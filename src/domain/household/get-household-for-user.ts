import type { SupabaseClient } from "@supabase/supabase-js";
import type { Household } from "./types";

export async function getHouseholdForUser(
  supabase: SupabaseClient,
  { userId }: { userId: string },
): Promise<Household | null> {
  const { data: membership, error: membershipError } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (membershipError) throw membershipError;
  if (!membership) return null;

  const { data: household, error: householdError } = await supabase
    .from("households")
    .select("id, name, household_members(id, user_id, display_name)")
    .eq("id", membership.household_id)
    .single();
  if (householdError) throw householdError;

  return {
    id: household.id,
    name: household.name,
    members: household.household_members.map(
      (member: { id: string; user_id: string; display_name: string }) => ({
        id: member.id,
        userId: member.user_id,
        displayName: member.display_name,
      }),
    ),
  };
}
