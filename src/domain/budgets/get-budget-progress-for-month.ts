import type { SupabaseClient } from "@supabase/supabase-js";
import { listTransactionsForMonth } from "@/domain/transactions/list-transactions-for-month";
import type { BudgetProgressForMonth, CategoryBudgetProgress } from "./types";

/**
 * Household-wide spent-vs-budget progress for every category, for a given
 * calendar month, plus the month's total income (shown for context only —
 * income has no budget/target per spec).
 *
 * "Spent" is the sum of expense transactions in that category for the
 * household within the calendar month; budget progress is computed against
 * whatever budget (if any) is set for that category/month — a category with
 * no budget set still appears, with `budgetAmount: null`, so spending is
 * still visible even before a target is configured.
 *
 * Reuses `listTransactionsForMonth` for the transaction fetch (rather than
 * re-deriving the calendar-month date range here) so the two views can't
 * drift on month-boundary handling.
 */
export async function getBudgetProgressForMonth(
  supabase: SupabaseClient,
  { householdId, year, month }: { householdId: string; year: number; month: number },
): Promise<BudgetProgressForMonth> {
  const [categoriesResult, budgetsResult, transactions] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name")
      .eq("household_id", householdId)
      .order("name"),
    supabase
      .from("category_budgets")
      .select("category_id, amount")
      .eq("household_id", householdId)
      .eq("year", year)
      .eq("month", month),
    listTransactionsForMonth(supabase, { householdId, year, month }),
  ]);
  if (categoriesResult.error) throw categoriesResult.error;
  if (budgetsResult.error) throw budgetsResult.error;

  const categories = categoriesResult.data as { id: string; name: string }[];
  const budgetRows = budgetsResult.data as { category_id: string; amount: number | string }[];

  const budgetByCategoryId = new Map(
    budgetRows.map((row) => [row.category_id, Number(row.amount)]),
  );

  const spentByCategoryId = new Map<string, number>();
  let totalIncome = 0;
  for (const transaction of transactions) {
    if (transaction.type === "expense" && transaction.categoryId) {
      spentByCategoryId.set(
        transaction.categoryId,
        (spentByCategoryId.get(transaction.categoryId) ?? 0) + transaction.amount,
      );
    } else if (transaction.type === "income") {
      totalIncome += transaction.amount;
    }
  }

  const categoryProgress: CategoryBudgetProgress[] = categories.map((category) => ({
    categoryId: category.id,
    categoryName: category.name,
    budgetAmount: budgetByCategoryId.get(category.id) ?? null,
    spentAmount: spentByCategoryId.get(category.id) ?? 0,
  }));

  return { categories: categoryProgress, totalIncome };
}
