@echo off
echo ========================================
echo QSHE PWA - Azure PostgreSQL Database Setup
echo Free Tier (B1ms - 1 vCore, 2 GiB RAM)
echo ========================================
echo.

echo This will create an Azure Database for PostgreSQL Flexible Server
echo in the free tier for the QSHE prototype.
echo.
echo Press any key to continue or Ctrl+C to abort
pause

echo.
echo 1. Creating Azure Database for PostgreSQL Flexible Server...

REM Generate a random password
for /f %%i in ('powershell -Command "([char[]]([char]33..[char]126) + ([char[]]([char]48..[char]57)) + ([char[]]([char]65..[char]90)) + ([char[]]([char]97..[char]122)) | Get-Random -Count 16) -join ''"') do set DB_PASSWORD=%%i

echo Generated secure password: %DB_PASSWORD%

REM Create the PostgreSQL server
az postgres flexible-server create ^
    --resource-group qshe-prototype-rg ^
    --name qshe-prototype-db ^
    --location "Southeast Asia" ^
    --admin-user qshe_admin ^
    --admin-password %DB_PASSWORD% ^
    --sku-name Standard_B1ms ^
    --tier Burstable ^
    --storage-size 32 ^
    --version 14 ^
    --public-access 0.0.0.0-255.255.255.255

echo.
echo 2. Creating QSHE database...
az postgres flexible-server db create ^
    --resource-group qshe-prototype-rg ^
    --server-name qshe-prototype-db ^
    --database-name qshe_management

echo.
echo 3. Configuring firewall rules...
REM Allow Azure services
az postgres flexible-server firewall-rule create ^
    --resource-group qshe-prototype-rg ^
    --name qshe-prototype-db ^
    --rule-name AllowAzureServices ^
    --start-ip-address 0.0.0.0 ^
    --end-ip-address 0.0.0.0

REM Allow all IPs for prototype (restrict in production)
az postgres flexible-server firewall-rule create ^
    --resource-group qshe-prototype-rg ^
    --name qshe-prototype-db ^
    --rule-name AllowAllIPs ^
    --start-ip-address 0.0.0.0 ^
    --end-ip-address 255.255.255.255

echo.
echo 4. Getting connection information...
for /f "tokens=*" %%i in ('az postgres flexible-server show --resource-group qshe-prototype-rg --name qshe-prototype-db --query "fullyQualifiedDomainName" --output tsv') do set DB_HOST=%%i

echo.
echo ========================================
echo PostgreSQL Database Created!
echo ========================================
echo.
echo Database Configuration:
echo.
echo VITE_AZURE_DB_HOST=%DB_HOST%
echo VITE_AZURE_DB_NAME=qshe_management
echo VITE_AZURE_DB_USER=qshe_admin
echo VITE_AZURE_DB_PASSWORD=%DB_PASSWORD%
echo VITE_AZURE_DB_SSL_MODE=require
echo.

echo.
echo Creating database configuration file...
echo # Azure PostgreSQL Configuration > azure-setup\database-config.txt
echo VITE_AZURE_DB_HOST=%DB_HOST% >> azure-setup\database-config.txt
echo VITE_AZURE_DB_NAME=qshe_management >> azure-setup\database-config.txt
echo VITE_AZURE_DB_USER=qshe_admin >> azure-setup\database-config.txt
echo VITE_AZURE_DB_PASSWORD=%DB_PASSWORD% >> azure-setup\database-config.txt
echo VITE_AZURE_DB_SSL_MODE=require >> azure-setup\database-config.txt

echo.
echo IMPORTANT: Save the password securely!
echo Database password: %DB_PASSWORD%
echo.
echo Next step: Run 06-azure-storage-setup.cmd
echo.
pause