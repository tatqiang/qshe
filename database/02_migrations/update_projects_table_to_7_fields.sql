-- Update existing projects table - remove project_manager_id and add date fields
-- IMPORTANT: Run this in separate steps due to PostgreSQL enum limitations

-- STEP 1: First, add new enum values (run this part first, then commit)
DO $$
BEGIN
    -- Add enum values one by one, checking if they exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'completed' AND enumtypid = 'project_status_enum'::regtype) THEN
        ALTER TYPE public.project_status_enum ADD VALUE 'completed';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'on_hold' AND enumtypid = 'project_status_enum'::regtype) THEN
        ALTER TYPE public.project_status_enum ADD VALUE 'on_hold';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'extended' AND enumtypid = 'project_status_enum'::regtype) THEN
        ALTER TYPE public.project_status_enum ADD VALUE 'extended';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'cancelled' AND enumtypid = 'project_status_enum'::regtype) THEN
        ALTER TYPE public.project_status_enum ADD VALUE 'cancelled';
    END IF;
END
$$;

-- STEP 2: Add the new date fields we need
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS project_start DATE;

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS project_end DATE;

-- Step 3: Drop the foreign key constraint and project_manager_id column
ALTER TABLE public.projects 
DROP CONSTRAINT IF EXISTS fk_projects_project_manager_id;

ALTER TABLE public.projects 
DROP COLUMN IF EXISTS project_manager_id;

-- Step 4: Create indexes for the new date fields
CREATE INDEX IF NOT EXISTS idx_projects_start_date 
ON public.projects USING btree (project_start);

CREATE INDEX IF NOT EXISTS idx_projects_end_date 
ON public.projects USING btree (project_end);

CREATE INDEX IF NOT EXISTS idx_projects_date_range 
ON public.projects USING btree (project_start, project_end);

-- Step 5: Enable Row Level Security if not already enabled
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Step 6: Create or update RLS policy for all operations
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.projects;
CREATE POLICY "Enable all operations for authenticated users" ON public.projects
  FOR ALL USING (true);

-- Step 7: Grant permissions
GRANT ALL ON public.projects TO authenticated;
GRANT ALL ON public.projects TO anon;

-- Verify the final table structure 
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show the updated enum values
SELECT unnest(enum_range(NULL::project_status_enum)) AS project_status_values;