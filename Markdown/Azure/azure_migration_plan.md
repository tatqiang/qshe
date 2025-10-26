# 🌐 QSHE PWA - Azure Migration Plan (Multi-Company Architecture)

## 📋 Overview
Migration from Supabase + Cloudflare R2 to Azure ecosystem with dual authentication: Microsoft Entra ID for company staff and Azure AD B2C for external workers, supporting many-to-many company relationships.

## 🎯 Goals
1. **Dual Authentication**: Company SSO (@th.jec.com) + External worker B2C (contractors, consultants, temporary workers)
2. **Multi-Company Support**: External workers can affiliate with multiple companies with different roles
3. **No Biometric Dependencies**: Simplified onboarding without face recognition requirements
4. **Enhanced RBAC**: Company-specific roles with granular permissions (25+ permission types)
5. **Security Compliance**: Meet SECL security requirements for multi-company architecture
6. **Free Prototype**: Test on Azure free tier first
7. **Production Ready**: Scalable solution for enterprise deployment

## 🔄 Phase 1: Free Azure Prototype

### 1.1 Azure Services Setup
```bash
# Azure CLI installation and login
winget install Microsoft.AzureCLI
az login

# Create resource group
az group create --name qshe-prototype-rg --location "Southeast Asia"
```

### 1.2 Dual Authentication System

#### 1.2A Microsoft Entra ID (Company Staff)
**Service**: Azure Entra ID Enterprise
**Users**: Internal company employees with @th.jec.com accounts
**Configuration**:
- App Registration for QSHE PWA (Company)
- Redirect URIs: `http://localhost:5173/auth/company/callback`, `https://your-app.azurestaticapps.net/auth/company/callback`
- API Permissions: User.Read, profile, email, Group.Read.All
- Company domain integration: `@th.jec.com`
- SSO with existing company infrastructure

#### 1.2B Microsoft Entra External ID (External Workers)
**Service**: Microsoft Entra External ID (replaces Azure AD B2C)
**Users**: Contractors, consultants, temporary workers, visitors
**Note**: Azure AD B2C is no longer available for new customers as of May 2025
**Features**: 
- Multi-company user registration
- Custom user attributes (worker_type, verification_status, company_affiliations)
- Company invitation workflows
- Document-based verification (no biometrics)
- Modern user experience and simplified management

**External ID Custom Attributes**:
```json
{
  "extension_worker_type": "contractor|consultant|temporary|visitor",
  "extension_verification_status": "unverified|pending|verified|rejected", 
  "extension_company_affiliations": ["company_id_1", "company_id_2"],
  "extension_primary_company_id": "uuid",
  "extension_nationality": "string",
  "extension_passport_number": "string",
  "extension_work_permit_number": "string"
}
```

**Implementation**:
```typescript
// Install Azure MSAL for both flows
npm install @azure/msal-browser @azure/msal-react

// Dual authentication configuration
const companyMsalConfig = {
  auth: {
    clientId: process.env.VITE_AZURE_COMPANY_CLIENT_ID,
    authority: "https://login.microsoftonline.com/your-tenant-id",
    redirectUri: window.location.origin + "/auth/company/callback"
  }
};

const externalIdMsalConfig = {
  auth: {
    clientId: process.env.VITE_AZURE_EXTERNAL_CLIENT_ID,
    authority: "https://login.microsoftonline.com/qshe.onmicrosoft.com",
    redirectUri: window.location.origin + "/auth/external/callback"
  }
};

// Authentication router
const determineAuthFlow = (userType: 'company' | 'external') => {
  return userType === 'company' ? companyMsalConfig : externalIdMsalConfig;
};
```

### 1.3 Azure SQL Database
**Service**: Azure SQL Database (Basic Tier)
**Free Tier**: 100,000 vCore seconds/month + 32GB data + 32GB backup storage

**Migration Steps**:
```sql
-- Export from Supabase (PostgreSQL format)
pg_dump -h your-supabase-host -U postgres -d postgres > qshe_backup.sql

-- Convert and import to Azure SQL Database using Azure Data Migration Service
-- Or use manual T-SQL conversion + SSMS import
sqlcmd -S your-azure-sql-server.database.windows.net -d qshe_management -U qshe_admin -P your-password -i qshe_schema.sql
```

### 1.4 Azure Blob Storage
**Service**: Azure Storage Account (Standard LRS)
**Free Tier**: 5 GiB storage, 20,000 transactions

**Implementation**:
```typescript
// Replace R2 client with Azure Blob
npm install @azure/storage-blob

import { BlobServiceClient } from '@azure/storage-blob';

const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  new DefaultAzureCredential()
);
```

### 1.5 Azure Static Web Apps
**Service**: Azure Static Web Apps (Free tier)
**Features**: 
- Automatic CI/CD from GitHub
- Built-in authentication integration
- Free SSL certificates
- Global CDN

## 🔐 Phase 2: Security & Compliance (Microsoft Entra-Only Authentication)

### 2.1 Unified Microsoft Entra ID Security Features
- **Multi-Factor Authentication (MFA)**: Enforced for all users (company + external)
- **Conditional Access**: Location, device, and risk-based access policies
- **Risk-based Authentication**: Real-time adaptive authentication
- **Privileged Identity Management (PIM)**: Time-limited database admin access
- **Identity Protection**: ML-powered risk detection and remediation
- **Audit Logs**: Comprehensive activity tracking across all authentication flows

### 2.2 Database Security with Entra-Only Authentication
- **Azure AD Integrated Authentication**: No SQL passwords to manage
- **Row-Level Security**: Company-specific data isolation
- **Dynamic Data Masking**: Automatic PII protection
- **Advanced Threat Protection**: Real-time security monitoring
- **Encryption**: TLS 1.3 in transit, AES-256 at rest (automatic)
- **Backup**: Automated database backups (7-35 days retention)

### 2.3 Enhanced SECL Security Requirements Compliance
| Requirement | Microsoft Entra-Only Solution | ✅ Compliance Level |
|---|---|---|
| User Authentication | Entra ID + MFA + Conditional Access | ✅ **Enterprise Grade** |
| Database Access Control | Azure AD Integrated Auth + RBAC | ✅ **Zero Trust Model** |
| Data Encryption | TLS 1.3 + AES-256 (automatic) | ✅ **Military Standard** |
| Access Control | Conditional Access + Company Roles | ✅ **Granular Control** |
| Audit Logging | Azure Monitor + Entra ID Logs | ✅ **Complete Tracking** |
| Backup & Recovery | Azure SQL Backup + Point-in-time | ✅ **Enterprise SLA** |
| Multi-Company Isolation | Row-Level Security + Company Context | ✅ **Data Sovereignty** |
| External Worker Security | Entra External ID + Document Verification | ✅ **Modern B2C Alternative** |

### 2.4 Advanced Security Benefits
- **Passwordless Authentication**: Windows Hello, FIDO2 support
- **Zero Trust Architecture**: Never trust, always verify
- **Compliance Certifications**: SOC 2, ISO 27001, GDPR, HIPAA ready
- **Global Data Residency**: Southeast Asia region compliance
- **Advanced Threat Analytics**: AI-powered security insights

## 💾 Phase 3: Multi-Company Database Migration Strategy

### 3.1 Enhanced Schema Migration with Multi-Company Support (Azure SQL Database)
```sql
-- Azure SQL Database T-SQL Schema Migration
-- Remove Supabase-specific functions (not needed in SQL Server)

-- CRITICAL: Remove face recognition dependencies
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.users') AND name = 'face_descriptors')
BEGIN
    -- Create backup of face data if needed for reference
    SELECT id, face_descriptors, created_at, updated_at 
    INTO user_face_descriptors_backup
    FROM dbo.users 
    WHERE face_descriptors IS NOT NULL;
    
    -- Drop the face_descriptors column
    ALTER TABLE dbo.users DROP COLUMN face_descriptors;
END

-- Add multi-company support fields to users table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.users') AND name = 'primary_company_id')
BEGIN
    ALTER TABLE dbo.users ADD 
        primary_company_id UNIQUEIDENTIFIER NULL,
        worker_type NVARCHAR(50) NOT NULL DEFAULT 'internal' 
            CONSTRAINT CHK_worker_type CHECK (worker_type IN ('internal', 'contractor', 'consultant', 'temporary', 'visitor')),
        verification_status NVARCHAR(50) NOT NULL DEFAULT 'unverified' 
            CONSTRAINT CHK_verification_status CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
        external_worker_id NVARCHAR(255) NULL,
        nationality NVARCHAR(100) NULL,
        passport_number NVARCHAR(100) NULL,
        work_permit_number NVARCHAR(100) NULL;
END

-- Create user-company associations table (many-to-many)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_company_associations')
BEGIN
    CREATE TABLE dbo.user_company_associations (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        user_id UNIQUEIDENTIFIER NOT NULL,
        company_id UNIQUEIDENTIFIER NOT NULL,
        role_in_company NVARCHAR(100) NOT NULL DEFAULT 'member',
        company_role_id UNIQUEIDENTIFIER NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'active' 
            CONSTRAINT CHK_association_status CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
        approval_status NVARCHAR(50) DEFAULT 'pending' 
            CONSTRAINT CHK_approval_status CHECK (approval_status IN ('pending', 'approved', 'rejected')),
        start_date DATE DEFAULT GETDATE(),
        end_date DATE NULL,
        approved_by UNIQUEIDENTIFIER NULL,
        approved_at DATETIME2 NULL,
        notes NVARCHAR(MAX) NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        
        CONSTRAINT PK_user_company_associations PRIMARY KEY (id),
        CONSTRAINT FK_user_company_associations_user_id 
            FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
        CONSTRAINT FK_user_company_associations_company_id 
            FOREIGN KEY (company_id) REFERENCES dbo.companies(id) ON DELETE CASCADE
    );
END

-- Create company roles table for granular permissions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'company_roles')
BEGIN
    CREATE TABLE dbo.company_roles (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        company_id UNIQUEIDENTIFIER NOT NULL,
        role_name NVARCHAR(100) NOT NULL,
        role_description NVARCHAR(MAX) NULL,
        permissions NVARCHAR(MAX) NOT NULL DEFAULT '[]', -- JSON stored as NVARCHAR(MAX)
        is_system_role BIT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        
        CONSTRAINT PK_company_roles PRIMARY KEY (id),
        CONSTRAINT FK_company_roles_company_id 
            FOREIGN KEY (company_id) REFERENCES dbo.companies(id) ON DELETE CASCADE,
        CONSTRAINT UQ_company_role_name UNIQUE (company_id, role_name)
    );
END

-- Create permissions table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'permissions')
BEGIN
    CREATE TABLE dbo.permissions (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        permission_key NVARCHAR(100) NOT NULL UNIQUE,
        permission_name NVARCHAR(200) NOT NULL,
        description NVARCHAR(MAX) NULL,
        category NVARCHAR(50) NOT NULL DEFAULT 'general',
        is_sensitive BIT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETDATE(),
        
        CONSTRAINT PK_permissions PRIMARY KEY (id)
    );
END

-- Insert standard permissions
MERGE dbo.permissions AS target
USING (VALUES
    ('patrol.create', 'Create Patrols', 'Create new safety patrol reports', 'patrol', 0),
    ('patrol.edit', 'Edit Patrols', 'Edit existing patrol reports', 'patrol', 0),
    ('patrol.delete', 'Delete Patrols', 'Delete patrol reports', 'patrol', 1),
    ('patrol.view_all', 'View All Patrols', 'View patrol reports across all projects', 'patrol', 0),
    ('patrol.approve', 'Approve Patrols', 'Approve and finalize patrol reports', 'patrol', 1),
    ('user.create', 'Create Users', 'Create new user accounts', 'user', 1),
    ('user.edit', 'Edit Users', 'Edit user profiles and permissions', 'user', 1),
    ('user.manage_roles', 'Manage User Roles', 'Assign/modify user roles', 'user', 1),
    ('company.manage_external_workers', 'Manage External Workers', 'Invite and manage external workers', 'company', 1),
    ('project.create', 'Create Projects', 'Create new projects', 'project', 1),
    ('project.manage_members', 'Manage Project Members', 'Add/remove project members', 'project', 1)
) AS source (permission_key, permission_name, description, category, is_sensitive)
ON target.permission_key = source.permission_key
WHEN NOT MATCHED THEN
    INSERT (permission_key, permission_name, description, category, is_sensitive)
    VALUES (source.permission_key, source.permission_name, source.description, source.category, source.is_sensitive);

-- Create user context function (SQL Server equivalent)
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'FN' AND name = 'get_current_user_id')
    DROP FUNCTION dbo.get_current_user_id;
GO

CREATE FUNCTION dbo.get_current_user_id()
RETURNS UNIQUEIDENTIFIER
AS
BEGIN
    DECLARE @user_id UNIQUEIDENTIFIER;
    
    -- Extract user ID from session context or application context
    SET @user_id = TRY_CAST(SESSION_CONTEXT(N'current_user_id') AS UNIQUEIDENTIFIER);
    
    IF @user_id IS NULL
        SET @user_id = TRY_CAST(CONTEXT_INFO() AS UNIQUEIDENTIFIER);
    
    RETURN @user_id;
END
GO

-- Multi-company permission checking function
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'FN' AND name = 'user_has_permission')
    DROP FUNCTION dbo.user_has_permission;
GO

CREATE FUNCTION dbo.user_has_permission(
    @user_id UNIQUEIDENTIFIER, 
    @company_id UNIQUEIDENTIFIER, 
    @permission_key NVARCHAR(100)
)
RETURNS BIT
AS
BEGIN
    DECLARE @has_permission BIT = 0;
    
    -- Check if user has the permission through their company role
    IF EXISTS (
        SELECT 1 
        FROM dbo.user_company_associations uca
        INNER JOIN dbo.company_roles cr ON uca.company_role_id = cr.id
        WHERE uca.user_id = @user_id 
        AND uca.company_id = @company_id
        AND uca.status = 'active'
        AND uca.approval_status = 'approved'
        AND JSON_VALUE(cr.permissions, '$') LIKE '%' + @permission_key + '%'
    )
    BEGIN
        SET @has_permission = 1;
    END
    
    -- System admins have all permissions
    IF @has_permission = 0
    BEGIN
        IF EXISTS (
            SELECT 1 FROM dbo.users 
            WHERE id = @user_id 
            AND authority_level = 'system_admin'
        )
        BEGIN
            SET @has_permission = 1;
        END
    END
    
    RETURN @has_permission;
END
GO

-- Create files table for blob storage metadata
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'files')
BEGIN
    CREATE TABLE dbo.files (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        filename NVARCHAR(255) NOT NULL,
        blob_url NVARCHAR(500) NOT NULL,
        file_size BIGINT NULL,
        mime_type NVARCHAR(100) NULL,
        uploaded_by UNIQUEIDENTIFIER NULL,
        upload_date DATETIME2 DEFAULT GETDATE(),
        category NVARCHAR(50) NULL,
        
        CONSTRAINT PK_files PRIMARY KEY (id),
        CONSTRAINT FK_files_uploaded_by 
            FOREIGN KEY (uploaded_by) REFERENCES dbo.users(id)
    );
END
```

### 3.2 Multi-Company User Data Migration
```typescript
// Enhanced user migration for multi-company architecture
interface UserMigration {
  supabaseId: string;
  azureObjectId?: string; // From Microsoft Graph (company users)
  b2cObjectId?: string;   // From Azure AD B2C (external users)
  companyEmail?: string;  // For company staff
  externalEmail?: string; // For external workers
  userType: 'internal' | 'contractor' | 'consultant' | 'temporary' | 'visitor';
  companyAssociations: CompanyAssociation[];
}

interface CompanyAssociation {
  companyId: string;
  roleName: string;
  startDate: string;
  approvalStatus: 'approved' | 'pending';
}

// Migration script with face recognition removal
const migrateUsers = async () => {
  // 1. BACKUP face recognition data before removal
  console.log('Backing up face recognition data...');
  await backupFaceDescriptors();
  
  // 2. Export users from Supabase (excluding face_descriptors)
  const supabaseUsers = await exportUsersFromSupabase();
  
  // 3. Categorize users by type
  const internalUsers = supabaseUsers.filter(u => u.email.endsWith('@th.jec.com'));
  const externalUsers = supabaseUsers.filter(u => !u.email.endsWith('@th.jec.com'));
  
  // 4. Match internal users with Azure AD accounts
  for (const user of internalUsers) {
    const azureUser = await findAzureADUser(user.email);
    if (azureUser) {
      await migrateInternalUser(user, azureUser);
    }
  }
  
  // 5. Migrate external users to B2C structure
  for (const user of externalUsers) {
    await migrateExternalUser(user);
  }
  
  // 6. Create initial company associations
  await createInitialCompanyAssociations();
  
  // 7. Set up standard company roles
  await createStandardCompanyRoles();
};

const backupFaceDescriptors = async () => {
  // Create backup table before dropping face_descriptors column
  await executeSQL(`
    CREATE TABLE IF NOT EXISTS user_face_backup AS 
    SELECT id, face_descriptors, created_at 
    FROM users 
    WHERE face_descriptors IS NOT NULL
  `);
};

const migrateExternalUser = async (supabaseUser: any) => {
  // Create B2C user account if doesn't exist
  const b2cUser = await createB2CUser({
    email: supabaseUser.email,
    givenName: supabaseUser.first_name,
    surname: supabaseUser.last_name,
    customAttributes: {
      extension_worker_type: determineWorkerType(supabaseUser),
      extension_verification_status: 'verified', // Existing users are pre-verified
      extension_external_worker_id: supabaseUser.id
    }
  });
  
  // Update database record with new B2C object ID
  await updateUserRecord(supabaseUser.id, {
    azure_b2c_object_id: b2cUser.id,
    worker_type: determineWorkerType(supabaseUser),
    verification_status: 'verified'
  });
};

const createInitialCompanyAssociations = async () => {
  // For existing users with company_id, create association records
  const usersWithCompanies = await getUsersWithCompanyId();
  
  for (const user of usersWithCompanies) {
    await createUserCompanyAssociation({
      userId: user.id,
      companyId: user.company_id,
      roleName: mapLegacyRoleToCompanyRole(user.authority_level),
      status: 'active',
      approvalStatus: 'approved', // Existing relationships are pre-approved
      startDate: user.created_at
    });
    
    // Set as primary company
    await updateUser(user.id, {
      primary_company_id: user.company_id
    });
  }
};
```

## 📱 Phase 4: Frontend Updates

### 4.1 Authentication Service Replacement
```typescript
// src/lib/auth/azureAuthService.ts
import { PublicClientApplication, AuthenticationResult } from '@azure/msal-browser';

export class AzureAuthService {
  private msalInstance: PublicClientApplication;

  constructor() {
    this.msalInstance = new PublicClientApplication(msalConfig);
  }

  async loginWithMicrosoft(): Promise<AuthenticationResult> {
    return await this.msalInstance.loginPopup({
      scopes: ['User.Read', 'profile', 'email']
    });
  }

  async getUserProfile(): Promise<MicrosoftUser> {
    // Get user profile from Microsoft Graph
  }
}
```

### 4.2 Storage Service Updates
```typescript
// src/lib/storage/azureBlobClient.ts
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';

export class AzureBlobService {
  private containerClient: ContainerClient;

  constructor() {
    const blobServiceClient = new BlobServiceClient(
      process.env.VITE_AZURE_STORAGE_CONNECTION_STRING
    );
    this.containerClient = blobServiceClient.getContainerClient('qshe-photos');
  }

  async uploadProfilePhoto(file: File, userId: string): Promise<string> {
    const blobName = `profiles/${userId}/${Date.now()}-${file.name}`;
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    
    await blockBlobClient.uploadData(file, {
      blobHTTPHeaders: { blobContentType: file.type }
    });
    
    return blockBlobClient.url;
  }
}
```

## 💰 Cost Analysis

### Free Tier Prototype (Monthly)
- **Entra ID**: Free for first 50,000 users
- **Azure SQL Database**: Free 100,000 vCore seconds + 32GB storage
- **Blob Storage**: Free 5 GiB
- **Static Web Apps**: Free tier
- **Total**: $0/month for testing

### Production Estimate (1000 users)
- **Entra ID P1**: $6/user/month × 50 active users = $300
- **Azure SQL Database**: Standard S2 (50 DTU) = $30
- **Blob Storage**: 100 GiB × $0.0184 = $1.84
- **Static Web Apps**: Standard tier = $9
- **Total**: ~$341/month (vs current Supabase ~$250, vs PostgreSQL ~$511)

**Cost Optimization**:
- Use company Azure EA pricing (30-50% discount)
- Reserved instances for production
- Hybrid benefit for existing licenses

## 🚀 Enhanced Implementation Timeline

### Week 1-2: Azure Infrastructure & Authentication Setup
- [ ] Create Azure free account with B2C tenant
- [ ] Set up dual authentication:
  - [ ] Entra ID app registration (company staff)
  - [ ] Azure AD B2C tenant (external workers)
  - [ ] Configure custom B2C attributes (worker_type, verification_status, etc.)
- [ ] Configure PostgreSQL database with multi-company schema
- [ ] Set up Blob Storage for documents (no face images needed)
- [ ] Deploy enhanced database schema with company associations

### Week 3-4: Multi-Company Development
- [ ] Implement dual authentication system
  - [ ] Company staff SSO flow
  - [ ] External worker B2C registration/login
  - [ ] Company context switching logic
- [ ] Deploy multi-company database schema
  - [ ] Run migration scripts (with face recognition removal)
  - [ ] Create user-company association tables
  - [ ] Set up company roles and permissions system
- [ ] Update storage client (remove face image handling)
- [ ] Implement company invitation workflows

### Week 5-6: External Worker Management
- [ ] Build company management interface
  - [ ] External worker invitation system
  - [ ] Role assignment workflows
  - [ ] Access approval/revocation tools
- [ ] Implement session management for multi-company users
- [ ] Create external worker onboarding flow (document-based verification)
- [ ] Test cross-company user scenarios

### Week 7-8: Security & Compliance Testing
- [ ] Multi-company security testing
- [ ] External worker access control validation
- [ ] SECL compliance verification for multi-company architecture
- [ ] Performance testing with company context switching
- [ ] Create enhanced deployment documentation
- [ ] Prepare IT department presentation (dual authentication model)

## 🔧 Environment Variables (Multi-Company Azure)

```bash
# Azure Entra ID Configuration (Company Staff)
VITE_AZURE_COMPANY_CLIENT_ID=your-entra-app-registration-client-id
VITE_AZURE_COMPANY_TENANT_ID=your-company-tenant-id
VITE_AZURE_COMPANY_REDIRECT_URI=http://localhost:5173/auth/company/callback

# Microsoft Entra External ID Configuration (External Workers)
VITE_AZURE_EXTERNAL_CLIENT_ID=your-external-id-client-id
VITE_AZURE_EXTERNAL_TENANT_NAME=qshe
VITE_AZURE_EXTERNAL_AUTHORITY=https://login.microsoftonline.com/qshe.onmicrosoft.com
VITE_AZURE_EXTERNAL_REDIRECT_URI=http://localhost:5173/auth/external/callback

# Azure Database (Enhanced for Multi-Company)
VITE_AZURE_SQL_SERVER=qshe.database.windows.net
VITE_AZURE_DB_NAME=jectqshe
VITE_AZURE_DB_USER=qsheadmin
VITE_AZURE_DB_PASSWORD=your-secure-password
VITE_AZURE_DB_ENCRYPT=true

# Azure Blob Storage (No Face Images)
VITE_AZURE_STORAGE_ACCOUNT=qshemulticompany
VITE_AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
VITE_AZURE_CONTAINER_DOCUMENTS=qshe-documents
VITE_AZURE_CONTAINER_PATROL_PHOTOS=qshe-patrol-photos

# Multi-Company Configuration
VITE_DEFAULT_COMPANY_DOMAIN=th.jec.com
VITE_ENABLE_EXTERNAL_WORKERS=true
VITE_ENABLE_MULTI_COMPANY=true
VITE_EXTERNAL_WORKER_VERIFICATION_REQUIRED=true

# Security & Compliance
VITE_AZURE_KEY_VAULT_URL=https://your-keyvault.vault.azure.net/
VITE_ENABLE_AUDIT_LOGGING=true
VITE_SESSION_TIMEOUT_MINUTES=60
VITE_COMPANY_SWITCHING_TIMEOUT_MINUTES=15
```

## 📋 Enhanced Migration Checklist

### Pre-Migration
- [ ] Azure account setup with B2C tenant
- [ ] Company domain verification (@th.jec.com)
- [ ] IT department approval for dual authentication model
- [ ] SECL security requirements review (multi-company)
- [ ] **CRITICAL**: Backup face recognition data before removal
- [ ] External worker identification and categorization

### Migration Phase 1: Infrastructure
- [ ] Dual authentication system setup (Entra ID + B2C)
- [ ] Enhanced database schema deployment
- [ ] Multi-company role and permission system
- [ ] Face recognition dependency removal
- [ ] File storage migration (exclude face images)

### Migration Phase 2: User Management
- [ ] Internal user migration (Entra ID SSO)
- [ ] External user migration (B2C accounts)
- [ ] Company association creation
- [ ] Role assignment and approval workflows
- [ ] Document-based verification setup (no biometrics)

### Migration Phase 3: Multi-Company Features
- [ ] Company management interface deployment
- [ ] External worker invitation system
- [ ] Company context switching implementation
- [ ] Cross-company audit trail setup
- [ ] Multi-company session management

### Post-Migration
- [ ] Multi-company user acceptance testing
- [ ] External worker onboarding flow testing
- [ ] Enhanced security audit (multi-company architecture)
- [ ] Performance optimization (company context switching)
- [ ] Documentation update (dual authentication model)
- [ ] Staff training (company SSO + external worker management)

## 🔒 Enhanced Security Benefits

1. **Dual Enterprise Authentication**: 
   - Company-managed SSO for internal staff
   - Secure B2C for external workers with enhanced verification
2. **Multi-Company Zero-Trust Security**: 
   - Company-specific conditional access policies
   - Isolated data access per company context
3. **Enhanced External Worker Security**:
   - Document-based verification (passport/work permit) without biometric dependencies
   - Risk-based authentication for external users
   - Company invitation and approval workflows
4. **Granular Permission Control**: 
   - 25+ specific permissions with company-specific roles
   - Cross-company audit trails and monitoring
5. **Advanced Compliance**: 
   - SECL-compliant multi-company architecture
   - Enhanced data residency and privacy controls
6. **Simplified Onboarding**: 
   - No face recognition setup required
   - Streamlined external worker registration process

## 📈 Next Steps

1. **Review Enhanced Architecture**: 
   - Study `/docs/multi_company_architecture.md` for detailed system design
   - Review `/Markdown/data_flow_architecture.md` for updated data flows
   - Examine file structure and component organization
2. **Start with Free Tier Multi-Company Testing**: 
   - Test dual authentication (Entra ID + B2C)
   - Validate multi-company user scenarios
   - Verify external worker invitation workflows
3. **Gradual Migration with Face Recognition Removal**: 
   - Backup existing face data before removal
   - Migrate components incrementally following enhanced file structure
   - Test document-based verification flows
4. **Enhanced User Training**: 
   - Company staff: Microsoft SSO usage
   - Admins: External worker management interface
   - External workers: Multi-company access procedures
5. **Advanced IT Collaboration**: 
   - B2C tenant configuration
   - Multi-company security policy setup
   - Enhanced audit and compliance monitoring

## 📚 **Related Documentation**

- 📄 `/docs/multi_company_architecture.md` - Complete system architecture and file structure
- 📄 `/Markdown/data_flow_architecture.md` - Updated data flows and authentication patterns  
- 📄 `/docs/companyRequirements/SECL_Security_Compliance_Table.md` - Security compliance matrix
- 📄 `/docs/companyRequirements/azure-ad-b2c-multicompany-config.md` - B2C configuration details
- 📄 `/database/migrate_user_company_many_to_many.sql` - Database migration scripts
- 📄 `/database/create_multicompany_rbac_system.sql` - RBAC system setup

This enhanced migration will provide enterprise-grade multi-company security, seamless dual authentication, and scalable infrastructure for your QSHE PWA supporting both internal staff and external workers across multiple company relationships.