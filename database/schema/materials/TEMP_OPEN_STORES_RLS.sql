-- TEMPORARY: Drop the existing SELECT policy and create a completely permissive one for testing
DROP POLICY IF EXISTS "Allow authenticated users to SELECT stores" ON stores;

-- Create a completely open policy (NO restrictions) - FOR TESTING ONLY
CREATE POLICY "Allow all SELECT on stores - TEMP"
  ON stores
  FOR SELECT
  USING (true);

-- Verify
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'stores' AND cmd = 'SELECT';
