import type { SupabaseClient } from "@supabase/supabase-js";
import type { TransactionType } from "@/domain/transactions/types";
import { RECURRING_TEMPLATE_COLUMNS, toRecurringTemplate, type RecurringTemplate } from "./types";

export async function createRecurringTemplate(
  supabase: SupabaseClient,
  {
    householdId,
    type,
    amount,
    dayOfMonth,
    accountId,
    categoryId,
    ownerHouseholdMemberId,
  }: {
    householdId: string;
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
    .insert({
      household_id: householdId,
      type,
      amount,
      day_of_month: dayOfMonth,
      account_id: accountId,
      category_id: categoryId ?? null,
      owner_household_member_id: ownerHouseholdMemberId ?? null,
    })
    .select(RECURRING_TEMPLATE_COLUMNS)
    .single();
  if (error) throw error;

  return toRecurringTemplate(data);
}
