# 04 — Gráfico de gasto por categoria

**What to build:** The dashboard home shows a pizza/bar chart of spending by category for the
selected month, reusing the same data already computed for the budget-progress view.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] A chart library is chosen and installed (none exists in `package.json` today) — pick something
      that fits this app's existing shadcn-based UI.
- [ ] Chart is fed from the existing `getBudgetProgressForMonth` (`categoryName`/`spentAmount` per
      category) — no new domain function for this ticket.
- [ ] Chart renders on the existing dashboard home page, for the currently-selected month (reusing
      the existing month-nav state) — no new page/nav entry.
- [ ] A month with no spending in any category renders without erroring (empty/zero state, not a
      crash).
- [ ] Browser-verified on both mobile and desktop layouts.
