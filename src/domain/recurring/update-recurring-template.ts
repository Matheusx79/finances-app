import type { SupabaseClient } from "@supabase/supabase-js";
import type { TransactionType } from "@/domain/transactions/types";
import { RECURRING_TEMPLATE_COLUMNS, toRecurringTemplate, type RecurringTemplate } from "./types";

/**
 * Edits a template's terms (amount, category, account, owner, day of month).
 * Deliberately does not touch `active` — pausing/resuming is a distinct,
 * single-purpose action (see `pauseRecurringTemplate`/`resumeRecurringTemplate`)
 * so an edit never accidentally reactivates a paused template.
 */
export async function updateRecurringTemplate(
  supabase: SupabaseClient,
  {
    templateId,
    type,
    amount,
    dayOfMonth,
    accountId,
    categoryId,
    ownerHouseholdMemberId,
  }: {
    templateId: string;
    type: TransactionType;
    amount: number;
    dayOfMonth: number;
    accountId: string;
    categoryId?: string | null;
    ownerHouseholdMemberId?: string | null;
  },
): Promise<RecurringTemplate> {
  const { data, error } = await supabase
    .from("recurring_templates")
    .update({
      type,
      amount,
      day_of_month: dayOfMonth,
      account_id: accountId,
      category_id: categoryId ?? null,
      owner_household_member_id: ownerHouseholdMemberId ?? null,
    })
    .eq("id", templateId)
    .select(RECURRING_TEMPLATE_COLUMNS)
    .single();
  if (error) throw error;

  return toRecurringTemplate(data);
}
