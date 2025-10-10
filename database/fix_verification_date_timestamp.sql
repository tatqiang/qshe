-- Fix verification_date field type to properly store timestamp with timezone
-- This will allow storing both date and time for verification timestamps

-- Drop the existing date column and recreate as timestamptz
ALTER TABLE corrective_actions 
DROP COLUMN IF EXISTS verification_date;

-- Add new verification_date column as timestamptz (timestamp with timezone)
ALTER TABLE corrective_actions 
ADD COLUMN verification_date timestamptz;

-- Add comment to explain the field
COMMENT ON COLUMN corrective_actions.verification_date IS 'Timestamp when the corrective action was verified (with timezone)';

-- Update any existing records that might have verification data
-- This will set verification_date to updated_at for records with verification_notes
UPDATE corrective_actions 
SET verification_date = updated_at 
WHERE verification_notes IS NOT NULL 
  AND (verification_notes LIKE 'APPROVED:%' OR verification_notes LIKE 'REJECTED:%')
  AND verification_date IS NULL;