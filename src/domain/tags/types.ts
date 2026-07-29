export type Tag = {
  id: string;
  householdId: string;
  name: string;
  createdAt: string;
};

type TagRow = {
  id: string;
  household_id: string;
  name: string;
  created_at: string;
};

export function toTag(row: TagRow): Tag {
  return {
    id: row.id,
    householdId: row.household_id,
    name: row.name,
    createdAt: row.created_at,
  };
}
