@echo off
echo ========================================
echo QSHE PWA - Environment Configuration
echo Creating .env files for Azure services
echo ========================================
echo.

echo This script will create environment configuration files
echo from all the Azure service configurations.
echo.
echo Press any key to continue...
pause

echo.
echo 1. Consolidating configuration from setup files...

if not exist "azure-setup\entra-id-config.txt" (
    echo WARNING: Entra ID config not found. Please run 03-azure-entra-id-setup.cmd
)

if not exist "azure-setup\b2c-config.txt" (
    echo WARNING: B2C config not found. Please run 04-azure-b2c-setup.cmd
)

if not exist "azure-setup\database-config.txt" (
    echo WARNING: Database config not found. Please run 05-azure-database-setup.cmd
)

if not exist "azure-setup\storage-config.txt" (
    echo WARNING: Storage config not found. Please run 06-azure-storage-setup.cmd
)

echo.
echo 2. Creating .env.local file for development...

echo # QSHE PWA - Azure Configuration > .env.local
echo # Generated on %date% %time% >> .env.local
echo. >> .env.local

echo # ========================================== >> .env.local
echo # Azure Entra ID Configuration (Company Staff) >> .env.local
echo # ========================================== >> .env.local
if exist "azure-setup\entra-id-config.txt" (
    type azure-setup\entra-id-config.txt >> .env.local
) else (
    echo # VITE_AZURE_COMPANY_CLIENT_ID=your-entra-client-id >> .env.local
    echo # VITE_AZURE_COMPANY_TENANT_ID=your-tenant-id >> .env.local
    echo # VITE_AZURE_COMPANY_REDIRECT_URI=http://localhost:5173/auth/company/callback >> .env.local
)
echo. >> .env.local

echo # ========================================== >> .env.local
echo # Azure AD B2C Configuration (External Workers) >> .env.local
echo # ========================================== >> .env.local
if exist "azure-setup\b2c-config.txt" (
    type azure-setup\b2c-config.txt >> .env.local
) else (
    echo # VITE_AZURE_B2C_TENANT_NAME=your-b2c-tenant >> .env.local
    echo # VITE_AZURE_B2C_CLIENT_ID=your-b2c-client-id >> .env.local
    echo # VITE_AZURE_B2C_POLICY_SIGNUP_SIGNIN=B2C_1_external_signin >> .env.local
    echo # VITE_AZURE_B2C_POLICY_EDIT_PROFILE=B2C_1_external_edit_profile >> .env.local
    echo # VITE_AZURE_B2C_REDIRECT_URI=http://localhost:5173/auth/external/callback >> .env.local
)
echo. >> .env.local

echo # ========================================== >> .env.local
echo # Azure Database Configuration >> .env.local
echo # ========================================== >> .env.local
if exist "azure-setup\database-config.txt" (
    type azure-setup\database-config.txt >> .env.local
) else (
    echo # VITE_AZURE_DB_HOST=your-postgres.postgres.database.azure.com >> .env.local
    echo # VITE_AZURE_DB_NAME=qshe_multicompany >> .env.local
    echo # VITE_AZURE_DB_USER=qshe_admin >> .env.local
    echo # VITE_AZURE_DB_PASSWORD=your-secure-password >> .env.local
    echo # VITE_AZURE_DB_SSL_MODE=require >> .env.local
)
echo. >> .env.local

echo # ========================================== >> .env.local
echo # Azure Blob Storage Configuration >> .env.local
echo # ========================================== >> .env.local
if exist "azure-setup\storage-config.txt" (
    type azure-setup\storage-config.txt >> .env.local
) else (
    echo # VITE_AZURE_STORAGE_ACCOUNT=your-storage-account >> .env.local
    echo # VITE_AZURE_CONTAINER_DOCUMENTS=qshe-documents >> .env.local
    echo # VITE_AZURE_CONTAINER_PATROL_PHOTOS=qshe-patrol-photos >> .env.local
    echo # VITE_AZURE_CONTAINER_COMPANY_ASSETS=qshe-company-assets >> .env.local
    echo # VITE_AZURE_STORAGE_CONNECTION_STRING=your-connection-string >> .env.local
)
echo. >> .env.local

echo # ========================================== >> .env.local
echo # Multi-Company Configuration >> .env.local
echo # ========================================== >> .env.local
echo VITE_DEFAULT_COMPANY_DOMAIN=th.jec.com >> .env.local
echo VITE_ENABLE_EXTERNAL_WORKERS=true >> .env.local
echo VITE_ENABLE_MULTI_COMPANY=true >> .env.local
echo VITE_EXTERNAL_WORKER_VERIFICATION_REQUIRED=true >> .env.local
echo. >> .env.local

echo # ========================================== >> .env.local
echo # Security ^& Compliance Configuration >> .env.local
echo # ========================================== >> .env.local
echo VITE_ENABLE_AUDIT_LOGGING=true >> .env.local
echo VITE_SESSION_TIMEOUT_MINUTES=60 >> .env.local
echo VITE_COMPANY_SWITCHING_TIMEOUT_MINUTES=15 >> .env.local
echo. >> .env.local

echo # ========================================== >> .env.local
echo # Development Configuration >> .env.local
echo # ========================================== >> .env.local
echo VITE_ENVIRONMENT=development >> .env.local
echo VITE_API_BASE_URL=http://localhost:3000 >> .env.local
echo VITE_ENABLE_FACE_RECOGNITION=false >> .env.local
echo. >> .env.local

echo.
echo 3. Creating .env.production template...

echo # QSHE PWA - Azure Production Configuration Template > .env.production.template
echo # Copy this file to .env.production and update with production values >> .env.production.template
echo. >> .env.production.template

echo # ========================================== >> .env.production.template
echo # Azure Entra ID Configuration (Production) >> .env.production.template
echo # ========================================== >> .env.production.template
echo VITE_AZURE_COMPANY_CLIENT_ID=your-production-entra-client-id >> .env.production.template
echo VITE_AZURE_COMPANY_TENANT_ID=your-production-tenant-id >> .env.production.template
echo VITE_AZURE_COMPANY_REDIRECT_URI=https://your-app.azurestaticapps.net/auth/company/callback >> .env.production.template
echo. >> .env.production.template

echo # ========================================== >> .env.production.template
echo # Azure AD B2C Configuration (Production) >> .env.production.template
echo # ========================================== >> .env.production.template
echo VITE_AZURE_B2C_TENANT_NAME=your-production-b2c-tenant >> .env.production.template
echo VITE_AZURE_B2C_CLIENT_ID=your-production-b2c-client-id >> .env.production.template
echo VITE_AZURE_B2C_POLICY_SIGNUP_SIGNIN=B2C_1_external_signin >> .env.production.template
echo VITE_AZURE_B2C_POLICY_EDIT_PROFILE=B2C_1_external_edit_profile >> .env.production.template
echo VITE_AZURE_B2C_REDIRECT_URI=https://your-app.azurestaticapps.net/auth/external/callback >> .env.production.template
echo. >> .env.production.template

echo # Production database and storage configs... >> .env.production.template
echo VITE_ENVIRONMENT=production >> .env.production.template
echo VITE_ENABLE_FACE_RECOGNITION=false >> .env.production.template

echo.
echo 4. Creating setup summary document...

echo # QSHE PWA - Azure Setup Summary > azure-setup\SETUP_SUMMARY.md
echo Generated on %date% %time% >> azure-setup\SETUP_SUMMARY.md
echo. >> azure-setup\SETUP_SUMMARY.md
echo ## Phase 1: Free Azure Prototype Setup Completed >> azure-setup\SETUP_SUMMARY.md
echo. >> azure-setup\SETUP_SUMMARY.md
echo ### Services Created: >> azure-setup\SETUP_SUMMARY.md
echo - Azure Resource Group: qshe-prototype-rg >> azure-setup\SETUP_SUMMARY.md
echo - Azure Entra ID App Registration (Company Staff) >> azure-setup\SETUP_SUMMARY.md
echo - Azure AD B2C Tenant (External Workers) >> azure-setup\SETUP_SUMMARY.md
echo - Azure Database for PostgreSQL Flexible Server >> azure-setup\SETUP_SUMMARY.md
echo - Azure Blob Storage Account >> azure-setup\SETUP_SUMMARY.md
echo - Azure Static Web Apps (Manual setup required) >> azure-setup\SETUP_SUMMARY.md
echo. >> azure-setup\SETUP_SUMMARY.md
echo ### Database Changes: >> azure-setup\SETUP_SUMMARY.md
echo - Removed face_descriptors column >> azure-setup\SETUP_SUMMARY.md
echo - Created user_company_associations table >> azure-setup\SETUP_SUMMARY.md
echo - Setup enhanced RBAC with company-specific roles >> azure-setup\SETUP_SUMMARY.md
echo - Added multi-company support fields >> azure-setup\SETUP_SUMMARY.md
echo. >> azure-setup\SETUP_SUMMARY.md
echo ### Next Steps: >> azure-setup\SETUP_SUMMARY.md
echo 1. Install Azure MSAL packages: npm install @azure/msal-browser @azure/msal-react >> azure-setup\SETUP_SUMMARY.md
echo 2. Install Azure Storage package: npm install @azure/storage-blob >> azure-setup\SETUP_SUMMARY.md
echo 3. Update authentication components to use dual authentication >> azure-setup\SETUP_SUMMARY.md
echo 4. Update storage client to use Azure Blob Storage >> azure-setup\SETUP_SUMMARY.md
echo 5. Deploy to Azure Static Web Apps >> azure-setup\SETUP_SUMMARY.md

echo.
echo 5. Creating package installation script...

echo @echo off > azure-setup\install-azure-packages.cmd
echo echo Installing Azure packages for QSHE PWA... >> azure-setup\install-azure-packages.cmd
echo. >> azure-setup\install-azure-packages.cmd
echo echo Installing Azure MSAL packages... >> azure-setup\install-azure-packages.cmd
echo npm install @azure/msal-browser @azure/msal-react >> azure-setup\install-azure-packages.cmd
echo. >> azure-setup\install-azure-packages.cmd
echo echo Installing Azure Storage package... >> azure-setup\install-azure-packages.cmd
echo npm install @azure/storage-blob >> azure-setup\install-azure-packages.cmd
echo. >> azure-setup\install-azure-packages.cmd
echo echo Installing Azure Identity package... >> azure-setup\install-azure-packages.cmd
echo npm install @azure/identity >> azure-setup\install-azure-packages.cmd
echo. >> azure-setup\install-azure-packages.cmd
echo echo Azure packages installed successfully! >> azure-setup\install-azure-packages.cmd
echo pause >> azure-setup\install-azure-packages.cmd

echo.
echo ========================================
echo Environment Configuration Completed!
echo ========================================
echo.
echo Files created:
echo ✓ .env.local - Development environment configuration
echo ✓ .env.production.template - Production configuration template
echo ✓ azure-setup\SETUP_SUMMARY.md - Complete setup summary
echo ✓ azure-setup\install-azure-packages.cmd - Package installation script
echo.
echo IMPORTANT:
echo 1. Review .env.local and update any missing values
echo 2. Keep database passwords and connection strings secure
echo 3. Run install-azure-packages.cmd to install required npm packages
echo 4. Update authentication components to use Azure services
echo.
echo Phase 1: Free Azure Prototype Setup is now complete!
echo.
pause