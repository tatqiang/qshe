@echo off
echo ========================================
echo QSHE PWA - Database Schema Deployment
echo Multi-Company Architecture with Face Recognition Removal
echo ========================================
echo.

echo This script will deploy the enhanced database schema including:
echo - Remove face_descriptors column (with backup)
echo - Create user_company_associations table
echo - Setup enhanced RBAC system with company-specific roles
echo - Create permissions and company roles tables
echo.

REM Get database connection info from config file
if not exist "azure-setup\database-config.txt" (
    echo ERROR: Database configuration file not found!
    echo Please run 05-azure-database-setup.cmd first.
    pause
    exit /b 1
)

echo Reading database configuration...
for /f "tokens=2 delims==" %%i in ('findstr "VITE_AZURE_DB_HOST" azure-setup\database-config.txt') do set DB_HOST=%%i
for /f "tokens=2 delims==" %%i in ('findstr "VITE_AZURE_DB_USER" azure-setup\database-config.txt') do set DB_USER=%%i
for /f "tokens=2 delims==" %%i in ('findstr "VITE_AZURE_DB_PASSWORD" azure-setup\database-config.txt') do set DB_PASSWORD=%%i
for /f "tokens=2 delims==" %%i in ('findstr "VITE_AZURE_DB_NAME" azure-setup\database-config.txt') do set DB_NAME=%%i

echo.
echo Database: %DB_HOST%
echo User: %DB_USER%
echo Database Name: %DB_NAME%
echo.
echo Press any key to continue with schema deployment...
pause

echo.
echo 1. Testing database connection...
echo SELECT version(); | psql "host=%DB_HOST% user=%DB_USER% password=%DB_PASSWORD% dbname=%DB_NAME% sslmode=require"

if %ERRORLEVEL% neq 0 (
    echo ERROR: Cannot connect to database. Please check your configuration.
    pause
    exit /b 1
)

echo Connection successful!

echo.
echo 2. Running multi-company migration script...
echo This will remove face_descriptors and create multi-company support
psql "host=%DB_HOST% user=%DB_USER% password=%DB_PASSWORD% dbname=%DB_NAME% sslmode=require" -f "database\migrate_user_company_many_to_many.sql"

if %ERRORLEVEL% neq 0 (
    echo ERROR: Multi-company migration failed!
    pause
    exit /b 1
)

echo.
echo 3. Creating enhanced RBAC system...
psql "host=%DB_HOST% user=%DB_USER% password=%DB_PASSWORD% dbname=%DB_NAME% sslmode=require" -f "database\create_multicompany_rbac_system.sql"

if %ERRORLEVEL% neq 0 (
    echo ERROR: RBAC system creation failed!
    pause
    exit /b 1
)

echo.
echo 4. Verifying schema deployment...
echo Checking tables created:
echo SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('user_company_associations', 'company_roles', 'permissions') ORDER BY table_name; | psql "host=%DB_HOST% user=%DB_USER% password=%DB_PASSWORD% dbname=%DB_NAME% sslmode=require"

echo.
echo Checking face_descriptors column removal:
echo SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'face_descriptors'; | psql "host=%DB_HOST% user=%DB_USER% password=%DB_PASSWORD% dbname=%DB_NAME% sslmode=require"

echo.
echo Checking permissions created:
echo SELECT COUNT(*) as permission_count FROM public.permissions; | psql "host=%DB_HOST% user=%DB_USER% password=%DB_PASSWORD% dbname=%DB_NAME% sslmode=require"

echo.
echo 5. Creating initial test data (optional)...
echo Would you like to create some test companies and users? (y/n):
set /p CREATE_TEST_DATA=
if /i "%CREATE_TEST_DATA%"=="y" (
    echo Running test data creation...
    psql "host=%DB_HOST% user=%DB_USER% password=%DB_PASSWORD% dbname=%DB_NAME% sslmode=require" -c "
    -- Create test company
    INSERT INTO public.companies (id, name, email_domain, status) 
    VALUES (gen_random_uuid(), 'Test Company Ltd', 'testcompany.com', 'active')
    ON CONFLICT DO NOTHING;
    
    -- Create test permissions if not exist
    INSERT INTO public.permissions (permission_key, permission_name, description, category) 
    VALUES ('test.view', 'Test View', 'View test data', 'test')
    ON CONFLICT (permission_key) DO NOTHING;
    
    SELECT 'Test data created successfully' as result;
    "
)

echo.
echo ========================================
echo Database Schema Deployment Completed!
echo ========================================
echo.
echo Changes made:
echo ✓ Removed face_descriptors column (backup created)
echo ✓ Created user_company_associations table
echo ✓ Setup company_roles and permissions tables
echo ✓ Added multi-company support fields to users
echo ✓ Created helper functions for multi-company operations
echo.
echo Next step: Run 08-azure-static-web-apps-setup.cmd
echo.
pause