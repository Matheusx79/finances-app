export type HouseholdMember = {
  userId: string;
  displayName: string;
};

export type Household = {
  id: string;
  name: string;
  members: HouseholdMember[];
};
