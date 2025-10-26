@echo off
REM Fix NULL is_visible values in database

echo.
echo ================================================
echo Fixing NULL Visibility Values
echo ================================================
echo This will update NULL is_visible values to their defaults
echo ================================================
echo.

psql -U postgres -d qshe_pwa -f database\fix_null_visibility.sql

echo.
echo ================================================
echo Done! Refresh your form to see changes
echo ================================================
echo.

pause
