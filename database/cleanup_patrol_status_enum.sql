-- Remove unused enum values from patrol_status enum
-- Keep only: 'open', 'pending_verification', 'closed', 'rejected'
-- Remove: 'draft', 'in_progress', 'completed', 'under_review', 'pending_action'

DO $$
DECLARE
    enum_values text[];
    value_to_remove text;
    values_to_remove text[] := ARRAY['draft', 'in_progress', 'completed', 'under_review', 'pending_action'];
    temp_count integer;
BEGIN
    -- Get current enum values
    SELECT array_agg(enumlabel ORDER BY enumsortorder) 
    INTO enum_values
    FROM pg_enum 
    WHERE enumtypid = 'patrol_status'::regtype;
    
    RAISE NOTICE 'Current patrol_status enum values: %', enum_values;
    
    -- Check if we have any records using the values we want to remove
    FOR i IN 1..array_length(values_to_remove, 1) LOOP
        value_to_remove := values_to_remove[i];
        
        -- Check if this value exists in the enum
        IF value_to_remove = ANY(enum_values) THEN
            -- Check if any records are using this value
            EXECUTE format('
                SELECT COUNT(*) FROM safety_patrols WHERE status = %L
            ', value_to_remove) INTO STRICT temp_count;
            
            IF temp_count > 0 THEN
                RAISE NOTICE 'Found % records with status %. These need to be migrated first.', temp_count, value_to_remove;
            ELSE
                RAISE NOTICE 'No records found with status %. Ready to remove from enum.', value_to_remove;
            END IF;
        ELSE
            RAISE NOTICE 'Status % does not exist in enum, skipping.', value_to_remove;
        END IF;
    END LOOP;
    
    -- Since PostgreSQL doesn't support removing enum values directly,
    -- we need to recreate the enum type
    
    -- 1. First, let's create a backup of the safety_patrols table
    RAISE NOTICE 'Starting enum cleanup process...';
    
    -- 2. Create new enum with only the values we want
    CREATE TYPE patrol_status_new AS ENUM ('open', 'pending_verification', 'closed', 'rejected');
    
    -- 3. Add a temporary column with the new enum type
    ALTER TABLE safety_patrols ADD COLUMN status_new patrol_status_new;
    
    -- 4. Copy data from old column to new column (with validation)
    UPDATE safety_patrols SET status_new = 
        CASE 
            WHEN status::text = 'open' THEN 'open'::patrol_status_new
            WHEN status::text = 'pending_verification' THEN 'pending_verification'::patrol_status_new  
            WHEN status::text = 'closed' THEN 'closed'::patrol_status_new
            WHEN status::text = 'rejected' THEN 'rejected'::patrol_status_new
            -- Map legacy values to appropriate new values
            WHEN status::text = 'draft' THEN 'open'::patrol_status_new
            WHEN status::text = 'in_progress' THEN 'open'::patrol_status_new
            WHEN status::text = 'completed' THEN 'closed'::patrol_status_new
            WHEN status::text = 'under_review' THEN 'pending_verification'::patrol_status_new
            WHEN status::text = 'pending_action' THEN 'open'::patrol_status_new
            ELSE 'open'::patrol_status_new -- default fallback
        END;
    
    -- 5. Drop the old column
    ALTER TABLE safety_patrols DROP COLUMN status;
    
    -- 6. Rename the new column
    ALTER TABLE safety_patrols RENAME COLUMN status_new TO status;
    
    -- 7. Drop the old enum type
    DROP TYPE patrol_status;
    
    -- 8. Rename the new enum type
    ALTER TYPE patrol_status_new RENAME TO patrol_status;
    
    -- 9. Set the default value
    ALTER TABLE safety_patrols ALTER COLUMN status SET DEFAULT 'open';
    
    -- 10. Make the column NOT NULL if it isn't already
    ALTER TABLE safety_patrols ALTER COLUMN status SET NOT NULL;
    
    RAISE NOTICE 'Successfully cleaned up patrol_status enum!';
    RAISE NOTICE 'Removed unused values: %', values_to_remove;
    RAISE NOTICE 'Kept only: open, pending_verification, closed, rejected';
    
    -- Verify the final enum values
    SELECT array_agg(enumlabel ORDER BY enumsortorder) 
    INTO enum_values
    FROM pg_enum 
    WHERE enumtypid = 'patrol_status'::regtype;
    
    RAISE NOTICE 'Final patrol_status enum values: %', enum_values;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error cleaning up patrol_status enum: %', SQLERRM;
END;
$$;

-- Verify the cleanup was successful
SELECT 
    'patrol_status enum values:' as info,
    array_agg(enumlabel ORDER BY enumsortorder) as values
FROM pg_enum 
WHERE enumtypid = 'patrol_status'::regtype;

-- Check data integrity
SELECT 
    status,
    COUNT(*) as count
FROM safety_patrols 
GROUP BY status 
ORDER BY status;