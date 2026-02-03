-- Fix RLS policies for construction tables to allow inserts
-- Drop existing policies and recreate with proper permissions

-- ============================================================================
-- Fix construction_systems RLS
-- ============================================================================
DROP POLICY IF EXISTS "Users can view systems for their projects" ON construction_systems;
DROP POLICY IF EXISTS "Users can insert systems for their projects" ON construction_systems;
DROP POLICY IF EXISTS "Users can update systems for their projects" ON construction_systems;
DROP POLICY IF EXISTS "Users can delete systems for their projects" ON construction_systems;

-- Create permissive policies for all authenticated users
CREATE POLICY "Enable read access for authenticated users"
  ON construction_systems FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON construction_systems FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
  ON construction_systems FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users"
  ON construction_systems FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- Fix construction_itr_types RLS
-- ============================================================================
DROP POLICY IF EXISTS "Users can view ITR types for their projects" ON construction_itr_types;
DROP POLICY IF EXISTS "Users can insert ITR types for their projects" ON construction_itr_types;
DROP POLICY IF EXISTS "Users can update ITR types for their projects" ON construction_itr_types;
DROP POLICY IF EXISTS "Users can delete ITR types for their projects" ON construction_itr_types;

CREATE POLICY "Enable read access for authenticated users"
  ON construction_itr_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON construction_itr_types FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
  ON construction_itr_types FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users"
  ON construction_itr_types FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- Fix construction_itrs RLS
-- ============================================================================
DROP POLICY IF EXISTS "Users can view ITRs for their projects" ON construction_itrs;
DROP POLICY IF EXISTS "Users can insert ITRs for their projects" ON construction_itrs;
DROP POLICY IF EXISTS "Users can update ITRs for their projects" ON construction_itrs;
DROP POLICY IF EXISTS "Users can delete ITRs for their projects" ON construction_itrs;

CREATE POLICY "Enable read access for authenticated users"
  ON construction_itrs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON construction_itrs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
  ON construction_itrs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users"
  ON construction_itrs FOR DELETE
  TO authenticated
  USING (true);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('construction_systems', 'construction_itr_types', 'construction_itrs')
ORDER BY tablename, policyname;
