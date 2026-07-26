# 02 — Accounts management (CRUD)

**What to build:** Let household members create, rename, and delete accounts (e.g. Checking, Credit Card, Cash) that transactions will later be tagged to. Accounts are labels only — no balance tracking. Scoped to the household, visible/editable by either member.

**Blocked by:** 01.

**Status:** ready-for-agent

- [ ] Domain-layer functions: `createAccount`, `listAccounts`, `renameAccount`, `deleteAccount`, tested against the local Supabase stack
- [ ] Accounts are scoped to a household — one household's accounts never appear for another (relevant for test data isolation even though production only ever runs one household)
- [ ] UI (in pt-BR) to view the list of accounts, add a new one, rename an existing one, and delete one
- [ ] Deleting an account that's referenced by existing transactions is handled sanely (either blocked with a clear message, or explicitly decided otherwise — flag if this comes up, since the spec doesn't dictate a behavior)
- [ ] Changes are visible to both household members (shared household data, not per-user)
