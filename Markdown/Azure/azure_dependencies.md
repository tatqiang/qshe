# 📦 Azure Migration Dependencies

This file lists the dependencies needed for Azure migration.

## Required Azure Packages

```bash
# Microsoft Authentication Library (MSAL)
npm install @azure/msal-browser @azure/msal-react

# Microsoft Graph Client
npm install @microsoft/microsoft-graph-client

# Azure Storage (Blob)
npm install @azure/storage-blob

# Azure Database (PostgreSQL)
npm install pg @types/pg

# Azure Key Vault (for secrets)
npm install @azure/keyvault-secrets @azure/identity

# Optional: Azure App Configuration
npm install @azure/app-configuration
```

## Installation Command

```bash
npm install @azure/msal-browser @azure/msal-react @microsoft/microsoft-graph-client @azure/storage-blob pg @types/pg @azure/keyvault-secrets @azure/identity
```

## Development Dependencies

```bash
npm install --save-dev @types/node
```

## Environment Variables Template

Create `.env.azure` file:

```bash
# Azure Authentication (Microsoft Entra ID)
VITE_AZURE_CLIENT_ID=your-app-registration-client-id
VITE_AZURE_TENANT_ID=your-company-tenant-id
VITE_AZURE_REDIRECT_URI=http://localhost:5173/auth/callback

# Azure Database for PostgreSQL
VITE_AZURE_DB_HOST=your-postgres.postgres.database.azure.com
VITE_AZURE_DB_PORT=5432
VITE_AZURE_DB_NAME=qshe
VITE_AZURE_DB_USER=qshe_admin
VITE_AZURE_DB_PASSWORD=your-secure-password
VITE_AZURE_DB_SSL=true

# Azure Blob Storage
VITE_AZURE_STORAGE_ACCOUNT=qsheprototype
VITE_AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=qsheprototype;AccountKey=your-account-key;EndpointSuffix=core.windows.net
VITE_AZURE_CONTAINER_NAME=qshe-photos

# Optional: Azure Key Vault
VITE_AZURE_KEY_VAULT_URL=https://your-keyvault.vault.azure.net/
```

## Package.json Updates

The following scripts should be added to `package.json`:

```json
{
  "scripts": {
    "dev:azure": "vite --mode azure",
    "build:azure": "tsc -b && vite build --mode azure",
    "migrate:azure": "node scripts/migrate-to-azure.js"
  }
}
```

## Notes

- These packages are not installed by default to avoid errors
- Install them when ready to start Azure migration
- Use the prototype implementation files as templates
- Update environment variables for your Azure setup