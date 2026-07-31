## Agent skills

### Issue tracker

Local markdown under `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Testing

UI interactions (expand, delete, edit, forms) are a required TDD seam — React Testing Library under jsdom, opt in per-file with `// @vitest-environment jsdom`. Coverage grows organically, on touch. See `docs/agents/testing.md`.
