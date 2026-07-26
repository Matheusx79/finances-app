-- Household model: one household links exactly two pre-provisioned auth users.
-- No self-service signup: rows are created directly (seed script / admin action).

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create index household_members_household_id_idx on household_members (household_id);

alter table households enable row level security;
alter table household_members enable row level security;

-- A user can see their own household...
create policy "household members can read their household"
  on households for select
  using (
    id in (
      select household_id from household_members where user_id = auth.uid()
    )
  );

-- ...and the membership rows for that same household (including their partner's).
create policy "household members can read household membership"
  on household_members for select
  using (
    household_id in (
      select household_id from household_members where user_id = auth.uid()
    )
  );
