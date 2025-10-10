-- Database Schema Fix: Safe Index Creation
-- This script handles the "index already exists" error

-- Drop the index if it exists, then recreate it
-- This ensures a clean state regardless of previous migrations

DROP INDEX IF EXISTS idx_main_areas_project_id;
DROP INDEX IF EXISTS idx_sub_areas1_project_id;
DROP INDEX IF EXISTS idx_sub_areas1_main_area_id;
DROP INDEX IF EXISTS idx_sub_areas2_project_id;
DROP INDEX IF EXISTS idx_sub_areas2_main_area_id;
DROP INDEX IF EXISTS idx_sub_areas2_sub_area1_id;

-- Now create all indexes cleanly
CREATE INDEX idx_main_areas_project_id ON main_areas(project_id);
CREATE INDEX idx_sub_areas1_project_id ON sub_areas1(project_id);
CREATE INDEX idx_sub_areas1_main_area_id ON sub_areas1(main_area_id);
CREATE INDEX idx_sub_areas2_project_id ON sub_areas2(project_id);
CREATE INDEX idx_sub_areas2_main_area_id ON sub_areas2(main_area_id);
CREATE INDEX idx_sub_areas2_sub_area1_id ON sub_areas2(sub_area1_id);

-- Verify the indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('main_areas', 'sub_areas1', 'sub_areas2')
ORDER BY tablename, indexname;
