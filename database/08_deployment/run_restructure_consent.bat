@echo off
REM ============================================
REM Run consent form restructure migration
REM ============================================

echo.
echo ============================================
echo Restructuring Member Application Form
echo ============================================
echo.
echo This will:
echo 1. Move profile photo to end of personal info
echo 2. Rename documents section to consent
echo 3. Add consent text with date and name
echo 4. Reorder document fields
echo 5. Update signature label to "ผู้ให้ความยินยอม"
echo.
echo ============================================
echo.

pause

echo.
echo Opening Supabase SQL Editor...
echo.
echo Please:
echo 1. Copy the contents of: database\migrations\restructure_consent_form.sql
echo 2. Paste into Supabase SQL Editor
echo 3. Click Run
echo.

start https://supabase.com/dashboard

echo.
echo Waiting for you to complete the migration...
echo.

pause

echo.
echo ============================================
echo Migration should be complete!
echo ============================================
echo.

pause
