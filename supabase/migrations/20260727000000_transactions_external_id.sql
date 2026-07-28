-- External id for OFX-imported transactions (ticket 01, "Importar extrato").
-- Nullable: manually-entered transactions have no external id. Uniqueness
-- is scoped to (account_id, external_id) rather than household-wide since
-- the same bank FITID could coincidentally collide across two different
-- accounts (or households) without being the same real-world transaction —
-- and is a partial index (`where external_id is not null`) so the many null
-- rows from manual entry never collide with each other.

alter table transactions add column external_id text;

create unique index transactions_account_id_external_id_idx
  on transactions (account_id, external_id)
  where external_id is not null;
