# 03 — Etiquetas

**What to build:** A household can manage a list of Etiquetas (tags), attach any number of them to
a Transação independent of its Categoria, see them on the transaction row, and filter the
Transações list by Etiqueta.

**Blocked by:** None — can start immediately.

**Status:** done

- [x] New `domain/tags` context, mirroring `domain/categories` exactly: `types.ts`, `createTag`,
      `renameTag`, `deleteTag`, `listTags`.
- [x] New `tags` table (`household_id`, `name`, `created_at`) and `transaction_tags` join table
      (`transaction_id`, `tag_id`) for the N:N relationship.
- [x] A management page/section to create, rename, and delete Etiquetas (same CRUD shape as the
      Categorias page).
- [x] `createTransaction`/`updateTransaction` accept an optional `tagIds: string[]`, writing/
      replacing the corresponding `transaction_tags` rows in the same call.
- [x] The transaction create/edit form lets the user pick zero or more Etiquetas.
- [x] Each transaction row displays its attached Etiquetas.
- [x] `listTransactionsForMonth` returns each transaction's `tagIds` and accepts an optional `tagId`
      filter (exact match via the join — no "shared tag" concept, unlike the owner filter's
      include-shared behavior).
- [x] The Transações page has a filter control for Etiqueta, alongside the existing person filter.
- [x] Etiquetas and their transaction associations are household-scoped.
- [x] Integration tests for `domain/tags` mirror `src/domain/categories/*.test.ts` 1:1.
- [x] Extend `create-transaction.test.ts`/`update-transaction.test.ts`/
      `list-transactions-for-month.test.ts` with cases for: creating/updating with multiple tagIds,
      tagIds round-tripping through `listTransactionsForMonth`, and the `tagId` filter excluding
      non-matching transactions.
- [x] Migrations (`tags`, `transaction_tags`) pushed to the hosted Supabase project — diff against
      its actual migration history first.
- [x] Browser-verified: create a tag, attach it to a transaction, filter the list by it and confirm
      only tagged transactions show.
