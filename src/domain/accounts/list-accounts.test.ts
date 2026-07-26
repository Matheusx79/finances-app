import { describe, expect, it } from "vitest";
import { createAdminClient, createAnonClient } from "../test-support/supabase-clients";
import {
  cleanupTestData,
  createTestHousehold,
  createTestUser,
  signInAs,
} from "../test-support/household-fixtures";
import { createAccount } from "./create-account";
import { listAccounts } from "./list-accounts";

describe("listAccounts", () => {
  it("lists all accounts for the signed-in member's household", async () => {
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

      await createAccount(anon, { householdId, name: "Corrente" });
      await createAccount(anon, { householdId, name: "Cartão de Crédito" });

      const accounts = await listAccounts(anon, { householdId });

      expect(accounts.map((a) => a.name).sort()).toEqual(
        ["Cartão de Crédito", "Corrente"].sort(),
      );
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("never returns another household's accounts (household-scoped isolation)", async () => {
    const admin = createAdminClient();
    const userA = await createTestUser(admin, "member-a");
    const userB = await createTestUser(admin, "member-b");
    const outsider = await createTestUser(admin, "outsider");
    const outsiderPartner = await createTestUser(admin, "outsider-partner");
    const householdId = await createTestHousehold(admin, "Test Household", [
      { user: userA, displayName: "Alice" },
      { user: userB, displayName: "Bob" },
    ]);
    const otherHouseholdId = await createTestHousehold(admin, "Other Household", [
      { user: outsider, displayName: "Out" },
      { user: outsiderPartner, displayName: "Out2" },
    ]);

    try {
      const anon = createAnonClient();
      await signInAs(anon, userA);
      await createAccount(anon, { householdId, name: "Corrente" });

      const outsiderAnon = createAnonClient();
      await signInAs(outsiderAnon, outsider);
      await createAccount(outsiderAnon, { householdId: otherHouseholdId, name: "Dinheiro" });

      const accounts = await listAccounts(anon, { householdId });

      expect(accounts.map((a) => a.name)).toEqual(["Corrente"]);
      expect(accounts.some((a) => a.householdId === otherHouseholdId)).toBe(false);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId, otherHouseholdId],
        userIds: [userA.id, userB.id, outsider.id, outsiderPartner.id],
      });
    }
  });
});
