import type { SupabaseClient } from "@supabase/supabase-js";
import { RECURRING_TEMPLATE_COLUMNS, toRecurringTemplate, type RecurringTemplate } from "./types";

/** Lists every template (active and paused) for the household, for the management UI. */
export async function listRecurringTemplates(
  supabase: SupabaseClient,
  { householdId }: { householdId: string },
): Promise<RecurringTemplate[]> {
  const { data, error } = await supabase
    .from("recurring_templates")
    .select(RECURRING_TEMPLATE_COLUMNS)
    .eq("household_id", householdId)
    .order("day_of_month");
  if (error) throw error;

  return data.map(toRecurringTemplate);
}
