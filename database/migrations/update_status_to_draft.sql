-- =====================================================
-- Update Status from "plan" to "draft"
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Update existing ITRs status from 'plan' to 'draft'
-- First check if any ITRs exist with 'plan' status
SELECT COUNT(*) as plan_count FROM construction_itrs WHERE status_code = 'plan';

-- Update the ITRs
UPDATE construction_itrs SET status_code = 'draft' WHERE status_code = 'plan';

-- Step 2: Update the status definition
UPDATE itr_status_definitions 
SET display_name = 'Draft',
    description = 'ITR is being planned and prepared',
    color = '#6b7280'
WHERE code = 'plan';

-- Step 3: Drop and recreate the enum (if needed)
-- Note: You may need to run this manually if there are dependencies

-- First, let's see what the current enum values are:
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'itr_status_code'::regtype ORDER BY enumsortorder;

-- If 'plan' exists and you want to replace it with 'draft':
-- You'll need to:
-- 1. Create a new enum type
-- 2. Alter the column to use the new type
-- 3. Drop the old type

-- Create new enum type
DROP TYPE IF EXISTS itr_status_code_new CASCADE;
CREATE TYPE itr_status_code_new AS ENUM (
    'draft',
    'internal_requested',
    'confirm_requested',
    'in_review',
    'approved',
    'rejected'
);

-- Update construction_itrs table to use new enum
ALTER TABLE construction_itrs 
  ALTER COLUMN status_code TYPE itr_status_code_new 
  USING (CASE 
    WHEN status_code::text = 'plan' THEN 'draft'::itr_status_code_new
    ELSE status_code::text::itr_status_code_new
  END);

-- Update itr_status_definitions table
ALTER TABLE itr_status_definitions 
  ALTER COLUMN code TYPE itr_status_code_new 
  USING code::text::itr_status_code_new;

-- Drop old enum and rename new one
DROP TYPE IF EXISTS itr_status_code CASCADE;
ALTER TYPE itr_status_code_new RENAME TO itr_status_code;

-- Update the status definition for 'draft'
INSERT INTO itr_status_definitions (code, display_name, description, color, icon, sort_order, can_edit) 
VALUES ('draft', 'Draft', 'ITR is being planned and prepared', '#6b7280', '📝', 1, true)
ON CONFLICT (code) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  updated_at = NOW();

-- Verify the changes
SELECT * FROM itr_status_definitions ORDER BY sort_order;
SELECT status_code, COUNT(*) FROM construction_itrs GROUP BY status_code;
