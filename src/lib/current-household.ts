import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getHouseholdForUser } from "@/domain/household/get-household-for-user";
import type { Household } from "@/domain/household/types";

/** Redirects to /login if there's no authenticated session. */
export async function requireUser(): Promise<{ supabase: SupabaseClient; userId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  return { supabase, userId: user.id };
}

/** Redirects to /login if unauthenticated, or /dashboard if the user has no household. */
export async function requireHousehold(): Promise<{
  supabase: SupabaseClient;
  userId: string;
  householdId: string;
  household: Household;
}> {
  const { supabase, userId } = await requireUser();
  const household = await getHouseholdForUser(supabase, { userId });
  if (!household) {
    redirect("/dashboard");
  }
  return { supabase, userId, householdId: household.id, household };
}
