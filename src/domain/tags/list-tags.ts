import type { SupabaseClient } from "@supabase/supabase-js";
import { toTag, type Tag } from "./types";

export async function listTags(
  supabase: SupabaseClient,
  { householdId }: { householdId: string },
): Promise<Tag[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("id, household_id, name, created_at")
    .eq("household_id", householdId)
    .order("name");
  if (error) throw error;

  return data.map(toTag);
}
