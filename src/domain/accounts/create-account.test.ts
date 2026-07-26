import { describe, expect, it } from "vitest";
import { createAdminClient, createAnonClient } from "../test-support/supabase-clients";
import {
  cleanupTestData,
  createTestHousehold,
  createTestUser,
  signInAs,
} from "../test-support/household-fixtures";
import { createAccount } from "./create-account";

describe("createAccount", () => {
  it("creates an account for the signed-in member's household", async () => {
    const admin = createAdminClient();
    const userA = await createTestUser(admin, "member-a");
    const userB = await createTestUser(admin, "member-b");
    const householdId = await createTestHousehold(admin, "Test Household", [
      { user: userA, displayName: "Alice" },
      { user: userB, displayName: "Bob" },
    ]);

    try {
      const anon = createAnonClient();
      await signInAs(anon, userA);

      const account = await createAccount(anon, { householdId, name: "Corrente" });

      expect(account.name).toBe("Corrente");
      expect(account.householdId).toBe(householdId);
      expect(account.id).toBeTruthy();
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("rejects creating an account for another household (household-scoped isolation)", async () => {
    const admin = createAdminClient();
    const outsider = await createTestUser(admin, "outsider");
    const outsiderPartner = await createTestUser(admin, "outsider-partner");
    const memberA = await createTestUser(admin, "member-a");
    const memberB = await createTestUser(admin, "member-b");
    const otherHouseholdId = await createTestHousehold(admin, "Other Household", [
      { user: memberA, displayName: "Alice" },
      { user: memberB, displayName: "Bob" },
    ]);
    const outsiderHouseholdId = await createTestHousehold(admin, "Outsider Household", [
      { user: outsider, displayName: "Out" },
      { user: outsiderPartner, displayName: "Out2" },
    ]);

    try {
      const anon = createAnonClient();
      await signInAs(anon, outsider);

      await expect(
        createAccount(anon, { householdId: otherHouseholdId, name: "Carteira" }),
      ).rejects.toThrow();
    } finally {
      await cleanupTestData(admin, {
        householdIds: [otherHouseholdId, outsiderHouseholdId],
        userIds: [outsider.id, outsiderPartner.id, memberA.id, memberB.id],
      });
    }
  });
});
