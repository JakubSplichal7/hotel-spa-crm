-- Link invited guests to CRM clients so client pages can list events
ALTER TABLE event_guests
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_event_guests_account_id ON event_guests(account_id);
