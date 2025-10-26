-- Quick fix: Add 'rejected' enum value to patrol_status
-- This ensures the rejected status works immediately

DO $$
BEGIN
    -- Add rejected value if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = 'patrol_status'::regtype 
        AND enumlabel = 'rejected'
    ) THEN
        ALTER TYPE patrol_status ADD VALUE 'rejected';
        RAISE NOTICE 'Added rejected value to patrol_status enum';
    ELSE
        RAISE NOTICE 'rejected value already exists in patrol_status enum';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error adding rejected value: %', SQLERRM;
END;
$$;

-- Verify the enum values
SELECT 
    enumlabel as status_value
FROM pg_enum 
WHERE enumtypid = 'patrol_status'::regtype
ORDER BY enumsortorder;