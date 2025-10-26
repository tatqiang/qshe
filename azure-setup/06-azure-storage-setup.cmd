@echo off
echo ========================================
echo QSHE PWA - Azure Blob Storage Setup
echo Replacing Cloudflare R2 with Azure Storage
echo ========================================
echo.

echo This will create an Azure Storage Account with containers
echo for documents and patrol photos (no face images needed).
echo.
echo Press any key to continue or Ctrl+C to abort
pause

echo.
echo 1. Creating Azure Storage Account...

REM Create storage account with unique name
for /f %%i in ('powershell -Command "Get-Random"') do set RANDOM_SUFFIX=%%i
set STORAGE_NAME=qsheprototype%RANDOM_SUFFIX%

az storage account create ^
    --name %STORAGE_NAME% ^
    --resource-group qshe-prototype-rg ^
    --location "Southeast Asia" ^
    --sku Standard_LRS ^
    --kind StorageV2 ^
    --access-tier Hot

echo.
echo 2. Getting storage account key...
for /f "tokens=*" %%i in ('az storage account keys list --resource-group qshe-prototype-rg --account-name %STORAGE_NAME% --query "[0].value" --output tsv') do set STORAGE_KEY=%%i

echo.
echo 3. Creating blob containers...

REM Create container for documents (passport, work permits, etc.)
az storage container create ^
    --name qshe-documents ^
    --account-name %STORAGE_NAME% ^
    --account-key %STORAGE_KEY% ^
    --public-access off

REM Create container for patrol photos
az storage container create ^
    --name qshe-patrol-photos ^
    --account-name %STORAGE_NAME% ^
    --account-key %STORAGE_KEY% ^
    --public-access off

REM Create container for company assets
az storage container create ^
    --name qshe-company-assets ^
    --account-name %STORAGE_NAME% ^
    --account-key %STORAGE_KEY% ^
    --public-access off

echo.
echo 4. Configuring CORS for web access...
az storage cors add ^
    --services b ^
    --methods GET POST PUT DELETE ^
    --origins "*" ^
    --allowed-headers "*" ^
    --exposed-headers "*" ^
    --max-age 3600 ^
    --account-name %STORAGE_NAME% ^
    --account-key %STORAGE_KEY%

echo.
echo 5. Getting connection string...
for /f "tokens=*" %%i in ('az storage account show-connection-string --resource-group qshe-prototype-rg --name %STORAGE_NAME% --output tsv') do set CONNECTION_STRING=%%i

echo.
echo ========================================
echo Azure Blob Storage Created!
echo ========================================
echo.
echo Storage Configuration:
echo.
echo VITE_AZURE_STORAGE_ACCOUNT=%STORAGE_NAME%
echo VITE_AZURE_CONTAINER_DOCUMENTS=qshe-documents
echo VITE_AZURE_CONTAINER_PATROL_PHOTOS=qshe-patrol-photos
echo VITE_AZURE_CONTAINER_COMPANY_ASSETS=qshe-company-assets
echo.
echo Connection String (keep secure):
echo VITE_AZURE_STORAGE_CONNECTION_STRING=%CONNECTION_STRING%
echo.

echo.
echo Creating storage configuration file...
echo # Azure Blob Storage Configuration > azure-setup\storage-config.txt
echo VITE_AZURE_STORAGE_ACCOUNT=%STORAGE_NAME% >> azure-setup\storage-config.txt
echo VITE_AZURE_CONTAINER_DOCUMENTS=qshe-documents >> azure-setup\storage-config.txt
echo VITE_AZURE_CONTAINER_PATROL_PHOTOS=qshe-patrol-photos >> azure-setup\storage-config.txt
echo VITE_AZURE_CONTAINER_COMPANY_ASSETS=qshe-company-assets >> azure-setup\storage-config.txt
echo VITE_AZURE_STORAGE_CONNECTION_STRING=%CONNECTION_STRING% >> azure-setup\storage-config.txt

echo.
echo Containers created:
echo - qshe-documents: For passport, work permit, ID documents
echo - qshe-patrol-photos: For safety patrol photos
echo - qshe-company-assets: For company logos and documents
echo.
echo Note: Face image storage is no longer needed in the new architecture
echo.
echo Next step: Run 07-deploy-database-schema.cmd
echo.
pause