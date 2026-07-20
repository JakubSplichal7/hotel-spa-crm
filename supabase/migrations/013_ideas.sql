-- Ideas: name, note, contact (name), email, phone

CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  note TEXT,
  contact TEXT,
  email TEXT,
  phone TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ideas_org_id ON ideas(org_id);
CREATE INDEX idx_ideas_created_at ON ideas(created_at);

ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View ideas in org" ON ideas
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "Insert ideas in org" ON ideas
  FOR INSERT WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Update ideas in org" ON ideas
  FOR UPDATE USING (org_id = get_user_org_id());

CREATE POLICY "Delete ideas in org" ON ideas
  FOR DELETE USING (org_id = get_user_org_id());
