import { describe, expect, it } from "vitest";
import { createAdminClient, createAnonClient } from "../test-support/supabase-clients";
import {
  cleanupTestData,
  createTestHousehold,
  createTestUser,
  signInAs,
} from "../test-support/household-fixtures";
import { createAccount } from "../accounts/create-account";
import { createGoal } from "./create-goal";
import { deleteGoal } from "./delete-goal";
import { listGoals } from "./list-goals";

describe("deleteGoal", () => {
  it("deletes a goal belonging to the signed-in member's household", async () => {
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
      const account = await createAccount(anon, { householdId, name: "Poupança" });
      const goal = await createGoal(anon, {
        householdId,
        name: "Viagem",
        accountId: account.id,
        targetAmount: 1000,
      });

      await deleteGoal(anon, { goalId: goal.id });

      const goals = await listGoals(anon, { householdId });
      expect(goals).toEqual([]);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("rejects deleting another household's goal (household-scoped isolation)", async () => {
    const admin = createAdminClient();
    const memberA = await createTestUser(admin, "member-a");
    const memberB = await createTestUser(admin, "member-b");
    const outsider = await createTestUser(admin, "outsider");
    const outsiderPartner = await createTestUser(admin, "outsider-partner");
    const householdId = await createTestHousehold(admin, "Test Household", [
      { user: memberA, displayName: "Alice" },
      { user: memberB, displayName: "Bob" },
    ]);
    const outsiderHouseholdId = await createTestHousehold(admin, "Outsider Household", [
      { user: outsider, displayName: "Out" },
      { user: outsiderPartner, displayName: "Out2" },
    ]);

    try {
      const anon = createAnonClient();
      await signInAs(anon, memberA);
      const account = await createAccount(anon, { householdId, name: "Poupança" });
      const goal = await createGoal(anon, {
        householdId,
        name: "Viagem",
        accountId: account.id,
        targetAmount: 1000,
      });

      const outsiderAnon = createAnonClient();
      await signInAs(outsiderAnon, outsider);

      await expect(deleteGoal(outsiderAnon, { goalId: goal.id })).rejects.toThrow();

      const goals = await listGoals(anon, { householdId });
      expect(goals.map((g) => g.id)).toEqual([goal.id]);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId, outsiderHouseholdId],
        userIds: [memberA.id, memberB.id, outsider.id, outsiderPartner.id],
      });
    }
  });
});
