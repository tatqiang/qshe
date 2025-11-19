-- FINAL: Replace temporary policy with proper secure policies
-- These policies check if user is authenticated via auth.uid()

-- Drop temporary policy
DROP POLICY IF EXISTS "Allow all SELECT on stores - TEMP" ON stores;

-- Recreate proper policies for stores table
-- Policy 1: SELECT - Allow if user is authenticated
CREATE POLICY "Enable SELECT for authenticated users"
  ON stores
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy 2: INSERT - Allow if user is authenticated
CREATE POLICY "Enable INSERT for authenticated users"
  ON stores
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 3: UPDATE - Allow if user is authenticated
CREATE POLICY "Enable UPDATE for authenticated users"
  ON stores
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 4: DELETE - Allow if user is authenticated
CREATE POLICY "Enable DELETE for authenticated users"
  ON stores
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Verify all policies
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'stores'
ORDER BY cmd;
