# Per-person accent color is derived from household member order, not stored or configurable

The visual redesign's signature element is giving each household member their own accent color,
used everywhere a `Transação`/`Modelo recorrente`/chart already distinguishes "Eu" vs the partner.
`household_members` is hard-capped at exactly 2 rows (see **Casal** in `CONTEXT.md`), so a color
could either be a stored, user-configurable field on `household_members`, or a fixed pair of colors
assigned purely by each member's position in the household's member list (first row / second row).

Decided: derived by order, not stored, not configurable. A single UI-layer helper maps household
member index 0/1 to one of two fixed accent colors chosen for contrast and accessibility. No schema
change, no settings screen.

## Consequences

- Simpler: no migration, no color-picker UI, no validation that two members don't pick the same
  color.
- A member's color isn't stable if member order ever changes — not currently possible through any
  existing flow (there's no reorder/re-invite path), so this is a theoretical gap, not a real one
  today.
- If per-user color customization is ever explicitly requested, that's a new decision to make then
  (add a stored, user-editable column) — this ADR only rules out building it speculatively now.
