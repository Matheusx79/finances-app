-- Tags (Etiquetas): a managed (CRUD'd, not free-text), household-scoped,
-- cross-cutting label a transaction can carry several of at once,
-- independent of its category. Structurally identical to categories — same
-- RLS shape, no default-seed trigger (unlike categories, there's no sensible
-- default set of tags).

create table tags (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index tags_household_id_idx on tags (household_id);

alter table tags enable row level security;

create policy "household members can read their tags"
  on tags for select
  using (household_id = internal.household_id_for_user((select auth.uid())));

create policy "household members can create tags for their household"
  on tags for insert
  with check (household_id = internal.household_id_for_user((select auth.uid())));

create policy "household members can rename their tags"
  on tags for update
  using (household_id = internal.household_id_for_user((select auth.uid())))
  with check (household_id = internal.household_id_for_user((select auth.uid())));

create policy "household members can delete their tags"
  on tags for delete
  using (household_id = internal.household_id_for_user((select auth.uid())));

grant select, insert, update, delete on tags to authenticated;
grant all on tags to service_role;

-- transaction_tags: N:N join between transactions and tags. No household_id
-- column of its own — household membership is checked by joining through
-- transaction_id, since a join row only ever makes sense in the context of
-- its transaction's household. Composite primary key doubles as the
-- uniqueness constraint (a transaction can't carry the same tag twice) and
-- as the natural index for the "which tags does this transaction have"
-- lookup; a separate index on tag_id supports the reverse "which
-- transactions have this tag" filter (listTransactionsForMonth's tagId
-- param).

create table transaction_tags (
  transaction_id uuid not null references transactions (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  primary key (transaction_id, tag_id)
);

create index transaction_tags_tag_id_idx on transaction_tags (tag_id);

alter table transaction_tags enable row level security;

create policy "household members can read their transaction tags"
  on transaction_tags for select
  using (
    transaction_id in (
      select id from transactions
      where household_id = internal.household_id_for_user((select auth.uid()))
    )
  );

create policy "household members can attach tags to their transactions"
  on transaction_tags for insert
  with check (
    transaction_id in (
      select id from transactions
      where household_id = internal.household_id_for_user((select auth.uid()))
    )
  );

create policy "household members can remove tags from their transactions"
  on transaction_tags for delete
  using (
    transaction_id in (
      select id from transactions
      where household_id = internal.household_id_for_user((select auth.uid()))
    )
  );

grant select, insert, delete on transaction_tags to authenticated;
grant all on transaction_tags to service_role;

-- The FK on tag_id only guarantees it points at *some* existing tag, not one
-- belonging to the same household as the transaction it's being attached to
-- — same cross-household-reference risk the transactions/category_budgets
-- migrations guard against. Enforced as a trigger since it's a cross-table
-- check.
create function internal.check_transaction_tag_household_consistency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from transactions t
    join tags g on g.id = new.tag_id
    where t.id = new.transaction_id and t.household_id = g.household_id
  ) then
    raise exception 'tag % does not belong to the same household as transaction %', new.tag_id, new.transaction_id;
  end if;

  return new;
end;
$$;

create trigger transaction_tags_check_household_consistency
  before insert on transaction_tags
  for each row
  execute function internal.check_transaction_tag_household_consistency();
