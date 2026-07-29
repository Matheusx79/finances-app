import type { SupabaseClient } from "@supabase/supabase-js";
import { toTag, type Tag } from "./types";

export async function renameTag(
  supabase: SupabaseClient,
  { tagId, name }: { tagId: string; name: string },
): Promise<Tag> {
  const { data, error } = await supabase
    .from("tags")
    .update({ name })
    .eq("id", tagId)
    .select("id, household_id, name, created_at")
    .single();
  if (error) throw error;

  return toTag(data);
}
