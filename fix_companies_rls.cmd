@echo off
echo ========================================
echo Fixing Companies Table RLS Policies
echo ========================================
echo.
echo This script will apply RLS policies to the companies table
echo to allow authenticated users to read, insert, and update companies.
echo.
echo INSTRUCTIONS:
echo 1. Go to your Supabase Dashboard
echo 2. Navigate to SQL Editor
echo 3. Copy and paste the contents of database\fix_companies_rls.sql
echo 4. Run the SQL script
echo.
echo OR
echo.
echo Run this command in PowerShell:
echo   psql [YOUR_DATABASE_CONNECTION_STRING] -f database\fix_companies_rls.sql
echo.
pause
