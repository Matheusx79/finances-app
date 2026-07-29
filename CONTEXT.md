# finances-app — Domain Glossary

Single-context repo. Terms below are pt-BR (the app's UI language) with an English gloss for
engineering conversation. Don't drift to synonyms this glossary explicitly avoids — see
`docs/agents/domain.md` for how this file is used.

## Core concepts

- **Casal** (couple) — the app is a couple's shared finance tracker, not a general
  multi-person household. `household_members` is hard-capped at 2 rows
  (`src/domain/household/household-member-cap.test.ts`); there is no path to a 3+ person group.
  Don't borrow generic "household" language (à la YNAB Together / Monarch Households) — it implies
  an open-ended member count this app deliberately doesn't have.
- **Eu / [nome do parceiro]** — the two person-filter values alongside **Casal** (combined view).
  See `src/app/dashboard/transactions/person-filter.tsx`.
- **Categoria** (category) — a single budgetable spending bucket. No grouping concept exists yet
  (no "category group" / "envelope group"); categories render as a flat list. Adding grouping is a
  real feature, not a naming change — out of scope until it's actually decided on.
- **Conta** (account) — a bank/money account, per `src/domain/accounts`. A credit card is represented as a plain `Conta`
  (e.g. "Cartão Nubank") — there is no separate card/account-type distinction; see **Fatura** below.
- **Fatura** (credit card bill) — the source document for the card-bill import flow (distinct from **Extrato**, the OFX
  bank-statement import). Decided 2026-07-29: a `Fatura` is never modeled as its own entity — importing one just adds
  expense `Transação` rows to whichever `Conta` the user picks, the same "import the spending lines, don't model the
  instrument" precedent as OFX import. Installment lines ("3/12") are not modeled as a recurring/installment-plan
  concept either — each parcela line from the bill becomes one literal `Transação`, with the parcela text kept only in
  the note.
- **Transação** (transaction) — a posted entry in an account's register.
- **Modelo recorrente** (recurring template) — the entity that generates recurring transactions
  (`src/domain/recurring`, e.g. `create-recurring-template.ts`). This is the entity name, used in
  its own CRUD UI ("Novo modelo recorrente", "Modelos cadastrados").
  **"Transações recorrentes"** is the section/nav label for browsing recurring activity — it is
  *not* a synonym for the entity. Keep this split: section label describes what the user is
  browsing, entity name describes what they're creating/editing. Don't unify these two terms.
- **Meta** (goal) — a savings target tied to exactly one dedicated `Conta` (1:1, not N:1 — a `Conta`
  can back at most one `Meta`). Progress is never stored, it's derived by comparing the `Conta`'s
  balance (see **Saldo**) against the `Meta`'s target amount; likewise "concluída" (completed) is a
  derived read, not a persisted status column — there is no explicit "mark as complete" action.
  Target date is optional. Decided 2026-07-29 during the Organizze/Mobills insights pass
  (`.scratch/insights-and-visual-refresh/`); "Objetivo" was considered and rejected as a synonym.
- **Etiqueta** (tag) — a managed, cross-cutting label on a `Transação` (CRUD'd the same way as
  **Categoria**, not free-text) — a transaction can carry many etiquetas at once (N:N), independent
  of its single `Categoria`. Decided 2026-07-29, same pass as **Meta**.
- **Saldo** (balance) — an account's balance, always derived from the sum of its `Transação` rows,
  never a stored column. Feeds both the Contas page and **Meta** progress.
- **Orçamento** (budget) — the per-category budgeted amount for a month.
  - **Gasto** (spent) — amount spent so far in the category this month.
  - **Restante** (remaining) — `orçamento - gasto`, the standalone "amount left" figure. Decided
    2026-07-27 to add this label to the budget progress view (previously only showed
    spent/budget side by side with no derived remaining figure). Prefer "Restante" over
    "Disponível" ("available") — kept neutral in tone to match Categorias/Orçamentos/Transações
    rather than YNAB's more action-oriented "available to spend" framing.

## Naming decisions log (2026-07-27)

A naming sanity-check pass against research on YNAB, Copilot Money, Monarch Money, Actual Budget,
and Mint (see `docs/research/finance-app-ui-naming-patterns.md`) confirmed existing pt-BR
terminology is sound. Only change: added **Restante** as a budget-progress figure. Explicitly
deferred: category grouping (real feature, not a naming change).
