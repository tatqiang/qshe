-- Manual Database Enum Cleanup
-- Remove unused enum values from patrol_status enum
-- Keep only: 'open', 'pending_verification', 'closed', 'rejected'

-- Step 1: Check current enum values
SELECT enumlabel as current_enum_values 
FROM pg_enum 
WHERE enumtypid = 'patrol_status'::regtype 
ORDER BY enumsortorder;

-- Step 2: Check what data exists in the table (optional)
SELECT status, COUNT(*) as count
FROM safety_patrols 
GROUP BY status 
ORDER BY status;

-- Step 3: Create new clean enum type
CREATE TYPE patrol_status_clean AS ENUM ('open', 'pending_verification', 'closed', 'rejected');

-- Step 4: Add temporary column
ALTER TABLE safety_patrols ADD COLUMN status_temp patrol_status_clean;

-- Step 5: Copy data to new column (map old values to new ones)
UPDATE safety_patrols SET status_temp = 
    CASE 
        WHEN status::text = 'open' THEN 'open'::patrol_status_clean
        WHEN status::text = 'pending_verification' THEN 'pending_verification'::patrol_status_clean  
        WHEN status::text = 'closed' THEN 'closed'::patrol_status_clean
        WHEN status::text = 'rejected' THEN 'rejected'::patrol_status_clean
        -- Map legacy values to appropriate new values
        WHEN status::text = 'draft' THEN 'open'::patrol_status_clean
        WHEN status::text = 'in_progress' THEN 'open'::patrol_status_clean
        WHEN status::text = 'completed' THEN 'closed'::patrol_status_clean
        WHEN status::text = 'under_review' THEN 'pending_verification'::patrol_status_clean
        WHEN status::text = 'pending_action' THEN 'open'::patrol_status_clean
        ELSE 'open'::patrol_status_clean -- default fallback
    END;

-- Step 6: Drop old column
ALTER TABLE safety_patrols DROP COLUMN status;

-- Step 7: Rename new column
ALTER TABLE safety_patrols RENAME COLUMN status_temp TO status;

-- Step 8: Drop old enum type
DROP TYPE patrol_status;

-- Step 9: Rename new enum type
ALTER TYPE patrol_status_clean RENAME TO patrol_status;

-- Step 10: Set default value and constraints
ALTER TABLE safety_patrols ALTER COLUMN status SET DEFAULT 'open';
ALTER TABLE safety_patrols ALTER COLUMN status SET NOT NULL;

-- Step 11: Verify the cleanup
SELECT enumlabel as final_enum_values 
FROM pg_enum 
WHERE enumtypid = 'patrol_status'::regtype 
ORDER BY enumsortorder;

-- Step 12: Check final data
SELECT status, COUNT(*) as count
FROM safety_patrols 
GROUP BY status 
ORDER BY status;