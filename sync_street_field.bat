@echo off
REM Sync ALL new fields to existing project configurations

echo.
echo ================================================
echo Syncing New Fields to Project Configs
echo ================================================
echo This will add any missing fields (including 'ถนน')
echo to all existing project configurations
echo ================================================
echo.

REM Get database connection from environment
REM Adjust connection parameters as needed

psql -U postgres -d qshe_pwa -f database\sync_street_field_to_projects.sql

echo.
echo ================================================
echo Done! Check output above for results
echo ================================================
echo.

pause
