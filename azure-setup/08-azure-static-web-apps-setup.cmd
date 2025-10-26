@echo off
echo ========================================
echo QSHE PWA - Azure Static Web Apps Setup
echo Free Hosting with CI/CD from GitHub
echo ========================================
echo.

echo This script will guide you through setting up Azure Static Web Apps
echo for hosting the QSHE PWA with automatic CI/CD from GitHub.
echo.
echo Prerequisites:
echo - GitHub repository with your QSHE PWA code
echo - GitHub account connected to Azure
echo.
echo Press any key to continue or Ctrl+C to abort
pause

echo.
echo STEP 1: Create Static Web App (Manual Steps Required)
echo ========================================
echo.
echo 1. Go to Azure Portal: https://portal.azure.com
echo 2. Search for "Static Web Apps"
echo 3. Click "Create Static Web App"
echo 4. Fill in the basic details:
echo    - Subscription: Your Azure subscription
echo    - Resource Group: qshe-prototype-rg
echo    - Name: qshe-pwa-prototype
echo    - Plan type: Free
echo    - Region: East Asia or Southeast Asia
echo.
echo 5. Sign in to GitHub and authorize Azure
echo 6. Select your organization and repository
echo 7. Build Details:
echo    - Build Presets: React
echo    - App location: / (root)
echo    - Api location: api (leave empty if no backend API)
echo    - Output location: dist
echo.
echo 8. Click "Review + create" then "Create"
echo.
echo Press any key when you have created the Static Web App...
pause

echo.
echo STEP 2: Configure Environment Variables
echo ========================================
echo.
echo 1. After the Static Web App is created, go to the resource
echo 2. Click on "Configuration" in the left menu
echo 3. Add the following environment variables:
echo.

echo Reading configuration from setup files...
if exist "azure-setup\entra-id-config.txt" (
    echo.
    echo --- Entra ID Configuration ---
    type azure-setup\entra-id-config.txt
)

if exist "azure-setup\b2c-config.txt" (
    echo.
    echo --- Azure AD B2C Configuration ---
    type azure-setup\b2c-config.txt
)

if exist "azure-setup\database-config.txt" (
    echo.
    echo --- Database Configuration ---
    type azure-setup\database-config.txt
)

if exist "azure-setup\storage-config.txt" (
    echo.
    echo --- Storage Configuration ---
    type azure-setup\storage-config.txt
)

echo.
echo STEP 3: Update GitHub Actions Workflow
echo ========================================
echo.
echo The Static Web App creation will have created a GitHub Actions workflow
echo in your repository under .github/workflows/
echo.
echo You may need to update the workflow file to:
echo 1. Install dependencies: npm ci
echo 2. Build the app: npm run build
echo 3. Set the correct app location and output location
echo.
echo Example workflow section:
echo app_location: "/" # App source code path
echo api_location: "" # Api source code path - optional
echo output_location: "dist" # Built app content directory
echo.

echo.
echo STEP 4: Get Static Web App URL
echo ========================================
echo.
set /p STATIC_APP_URL=Enter your Static Web App URL (e.g., https://your-app.azurestaticapps.net): 

echo.
echo STEP 5: Update Authentication Redirect URIs
echo ========================================
echo.
echo You need to update the redirect URIs in your app registrations:
echo.
echo For Entra ID (Company Staff):
echo 1. Go to Azure Portal > Azure Active Directory > App registrations
echo 2. Find "QSHE PWA - Company Staff"
echo 3. Go to Authentication
echo 4. Add redirect URI: %STATIC_APP_URL%/auth/company/callback
echo.
echo For Azure AD B2C (External Workers):
echo 1. Go to your B2C tenant > App registrations
echo 2. Find "QSHE PWA - External Workers"  
echo 3. Go to Authentication
echo 4. Add redirect URI: %STATIC_APP_URL%/auth/external/callback
echo.

echo.
echo Creating deployment summary...
echo # Azure Static Web Apps Configuration > azure-setup\static-web-app-config.txt
echo STATIC_WEB_APP_URL=%STATIC_APP_URL% >> azure-setup\static-web-app-config.txt
echo STATIC_WEB_APP_NAME=qshe-pwa-prototype >> azure-setup\static-web-app-config.txt
echo.
echo # Updated Redirect URIs >> azure-setup\static-web-app-config.txt
echo COMPANY_REDIRECT_URI=%STATIC_APP_URL%/auth/company/callback >> azure-setup\static-web-app-config.txt
echo EXTERNAL_REDIRECT_URI=%STATIC_APP_URL%/auth/external/callback >> azure-setup\static-web-app-config.txt

echo.
echo ========================================
echo Azure Static Web Apps Setup Guide Completed!
echo ========================================
echo.
echo What you've accomplished:
echo ✓ Guidance for creating Static Web App in Azure Portal
echo ✓ Environment variables configuration list
echo ✓ GitHub Actions workflow requirements
echo ✓ Authentication redirect URI updates needed
echo.
echo Your app will be available at: %STATIC_APP_URL%
echo.
echo Next step: Run 09-create-environment-config.cmd
echo.
pause