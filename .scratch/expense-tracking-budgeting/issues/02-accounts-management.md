# 02 — Accounts management (CRUD)

**What to build:** Let household members create, rename, and delete accounts (e.g. Checking, Credit Card, Cash) that transactions will later be tagged to. Accounts are labels only — no balance tracking. Scoped to the household, visible/editable by either member.

**Blocked by:** 01.

**Status:** done

- [x] Domain-layer functions: `createAccount`, `listAccounts`, `renameAccount`, `deleteAccount`, tested against the local Supabase stack
- [x] Accounts are scoped to a household — one household's accounts never appear for another (relevant for test data isolation even though production only ever runs one household)
- [x] UI (in pt-BR) to view the list of accounts, add a new one, rename an existing one, and delete one
- [x] Deleting an account that's referenced by existing transactions is handled sanely (either blocked with a clear message, or explicitly decided otherwise — flag if this comes up, since the spec doesn't dictate a behavior)
- [x] Changes are visible to both household members (shared household data, not per-user)

## Comments

Implemented in commit `<pending>`.

- New migration `supabase/migrations/20260726160000_accounts.sql` adds an `accounts` table (`household_id`, `name`, `created_at`), scoped by RLS to `internal.household_id_for_user((select auth.uid()))` with explicit select/insert/update/delete policies (accounts, unlike households, are managed directly by members rather than via service role) and explicit grants to `authenticated`/`service_role`.
- Domain layer: `src/domain/accounts/{create-account,list-accounts,rename-account,delete-account}.ts`, each with a colocated `*.test.ts` run against the real local Supabase stack, following the `get-household-for-user` plain-function convention. Every function has a household-scoped-isolation test (an outsider household can never read/rename/delete another household's account), plus tests confirming rename/delete performed by one member are visible to the other (shared household data, not per-user).
- UI at `src/app/dashboard/accounts/` (list + add form + inline rename/delete per row, all pt-BR), linked from the dashboard. Server actions in `accounts/actions.ts` call the domain functions; a shared `requireUser`/`requireHousehold` helper (`src/lib/current-household.ts`) handles the auth/household-lookup boilerplate for both the page and the actions.
- **Delete-with-references decision (flagged per the ticket, since the spec doesn't dictate a behavior):** no `transactions` table exists yet (ticket 04), so there's nothing to conflict with today. The schema-level choice for when it does exist is decided now: the future `transactions.account_id` FK should use `on delete restrict` (not cascade/set null), so deleting an account referenced by existing transactions is blocked at the database level rather than silently orphaning or nulling out transaction data. This is documented as a comment in the accounts migration and should be applied when the transactions table is created in ticket 04 — no transaction-aware UI was built now.
- Code-reviewed (Standards + Spec axes) before commit; findings addressed: extracted a shared `toAccount` row-mapper (`src/domain/accounts/types.ts`) to remove duplicated Supabase-row-to-domain-type mapping across create/list/rename; extracted the shared `requireUser`/`requireHousehold` helper to remove duplicated (and inconsistent — redirect vs. throw) auth/household-lookup logic between the accounts page and its server actions; removed a dead/unreachable `if (!data) throw` branch in `delete-account.ts` (`.single()` already throws on zero rows); and removed an invented `unique (household_id, name)` constraint from the migration — it wasn't asked for by the ticket or spec and would have surfaced as an unhandled server-action error on a duplicate name, so it was scope creep worth cutting rather than building error-handling for.

Verified: `npx tsc --noEmit`, `npm run lint`, `npm test` (13/13 passing across 6 files), and `npm run build` all clean.

Next up: ticket 03 (categories) is now unblocked (it was already only blocked by 01, but accounts management establishes the pattern subsequent CRUD-style tickets can follow).
