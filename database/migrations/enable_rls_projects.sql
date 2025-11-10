-- Enable RLS for projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
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

-- TEMPORARY: Allow all authenticated users full access to projects (for testing)
-- TODO: Replace with proper company/project_members-based policies later

CREATE POLICY "Users can view projects"
ON public.projects
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert projects"
ON public.projects
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update projects"
ON public.projects
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete projects"
ON public.projects
FOR DELETE
USING (auth.uid() IS NOT NULL);
