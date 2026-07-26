import type { SupabaseClient } from "@supabase/supabase-js";
import { toCategory, type Category } from "./types";

export async function listCategories(
  supabase: SupabaseClient,
  { householdId }: { householdId: string },
): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, household_id, name, created_at")
    .eq("household_id", householdId)
    .order("name");
  if (error) throw error;

  return data.map(toCategory);
}
