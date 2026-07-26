export type Category = {
  id: string;
  householdId: string;
  name: string;
  createdAt: string;
};

type CategoryRow = {
  id: string;
  household_id: string;
  name: string;
  created_at: string;
};

export function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    householdId: row.household_id,
    name: row.name,
    createdAt: row.created_at,
  };
}
