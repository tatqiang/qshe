@echo off
REM ========================================
REM Member Application Module - Database Setup
REM ========================================

echo.
echo ========================================
echo  Member Application Module Setup
echo ========================================
echo.
echo This script will guide you through setting up the Member Application module database.
echo.
echo Prerequisites:
echo   - Supabase project is ready
echo   - You have access to SQL Editor in Supabase Dashboard
echo.
pause

echo.
echo ========================================
echo  Step 1: Run Schema Migration
echo ========================================
echo.
echo File: database\member_application_schema.sql
echo.
echo This will create:
echo   - 8 tables (form_templates, form_fields, etc.)
echo   - RLS policies
echo   - Helper functions
echo   - Triggers
echo.
echo Instructions:
echo   1. Open Supabase Dashboard ^> SQL Editor
echo   2. Click "New Query"
echo   3. Copy contents from: database\member_application_schema.sql
echo   4. Paste and click "Run"
echo   5. Wait for success message
echo.
echo Opening schema file...
start "" "%~dp0database\member_application_schema.sql"
echo.
pause

echo.
echo ========================================
echo  Step 2: Run Seed Data
echo ========================================
echo.
echo File: database\member_application_seed.sql
echo.
echo This will create:
echo   - Member Application form template
echo   - 26 form fields (based on JobApply.txt)
echo.
echo Instructions:
echo   1. In Supabase Dashboard ^> SQL Editor
echo   2. Click "New Query"
echo   3. Copy contents from: database\member_application_seed.sql
echo   4. Paste and click "Run"
echo   5. Wait for success message
echo.
echo Opening seed file...
start "" "%~dp0database\member_application_seed.sql"
echo.
pause

echo.
echo ========================================
echo  Step 3: Verify Installation
echo ========================================
echo.
echo Run this SQL in Supabase to verify:
echo.
echo -- Check tables
echo SELECT table_name FROM information_schema.tables
echo WHERE table_schema = 'public'
echo   AND table_name LIKE '%%member_application%%'
echo ORDER BY table_name;
echo.
echo -- Check form created
echo SELECT code, name_th FROM form_templates
echo WHERE code = 'MEMBER_APPLICATION';
echo.
echo -- Check fields count
echo SELECT COUNT(*) FROM form_fields ff
echo JOIN form_templates ft ON ff.form_template_id = ft.id
echo WHERE ft.code = 'MEMBER_APPLICATION';
echo -- Should return: 26
echo.
pause

echo.
echo ========================================
echo  Installation Complete!
echo ========================================
echo.
echo ✅ Next Steps:
echo    1. Verify all tables are created
echo    2. Check that 26 fields exist
echo    3. Start building the UI components
echo.
echo 📚 Documentation:
echo    docs\MEMBER_APPLICATION_MODULE.md
echo.
echo 🚀 Ready to build:
echo    - Form Config UI (Admin)
echo    - Public Form Component
echo    - Token Management
echo    - PDF Report Generator
echo.
pause
