-- ============================================
-- Add Foreign Key Constraint for project_id in member_application_tokens
-- ============================================
-- This fixes the error: "Could not find a relationship between 
-- 'member_application_tokens' and 'projects' in the schema cache"

-- Add foreign key constraint to link member_application_tokens to projects
ALTER TABLE member_application_tokens
ADD CONSTRAINT member_application_tokens_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- Also add foreign key for member_applications table (if not exists)
ALTER TABLE member_applications
ADD CONSTRAINT member_application_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- Verify the constraints were created
SELECT 
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE conname IN (
  'member_application_tokens_project_id_fkey',
  'member_application_project_id_fkey'
);
