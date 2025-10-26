@echo off
REM Quick fix for corrective action photos RLS policy
REM This script provides instructions to fix the 401 Unauthorized error

echo.
echo ========================================
echo Fix Corrective Action Photos RLS Error
echo ========================================
echo.
echo Problem: 401 Unauthorized when saving corrective action photos
echo Cause: RLS policy requires 'authenticated' role, Azure AD users use 'anon' role
echo.
echo ========================================
echo SOLUTION: Run SQL Fix in Supabase
echo ========================================
echo.
echo 1. Open your Supabase project dashboard
echo 2. Go to: SQL Editor (left sidebar)
echo 3. Click "New Query"
echo 4. Copy and paste the SQL from:
echo    database/fix_all_corrective_action_rls_policies.sql
echo 5. Click "Run"
echo.
echo ========================================
echo SQL File Location:
echo ========================================
echo.
echo %~dp0database\fix_all_corrective_action_rls_policies.sql
echo.
echo ========================================
echo What This Fix Does:
echo ========================================
echo.
echo ✅ Updates RLS policy to allow both authenticated and anon users
echo ✅ Fixes corrective_actions table
echo ✅ Fixes corrective_action_photos table
echo ✅ Fixes corrective_action_approvals table
echo ✅ Fixes corrective_action_workflow table
echo ✅ Fixes corrective_action_notifications table
echo.
echo ========================================
echo After Running SQL:
echo ========================================
echo.
echo 1. Refresh your browser
echo 2. Try creating corrective action with photos
echo 3. Should work without 401 errors
echo.
echo ========================================
echo Documentation:
echo ========================================
echo.
echo Full details in: CORRECTIVE_ACTION_PHOTOS_RLS_FIX.md
echo.
pause
