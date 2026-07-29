import type { SupabaseClient } from "@supabase/supabase-js";
import { toGoal, type Goal } from "./types";
import { getAccountBalances } from "../accounts/get-account-balances";

export type GoalWithProgress = Goal & { currentAmount: number; completed: boolean };

/**
 * Every goal joined with its tied account's current balance and a derived
 * `completed` flag (currentAmount >= targetAmount) — nothing stored, always
 * recomputed on read (ADR-0002).
 */
export async function listGoals(
  supabase: SupabaseClient,
  { householdId }: { householdId: string },
): Promise<GoalWithProgress[]> {
  const [{ data, error }, balances] = await Promise.all([
    supabase
      .from("goals")
      .select("id, household_id, name, account_id, target_amount, target_date, created_at")
      .eq("household_id", householdId)
      .order("name"),
    getAccountBalances(supabase, { householdId }),
  ]);
  if (error) throw error;

  return data.map(toGoal).map((goal) => {
    const currentAmount = balances.get(goal.accountId) ?? 0;
    return { ...goal, currentAmount, completed: currentAmount >= goal.targetAmount };
  });
}
