-- ============================================
-- Fix Material Receives Status Values and Add CHECK Constraint
-- ============================================

-- Step 1: Check what status values currently exist
-- Uncomment to see current values:
-- SELECT DISTINCT status FROM material_receives;

-- Step 2: Update any invalid status values to 'prepared' (default)
-- Common issues: null, empty string, or other invalid values

-- Fix NULL statuses
UPDATE material_receives 
SET status = 'prepared' 
WHERE status IS NULL;

-- Fix empty string statuses
UPDATE material_receives 
SET status = 'prepared' 
WHERE status = '';

-- Fix ANY status that is not one of the valid values
UPDATE material_receives 
SET status = 'prepared' 
WHERE status NOT IN ('prepared', 'received_all', 'received_with_note', 'rejected');

-- Step 3: Add CHECK constraint
ALTER TABLE material_receives 
ADD CONSTRAINT material_receives_status_check 
CHECK (status IN ('prepared', 'received_all', 'received_with_note', 'rejected'));

-- ============================================
-- Verify the constraint
-- ============================================
-- This should now work without errors:
-- SELECT constraint_name, check_clause 
-- FROM information_schema.check_constraints 
-- WHERE constraint_name = 'material_receives_status_check';
