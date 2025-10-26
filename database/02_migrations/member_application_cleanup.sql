-- ============================================
-- MEMBER APPLICATION - CLEANUP & RESET SCRIPT
-- ============================================
-- Use this to completely remove the Member Application module
-- and start fresh if you encounter "already exists" errors

-- Drop all tables (CASCADE will remove dependencies)
DROP TABLE IF EXISTS member_application_documents CASCADE;
DROP TABLE IF EXISTS member_applications CASCADE;
DROP TABLE IF EXISTS member_application_tokens CASCADE;
DROP TABLE IF EXISTS report_templates CASCADE;
DROP TABLE IF EXISTS project_field_configs CASCADE;
DROP TABLE IF EXISTS project_form_configs CASCADE;
DROP TABLE IF EXISTS form_fields CASCADE;
DROP TABLE IF EXISTS form_templates CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS generate_submission_number() CASCADE;
DROP FUNCTION IF EXISTS generate_secure_token(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS set_submission_number() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

-- Summary
DO $$
BEGIN
    RAISE NOTICE '✅ Member Application Module Cleaned Up!';
    RAISE NOTICE '';
    RAISE NOTICE '📌 Next Steps:';
    RAISE NOTICE '  1. Run member_application_schema.sql';
    RAISE NOTICE '  2. Run member_application_seed.sql';
    RAISE NOTICE '';
END $$;
