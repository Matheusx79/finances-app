import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export type TestUser = { id: string; email: string; password: string };

export async function createTestUser(
  admin: SupabaseClient,
  emailPrefix: string,
): Promise<TestUser> {
  const email = `${emailPrefix}-${randomUUID().slice(0, 8)}@example.test`;
  const password = `pw-${randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  return { id: data.user.id, email, password };
}

export async function createTestHousehold(
  admin: SupabaseClient,
  name: string,
  members: { user: TestUser; displayName: string }[],
): Promise<string> {
  const { data: household, error: householdError } = await admin
    .from("households")
    .insert({ name })
    .select("id")
    .single();
  if (householdError) throw householdError;

  const { error: membersError } = await admin.from("household_members").insert(
    members.map(({ user, displayName }) => ({
      household_id: household.id,
      user_id: user.id,
      display_name: displayName,
    })),
  );
  if (membersError) throw membersError;

  return household.id;
}

export async function signInAs(
  anon: SupabaseClient,
  user: TestUser,
): Promise<void> {
  const { error } = await anon.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });
  if (error) throw error;
}

export async function cleanupTestData(
  admin: SupabaseClient,
  { householdIds, userIds }: { householdIds: string[]; userIds: string[] },
): Promise<void> {
  if (householdIds.length > 0) {
    await admin.from("households").delete().in("id", householdIds);
  }
  for (const userId of userIds) {
    await admin.auth.admin.deleteUser(userId);
  }
}
