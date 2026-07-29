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

describe("createGoal", () => {
  it("creates a goal tied to an account for the signed-in member's household", async () => {
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
        targetAmount: 5000,
        targetDate: "2027-01-01",
      });

      expect(goal.name).toBe("Viagem");
      expect(goal.accountId).toBe(account.id);
      expect(goal.targetAmount).toBe(5000);
      expect(goal.targetDate).toBe("2027-01-01");
      expect(goal.householdId).toBe(householdId);
      expect(goal.id).toBeTruthy();
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("allows an omitted target date (optional end to end)", async () => {
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
        name: "Reserva",
        accountId: account.id,
        targetAmount: 1000,
      });

      expect(goal.targetDate).toBeNull();
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("rejects creating a goal for another household (household-scoped isolation)", async () => {
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
      const anonOwner = createAnonClient();
      await signInAs(anonOwner, memberA);
      const account = await createAccount(anonOwner, { householdId: otherHouseholdId, name: "Poupança" });

      const anon = createAnonClient();
      await signInAs(anon, outsider);

      await expect(
        createGoal(anon, {
          householdId: otherHouseholdId,
          name: "Viagem",
          accountId: account.id,
          targetAmount: 1000,
        }),
      ).rejects.toThrow();
    } finally {
      await cleanupTestData(admin, {
        householdIds: [otherHouseholdId, outsiderHouseholdId],
        userIds: [outsider.id, outsiderPartner.id, memberA.id, memberB.id],
      });
    }
  });

  it("rejects a second goal tied to an already-tied account", async () => {
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

      await createGoal(anon, {
        householdId,
        name: "Viagem",
        accountId: account.id,
        targetAmount: 1000,
      });

      await expect(
        createGoal(anon, {
          householdId,
          name: "Outra meta",
          accountId: account.id,
          targetAmount: 2000,
        }),
      ).rejects.toThrow();
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });
});
