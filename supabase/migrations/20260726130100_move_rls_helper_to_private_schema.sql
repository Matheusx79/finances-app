-- household_id_for_user was created in `public`, which PostgREST exposes as an
-- RPC endpoint (/rest/v1/rpc/household_id_for_user) — the advisor flagged that
-- any authenticated (and even anon) caller could invoke it directly. It only
-- needs to be callable from within RLS policies, not from the client API, so
-- move it to a schema PostgREST doesn't expose.

create schema if not exists internal;

create function internal.household_id_for_user(target_user_id uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select household_id from household_members where user_id = target_user_id limit 1;
$$;

revoke all on function internal.household_id_for_user(uuid) from public, anon;
grant execute on function internal.household_id_for_user(uuid) to authenticated;

drop policy "household members can read their household" on households;
create policy "household members can read their household"
  on households for select
  using (id = internal.household_id_for_user(auth.uid()));

drop policy "household members can read household membership" on household_members;
create policy "household members can read household membership"
  on household_members for select
  using (household_id = internal.household_id_for_user(auth.uid()));

drop function public.household_id_for_user(uuid);
