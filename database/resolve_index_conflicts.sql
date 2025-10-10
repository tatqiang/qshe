-- SQL Index Conflict Resolution Script
-- Run this script BEFORE running any schema migration scripts
-- This will resolve the "relation already exists" errors

-- =================================================================
-- STEP 1: Clean up any existing conflicting indexes
-- =================================================================

-- Drop all potentially conflicting indexes (if they exist)
DROP INDEX IF EXISTS idx_main_areas_project_id CASCADE;
DROP INDEX IF EXISTS idx_main_areas_name CASCADE;
DROP INDEX IF EXISTS idx_main_areas_status CASCADE;
DROP INDEX IF EXISTS idx_main_areas_type CASCADE;

DROP INDEX IF EXISTS idx_sub_areas_1_main_area_id CASCADE;
DROP INDEX IF EXISTS idx_sub_areas_1_name CASCADE;
DROP INDEX IF EXISTS idx_sub_areas_1_status CASCADE;
DROP INDEX IF EXISTS idx_sub_areas_1_floor CASCADE;

DROP INDEX IF EXISTS idx_sub_areas_2_sub_area1_id CASCADE;
DROP INDEX IF EXISTS idx_sub_areas_2_name CASCADE;
DROP INDEX IF EXISTS idx_sub_areas_2_status CASCADE;
DROP INDEX IF EXISTS idx_sub_areas_2_room_number CASCADE;

DROP INDEX IF EXISTS idx_safety_patrols_main_area CASCADE;
DROP INDEX IF EXISTS idx_safety_patrols_sub_area1 CASCADE;
DROP INDEX IF EXISTS idx_safety_patrols_sub_area2 CASCADE;
DROP INDEX IF EXISTS idx_patrol_photos_patrol_id CASCADE;
DROP INDEX IF EXISTS idx_corrective_actions_patrol_id CASCADE;
DROP INDEX IF EXISTS idx_corrective_actions_assigned_to CASCADE;
DROP INDEX IF EXISTS idx_corrective_actions_due_date CASCADE;
DROP INDEX IF EXISTS idx_sub_areas_level1_main_area CASCADE;
DROP INDEX IF EXISTS idx_sub_areas_level2_sub_area1 CASCADE;

-- Alternative naming patterns that might exist
DROP INDEX IF EXISTS idx_sub_areas1_project_id CASCADE;
DROP INDEX IF EXISTS idx_sub_areas1_main_area_id CASCADE;
DROP INDEX IF EXISTS idx_sub_areas2_project_id CASCADE;
DROP INDEX IF EXISTS idx_sub_areas2_main_area_id CASCADE;
DROP INDEX IF EXISTS idx_sub_areas2_sub_area1_id CASCADE;

-- =================================================================
-- STEP 2: Check current state and report what was cleaned up
-- =================================================================

-- Show any remaining indexes on area tables
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename LIKE '%area%' 
   OR tablename LIKE '%patrol%'
ORDER BY tablename, indexname;

-- =================================================================
-- INSTRUCTIONS
-- =================================================================

/*
After running this script:

1. Run your main schema scripts in this order:
   - normalized_areas_schema.sql (now uses IF NOT EXISTS)
   - safety_patrol_schema.sql (now uses IF NOT EXISTS)
   
2. All index creation commands now use "CREATE INDEX IF NOT EXISTS" 
   so they won't conflict even if run multiple times

3. If you still get conflicts, it means there are indexes with 
   different names. Check the output above and add them to this script.

This script is safe to run multiple times.
*/

-- Verify completion
SELECT 'Index cleanup completed successfully. You can now run your schema scripts.' as status;
