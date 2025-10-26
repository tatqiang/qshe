@echo off
echo ========================================
echo Fix Azure AD App Registration Redirect URI
echo ========================================
echo.

echo The error AADSTS500113 means the redirect URI is not configured.
echo We need to add http://localhost:5175 to the app registration.
echo.

echo STEP 1: Update Company App Registration
echo ========================================
echo.
echo 1. Go to: https://portal.azure.com
echo 2. Search for "App registrations"
echo 3. Find your app: "QSHE Company Authentication" (ID: 618098ec-e3e8-4d7b-a718-c10c23e82407)
echo 4. Click on the app name
echo 5. In the left menu, click "Authentication"
echo 6. Under "Platform configurations", click "Add a platform"
echo 7. Select "Single-page application (SPA)"
echo 8. Add redirect URI: http://localhost:5175
echo 9. Click "Configure"
echo 10. Click "Save"
echo.
echo Press any key when you have added the redirect URI...
pause

echo.
echo STEP 2: Verify Configuration
echo ========================================
echo.
echo After adding the redirect URI, your app should show:
echo - Platform: Single-page application
echo - Redirect URIs: http://localhost:5175
echo.
echo The authentication error should now be resolved.
echo.
echo Press any key to continue...
pause

echo.
echo ✅ Configuration complete!
echo.
echo You can now test the company login again at:
echo http://localhost:5175/users
echo.
echo Click "Login with Company Account" to test.
echo.
pause