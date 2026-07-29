Status: ready-for-agent

# OFX Statement Import (Importar Extrato)

## Problem Statement

Every transaction today has to be typed in by hand, one at a time, through a full form (tipo, valor, data, conta, categoria, responsável) — even though the underlying bank already has this same data in an exportable file. For a household logging income, expenses, and debits regularly, re-typing what the bank already recorded is slow, repetitive, and error-prone (typos on amount/date).

## Solution

A new "Importar extrato" action on the Transações page. The user uploads an OFX file exported from their bank, picks which `Conta` and `Responsável` the whole file applies to, and gets a staging list of parsed transactions — one row per bank transaction, each pre-filled with date/amount/type and an editable category, non-spending transfers already excluded, previously-imported duplicates flagged and pre-unchecked. The user reviews the list (adjusts categories, unchecks anything they don't want), then confirms to insert the checked rows into the household's transaction register in one go.

## User Stories

1. As a household member, I want to upload an OFX file exported from my bank, so that I don't have to manually type in every transaction it already contains.
2. As a household member, I want to pick which `Conta` the imported file belongs to, so that the transactions land against the right account.
3. As a household member, I want to pick which `Responsável` (me/partner/shared) the imported file's transactions belong to, so that ownership is set correctly without repeating myself per row.
4. As a household member, I want each parsed transaction's income/expense type derived automatically from the bank data, so that I don't have to set it manually for every row.
5. As a household member, I want to assign a category to each imported transaction before it's saved, so that it shows up correctly in budget tracking (same as any other expense).
6. As a household member, I want transfers between my own bank accounts excluded from the import automatically, so that moving my own money doesn't get counted as income or spending.
7. As a household member, I want to see which imported rows match a transaction I've already imported before, so that re-uploading an overlapping statement doesn't create duplicates.
8. As a household member, I want duplicate-looking rows pre-unchecked (but still visible and forceable), so that I don't accidentally re-import something, while still being able to override if the match is wrong.
9. As a household member, I want to uncheck/skip any row I don't want imported, so that I have full control over what actually lands in the register.
10. As a household member, I want a single "confirmar" action that inserts only the checked rows, so that reviewing and importing a whole statement is one deliberate step.
11. As a household member, I want the import screen to live on the existing Transações page (not a separate section), so that all transaction-creation happens in one place.
12. As a household member, I want the existing manual single-transaction form to keep working exactly as it does today, so that import is an addition, not a replacement.
13. As a household member, I want an expense row missing a category to be rejected on confirm (same rule as manual entry), so that budget-relevant data stays consistent regardless of how it was entered.
14. As a household member, I want a clearly-invalid or unparseable file to show an error instead of silently importing garbage, so that I can tell something went wrong and re-export/retry.
15. As a household member, I want the import feature scoped to my household only, so that another household's data is never visible or affected.

## Implementation Decisions

- **New domain module**, `src/domain/import/`, following the existing plain-function-over-a-Supabase-client convention (same shape as `src/domain/transactions`, `src/domain/recurring`):
  - `parseOfxStatement(ofxText: string)` — pure function, no I/O. Parses OFX's `STMTTRN` blocks and returns one entry per transaction: date, amount, a derived `type` (`expense`/`income`), the bank's description/memo (used as a display label in the staging list only — not stored on the transaction), and the bank's `FITID`. Rows with `TRNTYPE = XFER` are dropped here, before anything reaches the staging list. Targets the OFX 1.x SGML-tag-soup dialect (unclosed tags), the common Brazilian bank export format, not OFX 2.x XML.
  - `importTransactions(supabase, { householdId, accountId, ownerHouseholdMemberId, rows })` — takes the batch-level `accountId`/`ownerHouseholdMemberId` plus a list of `{ date, amount, type, categoryId, fitid, include }` rows (the staging form's submitted state). For each `include`d row, checks whether `fitid` already exists on a transaction for that `accountId`; if not, inserts it (same shape as `createTransaction`, plus the new `external_id` column); returns what was inserted vs. skipped. Tested against real Supabase, same integration style as `create-transaction.test.ts`.
- **Type derivation**: OFX `TRNTYPE` maps to `expense`/`income` (e.g. `CREDIT`/`DEP` → income; `DEBIT`/`POS`/`CHECK`/`PAYMENT`/`FEE`/`SRVCHG` → expense), with the sign of `TRNAMT` as a backstop when `TRNTYPE` is ambiguous or bank-specific.
- **Schema change**: add `external_id text` (nullable) to `transactions`, plus a partial unique index on `(account_id, external_id) where external_id is not null` — manual entries and recurring auto-posts never set this column, so they're unaffected; only imported rows populate it, and only imported rows are subject to the uniqueness/dedup check.
- **Staging flow, two server-rendered round-trips, no client-side state** (matches this codebase's existing all-server-action forms):
  1. Upload form (file input + `Conta` picker + `Responsável` picker) submits to a server action that calls `parseOfxStatement`, checks each row's `fitid` against existing `external_id`s for the chosen account, and re-renders the page with a staging `<form>`: one row per parsed transaction as indexed fields (date/amount/type shown read-only, a category `<select>`, an include checkbox defaulted checked, or unchecked + "já importado" label for a detected duplicate), plus hidden fields carrying the row's original parsed data (date/amount/type/fitid) forward.
  2. Confirming that staging form submits to a second server action that reconstructs each row from its fields, calls `importTransactions`, and redirects back to the Transações list showing the newly-inserted transactions.
  - No persisted staging/draft table: if the user navigates away before confirming, the parsed data is gone and the file must be re-uploaded.
- **Category assignment**: fully manual per row (a `<select>` identical to the existing transaction form's), no default beyond "Nenhuma" — same required-for-expense rule already enforced by the DB check constraint and the server action.
- **Placement**: a new "Importar extrato" section/button on the existing Transações page (`src/app/dashboard/transactions/`), not a new route or nav entry.

## Testing Decisions

- Only external behavior is asserted (inputs/prior state → return value or persisted rows), not internal implementation details — same standard as the rest of the domain layer.
- `parseOfxStatement`: pure unit tests against fixture OFX text (no Supabase/DB involved) covering: a normal debit and credit row, `XFER` rows excluded, multiple `STMTTRN` blocks in one file, malformed/missing `FITID`, and negative-vs-positive `TRNAMT` sign handling.
- `importTransactions`: integration tests against a real Supabase instance, same pattern as `create-transaction.test.ts`/`post-due-recurring-transactions.test.ts` — covering: normal insert of a batch, re-importing the same `fitid` for the same account is skipped (no duplicate row created), the same `fitid` on a *different* account is not treated as a duplicate, an expense row with no category is rejected, and household-scoped isolation (account/owner from another household is rejected, same as `create-transaction.test.ts`'s existing cross-household tests).
- Prior art: `src/domain/transactions/create-transaction.test.ts`, `src/domain/recurring/post-due-recurring-transactions.test.ts`.

## Out of Scope

- CSV or free-text/paste import (OFX only, this spec).
- Auto-categorization — keyword rules or last-used-category suggestion for imported rows.
- Persisted bank-account-to-`Conta` mapping/auto-match (the picker is manual every time).
- Persisted/resumable staging (no draft table; an abandoned import must be re-uploaded from scratch).
- Modeling transfers as a first-class domain concept (they're filtered out, not tracked).
- Per-row `Conta`/`Responsável` overrides (both are batch-level only, set once at upload).
- Uploading/merging multiple OFX files in one sitting.
- Direct-post without preview (every import goes through the staging/confirm step).

## Further Notes

- This narrows, rather than contradicts, the original `expense-tracking-budgeting` spec's out-of-scope line ("CSV/statement import of any kind... planned as a future phase") — OFX import is now in scope; CSV/paste and AI/PDF extraction remain explicitly deferred.
- New migration (the `external_id` column + partial unique index) needs to be pushed to the hosted Supabase project as part of implementation — this repo's local Supabase/Docker stack is not available in the current dev environment, so `importTransactions`'s integration tests need the hosted project to run at all.
- Per this repo's working convention: browser-verify the actual upload → stage → confirm flow, and push the migration to hosted Supabase, before considering any ticket from this spec done — automated checks alone have missed real bugs here before.
