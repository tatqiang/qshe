-- Update Position Level Type from INTEGER to NUMERIC
-- This allows decimal hierarchy levels like 1.0, 1.1, 2.0, 2.1, etc.
-- Run this in Supabase Dashboard > SQL Editor

-- ==============================================
-- STEP 1: Check current level column type
-- ==============================================

SELECT 
    table_name,
    column_name,
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'positions'
  AND column_name = 'level';

-- ==============================================
-- STEP 2: Update level column from integer to numeric(3,1)
-- ==============================================

-- Change level from integer to numeric for decimal precision (e.g., 1.0, 1.1, 2.0, 2.1)
ALTER TABLE public.positions ALTER COLUMN level TYPE numeric(3,1);

-- ==============================================
-- STEP 3: Add comment explaining the change
-- ==============================================

COMMENT ON COLUMN public.positions.level IS 'Hierarchical level - using NUMERIC(3,1) for decimal precision (e.g., 1.0, 1.1, 2.0, 2.1)';

-- ==============================================
-- STEP 4: Verify the change
-- ==============================================

-- Show updated column type
SELECT 
    table_name,
    column_name,
    data_type,
    numeric_precision,
    numeric_scale,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'positions'
  AND column_name = 'level';

-- Show current data to verify conversion worked correctly
SELECT id, level, position_title 
FROM public.positions 
ORDER BY level, id;

SELECT 'Successfully updated level column to NUMERIC(3,1) type!' as status;
