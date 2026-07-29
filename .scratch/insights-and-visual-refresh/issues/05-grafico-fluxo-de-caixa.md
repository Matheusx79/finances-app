# 05 — Gráfico de fluxo de caixa por pessoa

**What to build:** The dashboard home shows a monthly cash-flow chart (entradas vs. saídas) over
recent months, broken down by household member (eu/parceiro/compartilhado).

**Blocked by:** 04 (Gráfico de gasto por categoria) — reuses the chart library/setup it introduces.

**Status:** ready-for-agent

- [ ] New `getMonthlyCashFlow(supabase, { householdId, monthsBack })` in a new `domain/reports`
      context — one row per month covering the last `monthsBack` months, income/expense totals split
      by `ownerHouseholdMemberId` (eu/parceiro/shared).
- [ ] Chart renders on the dashboard home, alongside the category-breakdown chart from ticket 04.
- [ ] A month with no transactions is present in the series with zero totals, not omitted.
- [ ] Household-scoped isolation (integration-tested).
- [ ] Integration test covering multiple months and the per-person split, following this repo's
      real-Supabase-no-mocks convention.
- [ ] Note: final per-person segment colors depend on ticket 06 (cores do casal tokens); use
      placeholder colors here if 06 hasn't landed yet, and pick them up when it does — not a hard
      blocker on 06.
- [ ] Browser-verified on both mobile and desktop layouts.
