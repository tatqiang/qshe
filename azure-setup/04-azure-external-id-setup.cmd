@echo off
echo ========================================
echo QSHE PWA - Microsoft Entra External ID Setup
echo For External Workers (Contractors, Consultants, etc.)
echo Note: Azure AD B2C is no longer available for new customers
echo ========================================
echo.

echo This script will help you set up Microsoft Entra External ID for external workers.
echo Microsoft Entra External ID is the modern replacement for Azure AD B2C.
echo.
echo Press any key to continue or Ctrl+C to abort
pause

echo.
echo STEP 1: Configure External ID in Existing Tenant (Manual)
echo ========================================================
echo.
echo You already have an Entra tenant: Jardine Engineering Company Limited
echo We'll configure External ID within your existing tenant.
echo.
echo 1. Go to: https://entra.microsoft.com
echo 2. Sign in with your existing admin account
echo 3. In the left menu, go to "External Identities"
echo 4. Click "External Identities" -^> "Customer tenants" or "External ID for customers"
echo 5. Click "Create new customer tenant" or "New customer tenant"
echo 6. Fill in:
echo    - Organization name: QSHE External Workers
echo    - Tenant name: qshe-external (creates qshe-external.onmicrosoft.com)
echo    - Country/Region: Thailand
echo 7. Click "Create"
echo.
echo Note: This creates a separate customer tenant for external workers
echo while keeping your main company tenant for internal staff.
echo.
echo Wait for the customer tenant to be created (may take a few minutes)
echo.
echo Press any key when you have created the External ID customer tenant...
pause

echo.
echo STEP 2: Create App Registration in External ID Tenant
echo ========================================
echo.
echo 1. In the Entra portal, switch to your new External ID tenant
echo 2. Go to "Applications" > "App registrations"
echo 3. Click "New registration"
echo 4. Fill in:
echo    - Name: QSHE PWA - External Workers
echo    - Supported account types: Accounts in this organizational directory only
echo    - Redirect URI (Web): http://localhost:5173/auth/external/callback
echo 5. Click "Register"
echo.
echo Press any key when you have created the app registration...
pause

echo.
echo STEP 3: Configure Authentication and User Attributes
echo ========================================
echo.
echo 1. In your External ID app registration, go to "Authentication"
echo 2. Add additional redirect URI: https://your-app.azurestaticapps.net/auth/external/callback
echo 3. Enable "Access tokens" and "ID tokens"
echo 4. Under "Advanced settings", enable "Allow public client flows"
echo 5. Click "Save"
echo.
echo 6. Configure custom user attributes:
echo    - worker_type (String) - "Type of external worker"
echo    - verification_status (String) - "Document verification status"  
echo    - company_affiliations (String) - "Associated company IDs"
echo    - nationality (String) - "Worker nationality"
echo.
echo Press any key when you have configured the attributes...
pause

echo.
echo STEP 4: Create Sign-up and Sign-in Experience
echo ========================================
echo.
echo 1. In External ID tenant, go to "User experiences" > "Sign-up and sign-in"
echo 2. Configure the sign-up experience for external workers
echo 3. Set up identity verification if needed
echo 4. Configure user attributes collection
echo 5. Test the experience
echo.
echo Note: External ID uses modern user experience flows
echo.
echo Press any key when ready to continue...
pause

echo.
echo STEP 5: Get Configuration Values
echo ========================================
echo.
echo Please provide the following values from your External ID tenant:
echo.
set /p EXTERNAL_TENANT_NAME=Enter your External ID tenant name (e.g., qshe): 
set /p EXTERNAL_CLIENT_ID=Enter your External ID app registration Client ID: 

echo.
echo Creating External ID configuration file...
echo # Microsoft Entra External ID Configuration for External Workers > azure-setup\external-id-config.txt
echo # Company Tenant (Internal Staff) >> azure-setup\external-id-config.txt
echo VITE_AZURE_COMPANY_TENANT_ID=d6bb4e04-1f12-... >> azure-setup\external-id-config.txt
echo VITE_AZURE_COMPANY_DOMAIN=JECthailand.onmicrosoft.com >> azure-setup\external-id-config.txt
echo # External ID Tenant (External Workers) >> azure-setup\external-id-config.txt
echo VITE_AZURE_EXTERNAL_TENANT_NAME=%EXTERNAL_TENANT_NAME% >> azure-setup\external-id-config.txt
echo VITE_AZURE_EXTERNAL_CLIENT_ID=%EXTERNAL_CLIENT_ID% >> azure-setup\external-id-config.txt
echo VITE_AZURE_EXTERNAL_AUTHORITY=https://login.microsoftonline.com/%EXTERNAL_TENANT_NAME%.onmicrosoft.com >> azure-setup\external-id-config.txt
echo VITE_AZURE_EXTERNAL_REDIRECT_URI=http://localhost:5173/auth/external/callback >> azure-setup\external-id-config.txt

echo.
echo ========================================
echo Microsoft Entra External ID Setup Completed!
echo ========================================
echo.
echo Configuration saved to: azure-setup\external-id-config.txt
echo.
echo Benefits of External ID over B2C:
echo - Modern user experience
echo - Better integration with Microsoft ecosystem
echo - Simplified configuration
echo - Future-proof solution
echo.
echo Next step: Run 05-azure-database-setup.cmd
echo.
pause