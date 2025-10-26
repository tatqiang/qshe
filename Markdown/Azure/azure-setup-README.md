# QSHE PWA - Azure Setup Scripts

This folder contains all the scripts needed to set up the QSHE PWA on Azure with multi-company architecture and dual authentication.

## Quick Start

Run the master setup script to execute all steps:
```cmd
00-master-setup.cmd
```

## Individual Setup Scripts

If you prefer to run steps individually or need to retry specific steps:

| Script | Purpose |
|--------|---------|
| `01-azure-infrastructure-setup.cmd` | Install Azure CLI |
| `02-azure-login-and-resources.cmd` | Login to Azure and create resource group |
| `03-azure-entra-id-setup.cmd` | Setup Entra ID for company staff |
| `04-azure-b2c-setup.cmd` | Setup Azure AD B2C for external workers |
| `05-azure-database-setup.cmd` | Create PostgreSQL database (free tier) |
| `06-azure-storage-setup.cmd` | Setup Blob Storage for documents/photos |
| `07-deploy-database-schema.cmd` | Deploy multi-company database schema |
| `08-azure-static-web-apps-setup.cmd` | Setup Static Web Apps hosting |
| `09-create-environment-config.cmd` | Create environment configuration files |

## Post-Setup

After running the setup scripts:

1. **Install Azure packages:**
   ```cmd
   azure-setup\install-azure-packages.cmd
   ```

2. **Review configuration:**
   - Check `.env.local` for development settings
   - Update any missing values
   - Keep passwords/connection strings secure

3. **Update authentication:**
   - Modify frontend components to use Azure MSAL
   - Implement dual authentication (Entra ID + B2C)
   - Test company context switching

## Configuration Files Generated

- `.env.local` - Development environment variables
- `.env.production.template` - Production configuration template
- `azure-setup/entra-id-config.txt` - Entra ID app registration details
- `azure-setup/b2c-config.txt` - Azure AD B2C configuration
- `azure-setup/database-config.txt` - PostgreSQL connection details
- `azure-setup/storage-config.txt` - Blob Storage configuration
- `azure-setup/SETUP_SUMMARY.md` - Complete setup summary

## Architecture Changes

This setup implements:
- **Multi-company support**: Users can belong to multiple companies
- **Dual authentication**: Entra ID (company staff) + B2C (external workers)
- **Face recognition removal**: Simplified verification using documents
- **Enhanced RBAC**: Company-specific roles and permissions
- **Azure-native services**: PostgreSQL, Blob Storage, Static Web Apps

## Free Tier Resources

All services are configured for Azure free tier:
- **PostgreSQL**: B1ms (1 vCore, 2 GiB RAM, 32 GiB storage)
- **Blob Storage**: 5 GiB storage, 20,000 transactions
- **Static Web Apps**: Free hosting with CI/CD
- **Entra ID**: Free for first 50,000 users
- **B2C**: Free for first 50,000 users

## Support

For issues or questions:
1. Check `SETUP_SUMMARY.md` for troubleshooting
2. Review the main migration plan: `../docs/azure_migration_plan.md`
3. Consult the architecture documentation: `../docs/multi_company_architecture.md`

## Security Notes

- Database passwords are auto-generated and saved to config files
- Keep all configuration files secure and don't commit them to version control
- Review Azure security settings before going to production
- Enable MFA for all Azure accounts