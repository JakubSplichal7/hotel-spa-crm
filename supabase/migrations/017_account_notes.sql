-- Client internal notes as a list (like contacts), not a single text field on accounts.
CREATE TABLE IF NOT EXISTS account_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  title TEXT,
  body TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS account_notes_account_id_idx ON account_notes(account_id);
CREATE INDEX IF NOT EXISTS account_notes_org_id_idx ON account_notes(org_id);

ALTER TABLE account_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View account notes in org" ON account_notes
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "Insert account notes in org" ON account_notes
  FOR INSERT WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Update account notes in org" ON account_notes
  FOR UPDATE USING (org_id = get_user_org_id());

CREATE POLICY "Delete account notes in org" ON account_notes
  FOR DELETE USING (org_id = get_user_org_id());

-- Move existing single-field notes into the new table
INSERT INTO account_notes (org_id, account_id, title, body, created_at)
SELECT org_id, id, 'Migrated note', notes, COALESCE(updated_at, created_at, now())
FROM accounts
WHERE notes IS NOT NULL AND btrim(notes) <> '';
