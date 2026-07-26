# 06 — Category budgets + current-month progress view

**What to build:** Let household members set a fixed monthly budget amount per category (household-wide, not per-person), and show a dashboard view of spent-vs-budget per category for the current calendar month, with categories over budget visually distinct. Also show a total income figure for the month alongside it.

**Blocked by:** 04.

**Status:** ready-for-agent

- [ ] Domain-layer functions: `setCategoryBudget`, `getBudgetProgressForMonth`, tested against the local Supabase stack
- [ ] A budget is one amount per category per calendar month, scoped to the household — no per-person budgets, no rollover between months
- [ ] Budget progress is computed as sum of expense transactions in that category, household-wide (respecting the calendar month boundary: 1st to end of month), against the category's budget for that month
- [ ] UI (in pt-BR) to set/edit each category's budget for the current month
- [ ] Dashboard shows spent/budget per category for the current month, with categories over budget visually flagged (e.g. color/styling distinct from on-track categories)
- [ ] Dashboard shows a total income figure for the current month, separate from the budget-progress display, with no budget or target applied to it
