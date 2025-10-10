# QSHE PWA Data Flow & Sync Architecture

## 1. Offline-First Data Architecture

### Local Storage Structure (Dexie.js)

```typescript
// Database structure
const db = new Dexie('qsheDatabase');
db.version(1).stores({
  users: 'id, email, status, userType',
  projects: 'id, name, status',
  projectMembers: 'id, projectId, userId, role',
  companies: 'id, name, status',
  patrols: 'id, projectId, status, createdAt',
  patrolIssues: 'id, patrolId, status, assigneeId',
  syncQueue: '++id, entityType, entityId, operation, timestamp, status',
  mediaQueue: '++id, entityType, entityId, filePath, uploadStatus'
});
```

### Sync Queue System

```
┌───────────────────┐       ┌───────────────────┐
│                   │       │                   │
│   Local Changes   │───────▶   Sync Queue      │
│                   │       │                   │
└───────────────────┘       └─────────┬─────────┘
                                      │
                                      │ Network Available
                                      ▼
┌───────────────────┐       ┌───────────────────┐
│                   │       │                   │
│ Supabase/R2 APIs  │◀──────│   Sync Worker    │
│                   │       │                   │
└───────────────────┘       └───────────────────┘
```

## 2. User Management Data Flow

### Registration Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│             │    │             │    │             │    │             │
│ Basic Info  │───▶│ Face Capture│───▶│  Review     │───▶│ Confirmation│
│             │    │             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Face Recognition Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Camera     │    │ TensorFlow  │    │ Compare with│    │   Match     │
│  Capture    │───▶│ Processing  │───▶│ Descriptors │───▶│ Results     │
│             │    │             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## 3. Media Handling Strategy

### Photo Capture & Storage

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Capture    │    │ Local Storage│    │ Upload Queue│
│  Photo      │───▶│ (IndexedDB) │───▶│ (when online)│
│             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
                                           │
                                           ▼
                                    ┌─────────────┐
                                    │Cloudflare R2│
                                    │ Storage     │
                                    │             │
                                    └─────────────┘
                                           │
                                           ▼
                                    ┌─────────────┐
                                    │ Metadata in │
                                    │ Supabase    │
                                    │             │
                                    └─────────────┘
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
