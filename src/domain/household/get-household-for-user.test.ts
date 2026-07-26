import { describe, expect, it } from "vitest";
import { createAdminClient, createAnonClient } from "../test-support/supabase-clients";
import {
  cleanupTestData,
  createTestHousehold,
  createTestUser,
  signInAs,
} from "../test-support/household-fixtures";
import { getHouseholdForUser } from "./get-household-for-user";

describe("getHouseholdForUser", () => {
  it("returns the household and both members for a signed-in member", async () => {
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

      const result = await getHouseholdForUser(anon, { userId: userA.id });

      expect(result?.id).toBe(householdId);
      expect(result?.name).toBe("Test Household");
      expect(result?.members).toEqual(
        expect.arrayContaining([
          { userId: userA.id, displayName: "Alice" },
          { userId: userB.id, displayName: "Bob" },
        ]),
      );
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("never returns another household's data (household-scoped isolation)", async () => {
    const admin = createAdminClient();
    const outsider = await createTestUser(admin, "outsider");
    const memberA = await createTestUser(admin, "member-a");
    const memberB = await createTestUser(admin, "member-b");
    const otherHouseholdId = await createTestHousehold(admin, "Other Household", [
      { user: memberA, displayName: "Alice" },
      { user: memberB, displayName: "Bob" },
    ]);

    try {
      const anon = createAnonClient();
      await signInAs(anon, outsider);

      const result = await getHouseholdForUser(anon, { userId: outsider.id });

      expect(result).toBeNull();
    } finally {
      await cleanupTestData(admin, {
        householdIds: [otherHouseholdId],
        userIds: [outsider.id, memberA.id, memberB.id],
      });
    }
  });
});
