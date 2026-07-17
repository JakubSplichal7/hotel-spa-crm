-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'rep');
CREATE TYPE account_type AS ENUM ('hotel', 'spa', 'both');
CREATE TYPE account_status AS ENUM ('prospect', 'active', 'inactive');
CREATE TYPE deal_stage AS ENUM ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'completed', 'lost');
CREATE TYPE activity_type AS ENUM ('call', 'email', 'meeting', 'note');
CREATE TYPE task_status AS ENUM ('open', 'done');
CREATE TYPE booking_status AS ENUM ('draft', 'active', 'completed', 'cancelled');

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'rep',
  full_name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Accounts
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type account_type NOT NULL DEFAULT 'hotel',
  city TEXT,
  country TEXT,
  status account_status NOT NULL DEFAULT 'prospect',
  owner_id UUID NOT NULL REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contacts
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deals
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  stage deal_stage NOT NULL DEFAULT 'lead',
  value NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  expected_close DATE,
  owner_id UUID NOT NULL REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activities
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  type activity_type NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_at TIMESTAMPTZ,
  status task_status NOT NULL DEFAULT 'open',
  assignee_id UUID NOT NULL REFERENCES profiles(id),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  value NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status booking_status NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_profiles_org_id ON profiles(org_id);
CREATE INDEX idx_accounts_org_id ON accounts(org_id);
CREATE INDEX idx_accounts_owner_id ON accounts(owner_id);
CREATE INDEX idx_contacts_account_id ON contacts(account_id);
CREATE INDEX idx_deals_org_id ON deals(org_id);
CREATE INDEX idx_deals_owner_id ON deals(owner_id);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_activities_account_id ON activities(account_id);
CREATE INDEX idx_activities_occurred_at ON activities(occurred_at);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_due_at ON tasks(due_at);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_bookings_account_id ON bookings(account_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Helper function: get current user's profile
CREATE OR REPLACE FUNCTION get_user_profile()
RETURNS profiles AS $$
  SELECT * FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check if user is admin or manager
CREATE OR REPLACE FUNCTION is_manager_or_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get user's org_id
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER deals_updated_at BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view their org" ON organizations
  FOR SELECT USING (id = get_user_org_id());

CREATE POLICY "Admins can update their org" ON organizations
  FOR UPDATE USING (
    id = get_user_org_id() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Anyone can create org during signup" ON organizations
  FOR INSERT WITH CHECK (true);

-- Profiles policies
CREATE POLICY "Users can view org profiles" ON profiles
  FOR SELECT USING (org_id = get_user_org_id() OR id = auth.uid());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can update org profiles" ON profiles
  FOR UPDATE USING (
    org_id = get_user_org_id() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Accounts policies
CREATE POLICY "View accounts in org" ON accounts
  FOR SELECT USING (
    org_id = get_user_org_id() AND
    (is_manager_or_admin() OR owner_id = auth.uid())
  );

CREATE POLICY "Reps can view all accounts for reporting" ON accounts
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "Insert accounts in org" ON accounts
  FOR INSERT WITH CHECK (
    org_id = get_user_org_id() AND
    (is_manager_or_admin() OR owner_id = auth.uid())
  );

CREATE POLICY "Update own or managed accounts" ON accounts
  FOR UPDATE USING (
    org_id = get_user_org_id() AND
    (is_manager_or_admin() OR owner_id = auth.uid())
  );

CREATE POLICY "Delete managed accounts" ON accounts
  FOR DELETE USING (
    org_id = get_user_org_id() AND
    (is_manager_or_admin() OR owner_id = auth.uid())
  );

-- Contacts policies
CREATE POLICY "View contacts in org" ON contacts
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "Insert contacts in org" ON contacts
  FOR INSERT WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Update contacts in org" ON contacts
  FOR UPDATE USING (org_id = get_user_org_id());

CREATE POLICY "Delete contacts in org" ON contacts
  FOR DELETE USING (org_id = get_user_org_id());

-- Deals policies
CREATE POLICY "View deals in org" ON deals
  FOR SELECT USING (
    org_id = get_user_org_id() AND
    (is_manager_or_admin() OR owner_id = auth.uid())
  );

CREATE POLICY "View all deals for reporting" ON deals
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "Insert deals in org" ON deals
  FOR INSERT WITH CHECK (
    org_id = get_user_org_id() AND
    (is_manager_or_admin() OR owner_id = auth.uid())
  );

CREATE POLICY "Update deals in org" ON deals
  FOR UPDATE USING (
    org_id = get_user_org_id() AND
    (is_manager_or_admin() OR owner_id = auth.uid())
  );

CREATE POLICY "Delete deals in org" ON deals
  FOR DELETE USING (
    org_id = get_user_org_id() AND
    (is_manager_or_admin() OR owner_id = auth.uid())
  );

-- Activities policies
CREATE POLICY "View activities in org" ON activities
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "Insert activities in org" ON activities
  FOR INSERT WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Update own activities" ON activities
  FOR UPDATE USING (
    org_id = get_user_org_id() AND
    (is_manager_or_admin() OR created_by = auth.uid())
  );

CREATE POLICY "Delete own activities" ON activities
  FOR DELETE USING (
    org_id = get_user_org_id() AND
    (is_manager_or_admin() OR created_by = auth.uid())
  );

-- Tasks policies
CREATE POLICY "View tasks in org" ON tasks
  FOR SELECT USING (
    org_id = get_user_org_id() AND
    (is_manager_or_admin() OR assignee_id = auth.uid() OR created_by = auth.uid())
  );

CREATE POLICY "View all tasks for reporting" ON tasks
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "Insert tasks in org" ON tasks
  FOR INSERT WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Update tasks" ON tasks
  FOR UPDATE USING (
    org_id = get_user_org_id() AND
    (is_manager_or_admin() OR assignee_id = auth.uid() OR created_by = auth.uid())
  );

CREATE POLICY "Delete tasks" ON tasks
  FOR DELETE USING (
    org_id = get_user_org_id() AND
    (is_manager_or_admin() OR created_by = auth.uid())
  );

-- Bookings policies
CREATE POLICY "View bookings in org" ON bookings
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "Insert bookings in org" ON bookings
  FOR INSERT WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Update bookings in org" ON bookings
  FOR UPDATE USING (org_id = get_user_org_id());

CREATE POLICY "Delete bookings in org" ON bookings
  FOR DELETE USING (
    org_id = get_user_org_id() AND is_manager_or_admin()
  );
