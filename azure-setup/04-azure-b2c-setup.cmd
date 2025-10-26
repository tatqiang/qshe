@echo off
echo ========================================
echo QSHE PWA - Microsoft Entra External ID Setup
echo For External Workers (Contractors, Consultants, etc.)
echo Note: Azure AD B2C is no longer available for new customers
echo ========================================
echo.

echo This script will help you set up Microsoft Entra External ID for external workers.
echo Microsoft Entra External ID is the new replacement for Azure AD B2C.
echo.
echo Press any key to continue or Ctrl+C to abort
pause

echo.
echo STEP 1: Setup Microsoft Entra External ID (Manual)
echo ========================================
echo.
echo 1. Go to: https://portal.azure.com
echo 2. Search for "Azure AD B2C"
echo 3. Click "Create Azure AD B2C Tenant"
echo 4. Choose "Create a new Azure AD B2C Tenant"
echo 5. Fill in:
echo    - Organization name: QSHE External Workers
echo    - Initial domain name: qshe-external (or your choice)
echo    - Country/Region: Thailand
echo 6. Click "Create"
echo.
echo Wait for the tenant to be created (may take a few minutes)
echo.
echo Press any key when you have created the B2C tenant...
pause

echo.
echo STEP 2: Switch to B2C Tenant and Create App Registration
echo ========================================
echo.
echo 1. In Azure portal, click the directory switcher (top right)
echo 2. Select your new B2C tenant directory
echo 3. Search for "Azure AD B2C"
echo 4. Go to "App registrations" under "Manage"
echo 5. Click "New registration"
echo 6. Fill in:
echo    - Name: QSHE PWA - External Workers
echo    - Supported account types: Accounts in any identity provider or organizational directory
echo    - Redirect URI (Web): http://localhost:5173/auth/external/callback
echo 7. Click "Register"
echo.
echo Press any key when you have created the app registration...
pause

echo.
echo STEP 3: Configure Authentication and Custom Attributes
echo ========================================
echo.
echo 1. In your B2C app registration, go to "Authentication"
echo 2. Add additional redirect URI: https://your-app.azurestaticapps.net/auth/external/callback
echo 3. Enable "Access tokens" and "ID tokens"
echo 4. Click "Save"
echo.
echo 5. Go to "User attributes" in the B2C overview
echo 6. Click "Add" and create these custom attributes:
echo    - worker_type (String, max 50 chars) - "Type of external worker"
echo    - verification_status (String, max 20 chars) - "Document verification status"  
echo    - company_affiliations (String, max 500 chars) - "Associated company IDs"
echo    - primary_company_id (String, max 36 chars) - "Primary company affiliation"
echo    - nationality (String, max 50 chars) - "Worker nationality"
echo    - passport_number (String, max 20 chars) - "Passport number"
echo    - work_permit_number (String, max 20 chars) - "Work permit number"
echo.
echo Press any key when you have configured the attributes...
pause

echo.
echo STEP 4: Create User Flows
echo ========================================
echo.
echo 1. In Azure AD B2C, go to "User flows"
echo 2. Click "New user flow"
echo 3. Select "Sign up and sign in" - Version: Recommended
echo 4. Name: B2C_1_external_signin
echo 5. Local accounts: Email signup
echo 6. User attributes and claims:
echo    - Collect: Email, Given Name, Surname, worker_type, nationality
echo    - Return: Email, Given Name, Surname, Object ID, worker_type, verification_status
echo 7. Click "Create"
echo.
echo 8. Create another user flow:
echo    - Type: Profile editing - Version: Recommended  
echo    - Name: B2C_1_external_edit_profile
echo    - Same attributes as above
echo.
echo Press any key when you have created the user flows...
pause

echo.
echo STEP 5: Get Configuration Values
echo ========================================
echo.
echo Please provide the following values from your B2C tenant:
echo.
set /p B2C_TENANT_NAME=Enter your B2C tenant name (e.g., qshe-external): 
set /p B2C_CLIENT_ID=Enter your B2C app registration Client ID: 

echo.
echo Creating B2C configuration file...
echo # Azure AD B2C Configuration for External Workers > azure-setup\b2c-config.txt
echo VITE_AZURE_B2C_TENANT_NAME=%B2C_TENANT_NAME% >> azure-setup\b2c-config.txt
echo VITE_AZURE_B2C_CLIENT_ID=%B2C_CLIENT_ID% >> azure-setup\b2c-config.txt
echo VITE_AZURE_B2C_POLICY_SIGNUP_SIGNIN=B2C_1_external_signin >> azure-setup\b2c-config.txt
echo VITE_AZURE_B2C_POLICY_EDIT_PROFILE=B2C_1_external_edit_profile >> azure-setup\b2c-config.txt
echo VITE_AZURE_B2C_REDIRECT_URI=http://localhost:5173/auth/external/callback >> azure-setup\b2c-config.txt

echo.
echo ========================================
echo Azure AD B2C Setup Completed!
echo ========================================
echo.
echo Configuration saved to: azure-setup\b2c-config.txt
echo.
echo Next step: Run 05-azure-database-setup.cmd
echo.
pause