# 03 — Categories management (CRUD + seeded defaults)

**What to build:** A flat (non-hierarchical), household-scoped list of spending categories, seeded with sensible pt-BR defaults (e.g. Mercado, Transporte, Moradia, Lazer, Saúde) when the household is created, and fully editable afterward.

**Blocked by:** 01. *(Can run in parallel with 02 — both only need login/household scaffolding.)*

**Status:** ready-for-agent

- [ ] Domain-layer functions: `createCategory`, `listCategories`, `renameCategory`, `deleteCategory`, tested against the local Supabase stack
- [ ] Categories are scoped to a household
- [ ] Default pt-BR categories are created automatically when a household is provisioned
- [ ] UI (in pt-BR) to view, add, rename, and delete categories
- [ ] Deleting a category referenced by existing transactions or budgets is handled sanely (flag if the right behavior isn't obvious — the spec doesn't dictate one)
- [ ] Changes are visible to both household members
