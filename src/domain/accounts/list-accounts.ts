import type { SupabaseClient } from "@supabase/supabase-js";
import { toAccount, type Account } from "./types";

export async function listAccounts(
  supabase: SupabaseClient,
  { householdId }: { householdId: string },
): Promise<Account[]> {
  const { data, error } = await supabase
    .from("accounts")
    .select("id, household_id, name, created_at")
    .eq("household_id", householdId)
    .order("name");
  if (error) throw error;

  return data.map(toAccount);
}
