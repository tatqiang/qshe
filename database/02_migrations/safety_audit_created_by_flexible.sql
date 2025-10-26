-- ============================================
-- SAFETY AUDIT - FLEXIBLE CREATED_BY FIELD
-- ============================================
-- Purpose: Support both users table and Azure AD identifiers
-- Date: October 16, 2025
-- ============================================

-- ============================================
-- STEP 1: MODIFY created_by COLUMN
-- ============================================

-- Change created_by from UUID to VARCHAR to support multiple identifier types
ALTER TABLE public.safety_audits 
  ALTER COLUMN created_by TYPE VARCHAR(255) USING created_by::VARCHAR;

-- Remove FK constraint to users table (make it optional)
ALTER TABLE public.safety_audits 
  DROP CONSTRAINT IF EXISTS safety_audits_created_by_fkey;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_safety_audits_created_by 
  ON public.safety_audits(created_by);

COMMENT ON COLUMN public.safety_audits.created_by IS 
  'User identifier - can be UUID (from users table), email, Azure AD ID, or username. Format: UUID | email@domain.com | azure:id | username';

-- ============================================
-- STEP 2: ADD DISPLAY NAME FIELD
-- ============================================

-- Add field to store user display name (for UI display)
ALTER TABLE public.safety_audits 
  ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(255);

COMMENT ON COLUMN public.safety_audits.created_by_name IS 
  'Display name of user who created the audit (cached for performance)';

-- ============================================
-- STEP 3: CREATE HELPER FUNCTION
-- ============================================

-- Function to resolve user display name from any identifier
CREATE OR REPLACE FUNCTION public.get_user_display_name(
  p_identifier VARCHAR(255)
)
RETURNS VARCHAR(255)
LANGUAGE plpgsql
AS $$
DECLARE
  v_display_name VARCHAR(255);
BEGIN
  -- Try to find in users table (if exists)
  BEGIN
    SELECT CONCAT(first_name, ' ', last_name)
    INTO v_display_name
    FROM public.users
    WHERE id::VARCHAR = p_identifier 
       OR email = p_identifier 
       OR username = p_identifier
       OR azure_user_id = p_identifier
    LIMIT 1;
    
    IF v_display_name IS NOT NULL THEN
      RETURN v_display_name;
    END IF;
  EXCEPTION
    WHEN undefined_table THEN
      -- Users table doesn't exist, continue
      NULL;
  END;
  
  -- If Azure AD format, extract email
  IF p_identifier LIKE 'azure:%' THEN
    RETURN SUBSTRING(p_identifier FROM 7); -- Remove 'azure:' prefix
  END IF;
  
  -- If email format, return email
  IF p_identifier LIKE '%@%' THEN
    RETURN p_identifier;
  END IF;
  
  -- Otherwise return identifier as-is
  RETURN p_identifier;
END;
$$;

COMMENT ON FUNCTION public.get_user_display_name IS 
  'Resolve user display name from any identifier type (UUID, email, Azure ID, username)';

-- ============================================
-- STEP 4: UPDATE EXISTING VIEW
-- ============================================

-- Update v_audit_summary to use flexible created_by
CREATE OR REPLACE VIEW public.v_audit_summary AS
SELECT 
  a.id,
  a.audit_number,
  a.project_id,
  p.name AS project_name,
  a.audit_date,
  a.auditor_id,
  -- Try to get name from users table, fallback to stored name
  COALESCE(
    (SELECT CONCAT(u.first_name, ' ', u.last_name) 
     FROM public.users u 
     WHERE u.id::VARCHAR = a.auditor_id LIMIT 1),
    a.created_by_name,
    a.auditor_id
  ) AS auditor_name,
  a.created_by,
  COALESCE(a.created_by_name, public.get_user_display_name(a.created_by)) AS created_by_name,
  a.status,
  a.total_score,
  a.max_possible_score,
  a.weighted_average,
  a.percentage_score,
  a.category_scores,
  a.audit_criteria_rev,
  a.number_of_personnel,
  a.created_at,
  a.updated_at,
  -- Count of categories audited
  (SELECT COUNT(DISTINCT category_id) 
   FROM public.safety_audit_results 
   WHERE audit_id = a.id) AS categories_audited,
  -- Total requirements scored
  (SELECT COUNT(*) 
   FROM public.safety_audit_results 
   WHERE audit_id = a.id AND score IS NOT NULL) AS requirements_scored,
  -- Total photos
  (SELECT COUNT(*) 
   FROM public.safety_audit_photos 
   WHERE audit_id = a.id) AS photo_count
FROM public.safety_audits a
LEFT JOIN public.projects p ON a.project_id = p.id;

COMMENT ON VIEW public.v_audit_summary IS 
  'Summary view of all audits with flexible user identification';

-- ============================================
-- STEP 5: USAGE EXAMPLES
-- ============================================

-- Example 1: Insert with users table UUID
-- INSERT INTO safety_audits (created_by, created_by_name, ...)
-- VALUES ('550e8400-e29b-41d4-a716-446655440000', 'John Doe', ...);

-- Example 2: Insert with email (no users table)
-- INSERT INTO safety_audits (created_by, created_by_name, ...)
-- VALUES ('john.doe@company.com', 'John Doe', ...);

-- Example 3: Insert with Azure AD ID
-- INSERT INTO safety_audits (created_by, created_by_name, ...)
-- VALUES ('azure:a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'John Doe', ...);

-- Example 4: Query audits by user
-- SELECT * FROM safety_audits 
-- WHERE created_by = 'john.doe@company.com';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

/*
SUMMARY OF CHANGES:
✓ Changed created_by from UUID to VARCHAR(255)
✓ Removed FK constraint to users table (optional reference)
✓ Added created_by_name for cached display name
✓ Created get_user_display_name() helper function
✓ Updated v_audit_summary view
✓ Added index for performance

BENEFITS:
✓ Backward compatible (UUIDs work as strings)
✓ Supports Azure AD users (email, azure_id, username)
✓ No users table dependency
✓ Easy migration path
✓ Simple queries

USAGE IN APPLICATION:
// With users table (current)
created_by: currentUser.id.toString()
created_by_name: `${currentUser.first_name} ${currentUser.last_name}`

// With Azure AD (future)
created_by: currentUser.email
created_by_name: currentUser.displayName

// Or
created_by: `azure:${currentUser.azure_id}`
created_by_name: currentUser.displayName
*/
