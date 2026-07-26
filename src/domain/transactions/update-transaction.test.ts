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
import { updateTransaction } from "./update-transaction";

describe("updateTransaction", () => {
  it("updates a transaction's fields", async () => {
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
      const otherCategory = await createCategory(anon, { householdId, name: "Lazer" });

      const transaction = await createTransaction(anon, {
        householdId,
        type: "expense",
        amount: 20,
        date: "2026-07-10",
        accountId: account.id,
        categoryId: category.id,
      });

      const updated = await updateTransaction(anon, {
        transactionId: transaction.id,
        type: "expense",
        amount: 99.9,
        date: "2026-07-11",
        accountId: account.id,
        categoryId: otherCategory.id,
        note: "Ajustado",
      });

      expect(updated.id).toBe(transaction.id);
      expect(updated.amount).toBe(99.9);
      expect(updated.date).toBe("2026-07-11");
      expect(updated.categoryId).toBe(otherCategory.id);
      expect(updated.note).toBe("Ajustado");
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("can be edited by either household member regardless of who logged it", async () => {
    const admin = createAdminClient();
    const userA = await createTestUser(admin, "member-a");
    const userB = await createTestUser(admin, "member-b");
    const householdId = await createTestHousehold(admin, "Test Household", [
      { user: userA, displayName: "Alice" },
      { user: userB, displayName: "Bob" },
    ]);

    try {
      const anonA = createAnonClient();
      await signInAs(anonA, userA);
      const account = await createAccount(anonA, { householdId, name: "Carteira" });
      const transaction = await createTransaction(anonA, {
        householdId,
        type: "income",
        amount: 100,
        date: "2026-07-10",
        accountId: account.id,
      });

      const anonB = createAnonClient();
      await signInAs(anonB, userB);
      const updated = await updateTransaction(anonB, {
        transactionId: transaction.id,
        type: "income",
        amount: 150,
        date: "2026-07-12",
        accountId: account.id,
      });

      expect(updated.amount).toBe(150);
      expect(updated.date).toBe("2026-07-12");
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("rejects updating another household's transaction (household-scoped isolation)", async () => {
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
      const transaction = await createTransaction(anon, {
        householdId,
        type: "income",
        amount: 100,
        date: "2026-07-10",
        accountId: account.id,
      });

      const outsiderAnon = createAnonClient();
      await signInAs(outsiderAnon, outsider);

      await expect(
        updateTransaction(outsiderAnon, {
          transactionId: transaction.id,
          type: "income",
          amount: 999,
          date: "2026-07-10",
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
