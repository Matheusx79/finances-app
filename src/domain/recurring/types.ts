import type { TransactionType } from "@/domain/transactions/types";

export type RecurringTemplate = {
  id: string;
  householdId: string;
  type: TransactionType;
  amount: number;
  categoryId: string | null;
  accountId: string;
  ownerHouseholdMemberId: string | null;
  /** 1-31. See `postDueRecurringTransactions` for how short months (e.g. 31 in April) are handled. */
  dayOfMonth: number;
  active: boolean;
  createdAt: string;
};

type RecurringTemplateRow = {
  id: string;
  household_id: string;
  type: TransactionType;
  amount: number | string;
  category_id: string | null;
  account_id: string;
  owner_household_member_id: string | null;
  day_of_month: number;
  active: boolean;
  created_at: string;
};

export function toRecurringTemplate(row: RecurringTemplateRow): RecurringTemplate {
  return {
    id: row.id,
    householdId: row.household_id,
    type: row.type,
    amount: Number(row.amount),
    categoryId: row.category_id,
    accountId: row.account_id,
    ownerHouseholdMemberId: row.owner_household_member_id,
    dayOfMonth: row.day_of_month,
    active: row.active,
    createdAt: row.created_at,
  };
}

export const RECURRING_TEMPLATE_COLUMNS =
  "id, household_id, type, amount, category_id, account_id, owner_household_member_id, day_of_month, active, created_at";
