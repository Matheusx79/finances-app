import type { SupabaseClient } from "@supabase/supabase-js";

export async function deleteTransaction(
  supabase: SupabaseClient,
  { transactionId }: { transactionId: string },
): Promise<void> {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId)
    .select("id")
    .single();
  if (error) throw error;
}
