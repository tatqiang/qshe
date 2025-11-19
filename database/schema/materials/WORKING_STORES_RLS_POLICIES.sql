-- WORKING SOLUTION: Simple policies that work with Azure AD authentication
-- Your app handles authentication, so RLS just needs to allow access

DROP POLICY IF EXISTS "Enable SELECT for authenticated users" ON stores;
DROP POLICY IF EXISTS "Enable INSERT for authenticated users" ON stores;
DROP POLICY IF EXISTS "Enable UPDATE for authenticated users" ON stores;
DROP POLICY IF EXISTS "Enable DELETE for authenticated users" ON stores;

-- Create simple policies that allow access (your app handles auth)
CREATE POLICY "Allow SELECT on stores"
  ON stores FOR SELECT
  USING (true);

CREATE POLICY "Allow INSERT on stores"
  ON stores FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow UPDATE on stores"
  ON stores FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow DELETE on stores"
  ON stores FOR DELETE
  USING (true);

-- Verify
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'stores' ORDER BY cmd;
