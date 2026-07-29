import { describe, expect, it } from "vitest";
import { createAdminClient, createAnonClient } from "../test-support/supabase-clients";
import {
  cleanupTestData,
  createTestHousehold,
  createTestUser,
  signInAs,
} from "../test-support/household-fixtures";
import { createAccount } from "../accounts/create-account";
import { createTransaction } from "../transactions/create-transaction";
import { createGoal } from "./create-goal";
import { listGoals } from "./list-goals";

describe("listGoals", () => {
  it("lists all goals for the signed-in member's household", async () => {
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
      const account1 = await createAccount(anon, { householdId, name: "Poupança" });
      const account2 = await createAccount(anon, { householdId, name: "Reserva" });

      await createGoal(anon, { householdId, name: "Viagem", accountId: account1.id, targetAmount: 1000 });
      await createGoal(anon, { householdId, name: "Carro", accountId: account2.id, targetAmount: 2000 });

      const goals = await listGoals(anon, { householdId });

      expect(goals.map((g) => g.name).sort()).toEqual(["Carro", "Viagem"].sort());
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("never returns another household's goals (household-scoped isolation)", async () => {
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
      const account = await createAccount(anon, { householdId, name: "Poupança" });
      await createGoal(anon, { householdId, name: "Viagem", accountId: account.id, targetAmount: 1000 });

      const outsiderAnon = createAnonClient();
      await signInAs(outsiderAnon, outsider);
      const outsiderAccount = await createAccount(outsiderAnon, {
        householdId: otherHouseholdId,
        name: "Poupança",
      });
      await createGoal(outsiderAnon, {
        householdId: otherHouseholdId,
        name: "Meta Alheia",
        accountId: outsiderAccount.id,
        targetAmount: 500,
      });

      const goals = await listGoals(anon, { householdId });

      expect(goals.map((g) => g.name)).toEqual(["Viagem"]);
      expect(goals.some((g) => g.householdId === otherHouseholdId)).toBe(false);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId, otherHouseholdId],
        userIds: [userA.id, userB.id, outsider.id, outsiderPartner.id],
      });
    }
  });

  it("reflects the tied account's balance as currentAmount and flips completed at target", async () => {
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
      await createGoal(anon, { householdId, name: "Viagem", accountId: account.id, targetAmount: 1000 });

      await createTransaction(anon, {
        householdId,
        type: "income",
        amount: 400,
        date: "2026-07-05",
        accountId: account.id,
      });

      let [goal] = await listGoals(anon, { householdId });
      expect(goal.currentAmount).toBe(400);
      expect(goal.completed).toBe(false);

      await createTransaction(anon, {
        householdId,
        type: "income",
        amount: 600,
        date: "2026-07-10",
        accountId: account.id,
      });

      [goal] = await listGoals(anon, { householdId });
      expect(goal.currentAmount).toBe(1000);
      expect(goal.completed).toBe(true);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });
});
