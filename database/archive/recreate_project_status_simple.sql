-- Simple approach: Drop and recreate the status field with all values
-- This avoids enum modification complications

-- First, drop the existing status column (this also drops the enum if no other tables use it)
ALTER TABLE public.projects DROP COLUMN IF EXISTS status CASCADE;

-- Drop the enum type if it still exists
DROP TYPE IF EXISTS public.project_status_enum CASCADE;

-- Create the new enum with all values at once
CREATE TYPE public.project_status_enum AS ENUM (
    'active',
    'completed', 
    'on_hold',
    'extended',
    'cancelled'
);

-- Add the status column back with the new enum
ALTER TABLE public.projects 
ADD COLUMN status public.project_status_enum NOT NULL DEFAULT 'active';

-- Create index for the status field
CREATE INDEX IF NOT EXISTS idx_projects_status 
ON public.projects USING btree (status);

-- Add the date fields
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

-- Verify the enum values
SELECT unnest(enum_range(NULL::project_status_enum)) AS status_values;

-- Verify the final table structure 
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND table_schema = 'public'
ORDER BY ordinal_position;