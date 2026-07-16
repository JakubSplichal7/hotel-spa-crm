-- Per-organization location catalog (countries + cities)
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, country, city)
);

CREATE INDEX IF NOT EXISTS idx_locations_org_id ON locations(org_id);
CREATE INDEX IF NOT EXISTS idx_locations_country ON locations(org_id, country);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View locations in org" ON locations
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "Insert locations in org" ON locations
  FOR INSERT WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Delete locations in org" ON locations
  FOR DELETE USING (
    org_id = get_user_org_id() AND is_manager_or_admin()
  );
