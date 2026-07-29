import type { SupabaseClient } from "@supabase/supabase-js";

export async function deleteTag(
  supabase: SupabaseClient,
  { tagId }: { tagId: string },
): Promise<void> {
  const { error } = await supabase.from("tags").delete().eq("id", tagId).select("id").single();
  if (error) throw error;
}
