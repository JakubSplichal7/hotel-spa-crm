-- Client nickname (display name); backfill from official name for existing rows
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS nickname TEXT;

UPDATE accounts
SET nickname = name
WHERE nickname IS NULL OR nickname = '';

ALTER TABLE accounts
  ALTER COLUMN nickname SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_accounts_org_nickname ON accounts(org_id, nickname);
