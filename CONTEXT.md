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
- **Conta** (account) — a bank/money account, per `src/domain/accounts`.
- **Transação** (transaction) — a posted entry in an account's register.
- **Modelo recorrente** (recurring template) — the entity that generates recurring transactions
  (`src/domain/recurring`, e.g. `create-recurring-template.ts`). This is the entity name, used in
  its own CRUD UI ("Novo modelo recorrente", "Modelos cadastrados").
  **"Transações recorrentes"** is the section/nav label for browsing recurring activity — it is
  *not* a synonym for the entity. Keep this split: section label describes what the user is
  browsing, entity name describes what they're creating/editing. Don't unify these two terms.
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
