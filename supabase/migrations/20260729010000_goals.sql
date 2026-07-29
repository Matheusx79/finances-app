-- Goals (Metas): a savings target tied 1:1 to a dedicated Conta (account_id
-- UNIQUE enforces at most one Meta per account). Progress/completion are
-- never stored — derived on read from the account's balance (ADR-0002).

create table goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  account_id uuid not null unique references accounts (id) on delete cascade,
  name text not null,
  target_amount numeric not null,
  target_date date,
  created_at timestamptz not null default now()
);

create index goals_household_id_idx on goals (household_id);

alter table goals enable row level security;

create policy "household members can read their goals"
  on goals for select
  using (household_id = internal.household_id_for_user((select auth.uid())));

create policy "household members can create goals for their household"
  on goals for insert
  with check (household_id = internal.household_id_for_user((select auth.uid())));

create policy "household members can update their goals"
  on goals for update
  using (household_id = internal.household_id_for_user((select auth.uid())))
  with check (household_id = internal.household_id_for_user((select auth.uid())));

create policy "household members can delete their goals"
  on goals for delete
  using (household_id = internal.household_id_for_user((select auth.uid())));

grant select, insert, update, delete on goals to authenticated;
grant all on goals to service_role;

-- The FK on account_id only guarantees it points at *some* existing account,
-- not one belonging to the same household as the goal — same
-- cross-household-reference risk guarded against for transactions/tags.
create function internal.check_goal_household_consistency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from accounts a
    where a.id = new.account_id and a.household_id = new.household_id
  ) then
    raise exception 'account % does not belong to the same household as goal', new.account_id;
  end if;

  return new;
end;
$$;

create trigger goals_check_household_consistency
  before insert or update on goals
  for each row
  execute function internal.check_goal_household_consistency();
