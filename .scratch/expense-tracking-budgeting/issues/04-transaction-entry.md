# 04 — Transaction entry (manual, expense & income) + recent feed

**What to build:** A form to manually log a transaction — amount, date, type (expense/income), category, account, owner (one household member or "shared"), and an optional note — plus editing and deleting existing transactions, and a recent-transactions feed on the dashboard.

**Blocked by:** 02, 03 (needs real accounts and categories to assign transactions to).

**Status:** ready-for-agent

- [ ] Domain-layer functions: `createTransaction`, `updateTransaction`, `deleteTransaction`, `listTransactionsForMonth`, tested against the local Supabase stack
- [ ] A transaction records: amount (BRL), date, type (expense or income), category (required for expenses), account, owner (household member A, B, or shared), optional note
- [ ] UI (in pt-BR) to add a transaction, with category/account pickers populated from tickets 02/03
- [ ] Either household member can edit or delete any transaction, regardless of who logged it
- [ ] Dashboard shows a feed of recent transactions for the current month, newest first
- [ ] Transactions are scoped to the household
