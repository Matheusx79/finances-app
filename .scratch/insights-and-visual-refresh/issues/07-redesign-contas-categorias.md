# 07 — Redesign: Contas e Categorias

**What to build:** Contas and Categorias show items in a plain read state by default (name — and,
for Contas, saldo — with no visible input/Salvar/Excluir), entering an edit state only when the
user explicitly asks to, styled with the new design tokens.

**Blocked by:** 06 (Identidade visual: tokens + cores do casal).

**Status:** ready-for-agent

- [ ] Contas list: each account shows as a read-only row (name + saldo) by default; an explicit
      action switches a row into the existing edit form (input + Salvar + Excluir).
- [ ] Categorias list: same read/edit split.
- [ ] Both pages restyled with the tokens from ticket 06 (no more unmodified shadcn defaults).
- [ ] Existing rename/delete functionality is unchanged — only the default display state changes.
- [ ] Browser-verified on both mobile and desktop layouts.
