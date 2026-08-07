-- Link event guests to a specific client contact
ALTER TABLE event_guests
  ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_event_guests_contact_id ON event_guests(contact_id);
