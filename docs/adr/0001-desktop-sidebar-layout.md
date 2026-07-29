# Desktop gets a sidebar + grid layout distinct from the mobile PWA shell

The app is PWA-first: every page reuses the same `max-w-lg`/`max-w-sm` centered column and fixed
bottom tab bar at every viewport width, with no breakpoint logic anywhere in `src/app`. That's
correct for the installed mobile PWA (the primary surface) but reads as a narrow, stranded column
on a desktop browser (the secondary, occasional-use surface).

Decided: at `lg` (1024px) and above, swap to a desktop-specific shell — left sidebar nav (using
the shadcn sidebar theme tokens already defined but unused in `globals.css`) replacing both the
bottom tab bar and the floating logout button; the dashboard home page becomes a multi-column
grid instead of one stacked column. Below `lg`, the existing mobile shell is untouched.

The four form+list pages (transactions, accounts, categories, recurring) keep the mobile
form-above-list stacking at every width — a form-beside-list side-by-side layout was tried first
and reverted after a live look, it read as two unrelated panels rather than one
register-then-browse flow. On desktop the container widens to `max-w-5xl` and each section fills
that width instead of floating in it: the create-form's fields lay out in a 2-column grid for the
bigger forms (transactions, recurring), and each list becomes a multi-column grid
(`lg:grid-cols-2`, `xl:grid-cols-3` where items are small, e.g. categories/accounts). The one-field
category/account create-forms stay capped at `max-w-sm` — a single input has nothing to gain from
stretching. Budgets keeps its single card, switching its category list to a grid at `lg`/`xl`.

`lg` rather than `md` (768px) was chosen deliberately so a tablet or a half-width laptop browser
window still gets the mobile shell instead of a cramped, half-collapsed sidebar+grid.

## Consequences

Two parallel layout shells now exist per page (mobile stack vs. desktop sidebar/grid) instead of
one shell reused everywhere. Future page additions need to account for both breakpoints rather
than writing a single layout and being done.
