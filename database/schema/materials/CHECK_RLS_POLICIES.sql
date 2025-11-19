-- Check if RLS is enabled on stores table
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'stores';

-- Check RLS policies on stores table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'stores';

-- If RLS is blocking, temporarily disable it for testing
-- ALTER TABLE stores DISABLE ROW LEVEL SECURITY;

-- Or create a permissive policy for authenticated users
-- CREATE POLICY "Allow authenticated users to view stores"
--   ON stores FOR SELECT
--   TO authenticated
--   USING (true);
