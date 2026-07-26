Status: ready-for-agent

# Expense Tracking & Budgeting (v1)

## Problem Statement

A couple wants joint control over their household spending, but today there's no shared, structured way to see where money goes each month or whether they're staying within a budget. Expenses happen across multiple accounts (bank, credit card, cash), and it's hard to tell — individually or together — how a category like groceries or dining is tracking against what was planned, or how this month compares to the last.

## Solution

A phone-accessible (responsive PWA) web app, in pt-BR, shared by exactly two household members. Either person logs transactions (expenses and income) manually, tags them to an account and a category, and the app shows household-wide budget progress per category for the current calendar month, a recent transaction feed, and the ability to browse any past month. Recurring bills/income can be set up once and auto-post on schedule. Views can be filtered to "me," "her," or the combined household.

## User Stories

1. As a household member, I want to log in with my own account, so that transactions I enter are attributed to me specifically.
2. As a household member, I want my login to be pre-provisioned (no public signup), so that only the two of us can ever access the household's financial data.
3. As a household member, I want to add a manual transaction (amount, date, category, account, optional note), so that I can record money spent or received.
4. As a household member, I want to mark a transaction as an expense or income, so that spending and earnings are tracked separately.
5. As a household member, I want to edit or delete a transaction I or my partner entered, so that mistakes can be corrected.
6. As a household member, I want to assign a transaction to a specific account (e.g. Checking, Credit Card, Cash), so that I can see spending broken down by where it happened.
7. As a household member, I want to create, rename, and delete accounts, so that the account list matches the real accounts we use.
8. As a household member, I want to assign a transaction to a category (e.g. Groceries, Transport, Dining), so that spending is grouped meaningfully.
9. As a household member, I want a sensible set of default categories already present when the household is created, so that I don't have to set everything up from scratch.
10. As a household member, I want to add, rename, or delete categories, so that the category list matches how we actually think about our spending.
11. As a household member, I want every transaction (and account) to belong to one of us specifically, or be marked as shared, so that individual and joint spending can both be represented.
12. As a household member, I want to filter transactions and reports to "just me," "just my partner," or "combined," so that I can see either an individual or joint picture.
13. As a household member, I want to set a fixed monthly budget amount per category, so that we have a shared spending target.
14. As a household member, I want that budget to apply to the household as a whole (not split per person), so that it reflects how we actually plan spending together.
15. As a household member, I want budgets to reset each calendar month with no rollover, so that each month starts with a clean, predictable target.
16. As a household member, I want to see, for the current month, how much of each category's budget has been spent so far, so that I know at a glance whether we're on track.
17. As a household member, I want categories that are over budget to be visually distinct from ones that are within budget, so that overspending is obvious without reading numbers closely.
18. As a household member, I want to see a feed of recent transactions on the main screen, so that I can quickly review what's just been logged.
19. As a household member, I want to browse budget progress and transactions for any past month, not just the current one, so that I can review how a previous month went.
20. As a household member, I want to log income transactions (e.g. salary), so that money coming in is recorded alongside money going out.
21. As a household member, I want to see a total income figure for the month separate from expenses, so that I have "money in vs. money out" context, even though income itself isn't budgeted.
22. As a household member, I want to set up a recurring transaction template (amount, category, account, person/shared, frequency), so that I don't have to manually re-enter predictable bills or income every month.
23. As a household member, I want recurring transactions to post automatically on their scheduled date, so that I don't have to remember to enter them.
24. As a household member, I want to edit a transaction that was auto-posted from a recurring template, so that I can correct the amount if it differed from the template (e.g. a variable utility bill).
25. As a household member, I want to pause, edit, or delete a recurring template, so that it stays accurate as our recurring bills change.
26. As a household member, I want the entire app UI in pt-BR, including currency and date formatting, so that it matches how we actually think and speak.
27. As a household member, I want the app usable comfortably on a phone browser, so that I can log a transaction on the spot.
28. As a household member, I want to install the app to my phone's home screen (PWA), so that it feels like a normal app without an app-store install.
29. As a household member, I want all amounts handled in a single currency (BRL), so that I never have to think about currency conversion.
30. As a household member, I want the data to be private to our household only, so that our financial information isn't exposed to anyone else.

## Implementation Decisions

- **Stack**: Next.js (frontend + Server Actions/Server Components), Supabase (Postgres + Auth), Tailwind CSS + shadcn/ui, hosted on Vercel (app) + Supabase (data/auth).
- **Domain/service layer** (the one seam, confirmed with the user): plain functions in a domain layer (e.g. `createTransaction`, `updateTransaction`, `deleteTransaction`, `listTransactionsForMonth`, `getBudgetProgressForMonth`, `setCategoryBudget`, `createAccount`, `createCategory`, `createRecurringTemplate`, `postDueRecurringTransactions`) take a Supabase client plus plain args and return plain data. Server Actions/Server Components are thin — they handle auth/session context and rendering only, with all business logic living in this layer.
- **Household model**: a household record links exactly two pre-provisioned user accounts. No self-service signup or invite flow — both accounts are created directly (e.g. via a seed script or manual Supabase Auth admin action) at setup time.
- **Accounts**: a household has many accounts (e.g. Checking, Credit Card, Cash). Accounts are labels only in v1 — no starting balance, no running balance, no reconciliation logic.
- **Categories**: flat (non-hierarchical) list, scoped to the household, seeded with sensible pt-BR defaults (e.g. Mercado, Transporte, Moradia, Lazer, Saúde) on household creation, fully editable (add/rename/delete) thereafter.
- **Transactions**: each has amount, date, type (expense/income), category (required for expenses; optional/none for income — income isn't budgeted so it doesn't need a category for budget purposes, though categorizing income informally is fine), account, an owner field (one of the two household members or "shared"), and an optional note. Currency is implicitly BRL for every transaction — no currency field needed on the row.
- **Budgets**: one budget amount per category per calendar month, scoped to the household (not per-person). No rollover — each month's budget resets independently. Calendar month boundaries (1st to end of month), not custom billing cycles.
- **Budget progress**: computed as sum of expense transactions in that category for the household within the calendar month, compared against the category's budget for that month.
- **Recurring templates**: amount, category, account, owner (person/shared), frequency (monthly, keyed off a day-of-month), active/paused flag. A scheduled process auto-posts a real transaction from each active template when its due date arrives; the resulting transaction is a normal transaction row, editable/deletable like any other, with a reference back to its originating template.
- **Filtering**: transaction lists and budget-progress views accept a person filter (household member A, household member B, or combined/household) — combined is the default view.
- **Historical navigation**: budget progress and transaction views are parameterized by month/year, allowing navigation to any past month with existing data. Future months are not expected to be pre-populated except via recurring templates.
- **Auth**: Supabase Auth (email/password or magic link), one session per household member, no roles/permissions beyond "logged-in household member" — both members have equal access to all household data.
- **Localization**: pt-BR strings, date formatting, and currency formatting (BRL) throughout the UI.
- **Platform**: responsive design built mobile-first, configured as an installable PWA (manifest + service worker for installability; offline support is not a requirement in v1, only home-screen installability).

## Testing Decisions

- Tests target the domain/service layer directly (function calls, not HTTP requests or rendered components), run against a real local/test Supabase Postgres instance (via the Supabase CLI's local stack) — no mocking of the Supabase client or database.
- Only external behavior is asserted: given inputs and prior DB state, does the function return/persist the right result — not internal implementation details of how a function is written.
- Priority modules for testing: transaction CRUD, budget-progress calculation (including the household-wide, no-rollover, calendar-month rules), recurring-template due-date posting logic, and household-scoped data isolation (a query for household A never returns household B's data — relevant once there's more than one household in the test database, even though this app only ever runs one household in production).
- No prior art exists in this repo yet (greenfield) — this establishes the first testing convention, to be followed by all subsequent feature work in this codebase.
- Server Actions/Server Components, being thin, are not the primary target of test coverage — a small number of integration/smoke tests may cover the wiring, but correctness lives in the domain-layer tests.

## Out of Scope

- Bank sync / aggregator integration (e.g. Plaid) for automatic transaction import.
- AI/PDF-based extraction of transactions from credit card or bank statements (planned as a future phase, not part of this spec).
- CSV/statement import of any kind.
- Account balance tracking, reconciliation, or net-worth/asset-liability views.
- Multi-currency support.
- Hierarchical/nested categories.
- Per-person budgets (budgets are household-wide only).
- Income budgeting (income is tracked but not budgeted against targets).
- Self-service signup, invites, or support for households other than the two hard-coded members.
- Push notifications, over-budget alerts, or reminders of any kind.
- Native or app-store distribution (Android/iOS native apps).
- Offline transaction entry (PWA installability is required; offline functionality is not).

## Further Notes

- The recurring-transaction auto-post behavior was chosen deliberately over a "confirm before posting" flow, accepting that variable-amount bills (e.g. utilities) may post with a stale amount and require a manual edit afterward — this was a explicit user preference, not a constraint of the platform.
- A known future direction (not part of this spec, and not to be designed around prematurely) is AI-assisted extraction of transactions from credit card PDF statements, converting them into the same transaction shape this spec defines. The domain layer's `createTransaction`-style functions should remain the natural landing point for that future work, but no speculative hooks for it should be built now.
- Net worth / account-balance tracking was explicitly deferred; if it's picked up later, it will need its own spec covering starting balances, reconciliation, and asset vs. liability sign conventions — none of that should be pulled forward into this work.
