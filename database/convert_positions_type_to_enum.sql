-- Migration: Convert positions.type from VARCHAR to ENUM
-- This script safely converts the existing varchar field to a proper enum
-- All current code expects 'internal' | 'external' values only

-- Step 1: Verify current data values
DO $$
DECLARE
    distinct_types TEXT[];
    invalid_count INTEGER;
BEGIN
    -- Get all distinct type values
    SELECT ARRAY_AGG(DISTINCT type) INTO distinct_types 
    FROM positions 
    WHERE type IS NOT NULL;
    
    RAISE NOTICE '📊 Current type values in positions table: %', distinct_types;
    
    -- Check for any values that aren't 'internal' or 'external'
    SELECT COUNT(*) INTO invalid_count 
    FROM positions 
    WHERE type IS NOT NULL 
    AND type NOT IN ('internal', 'external');
    
    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'Cannot proceed: Found % positions with invalid type values. Please clean data first.', invalid_count;
    ELSE
        RAISE NOTICE '✅ All type values are valid (internal/external only)';
    END IF;
END $$;

-- Step 2: Create the enum type if it doesn't exist
DO $$
BEGIN
    -- Check if enum already exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'position_type_enum') THEN
        CREATE TYPE position_type_enum AS ENUM ('internal', 'external');
        RAISE NOTICE '✅ Created position_type_enum';
    ELSE
        RAISE NOTICE '⚠️  position_type_enum already exists';
    END IF;
END $$;

-- Step 3: Create a temporary column with the enum type
ALTER TABLE positions 
ADD COLUMN IF NOT EXISTS type_enum position_type_enum;

-- Step 4: Copy data from varchar to enum column
UPDATE positions 
SET type_enum = type::position_type_enum 
WHERE type IS NOT NULL;

-- Step 5: Verify the migration
DO $$
DECLARE
    varchar_count INTEGER;
    enum_count INTEGER;
    mismatch_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO varchar_count FROM positions WHERE type IS NOT NULL;
    SELECT COUNT(*) INTO enum_count FROM positions WHERE type_enum IS NOT NULL;
    
    SELECT COUNT(*) INTO mismatch_count 
    FROM positions 
    WHERE type IS NOT NULL 
    AND (type_enum IS NULL OR type::TEXT != type_enum::TEXT);
    
    RAISE NOTICE '📊 Migration verification:';
    RAISE NOTICE '   VARCHAR records: %', varchar_count;
    RAISE NOTICE '   ENUM records: %', enum_count;
    RAISE NOTICE '   Mismatches: %', mismatch_count;
    
    IF mismatch_count > 0 THEN
        RAISE EXCEPTION 'Migration failed: % records have mismatched values', mismatch_count;
    END IF;
END $$;

-- Step 6: Drop the old varchar column and rename enum column
ALTER TABLE positions DROP COLUMN IF EXISTS type;
ALTER TABLE positions RENAME COLUMN type_enum TO type;

-- Step 7: Add NOT NULL constraint if needed (based on your requirements)
-- Uncomment if type should be required:
-- ALTER TABLE positions ALTER COLUMN type SET NOT NULL;

-- Step 8: Final verification
DO $$
DECLARE
    final_count INTEGER;
    column_type TEXT;
BEGIN
    -- Check final state
    SELECT COUNT(*) INTO final_count FROM positions WHERE type IS NOT NULL;
    
    -- Get column type info
    SELECT data_type INTO column_type 
    FROM information_schema.columns 
    WHERE table_name = 'positions' 
    AND column_name = 'type';
    
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '   Final records with type: %', final_count;
    RAISE NOTICE '   Column type: %', column_type;
    
    -- Show sample data
    RAISE NOTICE '📋 Sample data after migration:';
END $$;

-- Display final result
SELECT 
    id, 
    position_title, 
    type,
    pg_typeof(type) as type_info
FROM positions 
ORDER BY level, position_title 
LIMIT 5;