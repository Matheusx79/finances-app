# 01 — Project scaffold + household login

**What to build:** Set up the Next.js + Supabase + Tailwind/shadcn project skeleton, deploy it to Vercel, provision a Supabase project with the two hard-coded household member accounts, and build a login page that puts either member into a protected, empty dashboard shell. Local Supabase dev stack must be usable for running domain-layer tests.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Next.js app created with Tailwind CSS and shadcn/ui configured
- [ ] Supabase project connected (Auth + Postgres), with local dev stack (`supabase start`) working for tests
- [ ] The domain-layer module convention (plain functions taking a Supabase client + args, returning plain data) is scaffolded with one working example function and its test, establishing the seam
- [ ] Household record exists in the schema, linking exactly two pre-provisioned user accounts (created via seed script or Supabase Auth admin action — no public signup UI)
- [ ] Login page (email/password or magic link via Supabase Auth) in pt-BR
- [ ] After login, an authenticated, protected dashboard route renders an empty shell with a pt-BR welcome message identifying the logged-in member
- [ ] Unauthenticated visitors are redirected to the login page
- [ ] App deploys successfully to Vercel from the repo
- [ ] At least one domain-layer test runs against the local Supabase stack and passes
