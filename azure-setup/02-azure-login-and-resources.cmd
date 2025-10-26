@echo off
echo ========================================
echo QSHE PWA - Azure Login and Resource Setup
echo Phase 1: Free Azure Prototype
echo ========================================
echo.

echo 1. Logging into Azure...
az login

echo.
echo 2. Setting default subscription (if multiple)...
echo Please select your Azure subscription if prompted
az account list --output table
echo.
echo Enter your subscription ID (or press Enter to use default):
set /p SUBSCRIPTION_ID=
if not "%SUBSCRIPTION_ID%"=="" (
    az account set --subscription %SUBSCRIPTION_ID%
)

echo.
echo 3. Creating resource group for QSHE prototype...
az group create --name qshe-prototype-rg --location "Southeast Asia"

echo.
echo 4. Enabling required resource providers...
az provider register --namespace Microsoft.Web
az provider register --namespace Microsoft.Storage
az provider register --namespace Microsoft.DBforPostgreSQL
az provider register --namespace Microsoft.AzureActiveDirectory

echo.
echo ========================================
echo Azure infrastructure setup completed!
echo ========================================
echo.
echo Next steps:
echo 1. Run: 03-azure-entra-id-setup.cmd
echo 2. Then: 04-azure-b2c-setup.cmd
echo.
pause