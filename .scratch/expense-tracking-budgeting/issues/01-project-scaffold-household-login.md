# 01 — Project scaffold + household login

**What to build:** Set up the Next.js + Supabase + Tailwind/shadcn project skeleton, deploy it to Vercel, provision a Supabase project with the two hard-coded household member accounts, and build a login page that puts either member into a protected, empty dashboard shell. Local Supabase dev stack must be usable for running domain-layer tests.

**Blocked by:** None — can start immediately.

**Status:** done

- [x] Next.js app created with Tailwind CSS and shadcn/ui configured
- [x] Supabase project connected (Auth + Postgres), with local dev stack (`supabase start`) working for tests
- [x] The domain-layer module convention (plain functions taking a Supabase client + args, returning plain data) is scaffolded with one working example function and its test, establishing the seam
- [x] Household record exists in the schema, linking exactly two pre-provisioned user accounts (created via seed script or Supabase Auth admin action — no public signup UI)
- [x] Login page (email/password or magic link via Supabase Auth) in pt-BR
- [x] After login, an authenticated, protected dashboard route renders an empty shell with a pt-BR welcome message identifying the logged-in member
- [x] Unauthenticated visitors are redirected to the login page
- [x] App deploys successfully to Vercel from the repo
- [x] At least one domain-layer test runs against the local Supabase stack and passes

## Comments

Implemented in commit `2be84c0`. Live at https://financas-casal-acme-3569.vercel.app. Code-reviewed (Standards + Spec axes) before commit; findings addressed: removed hardcoded PII from the seed script's defaults (now all required env vars, no fallbacks), extracted the shared `requireEnv` helper to `src/lib/env.ts`, collapsed `getHouseholdForUser` to a single embedded query, added a DB-level trigger capping household membership at two, and documented real setup/deploy steps in README.md.

Next up: ticket 02 (accounts), 03 (categories), and 09 (PWA installability) are now unblocked.
