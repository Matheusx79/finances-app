-- Categories: a flat (non-hierarchical), household-scoped list of spending
-- categories (e.g. Mercado, Transporte) that transactions will later be
-- tagged to. Structurally identical to accounts — same RLS shape, fully
-- managed by household members (not just service role).

create table categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index categories_household_id_idx on categories (household_id);

alter table categories enable row level security;

create policy "household members can read their categories"
  on categories for select
  using (household_id = internal.household_id_for_user((select auth.uid())));

create policy "household members can create categories for their household"
  on categories for insert
  with check (household_id = internal.household_id_for_user((select auth.uid())));

create policy "household members can rename their categories"
  on categories for update
  using (household_id = internal.household_id_for_user((select auth.uid())))
  with check (household_id = internal.household_id_for_user((select auth.uid())));

create policy "household members can delete their categories"
  on categories for delete
  using (household_id = internal.household_id_for_user((select auth.uid())));

grant select, insert, update, delete on categories to authenticated;
grant all on categories to service_role;

-- Future-proofing note (no transactions or budgets tables exist yet — tickets
-- 04/06): when they're added, their category_id FK should use `on delete
-- restrict` (not cascade/set null) so deleting a category referenced by
-- existing transactions/budgets is blocked at the schema level rather than
-- silently orphaning or nulling out that data. Decided now per ticket 03, to
-- be applied when those tables are created.

-- Spec: "seeded with sensible pt-BR defaults ... on household creation." Seed
-- at the DB level via a trigger on households insert (mirroring
-- household_member_cap's trigger style) so every household-creation path
-- (seed script, future admin UI, tests) gets defaults for free with no
-- app-code coupling.

create function internal.seed_default_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into categories (household_id, name)
  values
    (new.id, 'Mercado'),
    (new.id, 'Transporte'),
    (new.id, 'Moradia'),
    (new.id, 'Lazer'),
    (new.id, 'Saúde'),
    (new.id, 'Contas');
  return new;
end;
$$;

create trigger household_seed_default_categories
  after insert on households
  for each row
  execute function internal.seed_default_categories();
