@echo off
echo ========================================
echo QSHE PWA - Azure Entra ID Setup
echo For Company Staff (@th.jec.com)
echo ========================================
echo.

echo This script will create an app registration for company staff authentication.
echo Make sure you have admin privileges in your Azure AD tenant.
echo.
echo Press any key to continue or Ctrl+C to abort
pause

echo.
echo 1. Creating Entra ID App Registration for QSHE PWA (Company)...

REM Create the app registration
az ad app create ^
    --display-name "QSHE PWA - Company Staff" ^
    --web-redirect-uris "http://localhost:5173/auth/company/callback" "https://your-app.azurestaticapps.net/auth/company/callback" ^
    --enable-access-token-issuance ^
    --enable-id-token-issuance ^
    --required-resource-accesses "[{\"resourceAppId\":\"00000003-0000-0000-c000-000000000000\",\"resourceAccess\":[{\"id\":\"e1fe6dd8-ba31-4d61-89e7-88639da4683d\",\"type\":\"Scope\"},{\"id\":\"14dad69e-099b-42c9-810b-d002981feec1\",\"type\":\"Scope\"},{\"id\":\"64a6cdd6-aab1-4aaf-94b8-3cc8405e90d0\",\"type\":\"Scope\"},{\"id\":\"7427e0e9-2fba-42fe-b0c0-848c9e6a8182\",\"type\":\"Scope\"}]}]"

echo.
echo 2. Retrieving app registration details...
for /f "tokens=*" %%i in ('az ad app list --display-name "QSHE PWA - Company Staff" --query "[0].appId" --output tsv') do set CLIENT_ID=%%i
for /f "tokens=*" %%i in ('az account show --query "tenantId" --output tsv') do set TENANT_ID=%%i

echo.
echo ========================================
echo Entra ID App Registration Created!
echo ========================================
echo.
echo IMPORTANT: Save these values for your environment configuration:
echo.
echo VITE_AZURE_COMPANY_CLIENT_ID=%CLIENT_ID%
echo VITE_AZURE_COMPANY_TENANT_ID=%TENANT_ID%
echo VITE_AZURE_COMPANY_REDIRECT_URI=http://localhost:5173/auth/company/callback
echo.
echo ========================================

echo.
echo Creating configuration file...
echo # Azure Entra ID Configuration for Company Staff > azure-setup\entra-id-config.txt
echo VITE_AZURE_COMPANY_CLIENT_ID=%CLIENT_ID% >> azure-setup\entra-id-config.txt
echo VITE_AZURE_COMPANY_TENANT_ID=%TENANT_ID% >> azure-setup\entra-id-config.txt
echo VITE_AZURE_COMPANY_REDIRECT_URI=http://localhost:5173/auth/company/callback >> azure-setup\entra-id-config.txt

echo.
echo Next step: Run 04-azure-b2c-setup.cmd to setup Azure AD B2C for external workers
echo.
pause