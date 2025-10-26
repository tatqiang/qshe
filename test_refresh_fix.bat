@echo off
echo ========================================
echo   QSHE - Infinite Refresh Debug Testing
echo ========================================
echo.
echo This script will:
echo 1. Start the development server
echo 2. Show console instructions
echo.
echo Press any key to start the dev server...
pause >nul

echo.
echo Starting development server...
echo.
npm run dev

echo.
echo ========================================
echo   Server stopped
echo ========================================
pause
