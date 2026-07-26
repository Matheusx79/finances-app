/**
 * Seeds the household and its two pre-provisioned member accounts.
 * There is no public signup UI — this script (or the equivalent Supabase Auth
 * admin action) is the only way household member accounts get created.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... HOUSEHOLD_NAME=... \
 *   MEMBER1_EMAIL=... MEMBER1_NAME=... MEMBER2_EMAIL=... MEMBER2_NAME=... \
 *   npx tsx scripts/seed-household.ts
 *
 * All of the above are required — no defaults, since this seeds real household
 * member accounts and real names/emails shouldn't live in source control.
 *
 * Idempotent: safe to re-run. Existing users/household are reused, not duplicated.
 * Generated passwords are printed once and are never stored anywhere.
 */
import { randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "../src/lib/env";

function generatePassword(): string {
  return randomBytes(18).toString("base64url");
}

async function findUserByEmail(supabase: SupabaseClient, email: string) {
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;
    const match = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (match) return match;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function main() {
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const householdName = requireEnv("HOUSEHOLD_NAME");
  const members = [
    { email: requireEnv("MEMBER1_EMAIL"), displayName: requireEnv("MEMBER1_NAME") },
    { email: requireEnv("MEMBER2_EMAIL"), displayName: requireEnv("MEMBER2_NAME") },
  ];

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const generatedPasswords: Record<string, string> = {};
  const memberIds: Record<string, string> = {};

  for (const member of members) {
    const existing = await findUserByEmail(supabase, member.email);
    if (existing) {
      memberIds[member.email] = existing.id;
      console.log(`User already exists: ${member.email}`);
      continue;
    }

    const password = generatePassword();
    const { data, error } = await supabase.auth.admin.createUser({
      email: member.email,
      password,
      email_confirm: true,
      user_metadata: { display_name: member.displayName },
    });
    if (error) throw error;

    memberIds[member.email] = data.user.id;
    generatedPasswords[member.email] = password;
    console.log(`Created user: ${member.email}`);
  }

  const { data: existingMembership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", memberIds[members[0].email])
    .maybeSingle();

  let householdId = existingMembership?.household_id as string | undefined;

  if (!householdId) {
    const { data: household, error: householdError } = await supabase
      .from("households")
      .insert({ name: householdName })
      .select("id")
      .single();
    if (householdError) throw householdError;
    householdId = household.id as string;
    console.log(`Created household: ${householdName} (${householdId})`);
  } else {
    console.log(`Household already exists (${householdId})`);
  }

  for (const member of members) {
    const { data: existingRow } = await supabase
      .from("household_members")
      .select("id")
      .eq("user_id", memberIds[member.email])
      .maybeSingle();
    if (existingRow) continue;

    const { error: memberError } = await supabase
      .from("household_members")
      .insert({
        household_id: householdId,
        user_id: memberIds[member.email],
        display_name: member.displayName,
      });
    if (memberError) throw memberError;
    console.log(`Linked ${member.email} to household as ${member.displayName}`);
  }

  if (Object.keys(generatedPasswords).length > 0) {
    console.log("\nGenerated passwords (shown once, not stored):");
    for (const [email, password] of Object.entries(generatedPasswords)) {
      console.log(`  ${email}: ${password}`);
    }
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
