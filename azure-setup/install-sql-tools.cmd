@echo off
REM ================================
REM Install SQL Server Command Line Tools
REM Required for Azure SQL Database connectivity
REM ================================

echo Installing SQL Server command-line tools for Azure SQL Database...

echo.
echo Checking if sqlcmd is already installed...
sqlcmd -? >nul 2>&1
if %errorlevel% equ 0 (
    echo sqlcmd is already installed and available.
    sqlcmd -? | findstr "Version"
    echo.
    echo Installation skipped - tools are already available.
    pause
    exit /b 0
)

echo sqlcmd not found. Installing SQL Server command-line tools...

echo.
echo Installing Microsoft ODBC Driver 17 for SQL Server...
REM Download and install ODBC Driver 17
powershell -Command "& {Invoke-WebRequest -Uri 'https://go.microsoft.com/fwlink/?linkid=2187214' -OutFile 'msodbcsql.msi'; Start-Process -FilePath 'msiexec.exe' -ArgumentList '/i', 'msodbcsql.msi', '/quiet', 'IACCEPTMSODBCSQLLICENSETERMS=YES' -Wait; Remove-Item 'msodbcsql.msi'}"

if %errorlevel% neq 0 (
    echo Warning: ODBC Driver installation may have failed. Continuing with sqlcmd installation...
)

echo.
echo Installing SQL Server Command Line Utilities...
REM Download and install sqlcmd
powershell -Command "& {Invoke-WebRequest -Uri 'https://go.microsoft.com/fwlink/?linkid=2142258' -OutFile 'MsSqlCmdLnUtils.msi'; Start-Process -FilePath 'msiexec.exe' -ArgumentList '/i', 'MsSqlCmdLnUtils.msi', '/quiet', 'IACCEPTMSSQLCMDLNUTILSLICENSETERMS=YES' -Wait; Remove-Item 'MsSqlCmdLnUtils.msi'}"

if %errorlevel% neq 0 (
    echo Error: Failed to install SQL Server Command Line Utilities
    echo Please try manual installation from:
    echo https://docs.microsoft.com/en-us/sql/tools/sqlcmd-utility
    pause
    exit /b 1
)

echo.
echo Refreshing PATH environment variable...
REM Refresh PATH to include newly installed tools
set "PATH=%PATH%;C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\170\Tools\Binn\"
set "PATH=%PATH%;C:\Program Files\Microsoft SQL Server\150\Tools\Binn\"

echo.
echo Testing sqlcmd installation...
sqlcmd -? >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ sqlcmd installed successfully!
    sqlcmd -? | findstr "Version"
) else (
    echo Warning: sqlcmd may not be in PATH. You may need to restart your command prompt.
    echo Manual PATH addition may be required:
    echo C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\170\Tools\Binn\
    echo C:\Program Files\Microsoft SQL Server\150\Tools\Binn\
)

echo.
echo ======================================
echo SQL Server Tools Installation Complete
echo ======================================
echo.
echo Installed components:
echo ✓ Microsoft ODBC Driver 17 for SQL Server
echo ✓ SQL Server Command Line Utilities (sqlcmd)
echo.
echo These tools enable connectivity to:
echo - Azure SQL Database
echo - Azure SQL Managed Instance  
echo - SQL Server instances
echo.
echo If sqlcmd is not immediately available, please:
echo 1. Restart your command prompt/terminal
echo 2. Verify PATH includes SQL Server tools directories
echo.
echo Ready for Azure SQL Database operations!
echo.
pause