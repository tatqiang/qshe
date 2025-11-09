-- Enable RLS for projects table with permissive policies
-- These policies allow access even without auth.uid() (for development/testing)

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their company projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert projects for their company" ON public.projects;
DROP POLICY IF EXISTS "Users can update their company projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their company projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view their projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete projects" ON public.projects;

-- PERMISSIVE POLICIES: Allow all operations (RLS enabled but not restrictive)
-- Use TRUE instead of auth.uid() check since we're not using Supabase Auth

CREATE POLICY "Allow all to view projects"
ON public.projects
FOR SELECT
USING (TRUE);

CREATE POLICY "Allow all to insert projects"
ON public.projects
FOR INSERT
WITH CHECK (TRUE);

CREATE POLICY "Allow all to update projects"
ON public.projects
FOR UPDATE
USING (TRUE)
WITH CHECK (TRUE);

CREATE POLICY "Allow all to delete projects"
ON public.projects
FOR DELETE
USING (TRUE);
