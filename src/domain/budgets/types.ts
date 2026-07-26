export type CategoryBudget = {
  id: string;
  householdId: string;
  categoryId: string;
  year: number;
  month: number;
  amount: number;
  createdAt: string;
};

type CategoryBudgetRow = {
  id: string;
  household_id: string;
  category_id: string;
  year: number;
  month: number;
  amount: number | string;
  created_at: string;
};

export function toCategoryBudget(row: CategoryBudgetRow): CategoryBudget {
  return {
    id: row.id,
    householdId: row.household_id,
    categoryId: row.category_id,
    year: row.year,
    month: row.month,
    amount: Number(row.amount),
    createdAt: row.created_at,
  };
}

export const CATEGORY_BUDGET_COLUMNS =
  "id, household_id, category_id, year, month, amount, created_at";

/** Spent-vs-budget progress for a single category within a calendar month. */
export type CategoryBudgetProgress = {
  categoryId: string;
  categoryName: string;
  /** null when the household hasn't set a budget for this category this month. */
  budgetAmount: number | null;
  /** Sum of expense transactions in this category for the month. */
  spentAmount: number;
};

export type BudgetProgressForMonth = {
  categories: CategoryBudgetProgress[];
  /** Sum of income transactions for the month, household-wide — not budgeted, shown for context only. */
  totalIncome: number;
};
