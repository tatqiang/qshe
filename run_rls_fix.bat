@echo off
echo ========================================
echo Running RLS Fix for App-Level Auth
echo ========================================
echo.
echo This will update Supabase RLS policies to work with app-level authentication
echo (Azure AD) instead of requiring Supabase auth.
echo.
pause

echo.
echo Please run this SQL in Supabase SQL Editor:
echo.
echo File: database/migrations/fix_rls_for_app_auth.sql
echo.
echo Opening file...
start "" "database\migrations\fix_rls_for_app_auth.sql"

echo.
echo Instructions:
echo 1. Copy the SQL from the opened file
echo 2. Go to Supabase Dashboard ^> SQL Editor
echo 3. Paste and run the SQL
echo 4. Test photo upload in Safety Audit form
echo.
pause
