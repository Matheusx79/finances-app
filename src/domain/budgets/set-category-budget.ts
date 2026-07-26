import type { SupabaseClient } from "@supabase/supabase-js";
import { CATEGORY_BUDGET_COLUMNS, toCategoryBudget, type CategoryBudget } from "./types";

/**
 * Sets the household's budget for a category in a given calendar month.
 * One amount per (household, category, year, month) — a second call for the
 * same combination updates the existing amount rather than creating a
 * duplicate row, relying on the `category_budgets` unique constraint as the
 * upsert's conflict target.
 */
export async function setCategoryBudget(
  supabase: SupabaseClient,
  {
    householdId,
    categoryId,
    year,
    month,
    amount,
  }: { householdId: string; categoryId: string; year: number; month: number; amount: number },
): Promise<CategoryBudget> {
  const { data, error } = await supabase
    .from("category_budgets")
    .upsert(
      { household_id: householdId, category_id: categoryId, year, month, amount },
      { onConflict: "household_id,category_id,year,month" },
    )
    .select(CATEGORY_BUDGET_COLUMNS)
    .single();
  if (error) throw error;

  return toCategoryBudget(data);
}
