# 06 — Identidade visual: tokens + cores do casal

**What to build:** Replace the unmodified shadcn default palette/type with a deliberate identity for
this app, centered on its signature element — each household member gets their own accent color,
applied everywhere a person is already distinguished today (the person filter, the Responsável tag
on transaction/recurring rows).

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] New color/type design tokens replace the default shadcn values in the app's theme file — a
      deliberate palette and type pairing, not the current unmodified defaults (see
      `docs/adr/0003-member-accent-color-by-household-order.md` for the color-assignment rule).
- [ ] A UI-layer helper maps household member index 0/1 to one of two fixed, contrast-checked accent
      colors — no schema change, no per-user customization UI.
- [ ] Proposed colors shown for approval before being wired into the app (per the earlier grilling
      session's decision — the user picks the direction, not the exact hex values, up front).
- [ ] Person filter (Transações) and the Responsável tag on transaction/recurring-template rows use
      the member's accent color.
- [ ] Both the mobile bottom-nav shell and the desktop sidebar shell (`docs/adr/0001`) still render
      correctly with the new tokens — this is a reskin, not a layout change.
- [ ] Unit test for the member-color helper (pure logic, no Supabase) — index 0/1 map to the two
      fixed colors; no third case, household size is hard-capped at 2.
- [ ] Browser-verified in both light and dark mode, on mobile and desktop.
