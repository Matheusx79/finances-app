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
import { createTransaction } from "../transactions/create-transaction";
import { setCategoryBudget } from "./set-category-budget";
import { getBudgetProgressForMonth } from "./get-budget-progress-for-month";

describe("getBudgetProgressForMonth", () => {
  it("sums expense transactions per category against that category's budget for the month", async () => {
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
      const groceries = await createCategory(anon, { householdId, name: "Mercado" });

      await setCategoryBudget(anon, {
        householdId,
        categoryId: groceries.id,
        year: 2026,
        month: 7,
        amount: 500,
      });

      await createTransaction(anon, {
        householdId,
        type: "expense",
        amount: 120,
        date: "2026-07-05",
        accountId: account.id,
        categoryId: groceries.id,
      });
      await createTransaction(anon, {
        householdId,
        type: "expense",
        amount: 80,
        date: "2026-07-15",
        accountId: account.id,
        categoryId: groceries.id,
      });

      const progress = await getBudgetProgressForMonth(anon, {
        householdId,
        year: 2026,
        month: 7,
      });

      const groceriesProgress = progress.categories.find((c) => c.categoryId === groceries.id);
      expect(groceriesProgress?.spentAmount).toBe(200);
      expect(groceriesProgress?.budgetAmount).toBe(500);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("does not count income toward category spend, but does count it toward totalIncome", async () => {
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
      const groceries = await createCategory(anon, { householdId, name: "Mercado" });

      await createTransaction(anon, {
        householdId,
        type: "expense",
        amount: 50,
        date: "2026-07-05",
        accountId: account.id,
        categoryId: groceries.id,
      });
      await createTransaction(anon, {
        householdId,
        type: "income",
        amount: 3000,
        date: "2026-07-05",
        accountId: account.id,
      });
      await createTransaction(anon, {
        householdId,
        type: "income",
        amount: 500,
        date: "2026-07-20",
        accountId: account.id,
      });

      const progress = await getBudgetProgressForMonth(anon, {
        householdId,
        year: 2026,
        month: 7,
      });

      const groceriesProgress = progress.categories.find((c) => c.categoryId === groceries.id);
      expect(groceriesProgress?.spentAmount).toBe(50);
      expect(progress.totalIncome).toBe(3500);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("respects the calendar-month boundary (excludes last day of prior month and first day of next month)", async () => {
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
      const groceries = await createCategory(anon, { householdId, name: "Mercado" });

      await createTransaction(anon, {
        householdId,
        type: "expense",
        amount: 10,
        date: "2026-06-30",
        accountId: account.id,
        categoryId: groceries.id,
      });
      await createTransaction(anon, {
        householdId,
        type: "expense",
        amount: 20,
        date: "2026-07-01",
        accountId: account.id,
        categoryId: groceries.id,
      });
      await createTransaction(anon, {
        householdId,
        type: "expense",
        amount: 30,
        date: "2026-07-31",
        accountId: account.id,
        categoryId: groceries.id,
      });
      await createTransaction(anon, {
        householdId,
        type: "expense",
        amount: 40,
        date: "2026-08-01",
        accountId: account.id,
        categoryId: groceries.id,
      });

      const progress = await getBudgetProgressForMonth(anon, {
        householdId,
        year: 2026,
        month: 7,
      });

      const groceriesProgress = progress.categories.find((c) => c.categoryId === groceries.id);
      expect(groceriesProgress?.spentAmount).toBe(50);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("never mixes another household's budgets/spend into this household's progress (household-scoped isolation)", async () => {
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
      const account = await createAccount(anon, { householdId, name: "Carteira" });
      const groceries = await createCategory(anon, { householdId, name: "Mercado" });
      await setCategoryBudget(anon, {
        householdId,
        categoryId: groceries.id,
        year: 2026,
        month: 7,
        amount: 500,
      });
      await createTransaction(anon, {
        householdId,
        type: "expense",
        amount: 100,
        date: "2026-07-05",
        accountId: account.id,
        categoryId: groceries.id,
      });

      const outsiderAnon = createAnonClient();
      await signInAs(outsiderAnon, outsider);
      const outsiderAccount = await createAccount(outsiderAnon, {
        householdId: otherHouseholdId,
        name: "Carteira",
      });
      const outsiderGroceries = await createCategory(outsiderAnon, {
        householdId: otherHouseholdId,
        name: "Mercado",
      });
      await setCategoryBudget(outsiderAnon, {
        householdId: otherHouseholdId,
        categoryId: outsiderGroceries.id,
        year: 2026,
        month: 7,
        amount: 9999,
      });
      await createTransaction(outsiderAnon, {
        householdId: otherHouseholdId,
        type: "expense",
        amount: 8888,
        date: "2026-07-05",
        accountId: outsiderAccount.id,
        categoryId: outsiderGroceries.id,
      });
      await createTransaction(outsiderAnon, {
        householdId: otherHouseholdId,
        type: "income",
        amount: 7777,
        date: "2026-07-05",
        accountId: outsiderAccount.id,
      });

      const progress = await getBudgetProgressForMonth(anon, {
        householdId,
        year: 2026,
        month: 7,
      });

      expect(progress.categories.some((c) => c.categoryId === outsiderGroceries.id)).toBe(false);
      const groceriesProgress = progress.categories.find((c) => c.categoryId === groceries.id);
      expect(groceriesProgress?.spentAmount).toBe(100);
      expect(groceriesProgress?.budgetAmount).toBe(500);
      expect(progress.totalIncome).toBe(0);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId, otherHouseholdId],
        userIds: [userA.id, userB.id, outsider.id, outsiderPartner.id],
      });
    }
  });

  it("flags over-budget vs under-budget categories via spentAmount vs budgetAmount", async () => {
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
      const groceries = await createCategory(anon, { householdId, name: "Mercado" });
      const leisure = await createCategory(anon, { householdId, name: "Lazer" });

      await setCategoryBudget(anon, {
        householdId,
        categoryId: groceries.id,
        year: 2026,
        month: 7,
        amount: 100,
      });
      await setCategoryBudget(anon, {
        householdId,
        categoryId: leisure.id,
        year: 2026,
        month: 7,
        amount: 100,
      });

      await createTransaction(anon, {
        householdId,
        type: "expense",
        amount: 150,
        date: "2026-07-05",
        accountId: account.id,
        categoryId: groceries.id,
      });
      await createTransaction(anon, {
        householdId,
        type: "expense",
        amount: 40,
        date: "2026-07-05",
        accountId: account.id,
        categoryId: leisure.id,
      });

      const progress = await getBudgetProgressForMonth(anon, {
        householdId,
        year: 2026,
        month: 7,
      });

      const groceriesProgress = progress.categories.find((c) => c.categoryId === groceries.id)!;
      const leisureProgress = progress.categories.find((c) => c.categoryId === leisure.id)!;

      expect(groceriesProgress.spentAmount > (groceriesProgress.budgetAmount ?? 0)).toBe(true);
      expect(leisureProgress.spentAmount > (leisureProgress.budgetAmount ?? 0)).toBe(false);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("returns independent progress per month — spend and budget from one month never leak into another", async () => {
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
      const groceries = await createCategory(anon, { householdId, name: "Mercado" });

      await setCategoryBudget(anon, {
        householdId,
        categoryId: groceries.id,
        year: 2026,
        month: 7,
        amount: 500,
      });
      await setCategoryBudget(anon, {
        householdId,
        categoryId: groceries.id,
        year: 2026,
        month: 8,
        amount: 600,
      });

      await createTransaction(anon, {
        householdId,
        type: "expense",
        amount: 120,
        date: "2026-07-10",
        accountId: account.id,
        categoryId: groceries.id,
      });
      await createTransaction(anon, {
        householdId,
        type: "expense",
        amount: 300,
        date: "2026-08-10",
        accountId: account.id,
        categoryId: groceries.id,
      });

      const july = await getBudgetProgressForMonth(anon, { householdId, year: 2026, month: 7 });
      const august = await getBudgetProgressForMonth(anon, { householdId, year: 2026, month: 8 });

      const julyProgress = july.categories.find((c) => c.categoryId === groceries.id);
      const augustProgress = august.categories.find((c) => c.categoryId === groceries.id);

      expect(julyProgress?.budgetAmount).toBe(500);
      expect(julyProgress?.spentAmount).toBe(120);
      expect(augustProgress?.budgetAmount).toBe(600);
      expect(augustProgress?.spentAmount).toBe(300);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("includes categories with no budget set (budgetAmount null) alongside their spend", async () => {
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
      const transport = await createCategory(anon, { householdId, name: "Transporte" });

      await createTransaction(anon, {
        householdId,
        type: "expense",
        amount: 60,
        date: "2026-07-05",
        accountId: account.id,
        categoryId: transport.id,
      });

      const progress = await getBudgetProgressForMonth(anon, {
        householdId,
        year: 2026,
        month: 7,
      });

      const transportProgress = progress.categories.find((c) => c.categoryId === transport.id);
      expect(transportProgress?.budgetAmount).toBeNull();
      expect(transportProgress?.spentAmount).toBe(60);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });
});
