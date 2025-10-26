# QSHE PWA Multi-Company Data Flow & Sync Architecture

## 1. Enhanced Offline-First Data Architecture

### Local Storage Structure (Dexie.js) - Multi-Company Support

```typescript
// Enhanced database structure for multi-company support
const db = new Dexie('qsheMultiCompanyDatabase');
db.version(2).stores({
  // User Management (Multi-Company)
  users: 'id, email, status, userType, workerType, verificationStatus',
  userCompanyAssociations: 'id, userId, companyId, roleInCompany, status, approvalStatus',
  companies: 'id, name, status, type', // Enhanced company info
  
  // Role & Permission System
  companyRoles: 'id, companyId, roleName, permissions',
  permissions: 'id, permissionKey, category',
  userPermissions: 'id, userId, companyId, permissionKey', // Cached permissions
  
  // Project Management (Company-Scoped)
  projects: 'id, name, status, companyId', // Added company scope
  projectMembers: 'id, projectId, userId, role, companyId',
  
  // Safety Patrol (Multi-Company)
  patrols: 'id, projectId, status, createdAt, companyId',
  patrolIssues: 'id, patrolId, status, assigneeId, companyId',
  
  // External Worker Management
  externalWorkerInvitations: 'id, companyId, email, roleName, status, invitationToken',
  documentVerifications: 'id, userId, documentType, verificationStatus', // No face data
  
  // Enhanced Sync & Audit
  syncQueue: '++id, entityType, entityId, operation, timestamp, status, companyId',
  mediaQueue: '++id, entityType, entityId, filePath, uploadStatus, companyId',
  auditLog: '++id, userId, companyId, action, entityType, timestamp' // Multi-company audit
});
```

### Enhanced Sync Queue System with Company Context

```
┌───────────────────┐       ┌─────────────────────────┐
│                   │       │                         │
│ Multi-Company     │───────▶ Company-Aware          │
│ Local Changes     │       │ Sync Queue              │
│                   │       │                         │
└───────────────────┘       └─────────┬───────────────┘
                                      │
                                      │ Network Available + Company Context
                                      ▼
┌───────────────────┐       ┌─────────────────────────┐
│                   │       │                         │
│ Azure PostgreSQL  │◀──────│ Multi-Company           │
│ + Blob Storage    │       │ Sync Worker             │
│                   │       │                         │
└───────────────────┘       └─────────────────────────┘
                                      │
                                      ▼
                           ┌─────────────────────────┐
                           │                         │
                           │ Azure Audit &           │
                           │ Compliance Logging      │
                           │                         │
                           └─────────────────────────┘
```

## 2. Multi-Company User Management Data Flow

### Enhanced Registration Flow (No Face Recognition)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │    │                 │
│ User Type       │───▶│ Document        │───▶│ Company         │───▶│ Role Assignment │
│ Selection       │    │ Verification    │    │ Selection/      │    │ & Approval      │
│ (Company/Ext)   │    │ (Passport/ID)   │    │ Invitation      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Dual Authentication Flow (Company vs External)

```
┌─────────────────┐    
│                 │    
│ Authentication  │    
│ Type Detection  │    
│                 │    
└─────────┬───────┘    
          │
          ▼
┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │
│ Company Staff   │         │ External Worker │
│ (@th.jec.com)   │         │ (Other domains) │
│                 │         │                 │
└─────────┬───────┘         └─────────┬───────┘
          │                           │
          ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │
│ Microsoft       │         │ Azure AD B2C    │
│ Entra ID SSO    │         │ Custom Flow     │
│                 │         │                 │
└─────────┬───────┘         └─────────┬───────┘
          │                           │
          │                           ▼
          │                 ┌─────────────────┐
          │                 │                 │
          │                 │ Company         │
          │                 │ Selection UI    │
          │                 │ (Multi-Company) │
          │                 │                 │
          │                 └─────────┬───────┘
          │                           │
          └───────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │                 │
                    │ Permission      │
                    │ Loading &       │
                    │ Context Setup   │
                    │                 │
                    └─────────────────┘
```

### External Worker Invitation Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │    │                 │
│ Company Admin   │───▶│ Send Email      │───▶│ Worker Accepts  │───▶│ B2C Registration│
│ Sends Invite    │    │ with Token      │    │ Invitation      │    │ + Role Setup    │
│                 │    │                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 3. Enhanced Media Handling Strategy (No Face Data)

### Document & Photo Capture Storage

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│ Document/Photo  │───▶│ Local Storage   │───▶│ Azure Blob      │
│ Capture         │    │ (IndexedDB)     │    │ Upload Queue    │
│ (No Face Data)  │    │ + Compression   │    │ (when online)   │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                            ┌─────────────────┐
                                            │                 │
                                            │ Azure Blob      │
                                            │ Storage         │
                                            │ (Company-Scoped)│
                                            │                 │
                                            └─────────┬───────┘
                                                      │
                                                      ▼
                                            ┌─────────────────┐
                                            │                 │
                                            │ Metadata in     │
                                            │ Azure PostgreSQL│
                                            │ (Multi-Company) │
                                            │                 │
                                            └─────────────────┘
```

### Photo Annotation Process

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Image      │    │ Annotation  │    │ Save as new │
│  Display    │───▶│ Canvas      │───▶│ version     │
│             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
```

## 4. Conflict Resolution Strategy

### Data Sync Conflicts

```
┌────────────────┐      ┌────────────────┐
│                │      │                │
│ Local Changes  │      │ Remote Changes │
│                │      │                │
└───────┬────────┘      └────────┬───────┘
        │                        │
        ▼                        ▼
┌────────────────────────────────────────┐
│                                        │
│           Conflict Detection           │
│                                        │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│                                        │
│  Resolution Strategy (Last Write Wins  │
│  with timestamp or version control)    │
│                                        │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│                                        │
│           Data Reconciliation          │
│                                        │
└────────────────────────────────────────┘
```

## 5. Authentication Flow

### Login Process

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Login      │    │ Supabase    │    │ Store Token │    │ Initial     │
│  Form       │───▶│ Auth        │───▶│ & User Info │───▶│ Data Sync   │
│             │    │             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Offline Authentication

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Login      │    │ Check Local │    │ Limited     │
│  Form       │───▶│ Credentials │───▶│ Access Mode │
│ (Offline)   │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
```

## 6. Safety Patrol Workflow

### Issue Creation

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Create     │    │ Add Photos  │    │ Save to     │    │ Add to      │
│  Issue Form │───▶│ & Annotate  │───▶│ Local DB    │───▶│ Sync Queue  │
│             │    │             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Issue Resolution

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Update     │    │ Add "After" │    │ Update      │    │ Add to      │
│  Status     │───▶│ Photos      │───▶│ Local DB    │───▶│ Sync Queue  │
│             │    │             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## 7. State Management Architecture

### Redux Store Structure

```
store/
├── index.ts                # Store configuration
├── slices/
│   ├── authSlice.ts        # Authentication state
│   ├── usersSlice.ts       # User management
│   ├── projectsSlice.ts    # Project management
│   ├── companiesSlice.ts   # Company management
│   ├── patrolSlice.ts      # Patrol state
│   └── uiSlice.ts          # UI state (modals, etc)
└── thunks/
    ├── authThunks.ts       # Auth async actions
    ├── usersThunks.ts      # User async actions
    ├── projectsThunks.ts   # Project async actions
    ├── syncThunks.ts       # Sync queue actions
    └── mediaThunks.ts      # Media queue actions
```
