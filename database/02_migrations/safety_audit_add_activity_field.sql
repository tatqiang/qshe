-- ============================================
-- SAFETY AUDIT - ADD ACTIVITY FIELD
-- ============================================
-- Purpose: Add field to record the activity being audited
-- Date: October 16, 2025
-- ============================================

-- Add activity field to safety_audits table
ALTER TABLE public.safety_audits 
  ADD COLUMN IF NOT EXISTS activity TEXT;

COMMENT ON COLUMN public.safety_audits.activity IS 
  'Description of the activity being audited in the area (e.g., "Welding work", "Scaffolding installation", "Concrete pouring")';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Summary:
-- ✓ Added activity TEXT field to safety_audits table
-- ✓ Field is nullable (optional during audit creation)
-- ✓ Can store activity description for audit context
