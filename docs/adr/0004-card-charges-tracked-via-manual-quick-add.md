# Card charges get same-day visibility via manual quick-add, not notification automation

Credit-card `Fatura` data is only importable (OFX/pasted text) once the statement closes monthly —
even paid Open Finance doesn't shorten this, since Brazilian banks don't expose future/pending card
installments over Open Finance at all (see `docs/research/card-charge-daily-tracking-patterns.md`,
Organizze's own FAQ). Checking-account (`Conta corrente`) OFX has no such lag and is re-importable
anytime, so that side needed no product change — just importing more often. The card side does,
since the underlying data genuinely doesn't exist anywhere importable until month-end.

Two ways to close the gap were considered: (1) phone notification-forwarding automation (Tasker/iOS
Shortcuts style, reading the bank's push notification for each charge and posting to a webhook), or
(2) a lightweight manual quick-add using the existing transaction form. Decided: manual quick-add.
Every app surveyed in the research pass (Organizze, Mobills, YNAB, Actual Budget, Copilot Money,
Monarch) treats manual entry as a first-class path, not a fallback — and the two Brazilian apps that
do ship notification-reading capture (Organizze, Mobills) built it as native Android functionality,
Android-only by Apple policy, not a small addition. Automation was rejected here for cost/fragility
(bank-notification-format dependency, Android-only reach, real engineering investment) against the
"no paid service, no heavy manual work, ship something usable now" constraint driving this decision.

No new quick-add form or entry point was built either — the existing `TransactionForm`
(`src/app/dashboard/transactions/transaction-form.tsx`), already inline on `/dashboard/transactions`
and already defaulting date to today and type to expense, is reused as-is. Research confirmed other
apps' "quick add" differs from their full form by entry-point speed, not fewer fields (Organizze's
own docs describe its 3 quick-add entry points as using "the same general-purpose expense fields as
any other manual transaction... not a stripped-down fast-entry variant"). A faster entry point (PWA
`shortcuts` manifest entry, deep-linking to the form) was discussed and deliberately deferred rather
than rejected — the plan is to validate with real use first, since the bottom nav is already at 8
items and the form is already one tap away.

## Consequences

- No new route, form component, or nav item to maintain for this feature — the diff is limited to
  smarter defaults (remembering the last-picked account/owner per device) on the existing form.
- The app has no bank-notification-reading capability and isn't expected to grow one under this
  decision; if that's ever revisited, it's a new decision, not an extension of this one.
- Card-side same-day visibility depends entirely on the user actually doing the manual quick-add in
  the moment — there's no safety net if they skip it, unlike an automated capture path.
