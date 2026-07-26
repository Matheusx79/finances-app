# 05 — Person filter (me / partner / combined)

**What to build:** A filter control on the transaction feed that switches the view between "just me," "just my partner," and the combined household view.

**Blocked by:** 04.

**Status:** ready-for-agent

- [ ] Domain-layer `listTransactionsForMonth` (or equivalent) accepts an owner filter parameter (member A, member B, or combined), tested against the local Supabase stack
- [ ] UI control (in pt-BR) to switch the filter on the transaction feed
- [ ] "Shared" transactions appear in every filter view, not just "combined"
- [ ] Combined/household is the default view on load
