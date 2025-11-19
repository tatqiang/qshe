-- Enable RLS policies for stores table
-- This allows authenticated users to view all active stores

-- Policy 1: Allow SELECT for all authenticated users
CREATE POLICY "Allow authenticated users to SELECT stores"
  ON stores
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Policy 2: Allow INSERT for authenticated users (for creating stores)
CREATE POLICY "Allow authenticated users to INSERT stores"
  ON stores
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy 3: Allow UPDATE for authenticated users
CREATE POLICY "Allow authenticated users to UPDATE stores"
  ON stores
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy 4: Allow DELETE for authenticated users (soft delete via is_active)
CREATE POLICY "Allow authenticated users to DELETE stores"
  ON stores
  FOR DELETE
  TO authenticated
  USING (true);

-- Verify policies were created
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'stores';
