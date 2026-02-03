-- Add parent_task_id column to construction_tasks table
-- This enables hierarchical task structure (parent tasks and subtasks)

-- Add the column
ALTER TABLE public.construction_tasks 
ADD COLUMN parent_task_id uuid NULL;

-- Add foreign key constraint
ALTER TABLE public.construction_tasks 
ADD CONSTRAINT construction_tasks_parent_task_id_fkey 
FOREIGN KEY (parent_task_id) 
REFERENCES public.construction_tasks (id) 
ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX idx_construction_tasks_parent_task_id 
ON public.construction_tasks 
USING btree (parent_task_id);

-- Add comment
COMMENT ON COLUMN public.construction_tasks.parent_task_id IS 'Parent task ID for subtasks, enables hierarchical task structure';
