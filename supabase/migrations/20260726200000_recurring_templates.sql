-- Recurring transaction templates: a household member sets up a template
-- once (amount, category, account, owner, monthly day-of-month), and a
-- scheduled job (see postDueRecurringTransactions / the cron route handler)
-- auto-posts a real `transactions` row from each active template when its
-- due date arrives. Structurally this table mirrors `transactions` closely
-- (same type/amount/category/account/owner shape) since a posted
-- transaction is just a plain transaction with a back-reference — see the
-- `transactions.recurring_template_id` column added at the bottom of this
-- migration.
--
-- amount/type/category-required-for-expense: same storage and validation
-- choices as `transactions` (see that migration's header comment) — the
-- template's amount is a `numeric(12, 2)` reais value that gets copied
-- verbatim onto each posted transaction (the spec's explicit
-- auto-post-without-confirmation decision means a variable bill posts with
-- last month's amount and gets corrected via a normal transaction edit
-- afterward, not by re-confirming the template each month).
--
-- day_of_month: an integer 1-31 (not a `date`/interval) since the spec's
-- frequency model is "monthly, keyed off a day-of-month" — there's no year
-- or month component to store, just which day each month it's due. Values
-- above the number of days in a given month (e.g. 31 in April) are handled
-- by the application layer (`postDueRecurringTransactions`), which clamps
-- to that month's last day rather than skipping the month entirely — see
-- that function's comment for the reasoning.
--
-- active: a plain boolean rather than a status enum — the only two states
-- this ticket calls for are "posts when due" and "paused", so a richer
-- status column would be speculative.
--
-- Idempotency for the auto-post job deliberately is NOT modeled with a
-- `last_posted_year`/`last_posted_month` column on this table. Instead,
-- `postDueRecurringTransactions` checks for an existing posted transaction
-- referencing this template within the current calendar month
-- (`transactions.recurring_template_id`). This keeps this table free of
-- posting-run bookkeeping and makes "has this template posted this month"
-- directly reconstructible from the transactions table itself (the same
-- table a manual delete of the auto-posted transaction would affect) rather
-- than a second source of truth that could drift from it.

create table recurring_templates (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  type text not null check (type in ('expense', 'income')),
  amount numeric(12, 2) not null,
  category_id uuid references categories (id) on delete restrict,
  account_id uuid not null references accounts (id) on delete restrict,
  owner_household_member_id uuid references household_members (id) on delete restrict,
  day_of_month integer not null check (day_of_month between 1 and 31),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint recurring_templates_category_required_for_expense check (
    (type = 'expense' and category_id is not null) or (type = 'income')
  )
);

create index recurring_templates_household_id_idx on recurring_templates (household_id);
-- Supports postDueRecurringTransactions' "active templates for this household" scan.
create index recurring_templates_household_id_active_idx
  on recurring_templates (household_id, active);

alter table recurring_templates enable row level security;

create policy "household members can read their recurring templates"
  on recurring_templates for select
  using (household_id = internal.household_id_for_user((select auth.uid())));

create policy "household members can create recurring templates for their household"
  on recurring_templates for insert
  with check (household_id = internal.household_id_for_user((select auth.uid())));

create policy "household members can update their recurring templates"
  on recurring_templates for update
  using (household_id = internal.household_id_for_user((select auth.uid())))
  with check (household_id = internal.household_id_for_user((select auth.uid())));

create policy "household members can delete their recurring templates"
  on recurring_templates for delete
  using (household_id = internal.household_id_for_user((select auth.uid())));

grant select, insert, update, delete on recurring_templates to authenticated;
grant all on recurring_templates to service_role;

-- Same cross-household-reference risk `check_transaction_household_consistency`
-- guards against, applied to this table: the plain FKs above only guarantee
-- account_id/category_id/owner_household_member_id point at *some* existing
-- row, not one belonging to this template's own household.
create function internal.check_recurring_template_household_consistency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from accounts
    where id = new.account_id and household_id = new.household_id
  ) then
    raise exception 'account % does not belong to household %', new.account_id, new.household_id;
  end if;

  if new.category_id is not null and not exists (
    select 1 from categories
    where id = new.category_id and household_id = new.household_id
  ) then
    raise exception 'category % does not belong to household %', new.category_id, new.household_id;
  end if;

  if new.owner_household_member_id is not null and not exists (
    select 1 from household_members
    where id = new.owner_household_member_id and household_id = new.household_id
  ) then
    raise exception 'owner % does not belong to household %', new.owner_household_member_id, new.household_id;
  end if;

  return new;
end;
$$;

create trigger recurring_templates_check_household_consistency
  before insert or update on recurring_templates
  for each row
  execute function internal.check_recurring_template_household_consistency();

-- Back-reference from a posted transaction to the template it came from.
-- Nullable (a manually-entered transaction has none) and `on delete set
-- null` rather than `restrict`/`cascade`: per spec, an auto-posted
-- transaction is "a normal transaction, editable/deletable like any
-- other" — deleting the *template* later should not retroactively touch or
-- block deletion of transactions it already produced, it should just sever
-- the back-reference.
alter table transactions
  add column recurring_template_id uuid references recurring_templates (id) on delete set null;

-- Supports postDueRecurringTransactions' idempotency check (has this
-- template already posted a transaction within the current calendar month).
create index transactions_recurring_template_id_idx on transactions (recurring_template_id);
