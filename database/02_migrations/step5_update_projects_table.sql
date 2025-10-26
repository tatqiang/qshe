-- Part 5: Update projects table (run this last, after all enum values are added)
-- Add the new date fields and remove project_manager_id

-- Add date fields
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS project_start DATE;

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS project_end DATE;

-- Remove project_manager_id and its constraint
ALTER TABLE public.projects 
DROP CONSTRAINT IF EXISTS fk_projects_project_manager_id;

ALTER TABLE public.projects 
DROP COLUMN IF EXISTS project_manager_id;

-- Create indexes for the new date fields
CREATE INDEX IF NOT EXISTS idx_projects_start_date 
ON public.projects USING btree (project_start);

CREATE INDEX IF NOT EXISTS idx_projects_end_date 
ON public.projects USING btree (project_end);

CREATE INDEX IF NOT EXISTS idx_projects_date_range 
ON public.projects USING btree (project_start, project_end);

-- Enable Row Level Security if not already enabled
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create or update RLS policy for all operations
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.projects;
CREATE POLICY "Enable all operations for authenticated users" ON public.projects
  FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON public.projects TO authenticated;
GRANT ALL ON public.projects TO anon;

-- Verify the updated enum values
SELECT unnest(enum_range(NULL::project_status_enum)) AS project_status_values;

-- Verify the final table structure 
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND table_schema = 'public'
ORDER BY ordinal_position;