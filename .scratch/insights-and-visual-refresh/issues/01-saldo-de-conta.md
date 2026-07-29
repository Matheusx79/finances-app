# 01 — Saldo de conta

**What to build:** Each `Conta` on the Contas page shows its current saldo (balance), derived from
the sum of its transactions (income positive, expense negative) — no manual reconciliation, no
stored balance column.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] New `getAccountBalances(supabase, { householdId })` in `domain/accounts` returns each
      account's balance as one aggregate read (not one query per account).
- [ ] Contas page displays each account's saldo next to its name.
- [ ] An account with zero transactions shows a balance of 0, not blank/error.
- [ ] Household-scoped isolation: another household's transactions never contribute to this
      household's balances (integration-tested).
- [ ] Integration tests cover: mixed income/expense across multiple accounts, a zero-transaction
      account, and cross-household isolation — following `get-budget-progress-for-month.test.ts`'s
      pattern (real Supabase, no mocks).
- [ ] Browser-verified: saldo shown matches the actual sum of that account's transactions.
