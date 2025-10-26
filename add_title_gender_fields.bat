@echo off
REM ============================================
REM Add Title and Gender fields to member application form
REM ============================================

echo.
echo ============================================
echo Adding Title and Gender Fields
echo ============================================
echo.

REM Load Supabase connection details from .env
for /f "tokens=1,2 delims==" %%a in ('type .env ^| findstr /i "VITE_SUPABASE_URL SUPABASE_SERVICE_KEY"') do (
    if "%%a"=="VITE_SUPABASE_URL" set SUPABASE_URL=%%b
    if "%%a"=="SUPABASE_SERVICE_KEY" set SUPABASE_KEY=%%b
)

REM Extract host and project ref from URL
for /f "tokens=3 delims=:/" %%a in ("%SUPABASE_URL%") do set SUPABASE_HOST=%%a
for /f "tokens=1 delims=." %%a in ("%SUPABASE_HOST%") do set PROJECT_REF=%%a

REM Supabase pooler connection details
set DB_HOST=aws-0-ap-southeast-1.pooler.supabase.com
set DB_PORT=6543
set DB_NAME=postgres
set DB_USER=postgres.%PROJECT_REF%

echo Project Reference: %PROJECT_REF%
echo Database Host: %DB_HOST%
echo.
echo Running SQL migration...
echo.

REM Set PGPASSWORD for non-interactive authentication
set PGPASSWORD=%SUPABASE_KEY%

REM Run the SQL script
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f database\add_title_and_gender_fields.sql

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Error running SQL migration
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo ✅ Title and Gender Fields Added Successfully
echo ============================================
echo.
echo New fields added to personal_info section:
echo   1. title_name - คำนำหน้าชื่อ (นาย/นาง/นางสาว)
echo   2. gender - เพศ (ชาย/หญิง)
echo.
echo Please refresh the form config page to see the changes.
echo.
pause
