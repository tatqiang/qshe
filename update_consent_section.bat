@echo off
echo ========================================
echo Update Member Form - Consent Section
echo ========================================
echo.
echo This will:
echo 1. Move profile photo to end of personal_info section
echo 2. Create consent section (หนังสือให้ความยินยอม)
echo 3. Add consent text with name interpolation
echo 4. Reorganize document fields
echo 5. Update signature field
echo.
pause

supabase db execute --file database/update_member_form_consent_section.sql

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo ✅ Migration completed successfully!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo ❌ Migration failed!
    echo ========================================
)

pause
