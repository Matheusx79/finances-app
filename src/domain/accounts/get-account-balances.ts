import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Each account's current balance (income positive, expense negative),
 * derived from the household's transactions in one aggregate read — no
 * stored/cached balance column (see ADR-0002). An account with no
 * transactions has no entry in the returned map; callers fall back to 0
 * (`balances.get(accountId) ?? 0`).
 */
export async function getAccountBalances(
  supabase: SupabaseClient,
  { householdId }: { householdId: string },
): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from("transactions")
    .select("account_id, type, amount")
    .eq("household_id", householdId);
  if (error) throw error;

  const rows = data as { account_id: string; type: "expense" | "income"; amount: number | string }[];

  const balances = new Map<string, number>();
  for (const row of rows) {
    const signedAmount = row.type === "income" ? Number(row.amount) : -Number(row.amount);
    balances.set(row.account_id, (balances.get(row.account_id) ?? 0) + signedAmount);
  }
  return balances;
}
