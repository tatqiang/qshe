@echo off
echo ========================================
echo QSHE Simplified Database Schema Deployment
echo ========================================
echo.
echo This will create the simplified QSHE schema with:
echo - Users table with simple role field
echo - No complex role tables or junctions
echo - Auto-registration system
echo - Complete safety patrol system
echo.
echo Target: Azure SQL Database (jectqshe)
echo Server: qshe.database.windows.net
echo.

pause

echo.
echo ======================================== 
echo Deploying Simplified QSHE Schema...
echo ========================================

sqlcmd -S qshe.database.windows.net -d jectqshe -G -i "simplified_qshe_schema.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✅ SUCCESS: Simplified QSHE Schema Deployed!
    echo ========================================
    echo.
    echo Key Features:
    echo - ✅ Users table with simple role field
    echo - ✅ Role hierarchy: system_admin → employee
    echo - ✅ Auto-registration on first login
    echo - ✅ nithat.su@th.jec.com → system_admin
    echo - ✅ Complete safety patrol system
    echo - ✅ Corrective actions with user assignment
    echo - ✅ Cloudflare R2 photo integration
    echo.
    echo Role Levels:
    echo 1. system_admin    ^(nithat.su@th.jec.com^)
    echo 2. qshe_manager    ^(QSHE department heads^)
    echo 3. safety_officer  ^(Safety team members^)
    echo 4. project_manager ^(Project leads^)
    echo 5. supervisor      ^(Team supervisors^)
    echo 6. inspector       ^(Safety inspectors^)
    echo 7. employee        ^(Regular staff^)
    echo.
    echo Next Steps:
    echo 1. Login with nithat.su@th.jec.com ^(auto-gets system_admin^)
    echo 2. Start creating projects
    echo 3. Conduct safety patrols
    echo 4. Assign corrective actions to users
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
echo Schema Summary:
sqlcmd -S qshe.database.windows.net -d jectqshe -G -Q "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME"

echo.
pause