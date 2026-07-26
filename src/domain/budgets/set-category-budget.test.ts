import { describe, expect, it } from "vitest";
import { createAdminClient, createAnonClient } from "../test-support/supabase-clients";
import {
  cleanupTestData,
  createTestHousehold,
  createTestUser,
  signInAs,
} from "../test-support/household-fixtures";
import { createCategory } from "../categories/create-category";
import { setCategoryBudget } from "./set-category-budget";

describe("setCategoryBudget", () => {
  it("creates a budget for a category/month with no prior budget", async () => {
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

      const category = await createCategory(anon, { householdId, name: "Mercado" });

      const budget = await setCategoryBudget(anon, {
        householdId,
        categoryId: category.id,
        year: 2026,
        month: 7,
        amount: 500,
      });

      expect(budget.householdId).toBe(householdId);
      expect(budget.categoryId).toBe(category.id);
      expect(budget.year).toBe(2026);
      expect(budget.month).toBe(7);
      expect(budget.amount).toBe(500);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("updates (not duplicates) the amount on a second call for the same category/month", async () => {
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

      const category = await createCategory(anon, { householdId, name: "Mercado" });

      const first = await setCategoryBudget(anon, {
        householdId,
        categoryId: category.id,
        year: 2026,
        month: 7,
        amount: 500,
      });
      const second = await setCategoryBudget(anon, {
        householdId,
        categoryId: category.id,
        year: 2026,
        month: 7,
        amount: 750,
      });

      expect(second.id).toBe(first.id);
      expect(second.amount).toBe(750);

      const { data, error } = await admin
        .from("category_budgets")
        .select("id")
        .eq("household_id", householdId)
        .eq("category_id", category.id)
        .eq("year", 2026)
        .eq("month", 7);
      if (error) throw error;
      expect(data).toHaveLength(1);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("a different month gets its own independent budget (no rollover)", async () => {
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

      const category = await createCategory(anon, { householdId, name: "Mercado" });

      await setCategoryBudget(anon, {
        householdId,
        categoryId: category.id,
        year: 2026,
        month: 7,
        amount: 500,
      });
      const august = await setCategoryBudget(anon, {
        householdId,
        categoryId: category.id,
        year: 2026,
        month: 8,
        amount: 600,
      });

      expect(august.amount).toBe(600);

      const { data, error } = await admin
        .from("category_budgets")
        .select("month, amount")
        .eq("household_id", householdId)
        .eq("category_id", category.id)
        .order("month");
      if (error) throw error;
      expect(data).toEqual([
        { month: 7, amount: 500 },
        { month: 8, amount: 600 },
      ]);
    } finally {
      await cleanupTestData(admin, {
        householdIds: [householdId],
        userIds: [userA.id, userB.id],
      });
    }
  });

  it("rejects setting a budget against another household's category (household-scoped isolation)", async () => {
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
      const category = await createCategory(anon, { householdId, name: "Mercado" });

      const outsiderAnon = createAnonClient();
      await signInAs(outsiderAnon, outsider);

      await expect(
        setCategoryBudget(outsiderAnon, {
          householdId: outsiderHouseholdId,
          categoryId: category.id,
          year: 2026,
          month: 7,
          amount: 500,
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
