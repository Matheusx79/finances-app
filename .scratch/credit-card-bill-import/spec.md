# Credit Card Bill Import (Importar Fatura)

## Problem Statement

Bank statement import (OFX) already saves the household from re-typing every checking-account transaction by hand. Credit card purchases have no equivalent path — the household still types in every line of every card `Fatura` manually, even though the card issuer's PDF bill already contains the same data. Credit card PDF statements have no OFX (or any machine-parseable) export, so the existing OFX import path can't be reused for them, and building a bespoke PDF-layout parser per issuer would be brittle and expensive to maintain.

## Solution

A new "Importar fatura" tab on the existing `/dashboard/transactions/import` page, alongside the existing "Extrato bancário" (OFX) tab. Instead of parsing the PDF in-app, the user offloads extraction to their own Claude.ai chat (Pro subscription, no API cost to this app): the page shows a copyable prompt template, the user pastes it into Claude.ai along with the uploaded PDF bill, copies Claude's JSON reply, and pastes that JSON into a textarea on this page. The app parses the pasted JSON into a staging list — one row per bill line, category editable per row, previously-imported duplicates flagged and pre-unchecked, non-spend lines (payments, balance carry-forward) excluded upstream by the prompt instructions — and the user reviews and confirms exactly as with OFX import, inserting the checked rows into the household's transaction register in one go.

## User Stories

1. As a household member, I want to convert my credit card PDF bill into structured data using my own Claude.ai chat subscription, so that I don't pay per-import API costs and don't have to type every line by hand.
2. As a household member, I want a ready-made prompt to copy into Claude.ai chat, so that I don't have to guess what format to ask for and the app can reliably parse the result.
3. As a household member, I want to paste Claude's JSON reply directly into the app, so that getting from "PDF bill" to "reviewed transactions" takes only a copy-paste round trip.
4. As a household member, I want to pick which existing `Conta` (e.g. "Cartão Nubank") the pasted bill belongs to, so that the transactions land against the right account — the same account I already created manually for that card.
5. As a household member, I want to pick which `Responsável` the whole pasted bill belongs to, so that ownership is set without repeating myself per row.
6. As a household member, I want each parsed line's income/expense type derived automatically from the amount's sign, so that refunds (estornos) come through as income and purchases as expense without manual toggling.
7. As a household member, I want the prompt template to instruct Claude to omit non-spend lines (payment received, previous balance carried forward), so that my bill's paid-balance total doesn't get imported as spending.
8. As a household member, I want to assign a category to each imported line before it's saved, so that it shows up correctly in budget tracking, same as any other expense.
9. As a household member, I want to see which pasted lines match a line I've already imported before, so that re-pasting an overlapping bill (or re-running the same Claude.ai conversion) doesn't create duplicates.
10. As a household member, I want duplicate-looking rows pre-unchecked but still visible and forceable, so that I don't accidentally re-import something while still being able to override a wrong match.
11. As a household member, I want to uncheck/skip any row I don't want imported, so that I have full control over what actually lands in the register.
12. As a household member, I want a single "confirmar" action that inserts only the checked rows, so that reviewing and importing a whole bill is one deliberate step.
13. As a household member, I want installment lines ("Compra X 3/12") imported literally as they appear on this month's bill, so that I don't need to configure or maintain a recurring installment plan — next month's bill just gets pasted the same way.
14. As a household member, I want an expense row missing a category to be rejected on confirm, same as manual entry and OFX import, so budget-relevant data stays consistent regardless of how it was entered.
15. As a household member, I want a clearly-invalid paste (not JSON, wrong shape) to show an error instead of silently importing garbage, so I can tell something went wrong and retry the Claude.ai step.
16. As a household member, I want the import feature scoped to my household only, so that another household's data is never visible or affected.
17. As a household member, I want the existing OFX import and manual single-transaction entry to keep working exactly as they do today, so this is an addition, not a replacement.

## Implementation Decisions

- **New domain module**, `src/domain/card-bill/`, following the same plain-function-over-a-Supabase-client convention as `src/domain/ofx/`:
  - `parseCardBillPaste(jsonText: string)` — pure function, no I/O. Parses the pasted JSON array into one entry per line: `{date, amount, type, description, externalId}`. Input schema per row: `{data: string (ISO YYYY-MM-DD), descricao: string, valor: number (signed), parcela: string | null}`. Strips a wrapping ` ```json ` code fence (or bare ` ``` `) before parsing, since users paste directly from a Claude.ai chat reply. `type` derives from the sign of `valor` (positive → expense, negative → income/estorno). `parcela`, when present (e.g. `"3/12"`), is appended to the row's description/note text — no separate field, no installment-plan modeling. `externalId` is a deterministic hash of `date + description + amount`, filling the same role OFX's `fitid` plays.
  - No new insert/dedup function — reuses `importTransactions` and `findExistingExternalIds`, unchanged, from their new home at `src/domain/transactions/import-transactions.ts` (moved from `src/domain/ofx/import-transactions.ts` via `git mv`, pure rename — the functions already take a generic `fitid`/`description`/rows shape with no OFX-specific logic, so the synthetic hash slots into the existing `fitid` param and `external_id` column without any signature change).
  - A static, copyable prompt-template string (shown in the UI, not sent anywhere by the app) instructs Claude.ai chat to: read the uploaded PDF bill, emit only a JSON array matching the schema above, omit non-spend lines (payment received, previous balance carried forward, statement totals/footers), and use a negative `valor` for refunds/estornos.
- **No schema change.** Reuses the `transactions.external_id` column and its partial unique index added for OFX import — the synthetic hash is just another value in that column.
- **No new domain concept for credit cards.** A card is represented as a plain `Conta` the user creates manually once (e.g. "Cartão Nubank"), same as any bank account — see `CONTEXT.md`'s **Fatura** entry. No account-type field, no first-class "credit card" or "fatura" entity, no tracking of the card's own running balance or bill-payment as a transaction category.
- **No installment-plan modeling.** Each parcela line from a given month's bill is imported as one literal transaction when that month's `Fatura` is pasted; there is no link between parcela 3/12 this month and parcela 4/12 next month, and no auto-generation of future installments.
- **UI placement**: a second tab, "Fatura do cartão", on the existing import page (`src/app/dashboard/transactions/import/`) alongside the existing "Extrato bancário" (OFX) tab — not a new route. The staging/review/confirm step is the shared component already built for OFX (row list, category `<select>`, include checkbox, duplicate flag), fed by `parseCardBillPaste` output instead of `parseOfxStatement` output.
- **Paste flow**: single step, no upload — a textarea for the pasted JSON plus the batch-level `Conta`/`Responsável` pickers, submitting to a server action that calls `parseCardBillPaste`, checks each row's `externalId` against existing `external_id`s for the chosen account (via `findExistingExternalIds`), and renders the same staging form OFX uses. Confirm submits to a second server action calling `importTransactions`, same as OFX.
- **Error handling**: the parser throws a friendly error ("Não foi possível interpretar o texto colado. Verifique se é um JSON válido.") only when the pasted text isn't valid JSON or isn't an array. Within a valid array, a row missing a parseable `data` or `valor` is skipped, not fatal to the whole paste — matching `parseOfxStatement`'s tolerance for individual bad rows.
- **Category assignment**: fully manual per row, identical `<select>` and required-for-expense rule as OFX and manual entry.
- **Household scoping**: inherited automatically from the existing `transactions_check_household_consistency` trigger and the chosen `Conta`/`Responsável` belonging to the signed-in household — no new isolation logic.

## Testing Decisions

- Only external behavior is asserted (input paste text → parsed rows, or thrown error), not internal implementation details — same standard as the rest of the domain layer.
- `parseCardBillPaste`: pure unit tests against fixture JSON strings (no Supabase/DB involved) covering: a normal row, a row with `parcela` present vs `null`, a negative `valor` (estorno → income), a row missing `data`/`valor` (skipped, not fatal), JSON wrapped in a ` ```json ` code fence (stripped before parsing), and invalid/non-JSON input (throws the friendly error).
- No new tests for `importTransactions`/`findExistingExternalIds` — reused unchanged (pure file move via `git mv`), already covered by the existing OFX integration test suite (`create-transaction.test.ts`-style pattern). Verify the move doesn't break existing import paths by re-running that suite after the rename.
- Prior art: `src/domain/ofx/parse-ofx-statement.test.ts` for the parser-test shape; `src/domain/ofx/import-transactions.test.ts` (moving to `src/domain/transactions/import-transactions.test.ts`) for the reused insert/dedup tests.

## Out of Scope

- Calling the Claude API (or any LLM API) directly from the app — extraction happens entirely in the user's own Claude.ai chat session, outside this app, at no API cost to the app.
- CSV or bespoke PDF-layout parsing of the bill (regex/positional parsers per card issuer) — the JSON-paste-from-chat approach is the only extraction path this spec covers.
- Auto-categorization — keyword rules or last-used-category suggestion for imported rows.
- Persisted bank-account-to-`Conta` mapping/auto-match, or a first-class "credit card" account type — the `Conta` picker is manual every time, same as OFX.
- Installment-plan modeling as a first-class concept (generating future months' parcela transactions automatically).
- Persisted/resumable staging (no draft table) — an abandoned import must be re-pasted from scratch, same as OFX.
- Per-row `Conta`/`Responsável` overrides (both are batch-level only, set once at paste time).
- Pasting/merging multiple bills in one sitting.
- Direct-post without preview — every import goes through the staging/confirm step.
- Validating or enforcing that the pasted JSON actually came from Claude.ai chat, or verifying the prompt template was used verbatim — the app only validates the JSON shape, not its provenance.

## Further Notes

- This narrows the original `expense-tracking-budgeting` spec's deferred "AI/PDF extraction" line into a concrete, zero-API-cost design: extraction happens in the user's own Claude.ai chat, not via a server-side API call this app pays for.
- No new Supabase migration — reuses the `external_id` column and partial unique index added by the OFX import ticket (`20260727000000_transactions_external_id.sql`). Per this repo's working convention, still browser-verify the actual paste → stage → confirm flow against the hosted Supabase project before considering any ticket from this spec done.
- `CONTEXT.md` already updated (2026-07-29) with the **Fatura** glossary entry documenting the "no first-class entity" decision.
