-- Link child audit rows (e.g. event guests) to a parent entity for scoped logs
ALTER TABLE audit_events
  ADD COLUMN IF NOT EXISTS related_entity_id UUID;

CREATE INDEX IF NOT EXISTS idx_audit_events_related
  ON audit_events(related_entity_id, created_at DESC)
  WHERE related_entity_id IS NOT NULL;
