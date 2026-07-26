# 08 — Recurring transaction templates + auto-post

**What to build:** Let household members set up a recurring transaction template (amount, category, account, owner, monthly frequency keyed off a day-of-month), and have a scheduled job auto-post a real, editable transaction from each active template when its due date arrives.

**Blocked by:** 04.

**Status:** ready-for-agent

- [ ] Domain-layer functions: `createRecurringTemplate`, `updateRecurringTemplate`, `pauseRecurringTemplate`, `deleteRecurringTemplate`, `postDueRecurringTransactions`, tested against the local Supabase stack
- [ ] A template records: amount, category, account, owner (member or shared), day-of-month frequency, active/paused flag
- [ ] UI (in pt-BR) to create, edit, pause, and delete recurring templates
- [ ] A scheduled job (e.g. Vercel Cron or Supabase scheduled function) runs at least daily and auto-posts a normal transaction for any active template whose due date has arrived
- [ ] The auto-posted transaction references its originating template, and is otherwise a normal transaction — editable and deletable like any manually entered one
- [ ] A paused template does not auto-post
- [ ] Test coverage includes the due-date posting logic itself (e.g. a template due today posts, one due next month does not)
