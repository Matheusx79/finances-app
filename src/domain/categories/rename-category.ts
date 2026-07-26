import type { SupabaseClient } from "@supabase/supabase-js";
import { toCategory, type Category } from "./types";

export async function renameCategory(
  supabase: SupabaseClient,
  { categoryId, name }: { categoryId: string; name: string },
): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .update({ name })
    .eq("id", categoryId)
    .select("id, household_id, name, created_at")
    .single();
  if (error) throw error;

  return toCategory(data);
}
