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
import { updateGoal } from "./update-goal";

describe("updateGoal", () => {
  it("updates name, target amount, target date, and account in one call", async () => {
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
      const otherAccount = await createAccount(anon, { householdId, name: "Reserva" });
      const goal = await createGoal(anon, {
        householdId,
        name: "Viagem",
        accountId: account.id,
        targetAmount: 1000,
      });

      const updated = await updateGoal(anon, {
        goalId: goal.id,
        name: "Viagem Europa",
        accountId: otherAccount.id,
        targetAmount: 8000,
        targetDate: "2028-06-01",
      });

      expect(updated.name).toBe("Viagem Europa");
      expect(updated.accountId).toBe(otherAccount.id);
      expect(updated.targetAmount).toBe(8000);
      expect(updated.targetDate).toBe("2028-06-01");
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("rejects updating another household's goal (household-scoped isolation)", async () => {
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

      await expect(
        updateGoal(outsiderAnon, {
          goalId: goal.id,
          name: "Hackeado",
          accountId: account.id,
          targetAmount: 1,
        }),
      ).rejects.toThrow();
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId, outsiderHouseholdId],
        userIds: [memberA.id, memberB.id, outsider.id, outsiderPartner.id],
      });
    }
  });
});
