# 03 — Categories management (CRUD + seeded defaults)

**What to build:** A flat (non-hierarchical), household-scoped list of spending categories, seeded with sensible pt-BR defaults (e.g. Mercado, Transporte, Moradia, Lazer, Saúde) when the household is created, and fully editable afterward.

**Blocked by:** 01. *(Can run in parallel with 02 — both only need login/household scaffolding.)*

**Status:** done

- [x] Domain-layer functions: `createCategory`, `listCategories`, `renameCategory`, `deleteCategory`, tested against the local Supabase stack
- [x] Categories are scoped to a household
- [x] Default pt-BR categories are created automatically when a household is provisioned
- [x] UI (in pt-BR) to view, add, rename, and delete categories
- [x] Deleting a category referenced by existing transactions or budgets is handled sanely (flag if the right behavior isn't obvious — the spec doesn't dictate one)
- [x] Changes are visible to both household members

## Comments

Implemented in commit `240e4c2`.

- New migration `supabase/migrations/20260726170000_categories.sql` adds a `categories` table (`household_id`, `name`, `created_at`), scoped by RLS to `internal.household_id_for_user((select auth.uid()))` with explicit select/insert/update/delete policies and explicit grants to `authenticated`/`service_role` — structurally identical to the `accounts` migration from ticket 02.
- **Default category seeding:** implemented at the DB level via a new `internal.seed_default_categories()` trigger function, fired `after insert on households` (mirroring the `household_member_cap` trigger style from `20260726150000_cap_household_members.sql`), which inserts a fixed set of default category rows for the new household. This means every household-creation path (seed script, future admin UI, tests) gets defaults for free with no app-code coupling. Default list chosen: **Mercado, Transporte, Moradia, Lazer, Saúde, Contas** (the first five straight from the spec's example list, plus Contas — bills/utilities — as a sensible sixth default).
- Domain layer: `src/domain/categories/{create-category,list-categories,rename-category,delete-category}.ts`, each with a colocated `*.test.ts` run against the real local Supabase stack, following the same plain-function convention as `src/domain/accounts/`. Every function has a household-scoped-isolation test, plus tests confirming changes made by one member are visible to the other (shared household data, not per-user) — including a `createCategory` cross-visibility test added after code review (see below). `list-categories.test.ts` additionally asserts a newly created household is seeded with exactly the six default pt-BR categories.
- UI at `src/app/dashboard/categories/` (list + add form + inline rename/delete per row, all pt-BR), linked from the dashboard alongside "Contas". Server actions in `categories/actions.ts` call the domain functions and reuse the shared `requireUser`/`requireHousehold` helper (`src/lib/current-household.ts`) — no duplicated auth/household-lookup boilerplate.
- **Delete-with-references decision (flagged per the ticket, same as ticket 02's account decision):** no `transactions` or `budgets` tables exist yet (tickets 04/06), so there's nothing to conflict with today. The schema-level choice for when they do exist is decided now: the future `transactions.category_id` / `budgets.category_id` FKs should use `on delete restrict` (not cascade/set null), so deleting a category referenced by existing transactions or budgets is blocked at the database level rather than silently orphaning or nulling out that data. This is documented as a comment in the categories migration and should be applied when those tables are created — no transaction/budget-aware UI was built now.
- Code-reviewed (Standards + Spec axes) before commit. Standards axis found no hard violations — the diff visibly incorporates ticket 02's lessons (reuses the shared `requireUser`/`requireHousehold` helper, no invented `unique(household_id, name)` constraint, no dead `.single()` error-handling branch, uses a colocated `toCategory` mapper); flagged duplication between the categories and accounts domain modules/pages was judged premature to extract (Rule of Three, only two instances) and left as-is. Spec axis found one real gap — `create-category.test.ts` had no test asserting a category created by one member is visible to the other — addressed by adding that test.

Verified: `npx tsc --noEmit`, `npm run lint`, `npm test` (25/25 passing across 10 files), and `npm run build` all clean.

Next up: ticket 04 (transactions) can apply the documented `on delete restrict` FK for `category_id` when it creates the transactions table.
