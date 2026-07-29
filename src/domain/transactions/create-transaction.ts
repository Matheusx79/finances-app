import type { SupabaseClient } from "@supabase/supabase-js";
import { TRANSACTION_COLUMNS, toTransaction, type Transaction, type TransactionType } from "./types";
import { replaceTransactionTags } from "./replace-transaction-tags";

export async function createTransaction(
  supabase: SupabaseClient,
  {
    householdId,
    type,
    amount,
    date,
    accountId,
    categoryId,
    ownerHouseholdMemberId,
    note,
    tagIds,
  }: {
    householdId: string;
    type: TransactionType;
    amount: number;
    date: string;
    accountId: string;
    categoryId?: string | null;
    ownerHouseholdMemberId?: string | null;
    note?: string | null;
    tagIds?: string[];
  },
): Promise<Transaction> {
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      household_id: householdId,
      type,
      amount,
      date,
      account_id: accountId,
      category_id: categoryId ?? null,
      owner_household_member_id: ownerHouseholdMemberId ?? null,
      note: note ?? null,
    })
    .select(TRANSACTION_COLUMNS)
    .single();
  if (error) throw error;

  const resolvedTagIds = await replaceTransactionTags(supabase, data.id, tagIds ?? []);
  return toTransaction(data, resolvedTagIds);
}
