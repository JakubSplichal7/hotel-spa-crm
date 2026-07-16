-- Safe signup: create organization + admin profile in one step
CREATE OR REPLACE FUNCTION public.create_organization_with_admin(
  org_name text,
  admin_full_name text,
  admin_email text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'User already belongs to an organization';
  END IF;

  INSERT INTO organizations (name)
  VALUES (org_name)
  RETURNING id INTO new_org_id;

  INSERT INTO profiles (id, org_id, role, full_name, email)
  VALUES (auth.uid(), new_org_id, 'admin', admin_full_name, admin_email);

  RETURN new_org_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_organization_with_admin(text, text, text) TO authenticated;

-- Allow reading an org during first-time signup (before profile exists)
DROP POLICY IF EXISTS "Users can view their org" ON organizations;
CREATE POLICY "Users can view their org" ON organizations
  FOR SELECT USING (
    id = get_user_org_id()
    OR NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
  );
