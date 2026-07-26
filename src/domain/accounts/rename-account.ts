import type { SupabaseClient } from "@supabase/supabase-js";
import { toAccount, type Account } from "./types";

export async function renameAccount(
  supabase: SupabaseClient,
  { accountId, name }: { accountId: string; name: string },
): Promise<Account> {
  const { data, error } = await supabase
    .from("accounts")
    .update({ name })
    .eq("id", accountId)
    .select("id, household_id, name, created_at")
    .single();
  if (error) throw error;

  return toAccount(data);
}
