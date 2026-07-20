-- Events + invited guests; link activities/tasks to events

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  event_date DATE NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE event_guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE activities
  ALTER COLUMN account_id DROP NOT NULL;

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE CASCADE;

CREATE INDEX idx_events_org_id ON events(org_id);
CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_event_guests_event_id ON event_guests(event_id);
CREATE INDEX idx_activities_event_id ON activities(event_id);
CREATE INDEX idx_tasks_event_id ON tasks(event_id);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View events in org" ON events
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "Insert events in org" ON events
  FOR INSERT WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Update events in org" ON events
  FOR UPDATE USING (org_id = get_user_org_id());

CREATE POLICY "Delete events in org" ON events
  FOR DELETE USING (org_id = get_user_org_id());

CREATE POLICY "View event guests in org" ON event_guests
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "Insert event guests in org" ON event_guests
  FOR INSERT WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Update event guests in org" ON event_guests
  FOR UPDATE USING (org_id = get_user_org_id());

CREATE POLICY "Delete event guests in org" ON event_guests
  FOR DELETE USING (org_id = get_user_org_id());
