-- Spec: "a household record links exactly two pre-provisioned user accounts."
-- Previously only enforced by the seed script's loop — add a DB-level cap so a
-- bug or future direct insert can't silently create a 3+ member household.

create function internal.check_household_member_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from household_members where household_id = new.household_id) >= 2 then
    raise exception 'A household may have at most two members';
  end if;
  return new;
end;
$$;

create trigger household_member_cap
  before insert on household_members
  for each row
  execute function internal.check_household_member_cap();
