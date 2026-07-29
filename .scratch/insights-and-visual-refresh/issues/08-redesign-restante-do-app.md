# 08 — Redesign: restante do app

**What to build:** Extend the new design tokens and hierarchy across every remaining screen — Home
(incl. the new charts), Orçamentos, Recorrentes, Transações (incl. tag chips and filters), and
Metas — so the whole app reads as one consistent, deliberately-designed product instead of a mix of
old and new styling.

**Blocked by:** 06 (tokens), 02 (Metas UI must exist to restyle it), 03 (Etiquetas UI/chips must
exist to restyle them), 05 (both charts must exist to restyle them).

**Status:** ready-for-agent

- [ ] Home, Orçamentos, Recorrentes, Transações, and Metas all use the tokens from ticket 06 (no
      leftover unmodified shadcn defaults anywhere).
- [ ] The two dashboard charts (tickets 04/05) pick up the cores-do-casal accent colors for their
      per-person segments (the cash-flow chart's placeholder colors, if any, are replaced with the
      real tokens here).
- [ ] Etiqueta chips (ticket 03) and the tag filter control are restyled consistently with the rest
      of the app.
- [ ] Consistent type scale and spacing hierarchy applied across all of the above (e.g. the "big
      number, small label" pattern already used on Home's Receita figure is applied consistently
      wherever a headline figure appears).
- [ ] Both the mobile bottom-nav shell and the desktop sidebar shell keep working correctly — this
      is a reskin, not a layout rebuild.
- [ ] Browser-verified across every page listed above, in both light and dark mode, on mobile and
      desktop.
