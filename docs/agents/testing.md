# Testing

How the `/implement` and `/tdd` skills should treat test seams in this repo.

## Two test kinds, one runner

- **Domain tests** (`src/domain|app|lib/**/*.test.ts`) — node environment, hit a real local Postgres via the Supabase CLI stack. Existing convention, unchanged.
- **Component/interaction tests** (`src/components/**/*.test.tsx`, or any `*.test.tsx`) — render with React Testing Library under jsdom. Opt in with a pragma as the first line of the file:

  ```tsx
  // @vitest-environment jsdom
  ```

Both run through the same `npm test` / `vitest run`.

## UI interactions are a required TDD seam

Any new or changed interactive UI — expand/collapse, delete, edit toggles, form submission — gets a React Testing Library test as part of the ticket, not left to "where possible" judgment. This is the gap that let bugs like "expand doesn't work" and "delete crashes the app" ship undetected: nothing above the domain layer was ever rendered or clicked in an automated run.

## Coverage policy: organic, not retrofit

Existing components with zero coverage are not retrofitted proactively. A component gets a test when a ticket next touches it. No dedicated backfill sprint.

## Still do the live browser pass

This doesn't replace the existing rule (see memory: browser-verify before calling a ticket done) — RTL/jsdom catches render and click-handler crashes cheaply and permanently, but only a real Chrome load catches things jsdom can't (actual CSS/layout, PWA manifest/service-worker routing, real Supabase network calls). Do both.
