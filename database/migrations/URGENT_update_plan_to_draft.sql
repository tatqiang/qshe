-- =====================================================
-- URGENT: Update 'plan' to 'draft' status
-- Run EACH step separately in Supabase SQL Editor
-- =====================================================

-- STEP 1: Check what the ACTUAL status_code values are
SELECT id, itr_title, status_code, created_at
FROM construction_itrs
ORDER BY created_at DESC;

-- If you see 'plan' in the status_code column, continue to STEP 2

-- =====================================================
-- STEP 2: Update the actual status_code from 'plan' to 'draft'
-- =====================================================

UPDATE construction_itrs 
SET status_code = 'draft'
WHERE status_code = 'plan';

-- STEP 3: Verify the change
SELECT status_code, COUNT(*) 
FROM construction_itrs 
GROUP BY status_code;
