Status: ready-for-agent

# Insights from Organizze/Mobills: Metas, Etiquetas, Gráficos, Saldo, and a Visual Refresh

## Problem Statement

The app covers the daily-use basics (transactions, categories, budgets, accounts, recurring
templates, OFX/card-bill import) but is missing several features that similar Brazilian personal-
finance apps (Organizze, Mobills) treat as standard: a way to track progress toward a savings
target, a way to label transactions across categories, any visual chart of spending or cash flow,
and even a basic account balance. Expensive/complex features those apps offer (Open Finance bank
sync, AI-generated summaries) are explicitly not wanted.

Separately, the app's visual design today is the unmodified shadcn default (gray background, white
cards, default blue) — it reads as a generic admin panel, not as a couple's shared, personal
finance tool. Several screens (Contas, Categorias) also expose every list item permanently in edit
mode (an inline text input + Salvar + Excluir, always visible), with no distinct read state.

## Solution

Five additions, all scoped to exclude Open Finance/AI:

1. **Meta** — a savings goal tied to a dedicated `Conta`; progress and completion are derived from
   that account's balance, never separately tracked.
2. **Etiqueta** — a managed (CRUD'd, not free-text), cross-cutting label a `Transação` can carry
   several of at once, independent of its `Categoria`; filterable on the Transações page.
3. **Saldo** on the Contas page — each `Conta` shows its balance, derived from its transactions.
4. **Gráficos** on the dashboard home — a category spending breakdown (pizza/barra) and a monthly
   cash-flow chart (entradas vs. saídas), the latter broken down by household member.
5. **Visual refresh** — a full identity pass built around "cores do casal": each household member
   gets their own accent color, applied everywhere a person is already distinguished (filters,
   Responsável tags, the new person-split cash-flow chart), plus fixing the Contas/Categorias
   always-in-edit-mode list pattern and giving the app a consistent type/spacing hierarchy instead
   of unmodified shadcn defaults.

## User Stories

1. As a household member, I want to create a Meta with a name and a target amount, so that I can
   track progress toward a savings goal (viagem, reserva de emergência, compra).
2. As a household member, I want to pick which Conta a Meta is tied to, so that its progress
   reflects real money, not a number I have to update by hand.
3. As a household member, I want a Meta's target date to be optional, so that goals without a fixed
   deadline (like an emergency fund) are still valid.
4. As a household member, I want to see a Meta's current progress as its Conta's balance against
   the target amount, so that the number is always accurate without any manual updating.
5. As a household member, I want a Meta to automatically show as "concluída" once its Conta's
   balance reaches the target, so that I don't have to remember to close it out myself.
6. As a household member, I want completed Metas to move out of the main active list, so that the
   Metas screen stays focused on goals still in progress.
7. As a household member, I want to still be able to find/review a completed Meta, so that
   reaching a goal doesn't make it disappear entirely.
8. As a household member, I want to rename a Meta, change its target amount, or change its target
   date, so that I can adjust a goal as circumstances change.
9. As a household member, I want to delete a Meta, so that I can remove one I no longer want to
   track (without deleting the underlying Conta or its transactions).
10. As a household member, I want the app to prevent tying two Metas to the same Conta, so that
    progress numbers are never ambiguous about which goal they belong to.
11. As a household member, I want Metas scoped to my household only, so another household's goals
    are never visible or editable.
12. As a household member, I want to create an Etiqueta (name only), so I have a reusable label I
    can attach to transactions.
13. As a household member, I want to rename or delete an Etiqueta, so I can fix a typo or retire a
    label I no longer use.
14. As a household member, I want to pick zero or more Etiquetas when creating or editing a
    Transação, so I can mark it with whatever cross-cutting labels apply (e.g. "reembolsável").
15. As a household member, I want a Transação to be able to carry more than one Etiqueta at once,
    so labeling isn't limited to a single tag the way Categoria already is.
16. As a household member, I want to filter the Transações list by Etiqueta, so I can find
    everything tagged a certain way regardless of category or month view specifics.
17. As a household member, I want Etiquetas scoped to my household only, so another household's
    tags never show up in my picker.
18. As a household member, I want each Conta on the Contas page to show its current saldo, so I
    can tell how much money is actually in each account without doing math myself.
19. As a household member, I want a Conta's saldo to be computed from its transactions (income
    minus expense), so it's always correct without any manual reconciliation step.
20. As a household member, I want a pizza/bar chart of spending by category for the selected month
    on the dashboard home, so I can see where the money went at a glance instead of reading a list
    of numbers.
21. As a household member, I want a monthly cash-flow chart (entradas vs. saídas) covering recent
    months on the dashboard home, so I can see the trend over time, not just the current month.
22. As a household member, I want the cash-flow chart broken down by household member
    (eu/parceiro/compartilhado), so I can see whose spending/income is driving the trend.
23. As a household member, I want the new charts to appear on the existing dashboard home page
    (not a separate "Relatórios" section), so I see them immediately without extra navigation.
24. As a household member, I want each household member to have their own accent color used
    consistently across the app (person filters, Responsável tags, the cash-flow chart's
    per-person segments), so the "casal" (two-person) nature of the app is visually reinforced, not
    just implied by text labels.
25. As a household member, I want that accent-color pairing chosen for me (with a chance to
    approve it) rather than having to configure it myself, so I don't have to make a design
    decision I don't care about.
26. As a household member, I want the Contas and Categorias pages to show items in a plain read
    state by default (name only, no visible input/Salvar/Excluir), entering an edit state only when
    I ask to, so the lists don't look like a permanently-open bulk-edit form.
27. As a household member, I want the app's overall look (color, type, spacing) to feel deliberately
    designed for a couple's shared finances rather than like an unstyled admin panel, so using it
    day to day feels less like a generic tool.
28. As a household member, I want all of the above (Metas, Etiquetas, saldo, gráficos, and the
    visual refresh) to keep working correctly on both mobile (bottom nav) and desktop (sidebar)
    layouts, since the app is used on both.

## Implementation Decisions

**Shared/derived balance seam**

- New `getAccountBalances(supabase, { householdId }): Promise<Map<accountId, number>>` in
  `domain/accounts` — one aggregate read of the household's transactions, summed per account
  (income positive, expense negative). This is the single seam both the Contas page's saldo display
  and Metas' progress consume — no separate per-feature balance logic.
- No new column, no cached/stored balance anywhere (see ADR-0002).

**Meta (`domain/goals`, new context, mirrors `domain/accounts`/`domain/categories` shape)**

- `types.ts`: `Goal { id, householdId, name, accountId, targetAmount, targetDate: string | null,
  createdAt }`.
- `createGoal`, `updateGoal` (covers rename/target amount/target date/account changes in one
  function, matching this repo's preference for one update function over several narrow ones where
  the fields are all optional edits to the same row), `deleteGoal`, `listGoals`.
- `listGoals` internally calls `getAccountBalances` and returns each goal already joined with
  `currentAmount` and a derived `completed: boolean` (`currentAmount >= targetAmount`) — callers
  get render-ready data in one call, same pattern as `getBudgetProgressForMonth`.
- **Schema**: new `goals` table (`household_id`, `account_id` unique, `name`, `target_amount`,
  `target_date` nullable, `created_at`). The unique constraint on `account_id` enforces the 1:1
  Meta-to-Conta rule at the database level, not just in application code.
- No `status`/`completed_at` column (ADR-0002).

**Etiqueta (`domain/tags`, new context, mirrors `domain/categories` exactly)**

- `types.ts`, `createTag`, `renameTag`, `deleteTag`, `listTags` — same shape/signatures as the
  equivalent `categories` functions.
- **Schema**: new `tags` table (`household_id`, `name`, `created_at`), plus a `transaction_tags`
  join table (`transaction_id`, `tag_id`) for the N:N relationship.
- Extend the existing `createTransaction`/`updateTransaction` (in `domain/transactions`) to accept
  an optional `tagIds: string[]`, writing/replacing the corresponding `transaction_tags` rows as
  part of the same call — reuses the existing transaction seam rather than introducing a parallel
  "attach tag" action.
- Extend `listTransactionsForMonth` to (a) return each transaction's `tagIds` and (b) accept an
  optional `tagId` filter — an `inner join`/`exists` filter (exact match against the joined tag),
  distinct from the existing `ownerHouseholdMemberId` filter's OR-with-null "shared" semantics,
  since there's no "shared tag" concept.

**Gráficos (dashboard home, no new writes)**

- Category breakdown chart reuses the existing `getBudgetProgressForMonth` (already returns
  `categoryName`/`spentAmount` per category) — no new domain function needed for this chart.
- New `getMonthlyCashFlow(supabase, { householdId, monthsBack }): Promise<MonthlyCashFlow[]>` in a
  new `domain/reports` context — one row per month covering the last `monthsBack` months, each with
  income/expense totals split by `ownerHouseholdMemberId` (eu/parceiro/compartilhado), for the
  per-person cash-flow chart.
- Chart rendering library: none is installed today (confirmed — no chart dependency in
  `package.json`). Picking one (e.g. a shadcn-compatible charts library) is an implementation detail
  for the ticket that builds this, not decided here.

**Saldo on Contas page**

- Contas page's existing list reads `getAccountBalances` alongside `listAccounts` and displays each
  account's balance next to its name.

**Visual refresh**

- Member accent color: a small UI-layer helper (not a domain seam) maps `household.members[0]` /
  `[1]` to one of two fixed accent colors — chosen for contrast/accessibility, proposed for
  approval before being wired in (see ADR-0003). No schema change, no per-user customization UI.
- Applied to: the existing person filter (Transações), the Responsável tag shown on
  transaction/recurring-template rows, and the new per-person cash-flow chart's segments.
- Contas/Categorias lists: split into a read state (name only, plus an explicit action to enter
  edit mode) and an edit state (today's always-visible input/Salvar/Excluir), instead of always
  rendering the edit state.
- Broader type/spacing/hierarchy consistency pass across existing pages (Home, Contas, Categorias,
  Orçamentos, Recorrentes, Transações) grounded in the "cores do casal" concept as the one signature
  element — no other unrelated aesthetic experiments.
- Both the mobile bottom-nav shell and the desktop sidebar shell (ADR-0001) must keep working
  correctly after the visual refresh — this is a reskin, not a layout rebuild.

## Testing Decisions

- Only external behavior is asserted (inputs/prior state → return value or persisted rows), not
  internal implementation details — same standard as the rest of the domain layer, and tests run
  against a real Supabase instance (no mocking the database), same as every existing domain test.
- `getAccountBalances`: integration tests covering a mix of income/expense transactions across
  multiple accounts, an account with zero transactions (balance 0), and household-scoped isolation
  (another household's transactions never contribute to this household's balances). Prior art:
  `src/domain/budgets/get-budget-progress-for-month.test.ts` (aggregates transactions similarly).
- `domain/goals` functions: integration tests mirroring `src/domain/accounts/*.test.ts` 1:1
  (create/update/delete/list, plus household-scoped isolation for each), plus goal-specific cases:
  progress reflects the tied account's balance, `completed` flips to true once balance meets/exceeds
  target, a second goal cannot be created against an already-tied account.
- `domain/tags` functions: integration tests mirroring `src/domain/categories/*.test.ts` 1:1.
- `createTransaction`/`updateTransaction`/`listTransactionsForMonth` extensions: extend their
  existing test files (`create-transaction.test.ts`, `update-transaction.test.ts`,
  `list-transactions-for-month.test.ts`) with cases for: creating/updating a transaction with
  multiple tagIds, tagIds round-tripping through `listTransactionsForMonth`, and the new `tagId`
  filter excluding non-matching transactions (contrasted with the existing owner filter's
  include-shared behavior).
- `getMonthlyCashFlow`: integration test covering multiple months, per-person split (eu/parceiro/
  shared), and a month with no transactions (present with zero totals, not omitted).
- Member accent-color helper: a plain unit test (no Supabase involved) since it's pure UI logic —
  member index 0 and 1 map to the two fixed colors, no third case since household size is
  hard-capped at 2 (`household-member-cap.test.ts`).

## Out of Scope

- Open Finance / bank API sync and AI-generated summaries (explicitly excluded from this round).
- A Meta backed by more than one Conta, or a Conta backing more than one Meta (1:1 only).
- A mandatory target date on Metas (optional only).
- A "mark as complete" action or any persisted goal-completion status/timestamp (derived only, see
  ADR-0002).
- Free-text/ad-hoc Etiquetas (managed/CRUD'd list only, no create-on-the-fly).
- Category grouping (already deferred per `CONTEXT.md`'s 2026-07-27 naming pass — unrelated to this
  spec, noted only to avoid re-opening it).
- Receipt/comprovante attachments on transactions.
- Due-date/bill-payment reminders or notifications for Modelos recorrentes.
- Data export (Excel/PDF) of transactions or reports.
- A dedicated "Relatórios" page/nav entry (charts live on the existing dashboard home).
- Per-user accent-color customization/settings UI (fixed pair, see ADR-0003).
- Any charting for the category-breakdown view broken down by person (only the cash-flow chart is
  person-split; category breakdown stays category-colored).

## Further Notes

- This spec bundles five related-but-separable pieces of work discovered in one `/grilling`
  session. `/to-tickets` should likely split it along its natural seams: (1) `getAccountBalances` +
  Contas saldo, (2) Metas (depends on 1), (3) Etiquetas, (4) Gráficos (depends on 1 for reusing
  existing budget-progress data, and benefits from the visual refresh's accent colors being in place
  for the per-person cash-flow chart), (5) Visual refresh (the "cores do casal" token/helper it
  introduces is a soft dependency for ticket 4's per-person chart colors, so land it first or in
  parallel with an agreed color-token name).
- New migrations (`goals`, `tags`, `transaction_tags` tables, plus whatever indexes/constraints back
  them) need to be pushed to the hosted Supabase project as part of implementation — this repo's
  local Supabase/Docker stack is not available in the current dev environment. Diff against the
  hosted project's actual migration history before pushing (it has drifted from local filenames
  before) rather than blind `db push`.
- Per this repo's working convention: browser-verify each new flow (creating/completing a Meta,
  tagging and filtering a transaction, the new charts rendering with real data, the accent colors
  showing up in the right places) before considering any ticket from this spec done — automated
  checks alone have missed real bugs here before.
- Two new ADRs were recorded alongside this spec: `docs/adr/0002-goal-progress-is-derived-not-stored.md`
  and `docs/adr/0003-member-accent-color-by-household-order.md`. `CONTEXT.md` was updated with the
  **Meta**, **Etiqueta**, and **Saldo** glossary entries.
