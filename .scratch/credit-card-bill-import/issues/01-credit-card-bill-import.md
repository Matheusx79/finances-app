# 01 — Credit card bill import (Importar Fatura)

**What to build:** A "Fatura do cartão" tab on the existing Importar page (`/dashboard/transactions/import`), alongside the existing "Extrato bancário" (OFX) tab. The user copies a provided prompt template into their own Claude.ai chat along with the uploaded PDF bill, pastes Claude's JSON reply back into a textarea, picks the `Conta` and `Responsável` the whole bill belongs to, reviews a staging list of parsed lines (category per row, duplicates flagged, non-spend lines already excluded by the prompt), then confirms to insert the checked rows into the register — same staging/review/confirm shape as OFX import.

**Blocked by:** None — can start immediately

**Status:** done

- [x] `src/domain/ofx/import-transactions.ts` moved to `src/domain/transactions/import-transactions.ts` via `git mv` (pure rename, no behavior change); both existing OFX call sites (upload/confirm actions, tests) updated to the new import path
- [x] New module `src/domain/card-bill/` with `parseCardBillPaste(jsonText)` — pure function, no I/O — parses a JSON array of `{data, descricao, valor, parcela}` rows into `{date, amount, type, description, externalId}` rows: `type` derived from the sign of `valor` (positive → expense, negative → income/estorno), `parcela` (when present, e.g. `"3/12"`) appended into the description/note text, `externalId` a deterministic hash of `date + description + amount`. Strips a wrapping ` ```json `/` ``` ` code fence before parsing. Throws a friendly error only when the input isn't valid JSON or isn't an array; a row missing a parseable `data`/`valor` is skipped, not fatal to the whole paste.
- [x] Static copyable prompt-template string, shown in the UI on the "Fatura do cartão" tab, instructing Claude.ai chat to read the uploaded PDF bill and reply with only a JSON array matching `parseCardBillPaste`'s schema, omitting non-spend lines (payment received, previous balance carried forward, statement totals/footers), using a negative `valor` for refunds/estornos
- [x] "Fatura do cartão" tab UI: prompt template + "Copiar" button, paste textarea, `Conta` picker, `Responsável` picker, all required — submits to a server action that calls `parseCardBillPaste`, checks each row's `externalId` against existing `external_id`s for the chosen account via the (moved, unchanged) `findExistingExternalIds`, and renders the same staging form component OFX import already uses (date/amount/type read-only, category `<select>`, include checkbox defaulted checked, defaulted unchecked + "já importado" label for a detected duplicate)
- [x] Confirm submits the staging form to a second server action, calls the (moved, unchanged) `importTransactions`, redirects to the Transações list showing the newly-inserted rows
- [x] Expense rows with no category are rejected on confirm, same as manual entry and OFX import (check constraint + server-action validation)
- [x] An invalid paste (not valid JSON, not an array) shows an error instead of silently importing garbage
- [x] Import is scoped to the signed-in household (account/owner from another household rejected — inherited from the existing `transactions_check_household_consistency` trigger, no new isolation logic)
- [x] Existing OFX import ("Extrato bancário" tab) and manual single-transaction entry form are untouched and still work
- [x] `parseCardBillPaste` unit tests: normal row, `parcela` present vs `null`, negative `valor` (estorno → income), row missing `data`/`valor` (skipped, not fatal), JSON wrapped in a ` ```json ` code fence (stripped), invalid/non-JSON input (throws)
- [x] Existing OFX integration tests for `importTransactions`/`findExistingExternalIds` re-run green after the file move (no new tests needed — reused unchanged)
