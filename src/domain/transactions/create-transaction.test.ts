import { describe, expect, it } from "vitest";
import { createAdminClient, createAnonClient } from "../test-support/supabase-clients";
import {
  cleanupTestData,
  createTestHousehold,
  createTestUser,
  signInAs,
} from "../test-support/household-fixtures";
import { createAccount } from "../accounts/create-account";
import { createCategory } from "../categories/create-category";
import { createTransaction } from "./create-transaction";

describe("createTransaction", () => {
  it("creates an expense transaction owned by the signed-in member's household", async () => {
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

      const account = await createAccount(anon, { householdId, name: "Carteira" });
      const category = await createCategory(anon, { householdId, name: "Mercado" });

      const { data: memberRow } = await admin
        .from("household_members")
        .select("id")
        .eq("household_id", householdId)
        .eq("user_id", userA.id)
        .single();

      const transaction = await createTransaction(anon, {
        householdId,
        type: "expense",
        amount: 42.5,
        date: "2026-07-15",
        accountId: account.id,
        categoryId: category.id,
        ownerHouseholdMemberId: memberRow!.id,
        note: "Compras da semana",
      });

      expect(transaction.id).toBeTruthy();
      expect(transaction.householdId).toBe(householdId);
      expect(transaction.type).toBe("expense");
      expect(transaction.amount).toBe(42.5);
      expect(transaction.date).toBe("2026-07-15");
      expect(transaction.accountId).toBe(account.id);
      expect(transaction.categoryId).toBe(category.id);
      expect(transaction.ownerHouseholdMemberId).toBe(memberRow!.id);
      expect(transaction.note).toBe("Compras da semana");
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("creates a shared income transaction with no category and no owner", async () => {
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

      const account = await createAccount(anon, { householdId, name: "Conta Corrente" });

      const transaction = await createTransaction(anon, {
        householdId,
        type: "income",
        amount: 5000,
        date: "2026-07-01",
        accountId: account.id,
      });

      expect(transaction.type).toBe("income");
      expect(transaction.categoryId).toBeNull();
      expect(transaction.ownerHouseholdMemberId).toBeNull();
      expect(transaction.note).toBeNull();
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("rejects an expense transaction with no category (category required for expenses)", async () => {
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

      const account = await createAccount(anon, { householdId, name: "Carteira" });

      await expect(
        createTransaction(anon, {
          householdId,
          type: "expense",
          amount: 10,
          date: "2026-07-15",
          accountId: account.id,
        }),
      ).rejects.toThrow();
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("rejects an account that belongs to a different household than the transaction", async () => {
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
      const outsiderAnon = createAnonClient();
      await signInAs(outsiderAnon, outsider);
      const outsiderAccount = await createAccount(outsiderAnon, {
        householdId: outsiderHouseholdId,
        name: "Carteira",
      });

      const anon = createAnonClient();
      await signInAs(anon, memberA);

      await expect(
        createTransaction(anon, {
          householdId,
          type: "income",
          amount: 10,
          date: "2026-07-15",
          accountId: outsiderAccount.id,
        }),
      ).rejects.toThrow();
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId, outsiderHouseholdId],
        userIds: [memberA.id, memberB.id, outsider.id, outsiderPartner.id],
      });
    }
  });

  it("rejects a category that belongs to a different household than the transaction", async () => {
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
      const outsiderAnon = createAnonClient();
      await signInAs(outsiderAnon, outsider);
      const outsiderCategory = await createCategory(outsiderAnon, {
        householdId: outsiderHouseholdId,
        name: "Viagem",
      });

      const anon = createAnonClient();
      await signInAs(anon, memberA);
      const account = await createAccount(anon, { householdId, name: "Carteira" });

      await expect(
        createTransaction(anon, {
          householdId,
          type: "expense",
          amount: 10,
          date: "2026-07-15",
          accountId: account.id,
          categoryId: outsiderCategory.id,
        }),
      ).rejects.toThrow();
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId, outsiderHouseholdId],
        userIds: [memberA.id, memberB.id, outsider.id, outsiderPartner.id],
      });
    }
  });

  it("rejects an owner household member that belongs to a different household than the transaction", async () => {
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
      const { data: outsiderMemberRow } = await admin
        .from("household_members")
        .select("id")
        .eq("household_id", outsiderHouseholdId)
        .eq("user_id", outsider.id)
        .single();

      const anon = createAnonClient();
      await signInAs(anon, memberA);
      const account = await createAccount(anon, { householdId, name: "Carteira" });

      await expect(
        createTransaction(anon, {
          householdId,
          type: "income",
          amount: 10,
          date: "2026-07-15",
          accountId: account.id,
          ownerHouseholdMemberId: outsiderMemberRow!.id,
        }),
      ).rejects.toThrow();
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId, outsiderHouseholdId],
        userIds: [memberA.id, memberB.id, outsider.id, outsiderPartner.id],
      });
    }
  });

  it("rejects creating a transaction for another household (household-scoped isolation)", async () => {
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
      const account = await createAccount(anon, { householdId, name: "Carteira" });

      const outsiderAnon = createAnonClient();
      await signInAs(outsiderAnon, outsider);

      await expect(
        createTransaction(outsiderAnon, {
          householdId,
          type: "income",
          amount: 10,
          date: "2026-07-15",
          accountId: account.id,
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
