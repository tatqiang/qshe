@echo off
echo ========================================
echo Fix Azure AD Redirect URI - Port 5176
echo ========================================
echo.

echo The development server is now running on port 5176.
echo You need to update the redirect URI in Azure portal.
echo.

echo STEP 1: Update Azure Portal Configuration
echo ========================================
echo.
echo 1. Go to: https://portal.azure.com
echo 2. Search for "App registrations"
echo 3. Find your app with ID: 618098ec-e3e8-4d7b-a718-c10c23e82407
echo 4. Click on the app name
echo 5. In the left menu, click "Authentication"
echo 6. Find the existing redirect URI: http://localhost:5175
echo 7. Change it to: http://localhost:5176
echo 8. Click "Save"
echo.
echo Press any key when you have updated the redirect URI...
pause

echo.
echo STEP 2: Clear Browser Cache (Important!)
echo ========================================
echo.
echo 1. Clear your browser cache or use incognito mode
echo 2. This ensures the old redirect URI is not cached
echo.

echo.
echo STEP 3: Test the User Assignment Demo
echo ========================================
echo.
echo 1. Go to: http://localhost:5176/user-assignment-demo
echo 2. Login with your company account
echo 3. You should stay on port 5176 after login
echo.
echo ✅ After successful login, the user assignment demo will be available!
echo.
pause