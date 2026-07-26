import type { SupabaseClient } from "@supabase/supabase-js";

export async function deleteAccount(
  supabase: SupabaseClient,
  { accountId }: { accountId: string },
): Promise<void> {
  const { error } = await supabase
    .from("accounts")
    .delete()
    .eq("id", accountId)
    .select("id")
    .single();
  if (error) throw error;
}
