-- auth.uid() was re-evaluated per row in these policies. Wrapping it in a
-- subquery lets Postgres evaluate it once per query (initplan) instead.

drop policy "household members can read their household" on households;
create policy "household members can read their household"
  on households for select
  using (id = internal.household_id_for_user((select auth.uid())));

drop policy "household members can read household membership" on household_members;
create policy "household members can read household membership"
  on household_members for select
  using (household_id = internal.household_id_for_user((select auth.uid())));
