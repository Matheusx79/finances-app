import type { SupabaseClient } from "@supabase/supabase-js";
import {
  TRANSACTION_COLUMNS,
  toTransaction,
  type Transaction,
  type TransactionType,
} from "@/domain/transactions/types";

export type ImportOfxRow = {
  date: string;
  amount: number;
  type: TransactionType;
  categoryId: string | null;
  fitid: string | null;
  description?: string | null;
};

export type ImportTransactionsResult = {
  inserted: Transaction[];
  skipped: ImportOfxRow[];
};

/**
 * The `external_id`s, among `fitids`, already present on `accountId`'s
 * transactions. Shared by the upload action (to flag duplicate rows for
 * display in the staging review) and `importTransactions` (the actual
 * insert guard below) so the two don't drift out of sync.
 */
export async function findExistingExternalIds(
  supabase: SupabaseClient,
  { accountId, fitids }: { accountId: string; fitids: string[] },
): Promise<Set<string>> {
  const existingFitids = new Set<string>();
  if (fitids.length === 0) return existingFitids;

  const { data: existing, error } = await supabase
    .from("transactions")
    .select("external_id")
    .eq("account_id", accountId)
    .in("external_id", fitids);
  if (error) throw error;
  for (const row of existing) {
    if (row.external_id) existingFitids.add(row.external_id as string);
  }
  return existingFitids;
}

/**
 * Inserts the (already user-checked) rows from an OFX staging review as
 * real `transactions` rows, attributed to a single account/owner for the
 * whole batch. Re-checks each row's `fitid` against that account's existing
 * `external_id`s and skips duplicates — this is the same duplicate check
 * the staging UI uses to flag rows for display, run again here as the
 * actual guard before insert (the UI's flag is advisory; a user could
 * re-check a flagged row, or re-run the same import twice).
 *
 * A single bulk insert — not one-by-one — so an invalid row (e.g. an
 * expense with no category, rejected by the `transactions` table's check
 * constraint) fails the whole batch instead of partially importing it.
 */
export async function importTransactions(
  supabase: SupabaseClient,
  {
    householdId,
    accountId,
    ownerHouseholdMemberId,
    rows,
  }: {
    householdId: string;
    accountId: string;
    ownerHouseholdMemberId?: string | null;
    rows: ImportOfxRow[];
  },
): Promise<ImportTransactionsResult> {
  const fitids = rows
    .map((row) => row.fitid)
    .filter((fitid): fitid is string => fitid !== null);

  const existingFitids = await findExistingExternalIds(supabase, { accountId, fitids });

  const isDuplicate = (row: ImportOfxRow) => Boolean(row.fitid && existingFitids.has(row.fitid));
  const toInsert = rows.filter((row) => !isDuplicate(row));
  const skipped = rows.filter(isDuplicate);

  if (toInsert.length === 0) {
    return { inserted: [], skipped };
  }

  const { data, error } = await supabase
    .from("transactions")
    .insert(
      toInsert.map((row) => ({
        household_id: householdId,
        type: row.type,
        amount: row.amount,
        date: row.date,
        account_id: accountId,
        category_id: row.categoryId,
        owner_household_member_id: ownerHouseholdMemberId ?? null,
        note: row.description?.trim() || null,
        external_id: row.fitid,
      })),
    )
    .select(TRANSACTION_COLUMNS);
  if (error) throw error;

  return { inserted: data.map(toTransaction), skipped };
}
