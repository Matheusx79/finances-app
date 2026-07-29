import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Delete-then-insert replace semantics for a transaction's tag set — shared
 * by createTransaction/updateTransaction so both write through the same
 * seam. `tagIds === undefined` means "don't touch tags" (update only): the
 * existing set is read back untouched, so the caller still gets a correct
 * `tagIds` for the returned Transaction.
 */
export async function replaceTransactionTags(
  supabase: SupabaseClient,
  transactionId: string,
  tagIds: string[] | undefined,
): Promise<string[]> {
  if (tagIds === undefined) {
    const { data, error } = await supabase
      .from("transaction_tags")
      .select("tag_id")
      .eq("transaction_id", transactionId);
    if (error) throw error;
    return data.map((row: { tag_id: string }) => row.tag_id);
  }

  const { error: deleteError } = await supabase
    .from("transaction_tags")
    .delete()
    .eq("transaction_id", transactionId);
  if (deleteError) throw deleteError;

  if (tagIds.length === 0) return [];

  const { error: insertError } = await supabase
    .from("transaction_tags")
    .insert(tagIds.map((tagId) => ({ transaction_id: transactionId, tag_id: tagId })));
  if (insertError) throw insertError;

  return tagIds;
}
