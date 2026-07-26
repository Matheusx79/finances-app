-- Category budgets: one fixed spending target per category per calendar
-- month, scoped to the household (not per-person — spec is explicit that
-- budgets reflect joint planning, not individual targets). No rollover: each
-- (household, category, year, month) row is independent, so an unspent or
-- overspent amount never carries into the next month.
--
-- Schema shape: `year`/`month` as plain integers rather than a `date`
-- (e.g. first-of-month) column. A budget has no day-of-month meaning — it's
-- keyed by calendar month, not a point in time — so storing it as two ints
-- avoids the temptation to compare/range-query it like a date, and keeps the
-- "one row per household+category+month" uniqueness constraint legible
-- (`unique (household_id, category_id, year, month)`) instead of relying on
-- callers to always normalize to the 1st. `month` is constrained to 1-12;
-- `year` is left unconstrained (no meaningful upper/lower bound to enforce).
--
-- amount: `numeric(12, 2)` reais, matching `transactions.amount` (see that
-- migration's header comment) for the same reason — the UI collects/displays
-- a decimal BRL amount directly, no cents<->reais conversion layer needed.
--
-- category_id: `on delete restrict`, matching `transactions.category_id` —
-- deleting a category that has a budget set against it is blocked at the
-- schema level rather than silently dropping the budget.
--
-- Upsert semantics: `setCategoryBudget` (application layer) relies on the
-- `(household_id, category_id, year, month)` unique constraint as its
-- `on conflict` target, so calling it twice for the same household+category+
-- month updates the existing row's amount rather than creating a duplicate.

create table category_budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  category_id uuid not null references categories (id) on delete restrict,
  year integer not null,
  month integer not null check (month between 1 and 12),
  amount numeric(12, 2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  unique (household_id, category_id, year, month)
);

create index category_budgets_household_id_idx on category_budgets (household_id);
-- Supports the current-month progress-view query (getBudgetProgressForMonth).
create index category_budgets_household_id_year_month_idx
  on category_budgets (household_id, year, month);

alter table category_budgets enable row level security;

create policy "household members can read their category budgets"
  on category_budgets for select
  using (household_id = internal.household_id_for_user((select auth.uid())));

create policy "household members can create category budgets for their household"
  on category_budgets for insert
  with check (household_id = internal.household_id_for_user((select auth.uid())));

create policy "household members can update their category budgets"
  on category_budgets for update
  using (household_id = internal.household_id_for_user((select auth.uid())))
  with check (household_id = internal.household_id_for_user((select auth.uid())));

create policy "household members can delete their category budgets"
  on category_budgets for delete
  using (household_id = internal.household_id_for_user((select auth.uid())));

grant select, insert, update, delete on category_budgets to authenticated;
grant all on category_budgets to service_role;

-- Same cross-household-reference risk `check_transaction_household_consistency`
-- guards against: the plain FK on category_id only guarantees it points at
-- *some* existing category, not one belonging to this budget's own household.
-- RLS on category_budgets only checks the budget row's own household_id, so
-- without this a member could set a budget referencing another household's
-- category_id (e.g. a guessed UUID). Enforced as a trigger, mirroring the
-- transactions migration's pattern, since a cross-table check isn't
-- expressible as a plain column check.
create function internal.check_category_budget_household_consistency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from categories
    where id = new.category_id and household_id = new.household_id
  ) then
    raise exception 'category % does not belong to household %', new.category_id, new.household_id;
  end if;

  return new;
end;
$$;

create trigger category_budgets_check_household_consistency
  before insert or update on category_budgets
  for each row
  execute function internal.check_category_budget_household_consistency();
