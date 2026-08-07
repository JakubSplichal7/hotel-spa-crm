-- Append-only transaction / audit log (forever retention)
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_label TEXT,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  summary TEXT NOT NULL,
  changes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_org_created
  ON audit_events(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_account_created
  ON audit_events(account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity
  ON audit_events(entity_type, entity_id, created_at DESC);

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Managers and admins can read org audit history
CREATE POLICY "Managers view audit events" ON audit_events
  FOR SELECT USING (
    org_id = get_user_org_id() AND is_manager_or_admin()
  );

-- Inserts go through the service role / authenticated users in org
CREATE POLICY "Users insert audit events in org" ON audit_events
  FOR INSERT WITH CHECK (
    org_id = get_user_org_id()
  );

-- No update/delete policies → immutable from app roles
