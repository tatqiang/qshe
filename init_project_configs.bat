@echo off
echo ============================================
echo Initialize Project Form Configuration
echo ============================================
echo.

echo Step 1: Creating project_field_configs table...
psql %DATABASE_URL% -f database\schema\schema_project_field_configs.sql
if errorlevel 1 (
    echo ERROR: Failed to create table
    pause
    exit /b 1
)

echo.
echo Step 2: Initializing configs for existing projects...
psql %DATABASE_URL% -f database\init_project_form_configs.sql
if errorlevel 1 (
    echo ERROR: Failed to initialize configs
    pause
    exit /b 1
)

echo.
echo ============================================
echo ✅ Configuration complete!
echo ============================================
echo.
echo Now you can:
echo 1. Configure which fields appear in each project
echo 2. Mark fields as required/optional per project
echo 3. Customize labels and help text per project
echo.
pause
