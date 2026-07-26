-- Transactions: manually logged expense/income entries, tagged to an account
-- and (for expenses) a category, attributed to one household member or
-- shared. Structurally follows the accounts/categories RLS pattern, but
-- unlike those tables the FKs to accounts/categories use `on delete
-- restrict` per the decision documented in tickets 02/03's migrations —
-- deleting an account or category referenced by existing transactions is
-- blocked at the schema level, not cascaded/nulled.
--
-- Amount storage: `numeric(12, 2)` reais (e.g. 12.50), not integer cents.
-- Chosen over cents-as-integer because the UI collects/display a decimal
-- BRL amount directly, so there's no cents<->reais conversion to keep
-- consistent across the app; `numeric` avoids the float rounding issues a
-- `real`/`double precision` column would introduce.
--
-- Owner modeling: a nullable FK to `household_members` rather than a
-- text/enum column. A specific `household_members.id` means "this member
-- owns this transaction"; null means "shared" (spec: owner is "one of the
-- two household members or shared"). This keeps the owner tied to the real
-- member row (and its display_name) instead of a second source of truth for
-- member identity. `on delete restrict` since a member row disappearing out
-- from under existing transactions should never happen silently (in
-- practice member rows are never deleted independently of their household,
-- which already cascades).
--
-- category_id is required for expenses, optional for income (spec: income
-- isn't budgeted, so categorizing it is optional) — enforced with a check
-- constraint tying category presence to type, rather than splitting into
-- two tables.

create table transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  type text not null check (type in ('expense', 'income')),
  amount numeric(12, 2) not null,
  date date not null,
  category_id uuid references categories (id) on delete restrict,
  account_id uuid not null references accounts (id) on delete restrict,
  owner_household_member_id uuid references household_members (id) on delete restrict,
  note text,
  created_at timestamptz not null default now(),
  constraint transactions_category_required_for_expense check (
    (type = 'expense' and category_id is not null) or (type = 'income')
  )
);

create index transactions_household_id_idx on transactions (household_id);
-- Supports the month-scoped feed/report queries (listTransactionsForMonth).
create index transactions_household_id_date_idx on transactions (household_id, date);

alter table transactions enable row level security;

create policy "household members can read their transactions"
  on transactions for select
  using (household_id = internal.household_id_for_user((select auth.uid())));

create policy "household members can create transactions for their household"
  on transactions for insert
  with check (household_id = internal.household_id_for_user((select auth.uid())));

create policy "household members can update their transactions"
  on transactions for update
  using (household_id = internal.household_id_for_user((select auth.uid())))
  with check (household_id = internal.household_id_for_user((select auth.uid())));

create policy "household members can delete their transactions"
  on transactions for delete
  using (household_id = internal.household_id_for_user((select auth.uid())));

grant select, insert, update, delete on transactions to authenticated;
grant all on transactions to service_role;

-- The FKs above only guarantee account_id/category_id/owner_household_member_id
-- point at *some* existing row — not one belonging to the same household as
-- the transaction. RLS on transactions only checks the transaction row's own
-- household_id, so without this check a transaction could otherwise be
-- created referencing another household's account/category/member (e.g. a
-- guessed UUID), undermining "transactions are scoped to the household."
-- Enforced as a trigger (mirroring the `seed_default_categories` /
-- `household_member_cap` trigger style already used in this schema) rather
-- than a check constraint, since checking across tables isn't expressible
-- as a plain column check.
create function internal.check_transaction_household_consistency()
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

create trigger transactions_check_household_consistency
  before insert or update on transactions
  for each row
  execute function internal.check_transaction_household_consistency();
