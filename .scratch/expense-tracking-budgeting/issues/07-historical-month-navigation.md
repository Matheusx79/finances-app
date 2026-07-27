# 07 — Historical month navigation

**What to build:** A month picker/navigation on the budget-progress and transaction views, so any past month with data can be browsed, not just the current one.

**Blocked by:** 06.

**Status:** done

- [x] Domain-layer functions (`getBudgetProgressForMonth`, `listTransactionsForMonth`) accept a month/year parameter, tested against the local Supabase stack for at least two different months
- [x] UI control (in pt-BR) to navigate to a previous or next month
- [x] Navigating to a past month shows that month's budget progress, income total, and transaction feed, correctly scoped to that month's boundaries
- [x] Navigating to a month with no data shows an empty/zeroed state, not an error

## Comments

Implemented in commit `f4e1c75`.

- Both `listTransactionsForMonth` and `getBudgetProgressForMonth` already accepted `{ year, month }` (from tickets 04/06) and `list-transactions-for-month.test.ts` already covered two different months (a June/July/August boundary plus a Dec/Jan year-boundary case) — only `getBudgetProgressForMonth` was missing a genuine multi-month test (every existing test exercised month 7 only), so one was added: `"returns independent progress per month"` in `get-budget-progress-for-month.test.ts`, asserting July and August budgets/spend don't leak into each other. No other domain-layer changes were needed — this ticket was almost entirely UI wiring.
- New shared `src/app/dashboard/month-nav.tsx`: `MonthNav` (prev/next Link-rendered buttons + centered pt-BR month/year label), `formatMonthYearBR`, and `resolveMonthParams(ano?, mes?)` (parses `?ano=&mes=`, falls back to the current month on anything missing/malformed — never throws, satisfying "a month with no data shows empty/zeroed, not an error" at the routing layer too). `src/app/dashboard/page.tsx` and `src/app/dashboard/transactions/page.tsx` both dropped their hardcoded `now = new Date()` in favor of this.
- `MonthNav` takes an `extraParams` map so switching months preserves other filters — `transactions/page.tsx` passes `{ responsavel }` through. The reverse direction (switching the person filter preserving `ano`/`mes`) was originally left as a known gap by the implementing agent, since it required touching `person-filter.tsx` outside that agent's file-ownership boundary — fixed during integration: `PersonFilter` now takes the same `extraParams` shape and `transactions/page.tsx` passes `{ ano, mes }` through it.
- Bug found and fixed during integration (not caught by `tsc`/`eslint`/tests — only visible live): the month label used Tailwind's `capitalize` class, which capitalizes *every* word, turning "julho de 2026" into "Julho De 2026" (pt-BR's "de" shouldn't be capitalized). Replaced with a `capitalizeFirst` helper that only capitalizes the leading letter.
- Also found during the Standards-axis code review and fixed: `src/app/dashboard/budgets/page.tsx` had forked its own byte-identical copy of `formatMonthYearBR` instead of importing the one in `month-nav.tsx` — collapsed to a single import, closing off exactly the kind of drift that caused the capitalize bug above (that page's copy hadn't gotten the `capitalizeFirst` treatment and would have silently diverged).
- Live-browser-verified end to end against a throwaway household seeded on the local Supabase stack (production login isn't available to the agent — see ticket 06's Comments): navigated to a past month via "Mês anterior", confirmed the dashboard's income/budget-progress cards and the transactions feed all scoped correctly to that month with a clean empty state (no transactions, all categories `R$ 0,00`, no error), and confirmed round-tripping between the person filter and month nav on the transactions page preserves both.
- Code-reviewed (Standards + Spec axes) alongside ticket 08. Spec axis: no missing/wrong requirements. Standards axis: one hard violation (the `formatMonthYearBR` duplication above, fixed) and two judgement-call notes on ticket 08's side (see that ticket's Comments).
- Verified: `npx tsc --noEmit`, `npx eslint`, full `npm test` (71/71 passing), `npm run build` all clean.
