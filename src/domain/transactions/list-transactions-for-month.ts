import type { SupabaseClient } from "@supabase/supabase-js";
import { TRANSACTION_COLUMNS, toTransaction, type Transaction } from "./types";

function firstDayOfMonth(year: number, month: number): string {
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-01`;
}

export async function listTransactionsForMonth(
  supabase: SupabaseClient,
  { householdId, year, month }: { householdId: string; year: number; month: number },
): Promise<Transaction[]> {
  const startDate = firstDayOfMonth(year, month);
  const endDate =
    month === 12 ? firstDayOfMonth(year + 1, 1) : firstDayOfMonth(year, month + 1);

  const { data, error } = await supabase
    .from("transactions")
    .select(TRANSACTION_COLUMNS)
    .eq("household_id", householdId)
    .gte("date", startDate)
    .lt("date", endDate)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;

  return data.map(toTransaction);
}
