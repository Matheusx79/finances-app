# 02 — Metas

**What to build:** A household can create a Meta (savings goal) tied to a dedicated Conta, see its
progress and whether it's "concluída" derived live from that Conta's saldo, edit or delete it, and
have completed Metas move out of the active list automatically — no manual "mark as complete" step.

**Blocked by:** 01 (Saldo de conta) — reuses `getAccountBalances`.

**Status:** ready-for-agent

- [ ] New `domain/goals` context (mirrors `domain/accounts`/`domain/categories` shape): `types.ts`
      (`Goal { id, householdId, name, accountId, targetAmount, targetDate: string | null,
      createdAt }`), `createGoal`, `updateGoal` (rename/target amount/target date/account in one
      function), `deleteGoal`, `listGoals`.
- [ ] `listGoals` returns each goal joined with `currentAmount` (from `getAccountBalances`) and a
      derived `completed: boolean` (`currentAmount >= targetAmount`) — nothing stored, always
      recomputed on read.
- [ ] New `goals` table: `household_id`, `account_id` (unique — enforces 1:1 Meta-to-Conta at the DB
      level), `name`, `target_amount`, `target_date` (nullable), `created_at`.
- [ ] Target date is optional end to end (create/edit form, schema, display).
- [ ] Creating a second Meta against an already-tied Conta is rejected.
- [ ] A new page/section to create, list, edit, and delete Metas, following this app's existing
      form-above-list page shape.
- [ ] Active Metas show progress (currentAmount vs targetAmount); a Meta whose balance meets/exceeds
      its target is excluded from the active list but still viewable/reachable (not deleted, not
      hidden entirely).
- [ ] Metas are household-scoped — another household's Metas are never visible/editable.
- [ ] Integration tests mirror `src/domain/accounts/*.test.ts` 1:1 (create/update/delete/list +
      household-scoped isolation for each), plus: progress reflects the tied account's balance,
      `completed` flips true once balance crosses target, second-goal-on-same-account rejected.
- [ ] Migration for the `goals` table pushed to the hosted Supabase project (local Supabase/Docker
      isn't available in this dev environment) — diff against the hosted project's actual migration
      history first, don't blind `db push`.
- [ ] Browser-verified: create a Meta, add a transaction to its Conta that crosses the target, see it
      move to completed/inactive.
