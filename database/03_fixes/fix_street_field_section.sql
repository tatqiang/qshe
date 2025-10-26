-- ============================================
-- Fix: Move address_street field to correct section
-- ============================================
-- Issue: Field was created with section='personal_info' 
-- Should be: section='address'
-- ============================================

-- Check current section
SELECT 
    field_key, 
    label_th, 
    section, 
    display_order
FROM form_fields
WHERE field_key = 'address_street';

-- Expected output: section = 'personal_info' (WRONG)

-- ============================================
-- FIX: Update section to 'address'
-- ============================================

UPDATE form_fields
SET section = 'address'
WHERE field_key = 'address_street';

-- Verify fix
SELECT 
    field_key, 
    label_th, 
    section, 
    display_order
FROM form_fields
WHERE field_key = 'address_street';

-- Expected output: section = 'address' (CORRECT)

-- ============================================
-- Bonus: Verify all address fields are in correct section
-- ============================================

SELECT 
    field_key,
    label_th,
    section,
    display_order
FROM form_fields
WHERE field_key LIKE 'address_%'
ORDER BY display_order;

-- All address_* fields should have section='address'
