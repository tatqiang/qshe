-- Add remark column to safety_patrols table
-- Migration: Add remark field for additional notes/comments on safety patrol observations

ALTER TABLE safety_patrols 
ADD COLUMN remark TEXT;

-- Add comment to document the column purpose
COMMENT ON COLUMN safety_patrols.remark IS 'Additional remarks or notes about the safety patrol observation';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'safety_patrols' 
AND column_name = 'remark';