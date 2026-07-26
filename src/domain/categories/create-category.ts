import type { SupabaseClient } from "@supabase/supabase-js";
import { toCategory, type Category } from "./types";

export async function createCategory(
  supabase: SupabaseClient,
  { householdId, name }: { householdId: string; name: string },
): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .insert({ household_id: householdId, name })
    .select("id, household_id, name, created_at")
    .single();
  if (error) throw error;

  return toCategory(data);
}
