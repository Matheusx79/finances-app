import type { SupabaseClient } from "@supabase/supabase-js";
import { RECURRING_TEMPLATE_COLUMNS, toRecurringTemplate, type RecurringTemplate } from "./types";

/** Sets `active: false`. A paused template is skipped entirely by `postDueRecurringTransactions`. */
export async function pauseRecurringTemplate(
  supabase: SupabaseClient,
  { templateId }: { templateId: string },
): Promise<RecurringTemplate> {
  const { data, error } = await supabase
    .from("recurring_templates")
    .update({ active: false })
    .eq("id", templateId)
    .select(RECURRING_TEMPLATE_COLUMNS)
    .single();
  if (error) throw error;

  return toRecurringTemplate(data);
}
