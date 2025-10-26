@echo off
echo ========================================
echo QSHE PWA - Complete Azure Setup
echo Phase 1: Free Azure Prototype
echo ========================================
echo.

echo This master script will guide you through the complete Azure setup process.
echo Each step can also be run individually if needed.
echo.
echo Setup Steps:
echo 1. Azure CLI Installation
echo 2. Azure Login and Resource Group Creation
echo 3. Azure Entra ID App Registration (Company Staff)
echo 4. Microsoft Entra External ID Setup (External Workers)
echo 5. Azure SQL Database Setup
echo 6. Azure Blob Storage Setup
echo 7. Database Schema Deployment
echo 8. Azure Static Web Apps Setup
echo 9. Environment Configuration
echo.
echo Press any key to start the setup process...
pause

echo.
echo ========================================
echo Step 1: Azure CLI Installation
echo ========================================
call azure-setup\01-azure-infrastructure-setup.cmd

echo.
echo ========================================
echo Step 2: Azure Login and Resources
echo ========================================
call azure-setup\02-azure-login-and-resources.cmd

echo.
echo ========================================
echo Step 3: Azure Entra ID Setup
echo ========================================
call azure-setup\03-azure-entra-id-setup.cmd

echo.
echo ========================================
echo Step 4: Microsoft Entra External ID Setup
echo ========================================
call azure-setup\04-azure-external-id-setup.cmd

echo.
echo ========================================
echo Step 5: Azure SQL Database Setup
echo ========================================
call azure-setup\05-azure-sql-database-setup.cmd

echo.
echo ========================================
echo Step 6: Azure Storage Setup
echo ========================================
call azure-setup\06-azure-storage-setup.cmd

echo.
echo ========================================
echo Step 7: Azure SQL Database Schema Deployment
echo ========================================
call azure-setup\07-deploy-azure-sql-schema.cmd

echo.
echo ========================================
echo Step 8: Azure Static Web Apps Setup
echo ========================================
call azure-setup\08-azure-static-web-apps-setup.cmd

echo.
echo ========================================
echo Step 9: Environment Configuration
echo ========================================
call azure-setup\09-create-environment-config.cmd

echo.
echo ========================================
echo 🎉 AZURE SETUP COMPLETED! 🎉
echo ========================================
echo.
echo Phase 1: Free Azure Prototype setup is now complete!
echo.
echo What's been accomplished:
echo ✓ Azure infrastructure created (free tier)
echo ✓ Dual authentication system configured
echo ✓ Multi-company database schema deployed
echo ✓ Face recognition dependencies removed
echo ✓ Environment configuration files created
echo.
echo Next Steps:
echo 1. Run: azure-setup\install-azure-packages.cmd
echo 2. Update your frontend components for Azure authentication
echo 3. Test the multi-company user flows
echo 4. Deploy to Azure Static Web Apps
echo.
echo For development:
echo - Use the .env.local file created for you
echo - Start with: npm run dev
echo.
echo For production:
echo - Copy .env.production.template to .env.production
echo - Update with production values
echo - Deploy via GitHub Actions
echo.
echo Documentation:
echo - Setup summary: azure-setup\SETUP_SUMMARY.md
echo - Architecture: docs\multi_company_architecture.md
echo - Migration plan: docs\azure_migration_plan.md
echo.
pause