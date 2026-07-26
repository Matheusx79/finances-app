# Finanças do Casal

Household expense-tracking & budgeting PWA (pt-BR), for two pre-provisioned members. Next.js (App Router) + Supabase (Postgres + Auth) + Tailwind/shadcn, deployed on Vercel.

## Setup

1. `npm install`
2. Copy `.env.local` (not committed) with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=<from Supabase project settings>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key, from Supabase project settings>
   SUPABASE_SERVICE_ROLE_KEY=<service_role/secret key, for the seed script only>
   ```
3. Seed the household and its two pre-provisioned accounts (no public signup UI exists — this is the only way in):
   ```
   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... HOUSEHOLD_NAME=... \
   MEMBER1_EMAIL=... MEMBER1_NAME=... MEMBER2_EMAIL=... MEMBER2_NAME=... \
   npm run seed
   ```
   Prints each account's generated password once — save it, it isn't stored anywhere.
4. `npm run dev` → http://localhost:3000

## Local Supabase stack (for domain-layer tests)

Domain-layer tests run against a real local Postgres via the Supabase CLI — no mocking. Requires Docker.

```
npx supabase start
```

Copy the printed `API_URL`, `ANON_KEY`, and `SERVICE_ROLE_KEY` into `.env.test.local`:

```
SUPABASE_URL=<API_URL>
SUPABASE_ANON_KEY=<ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
```

Then `npm test` (or `npm run test:watch`). `npx supabase db reset` re-applies all migrations from scratch.

## Deploying

Deployed to Vercel. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as project environment variables in the Vercel dashboard (Project Settings → Environment Variables) — both are safe to expose client-side, access is enforced by Postgres RLS, not by keeping them secret.
