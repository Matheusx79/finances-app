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
    tagId,
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
    /**
     * Restricts results to transactions carrying this exact tag — an exact
     * match via the join, unlike the owner filter's OR-with-null "shared"
     * semantics (there's no "shared tag" concept).
     */
    tagId?: string;
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

  if (tagId) {
    const { data: matches, error: tagFilterError } = await supabase
      .from("transaction_tags")
      .select("transaction_id")
      .eq("tag_id", tagId);
    if (tagFilterError) throw tagFilterError;

    const matchingIds = matches.map((row: { transaction_id: string }) => row.transaction_id);
    if (matchingIds.length === 0) return [];
    query = query.in("id", matchingIds);
  }

  const { data, error } = await query
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;

  const tagsByTransaction = await fetchTagIdsByTransaction(
    supabase,
    data.map((row: { id: string }) => row.id),
  );

  return data.map((row) => toTransaction(row, tagsByTransaction.get(row.id) ?? []));
}

async function fetchTagIdsByTransaction(
  supabase: SupabaseClient,
  transactionIds: string[],
): Promise<Map<string, string[]>> {
  const tagsByTransaction = new Map<string, string[]>();
  if (transactionIds.length === 0) return tagsByTransaction;

  const { data, error } = await supabase
    .from("transaction_tags")
    .select("transaction_id, tag_id")
    .in("transaction_id", transactionIds);
  if (error) throw error;

  for (const row of data as { transaction_id: string; tag_id: string }[]) {
    const tagIds = tagsByTransaction.get(row.transaction_id) ?? [];
    tagIds.push(row.tag_id);
    tagsByTransaction.set(row.transaction_id, tagIds);
  }
  return tagsByTransaction;
}
