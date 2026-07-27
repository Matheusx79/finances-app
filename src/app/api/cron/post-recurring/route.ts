import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";
import { postDueRecurringTransactions } from "@/domain/recurring/post-due-recurring-transactions";

// This route is hit by Vercel Cron (see vercel.json), not by a browser
// session, so it must never be statically cached/optimized away.
export const dynamic = "force-dynamic";

/**
 * Service-role client, same pattern as `scripts/seed-household.ts` and
 * `src/domain/test-support/supabase-clients.ts`'s `createAdminClient` — a
 * scheduled job has no user session/cookies to build the normal per-request
 * client from (`@/lib/supabase/server`), and it must legitimately see every
 * household's active templates, which RLS would otherwise block a
 * non-admin client from doing.
 *
 * Uses `NEXT_PUBLIC_SUPABASE_URL` (already present in `.env.local`/Vercel
 * for the client-side Supabase setup) rather than a second, non-public
 * `SUPABASE_URL` var — the project URL isn't secret, only the service-role
 * key is, so there's no need to duplicate it under a second name just for
 * this route.
 */
function createAdminClient(): SupabaseClient {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

/**
 * Standard Vercel Cron request-auth pattern: Vercel sends
 * `Authorization: Bearer <CRON_SECRET>` on the scheduled request. Checking
 * this is what stops an arbitrary caller from hitting this URL and forcing
 * an off-schedule auto-post run.
 */
function isAuthorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  return request.headers.get("authorization") === `Bearer ${expected}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: households, error: householdsError } = await admin
    .from("households")
    .select("id");
  if (householdsError) {
    return NextResponse.json({ error: householdsError.message }, { status: 500 });
  }

  // Looped per-household (rather than one ungated call across every
  // template) so that a failure posting for one household — e.g. a bad row
  // — doesn't prevent every other household's due templates from posting.
  const results: { householdId: string; posted: number; error?: string }[] = [];
  for (const household of households) {
    try {
      const posted = await postDueRecurringTransactions(admin, { householdId: household.id });
      results.push({ householdId: household.id, posted: posted.length });
    } catch (err) {
      results.push({
        householdId: household.id,
        posted: 0,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({ results });
}
