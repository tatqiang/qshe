# INVENTORY PWA - SEPARATE vs INTEGRATED ARCHITECTURE ANALYSIS

## 🎯 EXECUTIVE SUMMARY

**RECOMMENDATION: SEPARATE INVENTORY PWA** ✅

**Why?**
1. **Different core purposes** - QSHE (Safety Management) vs Inventory (Material Management)
2. **Different user bases** - Safety officers vs Warehouse/Procurement staff
3. **Different data access patterns** - QSHE is project-centric, Inventory is material-centric
4. **Easier maintenance & scaling** - Deploy independently, scale independently
5. **Cleaner architecture** - Single responsibility principle

**Shared Components:**
- Authentication (Azure AD / Supabase Auth)
- Projects table (via API or database views)
- User management (read-only from QSHE)

---

## 📊 CURRENT QSHE PWA ANALYSIS

### Core Tables (from your schema):
```
USERS & AUTH:
- users
- companies
- member_applications
- member_application_tokens

PROJECTS:
- projects ← SHARED CORE TABLE
- project_field_configs
- project_form_configs

AREAS (Location hierarchy):
- main_areas
- sub_areas_1
- sub_areas_2

SAFETY MANAGEMENT:
- safety_patrols
- patrol_observations
- corrective_actions
- safety_audits
- safety_audit_results
- safety_audit_categories
- safety_audit_requirements

FORMS & REPORTS:
- form_templates
- form_fields
- report_templates

ATTACHMENTS:
- patrol_photos
- safety_audit_photos
```

### Purpose: **Safety & Quality Management**
- Safety patrols and inspections
- Corrective action tracking
- Audit management
- Observation reporting

---

## 🏗️ PROPOSED INVENTORY PWA ARCHITECTURE

### Two Approaches to Consider:

## ✅ OPTION 1: SEPARATE INVENTORY PWA (RECOMMENDED)

### Architecture:
```
┌─────────────────────────────────────────────────────────────┐
│                    SHARED SERVICES LAYER                     │
├─────────────────────────────────────────────────────────────┤
│  - Azure AD Authentication (or Supabase Auth)               │
│  - User Management API                                       │
│  - Projects API (read from QSHE, write to Inventory)        │
└─────────────────────────────────────────────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
┌──────────────────────┐          ┌──────────────────────┐
│    QSHE PWA          │          │   INVENTORY PWA      │
├──────────────────────┤          ├──────────────────────┤
│ Database: qshe_db    │          │ Database: inventory_db│
├──────────────────────┤          ├──────────────────────┤
│ - users (source)     │──────────│ - users (sync/view)  │
│ - projects (source)  │  Shared  │ - projects (sync/view)│
│ - safety_patrols     │          │ - materials          │
│ - corrective_actions │          │ - inventory_stock    │
│ - audits             │          │ - suppliers          │
│ - observations       │          │ - transactions       │
└──────────────────────┘          └──────────────────────┘
```

### Benefits: ✅
1. **Clean separation of concerns**
   - QSHE team manages safety data
   - Warehouse team manages inventory data
   
2. **Independent scaling**
   - Scale QSHE for 100 users doing safety inspections
   - Scale Inventory for 1000 material transactions/day

3. **Independent deployment**
   - Deploy QSHE updates without affecting inventory
   - Deploy inventory updates without affecting safety operations

4. **Different permissions**
   - Safety officer doesn't need inventory access
   - Warehouse staff doesn't need safety patrol access

5. **Technology flexibility**
   - Can use different tech stacks if needed
   - Can optimize each database independently

6. **Easier maintenance**
   - Smaller codebases
   - Faster CI/CD
   - Easier debugging

### Data Sharing Strategy:

#### **1. Projects Table (SHARED CORE)**

**Option A: Single Source (QSHE) with API**
```sql
-- QSHE Database (Source of Truth)
projects (
    id uuid,
    project_code varchar(50),
    name varchar(200),
    status project_status_enum,
    project_start date,
    project_end date,
    created_at timestamp
)

-- Inventory Database (Materialized View or Cached)
-- Access via API: GET /api/qshe/projects
-- Or periodic sync (every hour)
```

**Option B: Replicated with Sync**
```sql
-- Both databases have projects table
-- QSHE is master, Inventory syncs via webhook/API
-- Inventory PWA can read locally (fast), writes go to QSHE
```

**Option C: Shared Database View** (if same PostgreSQL instance)
```sql
-- In Inventory DB, create foreign data wrapper
CREATE FOREIGN TABLE qshe_projects (
    id uuid,
    project_code varchar(50),
    name varchar(200),
    status varchar(50)
)
SERVER qshe_server
OPTIONS (schema_name 'public', table_name 'projects');
```

#### **2. Users Table (SHARED)**

**Strategy: Read-only sync from QSHE to Inventory**
```sql
-- QSHE: Source of truth for users
-- Inventory: Receives user updates via webhook

-- Inventory only needs:
- id (for created_by, updated_by)
- email
- display_name
- department
- is_active
```

#### **3. Integration Points**

```typescript
// Shared types (in monorepo packages)
interface Project {
  id: string;
  project_code: string;
  name: string;
  status: 'active' | 'completed' | 'on_hold';
  project_start: Date;
  project_end: Date;
}

interface User {
  id: string;
  email: string;
  display_name: string;
  department: string;
}

// Inventory PWA uses QSHE API
const projects = await qsheApi.getProjects();
const user = await qsheApi.getUser(userId);
```

---

## ❌ OPTION 2: INTEGRATED INVENTORY IN QSHE PWA

### Architecture:
```
┌──────────────────────────────────────────┐
│         QSHE + INVENTORY PWA             │
├──────────────────────────────────────────┤
│ Database: qshe_db                        │
├──────────────────────────────────────────┤
│ - users                                  │
│ - projects                               │
│ - safety_patrols                         │
│ - corrective_actions                     │
│ - materials                              │
│ - inventory_stock                        │
│ - suppliers                              │
│ - inventory_transactions                 │
└──────────────────────────────────────────┘
```

### Drawbacks: ❌
1. **Monolithic growth**
   - One large database becomes harder to manage
   - Backup/restore takes longer
   - Schema migrations affect everything

2. **Performance conflicts**
   - Heavy inventory transactions slow down safety queries
   - Safety patrol inserts compete with material movements

3. **Permission complexity**
   - Need complex RLS policies
   - "Safety user can't see inventory, inventory user can't see safety"
   - Harder to audit access

4. **Deployment risks**
   - Inventory bug takes down safety system
   - Must test everything together
   - Slower release cycles

5. **Team conflicts**
   - Safety team and warehouse team fight over database changes
   - Merge conflicts in codebase

---

## 🎨 RECOMMENDED ARCHITECTURE: MICROSERVICES APPROACH

### Repo Structure:

```
qshe-platform/
  ├── packages/
  │   ├── shared-types/         ← TypeScript interfaces
  │   ├── shared-auth/          ← Auth utilities
  │   ├── shared-ui/            ← Common UI components
  │   └── api-client/           ← API client for service-to-service
  │
  ├── apps/
  │   ├── qshe-pwa/             ← QSHE Safety Management
  │   │   ├── src/
  │   │   ├── database/         ← QSHE database schema
  │   │   └── package.json
  │   │
  │   └── inventory-pwa/        ← Inventory Management
  │       ├── src/
  │       ├── database/         ← Inventory database schema
  │       └── package.json
  │
  ├── services/
  │   ├── auth-service/         ← Centralized auth (optional)
  │   └── projects-service/     ← Projects API (optional)
  │
  └── infrastructure/
      ├── docker-compose.yml
      └── kubernetes/
```

### Database Setup:

```yaml
# docker-compose.yml
services:
  qshe-db:
    image: postgres:15
    environment:
      POSTGRES_DB: qshe_db
    ports:
      - "5432:5432"
  
  inventory-db:
    image: postgres:15
    environment:
      POSTGRES_DB: inventory_db
    ports:
      - "5433:5432"
  
  qshe-api:
    build: ./apps/qshe-pwa
    environment:
      DATABASE_URL: postgresql://qshe-db:5432/qshe_db
  
  inventory-api:
    build: ./apps/inventory-pwa
    environment:
      DATABASE_URL: postgresql://inventory-db:5433/inventory_db
      QSHE_API_URL: http://qshe-api:3000
```

---

## 🔄 DATA SYNCHRONIZATION STRATEGY

### 1. Projects Sync (QSHE → Inventory)

**Real-time via Webhook:**
```typescript
// In QSHE PWA - when project created/updated
async function syncProjectToInventory(project: Project) {
  await fetch('http://inventory-api/api/sync/projects', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: project.id,
      project_code: project.project_code,
      name: project.name,
      status: project.status,
      project_start: project.project_start,
      project_end: project.project_end
    })
  });
}

// In Inventory PWA - sync endpoint
app.post('/api/sync/projects', async (req, res) => {
  const project = req.body;
  await db.query(`
    INSERT INTO projects (id, project_code, name, status, project_start, project_end)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      status = EXCLUDED.status,
      project_start = EXCLUDED.project_start,
      project_end = EXCLUDED.project_end,
      updated_at = NOW()
  `, [project.id, project.project_code, project.name, project.status, project.project_start, project.project_end]);
  
  res.json({ success: true });
});
```

**Or: Periodic Batch Sync (every 5 minutes)**
```typescript
// Scheduled job in Inventory PWA
cron.schedule('*/5 * * * *', async () => {
  const projects = await qsheApi.getProjects({ updated_since: lastSyncTime });
  
  for (const project of projects) {
    await syncProject(project);
  }
  
  lastSyncTime = new Date();
});
```

### 2. Users Sync (QSHE → Inventory)

Same strategy as projects - QSHE is source of truth, Inventory syncs.

---

## 💡 SPECIFIC RECOMMENDATIONS FOR YOUR CASE

### Phase 1: Start Separate from Day 1 ✅

**Reasons:**
1. Your QSHE system is already complex (20+ tables)
2. Inventory will add 23+ tables
3. Different teams will use each system
4. Easier to get right from the start than to split later

### Phase 2: Share Only What's Necessary

**Must Share:**
- ✅ Authentication (Azure AD or Supabase)
- ✅ Projects table (for allocation)
- ✅ Users table (for audit trail)

**Don't Share:**
- ❌ Safety patrol data (inventory doesn't need)
- ❌ Material specs (safety doesn't need)
- ❌ Stock levels (safety doesn't need)

### Phase 3: Integration Points

**Inventory → QSHE:**
```typescript
// Issue materials to a project
async function issueMaterialsToProject(
  materialId: string,
  projectId: string,
  quantity: number
) {
  // 1. Check project exists in QSHE
  const project = await qsheApi.getProject(projectId);
  
  // 2. Issue materials in inventory system
  await inventoryApi.issueM aterials({
    materialId,
    toLocationId: project.site_location_id,
    quantity,
    referenceType: 'PROJECT',
    referenceId: projectId,
    referenceNumber: project.project_code
  });
  
  // 3. Optionally notify QSHE (for cost tracking)
  await qsheApi.recordMaterialUsage({
    projectId,
    materialCode: material.code,
    quantity,
    cost: material.cost * quantity
  });
}
```

**QSHE → Inventory:**
```typescript
// When creating corrective action that needs materials
async function createCorrectiveActionWithMaterials(
  observation: Observation,
  materialsNeeded: MaterialRequest[]
) {
  // 1. Create corrective action in QSHE
  const action = await qsheApi.createCorrectiveAction(observation);
  
  // 2. Create material requisition in Inventory
  await inventoryApi.createRequisition({
    requisitionType: 'CORRECTIVE_ACTION',
    referenceId: action.id,
    projectId: observation.project_id,
    materials: materialsNeeded,
    requestedBy: observation.created_by
  });
}
```

---

## 🚀 IMPLEMENTATION ROADMAP

### Month 1: Setup Infrastructure
- [ ] Create separate repos or monorepo structure
- [ ] Setup separate databases (qshe_db, inventory_db)
- [ ] Configure authentication (shared Azure AD)
- [ ] Create shared-types package

### Month 2: Core Projects Integration
- [ ] Implement projects sync (QSHE → Inventory)
- [ ] Implement users sync (QSHE → Inventory)
- [ ] Create API client package
- [ ] Test cross-service calls

### Month 3: Build Inventory Core
- [ ] Categories & Materials (independent)
- [ ] Stock tracking (independent)
- [ ] Basic transactions (independent)

### Month 4: Integration Features
- [ ] Material allocation to projects
- [ ] Requisition from corrective actions
- [ ] Cost tracking sync to QSHE

---

## 📋 DATABASE SCHEMA COMPARISON

### Shared Core Tables:

```sql
-- Both QSHE and Inventory need these

-- PROJECTS (source: QSHE)
projects (
    id uuid PRIMARY KEY,
    project_code varchar(50) UNIQUE,
    name varchar(200),
    status varchar(50),
    project_start date,
    project_end date,
    created_at timestamp,
    updated_at timestamp
)

-- USERS (source: QSHE)
users (
    id uuid PRIMARY KEY,
    email varchar(255) UNIQUE,
    display_name varchar(200),
    department varchar(100),
    is_active boolean,
    created_at timestamp
)
```

### QSHE-Only Tables (20+):
```
safety_patrols, patrol_observations, corrective_actions,
safety_audits, main_areas, sub_areas_1, sub_areas_2,
form_templates, report_templates, etc.
```

### Inventory-Only Tables (23+):
```
material_categories_l1/l2/l3, materials, material_specs,
inventory_stock, inventory_transactions, inventory_locations,
suppliers, material_suppliers, etc.
```

**Total: ~45 tables** - Too much for one system! ✅ Confirms separation is right.

---

## ✅ FINAL RECOMMENDATION

### **BUILD SEPARATE INVENTORY PWA** with these principles:

1. **Shared Authentication**
   - Single Azure AD / Supabase tenant
   - Users log in once, access both systems

2. **Separate Databases**
   - qshe_db (PostgreSQL instance 1)
   - inventory_db (PostgreSQL instance 2)

3. **API-Based Integration**
   - Inventory reads projects via QSHE API
   - QSHE creates requisitions via Inventory API
   - Async communication (webhooks, message queues)

4. **Shared UI Components**
   - Monorepo with shared-ui package
   - Consistent look and feel
   - Same navigation pattern

5. **Independent Deployment**
   - qshe.yourcompany.com
   - inventory.yourcompany.com
   - Can deploy separately

### **This gives you:**
✅ Clean architecture (each system has clear purpose)
✅ Better performance (databases don't compete)
✅ Easier maintenance (smaller codebases)
✅ Independent scaling (scale what needs it)
✅ Team autonomy (safety team vs warehouse team)
✅ Lower risk (issues in one don't affect the other)

---

**Would you like me to create the detailed setup for separate Inventory PWA?** 🎯
