# Meta progress and completion are derived from account balance, never persisted

A `Meta` (goal) is tied 1:1 to a dedicated `Conta`. Its progress toward the target amount, and
whether it counts as "concluída" (completed), could either be tracked as stored state (a
`current_amount` column updated on every transaction, plus a `status` column flipped by some
action) or computed on read from the `Conta`'s balance (itself already derived from summed
`Transação` rows — see **Saldo** in `CONTEXT.md`).

Decided: fully derived, computed on read. `listGoals` joins each `Meta` against the household's
account balances (via `getAccountBalances`) and returns `currentAmount`/`completed` as computed
fields. There is no "mark as complete" action, no completion timestamp, and no risk of the stored
progress drifting from the real account balance (e.g. after a transaction is edited or deleted).

## Consequences

- One fewer write path to keep consistent — completing a goal is just the account balance crossing
  the target, nothing to update.
- `listGoals` always has to recompute balances for every account backing a goal; if this ever shows
  up as a real cost, the fix is to lean on `getAccountBalances` doing one aggregate query per
  household rather than per-account, not to start caching/persisting progress.
- No history of *when* a goal was completed is kept. If "completed on 12/2026" ever becomes a real
  ask, that's a new, separate decision (a completion event/timestamp), not a reason to revisit this
  one.
