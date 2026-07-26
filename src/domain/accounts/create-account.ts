import type { SupabaseClient } from "@supabase/supabase-js";
import { toAccount, type Account } from "./types";

export async function createAccount(
  supabase: SupabaseClient,
  { householdId, name }: { householdId: string; name: string },
): Promise<Account> {
  const { data, error } = await supabase
    .from("accounts")
    .insert({ household_id: householdId, name })
    .select("id, household_id, name, created_at")
    .single();
  if (error) throw error;

  return toAccount(data);
}
