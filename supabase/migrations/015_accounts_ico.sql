-- Company ID (IČO) for clients
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS ico TEXT;

CREATE INDEX IF NOT EXISTS idx_accounts_org_ico ON accounts(org_id, ico);
