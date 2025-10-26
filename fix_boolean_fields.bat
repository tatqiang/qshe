@echo off
echo ========================================
echo Fix Member Form Boolean Fields
echo ========================================
echo.

REM Load environment variables
if exist .env.local (
    echo Loading environment from .env.local...
    for /f "tokens=1,2 delims==" %%a in ('type .env.local ^| findstr /v "^#"') do (
        set %%a=%%b
    )
) else (
    echo Error: .env.local not found!
    pause
    exit /b 1
)

echo.
echo Running SQL migration...
echo.

psql %DATABASE_URL% -f database\fix_member_form_boolean_fields.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Migration completed successfully!
    echo ========================================
    echo.
    echo Changes made:
    echo - has_construction_experience: "yes"/"no" ^-^> true/false
    echo - has_acrophobia: "yes"/"no" ^-^> true/false
    echo - has_chronic_disease: "yes"/"no" ^-^> true/false
    echo - is_color_blind: "yes"/"no" ^-^> true/false
    echo - has_epilepsy: "yes"/"no" ^-^> true/false
    echo.
    echo Next steps:
    echo 1. Clear browser cache
    echo 2. Refresh the form page
    echo 3. Test filling out the form
    echo 4. Verify report shows checkboxes correctly
    echo.
) else (
    echo.
    echo ========================================
    echo Migration failed!
    echo ========================================
    echo.
)

pause
