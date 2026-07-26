# 07 — Historical month navigation

**What to build:** A month picker/navigation on the budget-progress and transaction views, so any past month with data can be browsed, not just the current one.

**Blocked by:** 06.

**Status:** ready-for-agent

- [ ] Domain-layer functions (`getBudgetProgressForMonth`, `listTransactionsForMonth`) accept a month/year parameter, tested against the local Supabase stack for at least two different months
- [ ] UI control (in pt-BR) to navigate to a previous or next month
- [ ] Navigating to a past month shows that month's budget progress, income total, and transaction feed, correctly scoped to that month's boundaries
- [ ] Navigating to a month with no data shows an empty/zeroed state, not an error
