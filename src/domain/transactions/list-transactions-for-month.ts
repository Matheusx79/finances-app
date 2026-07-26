import type { SupabaseClient } from "@supabase/supabase-js";
import { TRANSACTION_COLUMNS, toTransaction, type Transaction } from "./types";

function firstDayOfMonth(year: number, month: number): string {
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-01`;
}

export async function listTransactionsForMonth(
  supabase: SupabaseClient,
  {
    householdId,
    year,
    month,
    ownerHouseholdMemberId,
  }: {
    householdId: string;
    year: number;
    month: number;
    /**
     * Restricts results to this household member's transactions plus every
     * "shared" transaction (owner_household_member_id IS NULL) — shared
     * transactions always show up regardless of who's filtered to. Omit for
     * the combined/household view (default), which returns everything.
     */
    ownerHouseholdMemberId?: string;
  },
): Promise<Transaction[]> {
  const startDate = firstDayOfMonth(year, month);
  const endDate =
    month === 12 ? firstDayOfMonth(year + 1, 1) : firstDayOfMonth(year, month + 1);

  let query = supabase
    .from("transactions")
    .select(TRANSACTION_COLUMNS)
    .eq("household_id", householdId)
    .gte("date", startDate)
    .lt("date", endDate);

  if (ownerHouseholdMemberId) {
    query = query.or(
      `owner_household_member_id.eq.${ownerHouseholdMemberId},owner_household_member_id.is.null`,
    );
  }

  const { data, error } = await query
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;

  return data.map(toTransaction);
}
