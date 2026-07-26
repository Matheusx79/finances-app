-- Explicit grants for households/household_members. Relying solely on Postgres
-- default privileges is fragile across environments (this surfaced as
-- "permission denied for table households" on the local stack even though
-- RLS policies were correct) — grant explicitly regardless of environment.

grant usage on schema public to anon, authenticated, service_role;

grant select on households, household_members to authenticated;
grant all on households, household_members to service_role;
