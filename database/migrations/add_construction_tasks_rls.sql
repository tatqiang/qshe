-- ============================================================================
-- Construction Tasks RLS Policies
-- ============================================================================
-- This migration adds proper Row Level Security policies for construction_tasks table
-- Run this in Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view construction tasks for their projects" ON public.construction_tasks;
DROP POLICY IF EXISTS "Authenticated users can insert construction tasks" ON public.construction_tasks;
DROP POLICY IF EXISTS "Users can update construction tasks for their projects" ON public.construction_tasks;
DROP POLICY IF EXISTS "Users can delete construction tasks for their projects" ON public.construction_tasks;

-- Ensure RLS is enabled
ALTER TABLE public.construction_tasks ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT Policy: Allow all authenticated users to view tasks
-- ============================================================================
CREATE POLICY "Allow authenticated users to view construction tasks"
ON public.construction_tasks
FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- INSERT Policy: Allow authenticated users to insert tasks
-- ============================================================================
CREATE POLICY "Allow authenticated users to insert construction tasks"
ON public.construction_tasks
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================================================
-- UPDATE Policy: Allow authenticated users to update tasks
-- ============================================================================
CREATE POLICY "Allow authenticated users to update construction tasks"
ON public.construction_tasks
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================================
-- DELETE Policy: Allow authenticated users to delete tasks
-- ============================================================================
CREATE POLICY "Allow authenticated users to delete construction tasks"
ON public.construction_tasks
FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- DEPLOYMENT COMPLETE
-- ============================================================================
-- Summary:
-- ✅ Dropped old restrictive policies
-- ✅ Created permissive policies for authenticated users
-- ✅ All authenticated users can now:
--    - View all construction tasks
--    - Create new tasks
--    - Update existing tasks
--    - Delete tasks
-- 
-- Note: These are permissive policies suitable for internal team use.
-- If you need more restrictive access control (e.g., project-based),
-- modify the USING and WITH CHECK clauses accordingly.
-- ============================================================================
