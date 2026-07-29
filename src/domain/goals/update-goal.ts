import type { SupabaseClient } from "@supabase/supabase-js";
import { toGoal, type Goal } from "./types";

export async function updateGoal(
  supabase: SupabaseClient,
  {
    goalId,
    name,
    accountId,
    targetAmount,
    targetDate,
  }: {
    goalId: string;
    name: string;
    accountId: string;
    targetAmount: number;
    targetDate?: string | null;
  },
): Promise<Goal> {
  const { data, error } = await supabase
    .from("goals")
    .update({
      name,
      account_id: accountId,
      target_amount: targetAmount,
      target_date: targetDate ?? null,
    })
    .eq("id", goalId)
    .select("id, household_id, name, account_id, target_amount, target_date, created_at")
    .single();
  if (error) throw error;

  return toGoal(data);
}
