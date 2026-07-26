export type Account = {
  id: string;
  householdId: string;
  name: string;
  createdAt: string;
};

type AccountRow = {
  id: string;
  household_id: string;
  name: string;
  created_at: string;
};

export function toAccount(row: AccountRow): Account {
  return {
    id: row.id,
    householdId: row.household_id,
    name: row.name,
    createdAt: row.created_at,
  };
}
