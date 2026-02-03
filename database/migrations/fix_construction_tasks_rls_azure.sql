-- ============================================================================
-- Construction Tasks RLS Policies - Fix for Azure AD Auth
-- ============================================================================
-- This fixes RLS policies when using Azure AD authentication
-- Run this in Supabase SQL Editor

-- Step 1: Drop all existing policies
DROP POLICY IF EXISTS "Allow authenticated users to view construction tasks" ON public.construction_tasks;
DROP POLICY IF EXISTS "Allow authenticated users to insert construction tasks" ON public.construction_tasks;
DROP POLICY IF EXISTS "Allow authenticated users to update construction tasks" ON public.construction_tasks;
DROP POLICY IF EXISTS "Allow authenticated users to delete construction tasks" ON public.construction_tasks;
DROP POLICY IF EXISTS "Users can view construction tasks for their projects" ON public.construction_tasks;
DROP POLICY IF EXISTS "Authenticated users can insert construction tasks" ON public.construction_tasks;
DROP POLICY IF EXISTS "Users can update construction tasks for their projects" ON public.construction_tasks;
DROP POLICY IF EXISTS "Users can delete construction tasks for their projects" ON public.construction_tasks;

-- Step 2: Option A - DISABLE RLS completely (for internal use)
-- Uncomment this if you trust all users with the anon key:
-- ALTER TABLE public.construction_tasks DISABLE ROW LEVEL SECURITY;

-- Step 3: Option B - Create permissive policies that work with Azure AD
-- Keep RLS enabled but make it work:
ALTER TABLE public.construction_tasks ENABLE ROW LEVEL SECURITY;

-- Allow SELECT for anon and authenticated roles
CREATE POLICY "Enable read access for all users" ON public.construction_tasks
  FOR SELECT USING (true);

-- Allow INSERT for anon and authenticated roles
CREATE POLICY "Enable insert for all users" ON public.construction_tasks
  FOR INSERT WITH CHECK (true);

-- Allow UPDATE for anon and authenticated roles
CREATE POLICY "Enable update for all users" ON public.construction_tasks
  FOR UPDATE USING (true) WITH CHECK (true);

-- Allow DELETE for anon and authenticated roles
CREATE POLICY "Enable delete for all users" ON public.construction_tasks
  FOR DELETE USING (true);

-- ============================================================================
-- If above doesn't work, run this emergency fix:
-- ============================================================================
-- This completely disables RLS - use only if policies aren't working
-- ALTER TABLE public.construction_tasks DISABLE ROW LEVEL SECURITY;
-- ============================================================================

SELECT 'RLS policies updated successfully!' as message;
