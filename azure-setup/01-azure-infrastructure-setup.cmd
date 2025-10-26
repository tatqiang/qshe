@echo off
echo ========================================
echo QSHE PWA - Azure Infrastructure Setup
echo Phase 1: Free Azure Prototype
echo ========================================
echo.

echo 1. Installing Azure CLI...
echo This will install Azure CLI using winget
echo Press any key to continue or Ctrl+C to abort
pause

winget install Microsoft.AzureCLI

echo.
echo 2. Azure CLI installed. Please close this terminal and open a new one.
echo Then run: 02-azure-login-and-resources.cmd
echo.
pause