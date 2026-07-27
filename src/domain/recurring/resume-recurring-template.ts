import type { SupabaseClient } from "@supabase/supabase-js";
import { RECURRING_TEMPLATE_COLUMNS, toRecurringTemplate, type RecurringTemplate } from "./types";

/**
 * Sets `active: true` — the inverse of `pauseRecurringTemplate`. Not named
 * explicitly in the ticket's function list, but added alongside it: without
 * a way back to active, pausing a template would be a one-way trip, which
 * doesn't match "pause, edit, delete" reading as reversible lifecycle
 * actions in the UI.
 */
export async function resumeRecurringTemplate(
  supabase: SupabaseClient,
  { templateId }: { templateId: string },
): Promise<RecurringTemplate> {
  const { data, error } = await supabase
    .from("recurring_templates")
    .update({ active: true })
    .eq("id", templateId)
    .select(RECURRING_TEMPLATE_COLUMNS)
    .single();
  if (error) throw error;

  return toRecurringTemplate(data);
}
