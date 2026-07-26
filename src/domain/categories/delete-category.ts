import type { SupabaseClient } from "@supabase/supabase-js";

export async function deleteCategory(
  supabase: SupabaseClient,
  { categoryId }: { categoryId: string },
): Promise<void> {
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .select("id")
    .single();
  if (error) throw error;
}
