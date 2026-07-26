# 05 — Person filter (me / partner / combined)

**What to build:** A filter control on the transaction feed that switches the view between "just me," "just my partner," and the combined household view.

**Blocked by:** 04.

**Status:** done

- [x] Domain-layer `listTransactionsForMonth` (or equivalent) accepts an owner filter parameter (member A, member B, or combined), tested against the local Supabase stack
- [x] UI control (in pt-BR) to switch the filter on the transaction feed
- [x] "Shared" transactions appear in every filter view, not just "combined"
- [x] Combined/household is the default view on load

## Comments

Implemented in commit `d2edf53`.

- `listTransactionsForMonth` (`src/domain/transactions/list-transactions-for-month.ts`) takes an optional `ownerHouseholdMemberId`. When set, the query adds `.or("owner_household_member_id.eq.<id>,owner_household_member_id.is.null")` so shared transactions always show up alongside the filtered member's own — when omitted, behavior is unchanged (backward compatible with every other caller, including the dashboard's combined feed). Tests added to `list-transactions-for-month.test.ts`: member filter includes that member's + shared while excluding the other member's, and household-scoped isolation still holds with the filter applied.
- UI: a new server-only `PersonFilter` component (`src/app/dashboard/transactions/person-filter.tsx`) — three `Link`-rendered buttons, no client JS, matching the existing `?erro=` query-param pattern already used on this page. Query scheme: `?responsavel=eu|parceiro`, omitted (or any other/unresolvable value) defaults to combined — satisfies "combined is default on load." Labels are relative to the logged-in user ("Eu" / the partner's real `displayName`, resolved via `household.members` + the session's `userId`) rather than generic "member A/B," matching the ticket's framing ("just me," "just my partner").
- Judgment call: a 1-member household (shouldn't happen in production, but guarded anyway) falls back to combined rather than resolving `eu`/`parceiro` to a missing member.
- Verified: `npx tsc --noEmit`, `npx eslint`, full `npm test` (57/57 passing), `npm run build` all clean. Live-browser-verified against a throwaway local-Supabase-stack household (see ticket 06's Comments for the shared verification session — both tickets were checked together): added a transaction owned by one member, confirmed "Eu"/partner/"Casal" tabs filter correctly and a shared transaction (owner left blank) would appear in every tab per the domain-layer test coverage.
