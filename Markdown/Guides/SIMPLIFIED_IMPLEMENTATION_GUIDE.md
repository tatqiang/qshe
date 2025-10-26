# QSHE System - Simplified Role Implementation Guide

## Overview
Updated implementation using single role field instead of complex role tables for better performance and maintainability.

## Database Schema Changes

### Role Management Simplified
- **Before**: Separate `roles` and `user_roles` tables with junction relationships
- **After**: Single `role` field in `users` table with predefined values

### Role Hierarchy (Power Level 1-7)
1. `system_admin` - Full system access (nithat.su@th.jec.com)
2. `qshe_manager` - QSHE department management
3. `safety_officer` - Safety patrol creation and management
4. `project_manager` - Project and team management
5. `supervisor` - Team oversight and action completion
6. `inspector` - Inspection and observation creation
7. `employee` - Basic access and assigned tasks

## Deployment Options

### Option 1: Azure Portal Query Editor (Recommended)
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to SQL Database → jectqshe
3. Open Query Editor
4. Login with Azure AD
5. Copy and paste `simplified_qshe_schema.sql`
6. Execute the script

### Option 2: Visual Studio Code (If SQL Extension Available)
1. Install SQL Server extension in VS Code
2. Connect to `qshe.database.windows.net`
3. Open `simplified_qshe_schema.sql`
4. Execute against jectqshe database

### Option 3: Command Line (If Tools Available)
```cmd
cd database
deploy_simplified_schema.bat
```

## Auto-Registration Service Integration

### Service File
- `src/lib/api/userRegistrationSimplified.ts` - Updated for single role field

### Key Features
- Automatic role assignment based on email and job title
- Permission checking with role hierarchy
- User creation on first login
- Role-based action permissions

### Integration with Authentication
```typescript
// In your Azure AD login success handler
import { userRegistrationService } from '@/lib/api/userRegistrationSimplified';

const handleLoginSuccess = async (account) => {
  const user = await userRegistrationService.registerOrUpdateUser({
    id: account.homeAccountId,
    displayName: account.name,
    mail: account.username,
    // ... other Azure AD properties
  });
  
  // Set user in application state
  dispatch(setAzureUser(user));
};
```

## Permission System Usage

### Check User Permissions
```typescript
import { checkUserPermission, getRoleDisplayName } from '@/lib/api/userRegistrationSimplified';

// Check if user can perform action
const canManageProjects = checkUserPermission(user.role, 'project_manager');

// Display role name
const roleDisplayName = getRoleDisplayName(user.role); // "Safety Officer"
```

### Action-Based Permissions
```typescript
const canCreatePatrol = await userRegistrationService.canPerformAction(user.role, 'create_patrols');
const canAssignActions = await userRegistrationService.canPerformAction(user.role, 'assign_corrective_actions');
```

## Database Tables Summary

### Core Tables
- `users` - User information with single role field
- `projects` - Project management
- `safety_patrols` - Safety patrol records
- `patrol_observations` - Specific observations during patrols
- `corrective_actions` - Actions arising from patrols
- `attachments` - File attachments (photos, documents)
- `risk_categories` - Risk classification system
- `system_settings` - Application configuration

### Key Relationships
- Users → Safety Patrols (creator/assigned_to)
- Safety Patrols → Observations (one-to-many)
- Observations → Corrective Actions (one-to-many)
- All records → Attachments (many-to-many via polymorphic relationship)

## Cloudflare R2 Photo Storage

### Container Structure
- `patrol-photos/` - Safety patrol images
- `documents/` - General documents
- `project-files/` - Project-related files

### Security Features
- GDPR compliant data processing
- ISO 27001 certified infrastructure
- SOC 2 Type II security controls
- Enterprise-grade encryption
- Access control and audit logging

## Next Steps

1. **Deploy Schema**: Use Azure Portal Query Editor to deploy `simplified_qshe_schema.sql`
2. **Test Auto-Registration**: Login with company account to verify user creation
3. **Verify Permissions**: Check role assignment and permission system
4. **Implement UI Components**: Create safety patrol forms and management interfaces
5. **Configure Photo Storage**: Set up Cloudflare R2 integration for file uploads

## Verification Commands

After deployment, verify the schema:

```sql
-- Check tables created
SELECT name FROM sys.tables WHERE name LIKE '%patrol%' OR name = 'users';

-- Verify test data
SELECT email, role, display_name FROM users;

-- Check role values
SELECT DISTINCT role FROM users;
```

## Role Assignment Logic

### Automatic Assignment Rules
- `nithat.su@th.jec.com` → `system_admin`
- QSHE department + manager title → `qshe_manager`
- QSHE/Safety department → `safety_officer` 
- Manager/Director title → `project_manager`
- Supervisor/Lead title → `supervisor`
- Inspector/Auditor title → `inspector`
- Default → `employee`

### Manual Role Updates (Admin Only)
```typescript
await userRegistrationService.updateUserRole(userId, 'safety_officer', currentAdminId);
```

This simplified approach provides all the functionality of the complex role system while being much easier to maintain and understand.