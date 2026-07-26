export type TransactionType = "expense" | "income";

export type Transaction = {
  id: string;
  householdId: string;
  type: TransactionType;
  amount: number;
  date: string;
  categoryId: string | null;
  accountId: string;
  ownerHouseholdMemberId: string | null;
  note: string | null;
  createdAt: string;
};

type TransactionRow = {
  id: string;
  household_id: string;
  type: TransactionType;
  amount: number | string;
  date: string;
  category_id: string | null;
  account_id: string;
  owner_household_member_id: string | null;
  note: string | null;
  created_at: string;
};

export function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    householdId: row.household_id,
    type: row.type,
    amount: Number(row.amount),
    date: row.date,
    categoryId: row.category_id,
    accountId: row.account_id,
    ownerHouseholdMemberId: row.owner_household_member_id,
    note: row.note,
    createdAt: row.created_at,
  };
}

export const TRANSACTION_COLUMNS =
  "id, household_id, type, amount, date, category_id, account_id, owner_household_member_id, note, created_at";
