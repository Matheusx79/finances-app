export type HouseholdMember = {
  id: string;
  userId: string;
  displayName: string;
};

export type Household = {
  id: string;
  name: string;
  members: HouseholdMember[];
};
