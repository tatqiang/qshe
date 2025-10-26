@echo off
REM ================================
REM Azure SQL Database Setup Script
REM ================================

echo Starting Azure SQL Database setup...

REM Set variables
set RESOURCE_GROUP_NAME=qshe-prototype-rg
set SERVER_NAME=qshe-prototype-server
set DATABASE_NAME=qshe_management
set LOCATION=southeastasia
set ADMIN_LOGIN=qsheadmin
set TIER=Basic
set COMPUTE_MODEL=Provisioned

echo Creating Azure SQL Database server: %SERVER_NAME%...

REM Create Azure SQL Server
az sql server create ^
    --name %SERVER_NAME% ^
    --resource-group %RESOURCE_GROUP_NAME% ^
    --location %LOCATION% ^
    --admin-user %ADMIN_LOGIN% ^
    --admin-password "%SQL_ADMIN_PASSWORD%"

if %errorlevel% neq 0 (
    echo Error: Failed to create SQL Server
    exit /b 1
)

echo Configuring firewall rules...

REM Add firewall rule for Azure services
az sql server firewall-rule create ^
    --resource-group %RESOURCE_GROUP_NAME% ^
    --server %SERVER_NAME% ^
    --name AllowAzureServices ^
    --start-ip-address 0.0.0.0 ^
    --end-ip-address 0.0.0.0

REM Add firewall rule for current client IP
for /f "tokens=2 delims=: " %%i in ('curl -s https://ipinfo.io/ip') do set CLIENT_IP=%%i
az sql server firewall-rule create ^
    --resource-group %RESOURCE_GROUP_NAME% ^
    --server %SERVER_NAME% ^
    --name AllowClientIP ^
    --start-ip-address %CLIENT_IP% ^
    --end-ip-address %CLIENT_IP%

echo Creating database: %DATABASE_NAME%...

REM Create database with Basic tier (free tier eligible)
az sql db create ^
    --resource-group %RESOURCE_GROUP_NAME% ^
    --server %SERVER_NAME% ^
    --name %DATABASE_NAME% ^
    --service-objective Basic ^
    --compute-model %COMPUTE_MODEL%

if %errorlevel% neq 0 (
    echo Error: Failed to create database
    exit /b 1
)

echo Getting connection string...

REM Get connection string for the database
for /f "tokens=*" %%i in ('az sql db show-connection-string --server %SERVER_NAME% --name %DATABASE_NAME% --client sqlcmd --output tsv') do set CONNECTION_STRING=%%i

REM Replace placeholder with actual admin username
set CONNECTION_STRING=%CONNECTION_STRING:<username>=%ADMIN_LOGIN%

echo.
echo ======================================
echo Azure SQL Database Setup Complete!
echo ======================================
echo Server: %SERVER_NAME%.database.windows.net
echo Database: %DATABASE_NAME%
echo Admin Login: %ADMIN_LOGIN%
echo Connection String: %CONNECTION_STRING%
echo.
echo IMPORTANT: Save your admin password securely!
echo Add these to your .env file:
echo VITE_AZURE_SQL_SERVER=%SERVER_NAME%.database.windows.net
echo VITE_AZURE_DATABASE=%DATABASE_NAME%
echo VITE_AZURE_DB_USER=%ADMIN_LOGIN%
echo VITE_AZURE_DB_PASSWORD=[your-password]
echo VITE_AZURE_DB_ENCRYPT=true
echo VITE_AZURE_DB_TRUST_SERVER_CERTIFICATE=false
echo.

REM Test connection
echo Testing database connection...
sqlcmd -S %SERVER_NAME%.database.windows.net -d %DATABASE_NAME% -U %ADMIN_LOGIN% -P "%SQL_ADMIN_PASSWORD%" -Q "SELECT @@VERSION" -l 30

if %errorlevel% eq 0 (
    echo Connection test successful!
) else (
    echo Warning: Connection test failed. Please verify credentials and firewall rules.
)

echo Database setup completed successfully!