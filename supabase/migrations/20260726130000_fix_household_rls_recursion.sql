-- The household_members SELECT policy subqueried household_members itself,
-- and RLS re-applies to that subquery, causing infinite recursion (42P17).
-- Fix: look up the caller's household through a SECURITY DEFINER function,
-- which runs as the (RLS-exempt) function owner and breaks the recursion.

create function household_id_for_user(target_user_id uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select household_id from household_members where user_id = target_user_id limit 1;
$$;

drop policy "household members can read their household" on households;
create policy "household members can read their household"
  on households for select
  using (id = household_id_for_user(auth.uid()));

drop policy "household members can read household membership" on household_members;
create policy "household members can read household membership"
  on household_members for select
  using (household_id = household_id_for_user(auth.uid()));
