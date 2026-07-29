import type { SupabaseClient } from "@supabase/supabase-js";
import { toTag, type Tag } from "./types";

export async function createTag(
  supabase: SupabaseClient,
  { householdId, name }: { householdId: string; name: string },
): Promise<Tag> {
  const { data, error } = await supabase
    .from("tags")
    .insert({ household_id: householdId, name })
    .select("id, household_id, name, created_at")
    .single();
  if (error) throw error;

  return toTag(data);
}
