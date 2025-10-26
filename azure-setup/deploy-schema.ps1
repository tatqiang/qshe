# Azure SQL Database Schema Deployment Script
# Uses Azure CLI with Azure AD authentication

Write-Host "Deploying Azure SQL Database Schema..." -ForegroundColor Green

$serverName = "qshe"
$databaseName = "jectqshe"
$resourceGroup = "qc-safety"

# Test connection first
Write-Host "Testing connection to Azure SQL Database..." -ForegroundColor Yellow

try {
    # Simple test query using Azure CLI
    $result = az sql db show --resource-group $resourceGroup --server $serverName --name $databaseName --query "status" --output tsv
    
    if ($result -eq "Online") {
        Write-Host "✅ Database is online and accessible" -ForegroundColor Green
    } else {
        Write-Host "❌ Database status: $result" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Failed to connect to database: $_" -ForegroundColor Red
    exit 1
}

# Read schema file
$schemaFile = "database\azure_sql_schema.sql"
if (!(Test-Path $schemaFile)) {
    Write-Host "❌ Schema file not found: $schemaFile" -ForegroundColor Red
    exit 1
}

Write-Host "Reading schema file: $schemaFile" -ForegroundColor Yellow
$sqlContent = Get-Content $schemaFile -Raw

# Split SQL content into individual statements (simple approach)
$statements = $sqlContent -split "\nGO\n"
$statements = $statements | Where-Object { $_.Trim() -ne "" }

Write-Host "Found $($statements.Count) SQL statements to execute" -ForegroundColor Yellow

# Execute each statement
$successCount = 0
$errorCount = 0

foreach ($i in 0..($statements.Count - 1)) {
    $statement = $statements[$i].Trim()
    if ($statement -eq "" -or $statement -eq "GO") { continue }
    
    Write-Host "Executing statement $($i + 1)/$($statements.Count)..." -ForegroundColor Yellow
    
    # Save statement to temp file
    $tempFile = "temp_sql_$i.sql"
    $statement | Out-File -FilePath $tempFile -Encoding UTF8
    
    try {
        # Use Azure CLI to execute SQL
        $result = az sql db query --server $serverName --database $databaseName --resource-group $resourceGroup --auth-type ADIntegrated --file $tempFile 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Statement $($i + 1) executed successfully" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "❌ Statement $($i + 1) failed: $result" -ForegroundColor Red
            $errorCount++
        }
    } catch {
        Write-Host "❌ Statement $($i + 1) error: $_" -ForegroundColor Red
        $errorCount++
    } finally {
        # Clean up temp file
        if (Test-Path $tempFile) {
            Remove-Item $tempFile -Force
        }
    }
}

Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "Schema Deployment Complete!" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "✅ Successful statements: $successCount" -ForegroundColor Green
Write-Host "❌ Failed statements: $errorCount" -ForegroundColor Red

if ($errorCount -eq 0) {
    Write-Host "`n🎉 Database schema deployed successfully!" -ForegroundColor Green
    Write-Host "Your Azure SQL Database is ready for the QSHE PWA!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Some statements failed. Please check the errors above." -ForegroundColor Yellow
}

Write-Host "`nConnection Details:" -ForegroundColor Cyan
Write-Host "Server: $serverName.database.windows.net" -ForegroundColor White
Write-Host "Database: $databaseName" -ForegroundColor White
Write-Host "Authentication: Azure AD Integrated" -ForegroundColor White