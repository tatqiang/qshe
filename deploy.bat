@echo off
REM QSHE Quick Deploy Script for Windows
REM This script helps deploy your QSHE app quickly

echo 🚀 QSHE App Quick Deploy Script
echo =================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the project root directory
    pause
    exit /b 1
)

REM Check if build works
echo 📦 Testing build...
call npm run build

if %errorlevel% neq 0 (
    echo ❌ Build failed! Please fix errors before deploying.
    pause
    exit /b 1
)

echo ✅ Build successful!

REM Preview locally first
echo 🔍 Starting local preview...
echo 👀 Check http://localhost:4173 to test before deploying
echo Press any key when ready to continue to deployment...

start /b npm run preview
pause

REM Ask for deployment platform
echo 🎯 Choose deployment platform:
echo 1) Vercel (Recommended)
echo 2) Netlify
echo 3) Manual build only

set /p CHOICE="Enter choice (1-3): "

if "%CHOICE%"=="1" (
    echo 🚀 Deploying to Vercel...
    
    REM Check if Vercel CLI is installed
    where vercel >nul 2>nul
    if %errorlevel% neq 0 (
        echo 📥 Installing Vercel CLI...
        call npm install -g vercel
    )
    
    echo 🎯 Deploying with Vercel...
    call vercel --prod
    
) else if "%CHOICE%"=="2" (
    echo 🚀 Deploying to Netlify...
    
    REM Check if Netlify CLI is installed
    where netlify >nul 2>nul
    if %errorlevel% neq 0 (
        echo 📥 Installing Netlify CLI...
        call npm install -g netlify-cli
    )
    
    echo 🎯 Deploying with Netlify...
    call netlify deploy --prod --dir=dist
    
) else if "%CHOICE%"=="3" (
    echo 📦 Build completed! You can find the files in the 'dist' folder.
    echo 📤 Upload the 'dist' folder contents to your hosting provider.
    
) else (
    echo ❌ Invalid choice. Exiting.
    pause
    exit /b 1
)

echo 🎉 Deployment process completed!
echo 🔗 Your QSHE app should now be live!
echo.
echo 📋 Post-deployment checklist:
echo   ✅ Test user registration
echo   ✅ Test face recognition  
echo   ✅ Test PWA installation
echo   ✅ Test QR code generation
echo   ✅ Test on mobile devices
echo.
echo 🐛 If you encounter issues, check the DEPLOYMENT_GUIDE.md

pause
