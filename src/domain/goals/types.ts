export type Goal = {
  id: string;
  householdId: string;
  name: string;
  accountId: string;
  targetAmount: number;
  targetDate: string | null;
  createdAt: string;
};

type GoalRow = {
  id: string;
  household_id: string;
  name: string;
  account_id: string;
  target_amount: number | string;
  target_date: string | null;
  created_at: string;
};

export function toGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    householdId: row.household_id,
    name: row.name,
    accountId: row.account_id,
    targetAmount: Number(row.target_amount),
    targetDate: row.target_date,
    createdAt: row.created_at,
  };
}
