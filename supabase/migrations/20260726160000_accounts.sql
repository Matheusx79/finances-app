-- Accounts: labels household members tag transactions to (e.g. Checking,
-- Credit Card, Cash). Labels only in v1 — no balance tracking.
--
-- Unlike households (managed via service role / seed script only), accounts
-- are managed directly by household members, so this table needs full
-- select/insert/update/delete policies, not just select.

create table accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index accounts_household_id_idx on accounts (household_id);

alter table accounts enable row level security;

create policy "household members can read their accounts"
  on accounts for select
  using (household_id = internal.household_id_for_user((select auth.uid())));

create policy "household members can create accounts for their household"
  on accounts for insert
  with check (household_id = internal.household_id_for_user((select auth.uid())));

create policy "household members can rename their accounts"
  on accounts for update
  using (household_id = internal.household_id_for_user((select auth.uid())))
  with check (household_id = internal.household_id_for_user((select auth.uid())));

create policy "household members can delete their accounts"
  on accounts for delete
  using (household_id = internal.household_id_for_user((select auth.uid())));

grant select, insert, update, delete on accounts to authenticated;
grant all on accounts to service_role;

-- Future-proofing note (no transactions table exists yet — ticket 04): when
-- transactions are added, their account_id FK should use `on delete restrict`
-- (not cascade/set null) so deleting an account referenced by existing
-- transactions is blocked at the schema level rather than silently orphaning
-- or nulling out transaction data. Decided now per ticket 02, to be applied
-- when the transactions table is created.
