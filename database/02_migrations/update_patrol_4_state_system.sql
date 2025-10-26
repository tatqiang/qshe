-- Update patrol status enum to support simplified 4-state workflow
-- 1. 'open' - When patrol is first created (actions need response)  
-- 2. 'pending_verification' - When actions need verification
-- 3. 'closed' - Verification approved
-- 4. 'rejected' - Verification rejected

-- This migration ensures only these 4 states are supported

DO $$
BEGIN
    -- Check if we need to update the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = 'patrol_status'::regtype 
        AND enumlabel = 'rejected'
    ) THEN
        -- Drop the existing enum constraint temporarily
        ALTER TABLE safety_patrols ALTER COLUMN status DROP DEFAULT;
        
        -- Add the 4 required enum values
        ALTER TYPE patrol_status ADD VALUE IF NOT EXISTS 'open';
        ALTER TYPE patrol_status ADD VALUE IF NOT EXISTS 'pending_verification';
        ALTER TYPE patrol_status ADD VALUE IF NOT EXISTS 'closed';
        ALTER TYPE patrol_status ADD VALUE IF NOT EXISTS 'rejected';
        
        -- Update default value to 'open' instead of 'draft'
        ALTER TABLE safety_patrols ALTER COLUMN status SET DEFAULT 'open';
        
        -- Update any existing 'draft' patrols to 'open'
        UPDATE safety_patrols SET status = 'open' WHERE status = 'draft';
        
        -- Update any existing 'completed' patrols to 'closed'  
        UPDATE safety_patrols SET status = 'closed' WHERE status = 'completed';
        
        -- Update any existing 'pending_action' patrols to 'open'
        UPDATE safety_patrols SET status = 'open' WHERE status = 'pending_action';
        
        RAISE NOTICE 'Successfully updated patrol_status enum to 4-state system: open, pending_verification, closed, rejected';
        RAISE NOTICE 'Updated default value to open and migrated existing patrol statuses';
    ELSE
        RAISE NOTICE 'patrol_status enum already contains the required 4-state values';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error updating patrol_status enum: %', SQLERRM;
END;
$$;

-- Verify the enum values
SELECT 
    enumlabel as status_value,
    enumsortorder as sort_order
FROM pg_enum 
WHERE enumtypid = 'patrol_status'::regtype
ORDER BY enumsortorder;

COMMENT ON TYPE patrol_status IS 'Simplified 4-state patrol lifecycle: open -> pending_verification -> closed/rejected';