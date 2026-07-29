import type { SupabaseClient } from "@supabase/supabase-js";

export async function deleteGoal(
  supabase: SupabaseClient,
  { goalId }: { goalId: string },
): Promise<void> {
  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", goalId)
    .select("id")
    .single();
  if (error) throw error;
}
