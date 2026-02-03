-- Add display_order column for manual task ordering
-- Enables users to reorder tasks independently of dates

-- Add the column
ALTER TABLE public.construction_tasks 
ADD COLUMN display_order INTEGER NULL;

-- Set initial order based on start_date
UPDATE public.construction_tasks 
SET display_order = row_number 
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY start_date, created_at) as row_number
  FROM public.construction_tasks
) AS numbered
WHERE construction_tasks.id = numbered.id;

-- Make it NOT NULL after populating
ALTER TABLE public.construction_tasks 
ALTER COLUMN display_order SET NOT NULL;

-- Add index for performance
CREATE INDEX idx_construction_tasks_display_order 
ON public.construction_tasks 
USING btree (project_id, display_order);

-- Add comment
COMMENT ON COLUMN public.construction_tasks.display_order IS 'Manual sort order within project, allows reordering independent of dates';
