import { describe, expect, it } from "vitest";
import { createAdminClient, createAnonClient } from "../test-support/supabase-clients";
import {
  cleanupTestData,
  createTestHousehold,
  createTestUser,
  signInAs,
} from "../test-support/household-fixtures";
import { createAccount } from "./create-account";
import { createCategory } from "../categories/create-category";
import { createTransaction } from "../transactions/create-transaction";
import { getAccountBalances } from "./get-account-balances";

describe("getAccountBalances", () => {
  it("sums income positive and expense negative per account, across multiple accounts", async () => {
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
      const checking = await createAccount(anon, { householdId, name: "Corrente" });
      const wallet = await createAccount(anon, { householdId, name: "Carteira" });
      const category = await createCategory(anon, { householdId, name: "Mercado" });

      await createTransaction(anon, {
        householdId,
        type: "income",
        amount: 1000,
        date: "2026-07-05",
        accountId: checking.id,
      });
      await createTransaction(anon, {
        householdId,
        type: "expense",
        amount: 300,
        date: "2026-07-10",
        accountId: checking.id,
        categoryId: category.id,
      });
      await createTransaction(anon, {
        householdId,
        type: "expense",
        amount: 50,
        date: "2026-07-15",
        accountId: wallet.id,
        categoryId: category.id,
      });

      const balances = await getAccountBalances(anon, { householdId });

      expect(balances.get(checking.id)).toBe(700);
      expect(balances.get(wallet.id)).toBe(-50);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("does not include an account with zero transactions in the map (callers fall back to 0)", async () => {
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
      const empty = await createAccount(anon, { householdId, name: "Poupança" });

      const balances = await getAccountBalances(anon, { householdId });

      expect(balances.get(empty.id) ?? 0).toBe(0);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("never mixes another household's transactions into this household's balances (household-scoped isolation)", async () => {
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
      const account = await createAccount(anon, { householdId, name: "Corrente" });
      await createTransaction(anon, {
        householdId,
        type: "income",
        amount: 100,
        date: "2026-07-05",
        accountId: account.id,
      });

      const outsiderAnon = createAnonClient();
      await signInAs(outsiderAnon, outsider);
      const outsiderAccount = await createAccount(outsiderAnon, {
        householdId: otherHouseholdId,
        name: "Corrente",
      });
      await createTransaction(outsiderAnon, {
        householdId: otherHouseholdId,
        type: "income",
        amount: 9999,
        date: "2026-07-05",
        accountId: outsiderAccount.id,
      });

      const balances = await getAccountBalances(anon, { householdId });

      expect(balances.get(account.id)).toBe(100);
      expect(balances.has(outsiderAccount.id)).toBe(false);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId, otherHouseholdId],
        userIds: [userA.id, userB.id, outsider.id, outsiderPartner.id],
      });
    }
  });
});
