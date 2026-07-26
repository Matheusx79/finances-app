import type { SupabaseClient } from "@supabase/supabase-js";
import { TRANSACTION_COLUMNS, toTransaction, type Transaction, type TransactionType } from "./types";

export async function updateTransaction(
  supabase: SupabaseClient,
  {
    transactionId,
    type,
    amount,
    date,
    accountId,
    categoryId,
    ownerHouseholdMemberId,
    note,
  }: {
    transactionId: string;
    type: TransactionType;
    amount: number;
    date: string;
    accountId: string;
    categoryId?: string | null;
    ownerHouseholdMemberId?: string | null;
    note?: string | null;
  },
): Promise<Transaction> {
  const { data, error } = await supabase
    .from("transactions")
    .update({
      type,
      amount,
      date,
      account_id: accountId,
      category_id: categoryId ?? null,
      owner_household_member_id: ownerHouseholdMemberId ?? null,
      note: note ?? null,
    })
    .eq("id", transactionId)
    .select(TRANSACTION_COLUMNS)
    .single();
  if (error) throw error;

  return toTransaction(data);
}
