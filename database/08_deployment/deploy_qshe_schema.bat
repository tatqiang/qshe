@echo off
echo ========================================
echo QSHE Complete Database Schema Deployment
echo ========================================
echo.
echo This will create the complete QSHE safety management schema
echo including users, roles, projects, safety patrols, and corrective actions.
echo.
echo Target: Azure SQL Database (jectqshe)
echo Server: qshe.database.windows.net
echo.

pause

echo.
echo ======================================== 
echo Deploying Complete QSHE Schema...
echo ========================================

sqlcmd -S qshe.database.windows.net -d jectqshe -G -i "complete_qshe_schema.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✅ SUCCESS: QSHE Schema Deployed!
    echo ========================================
    echo.
    echo Created Tables:
    echo - users ^(auto-registration^)
    echo - roles ^(system_admin, qshe_manager, etc.^)
    echo - projects ^(project management^)
    echo - safety_patrols ^(inspection system^)
    echo - patrol_observations ^(findings^)
    echo - corrective_actions ^(action tracking^)
    echo - attachments ^(Cloudflare R2 integration^)
    echo - system_settings ^(configuration^)
    echo.
    echo Next Steps:
    echo 1. Configure Cloudflare R2 bucket: qshe-attachments
    echo 2. Test login with nithat.su@th.jec.com
    echo 3. System will auto-assign system_admin role
    echo 4. Start creating projects and safety patrols
    echo.
) else (
    echo.
    echo ❌ DEPLOYMENT FAILED
    echo Check the error messages above.
    echo.
)

echo.
echo Current Database Status:
sqlcmd -S qshe.database.windows.net -d jectqshe -G -Q "SELECT COUNT(*) as TableCount FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'"

echo.
pause