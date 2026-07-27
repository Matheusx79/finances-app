import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Deletes a template outright. Any transactions already posted from it keep
 * existing (their `recurring_template_id` FK is `on delete set null` — see
 * the migration) — deleting a template never retroactively touches
 * previously-posted transactions.
 */
export async function deleteRecurringTemplate(
  supabase: SupabaseClient,
  { templateId }: { templateId: string },
): Promise<void> {
  const { error } = await supabase
    .from("recurring_templates")
    .delete()
    .eq("id", templateId)
    .select("id")
    .single();
  if (error) throw error;
}
