-- =====================================================
-- Reset: ITR Attachments RLS Policies - Force Clean
-- Description: Completely remove and recreate policies
-- Date: 2026-02-02
-- =====================================================

-- Disable RLS temporarily
ALTER TABLE construction_itr_attachments DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies (even if names don't match)
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'construction_itr_attachments'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON construction_itr_attachments', pol.policyname);
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE construction_itr_attachments ENABLE ROW LEVEL SECURITY;

-- Create new simple policies
CREATE POLICY "allow_authenticated_select"
  ON construction_itr_attachments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_authenticated_insert"
  ON construction_itr_attachments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "allow_authenticated_update"
  ON construction_itr_attachments FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "allow_authenticated_delete"
  ON construction_itr_attachments FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Verify policies
SELECT schemaname, tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename = 'construction_itr_attachments';
