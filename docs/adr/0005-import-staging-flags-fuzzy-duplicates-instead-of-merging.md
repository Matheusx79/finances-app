# Import staging flags likely duplicates of manual entries by fuzzy match, never auto-merges

Once card charges can be manually quick-added same-day (ADR-0004), the same purchase will typically
also arrive a second time via the month-end `Fatura` import — and the existing dedup
(`findExistingExternalIds`, an exact hash of date+description+amount) only catches re-imports of the
same file, not a manual entry against a later import, since the two will never share a description
or an exact settled amount/date. Left alone, this silently double-counts spending in every category
total, which defeats the entire point of this feature.

Considered the reconciliation approaches surveyed in
`docs/research/card-charge-daily-tracking-patterns.md`: YNAB's auto-match-and-merge (date within 10
days + same amount, auto-approved, imported amount wins but manual payee/memo/date are kept),
Actual Budget's similar ID-then-fuzzy-match-and-merge, Organizze's suggest-and-confirm
"conciliação" with a dedicated candidates UI, and Monarch's "do nothing" (duplicates coexist until a
human deletes one). Decided: flag-only, no merge. The import staging screen (`OfxStagingForm`,
shared by the OFX-upload and fatura-paste flows) gets a second pass — for rows that don't hash-match,
look for an existing manual (`external_id IS NULL`) expense transaction on the same account, same
amount, dated within ±5 days. A match flags the row the same way an exact duplicate does today
("possível duplicata" instead of "já importado"), unchecked by default but overridable — the user
skips re-adding it and deletes the superseded manual row by hand if they want the import's fuller
description instead.

±5 days was chosen over YNAB's researched ±10-day window specifically to avoid false-positiving
common same-amount small recurring purchases (coffee, lunch) that land within a short window of each
other. Auto-merge (YNAB/Actual-style, silently updating the manual row's amount/date from the import)
was rejected as more machinery than the problem needs for a two-person household reconciling once a
month, and Organizze's full "candidatos" bulk-link UI was rejected as a second workflow to design
when a checkbox the user already understands (from today's exact-dup flag) does the job.

## Consequences

- No merge/link code path exists; a flagged "possível duplicata" row and its superseded manual
  transaction are two independent rows until the user deletes one. If that manual cleanup step ever
  proves annoying, the fix is a merge feature — a new decision, not a reason to revisit this one.
- False negatives are possible (a purchase re-dated or re-amounted by more than the ±5-day/exact-
  amount match will import as a fresh, unflagged row) and false positives are possible (an unrelated
  same-amount purchase within 5 days gets flagged and must be manually unchecked-back-in) — both are
  accepted tradeoffs of a heuristic match, not bugs to chase to zero.
- The fuzzy pass only ever looks at manual (no `external_id`) rows — it never re-flags something the
  exact hash-based dedup already covers, so the two checks are additive, not overlapping.
