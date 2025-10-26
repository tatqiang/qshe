-- Database Cleanup: Remove unused 'patrols' table
-- This script safely removes the empty 'patrols' table and updates references

-- Step 1: Verify patrols table is empty
DO $$
DECLARE
    patrol_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO patrol_count FROM patrols;
    
    IF patrol_count > 0 THEN
        RAISE EXCEPTION 'Cannot proceed: patrols table contains % records. Manual review required.', patrol_count;
    ELSE
        RAISE NOTICE '✅ Confirmed: patrols table is empty (% records)', patrol_count;
    END IF;
END $$;

-- Step 2: Check patrol_issues dependencies
DO $$
DECLARE
    issues_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO issues_count FROM patrol_issues;
    RAISE NOTICE 'patrol_issues table has % records', issues_count;
    
    -- If there are patrol_issues, we need to handle the foreign key
    IF issues_count > 0 THEN
        RAISE NOTICE 'Note: patrol_issues table has records. Foreign key constraint needs handling.';
    END IF;
END $$;

-- Step 3: Drop foreign key constraints first
ALTER TABLE patrol_issues DROP CONSTRAINT IF EXISTS patrol_issues_patrol_id_fkey;

-- Step 4: Option A - Update patrol_issues to reference safety_patrols
-- (Uncomment if you want to keep patrol_issues functionality)
-- ALTER TABLE patrol_issues 
-- ADD CONSTRAINT patrol_issues_safety_patrol_id_fkey 
-- FOREIGN KEY (patrol_id) REFERENCES safety_patrols(id);

-- Step 5: Drop the patrols table
DROP TABLE IF EXISTS patrols CASCADE;

-- Step 6: Verification
DO $$
BEGIN
    -- Check if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patrols') THEN
        RAISE EXCEPTION '❌ Failed: patrols table still exists';
    ELSE
        RAISE NOTICE '✅ Success: patrols table removed';
    END IF;
END $$;

-- Summary
SELECT 
    'safety_patrols' as active_table,
    COUNT(*) as record_count,
    'This is the primary patrol table' as status
FROM safety_patrols;