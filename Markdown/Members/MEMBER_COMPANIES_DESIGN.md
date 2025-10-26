# 🎯 Member-Companies Many-to-Many Relationship

## 📊 Database Architecture Improvement

### ✅ New Design: One Member → Many Companies

**Problem:** Original design had `member_applications.company_id` as a single company reference.

**Issue:** Real-world scenario - workers/contractors often work for multiple companies over time.

**Solution:** Create `member_companies` junction table for proper many-to-many relationship.

---

## 🗂️ Database Schema

### Tables Relationship:

```
member_applications (Members)
    ↓ one-to-many
member_companies (Junction Table)
    ↓ many-to-one
companies
```

### Visual Diagram:

```
┌─────────────────────────┐
│  member_applications    │
│─────────────────────────│
│  id (PK)                │
│  company_id (PRIMARY)   │◄─── From token (initial company)
│  form_data (JSONB)      │
│  ...                    │
└─────────────────────────┘
           │
           │ one-to-many
           │
           ▼
┌─────────────────────────┐         ┌──────────────────┐
│  member_companies       │         │   companies      │
│─────────────────────────│         │──────────────────│
│  id (PK)                │         │  id (PK)         │
│  member_application_id  │         │  name            │
│  company_id             │────────►│  name_th         │
│  start_date             │         │  status          │
│  end_date               │         └──────────────────┘
│  position               │
│  status                 │
│  notes                  │
└─────────────────────────┘
```

---

## 📋 Table: member_companies

### Columns:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `member_application_id` | UUID | FK to member_applications |
| `company_id` | UUID | FK to companies |
| `start_date` | DATE | When member started with company |
| `end_date` | DATE | When member left (NULL = still active) |
| `position` | TEXT | Job title/position at this company |
| `status` | VARCHAR(20) | active, inactive, terminated |
| `notes` | TEXT | Additional notes about assignment |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |
| `created_by` | UUID | FK to users (who created record) |
| `updated_by` | UUID | FK to users (who updated record) |

### Constraints:

- **UNIQUE**: `(member_application_id, company_id)` - Prevent duplicate assignments
- **CHECK**: `status IN ('active', 'inactive', 'terminated')`

---

## 🎯 How It Works

### Scenario 1: Initial Registration

**User fills form with token:**
```
Token → company_id = "Company A"
```

**After submission:**
```sql
-- member_applications created
INSERT INTO member_applications (company_id, ...) 
VALUES ('company-a-uuid', ...);

-- Auto-trigger creates member_companies record
INSERT INTO member_companies (member_application_id, company_id, start_date, status)
VALUES ('member-uuid', 'company-a-uuid', CURRENT_DATE, 'active');
```

**Result:**
- Member's primary company: Company A (in `member_applications.company_id`)
- Member also has entry in `member_companies` linking to Company A

---

### Scenario 2: Member Joins Another Company

**Admin adds member to Company B:**
```sql
INSERT INTO member_companies (
  member_application_id,
  company_id,
  start_date,
  position,
  status
) VALUES (
  'member-uuid',
  'company-b-uuid',
  '2025-02-01',
  'Safety Supervisor',
  'active'
);
```

**Result:**
- Member's primary company: Still Company A
- Member now works for: Company A + Company B

---

### Scenario 3: Member Leaves Company

**Update status to inactive:**
```sql
UPDATE member_companies 
SET 
  status = 'inactive',
  end_date = CURRENT_DATE
WHERE 
  member_application_id = 'member-uuid' 
  AND company_id = 'company-b-uuid';
```

**Result:**
- Member still has record for Company B (historical data)
- But status shows 'inactive' with end date

---

## 🔍 Helper View: member_all_companies

**Purpose:** Easily query all companies for each member

**Columns:**
- `member_id` - Member application ID
- `submission_number` - MA-2025-001 format
- `first_name`, `last_name` - From form_data JSONB
- `primary_company_id/name/name_th` - From member_applications
- `all_companies` - JSONB array of all companies
- `active_company_count` - Count of active companies
- `member_status` - Member's status
- `submitted_at`, `project_id`

**Usage Example:**
```sql
-- Get all companies for a specific member
SELECT * FROM member_all_companies 
WHERE member_id = 'member-uuid';

-- Find members working for multiple companies
SELECT * FROM member_all_companies 
WHERE active_company_count > 1;

-- Get all members of a specific company
SELECT * FROM member_all_companies 
WHERE primary_company_id = 'company-uuid'
   OR all_companies::TEXT LIKE '%company-uuid%';
```

---

## 🔧 Automatic Trigger

**Function:** `create_initial_member_company()`

**Trigger:** Runs AFTER INSERT on `member_applications`

**What it does:**
1. Checks if member has a company_id
2. Automatically creates `member_companies` record
3. Links member to their primary company
4. Sets start_date to today
5. Sets status to 'active'
6. Adds note: "Initial company from registration"

**Benefits:**
- No manual step required
- Every new member automatically linked to their company
- Maintains data consistency

---

## 📊 Query Examples

### Example 1: Get Member's Current Companies
```sql
SELECT 
  mc.*,
  c.name AS company_name,
  c.name_th AS company_name_th
FROM member_companies mc
JOIN companies c ON mc.company_id = c.id
WHERE mc.member_application_id = 'member-uuid'
  AND mc.status = 'active'
ORDER BY mc.start_date DESC;
```

### Example 2: Get All Members of a Company
```sql
SELECT 
  ma.id,
  ma.submission_number,
  ma.form_data->>'first_name' AS first_name,
  ma.form_data->>'last_name' AS last_name,
  mc.position,
  mc.start_date,
  mc.status
FROM member_companies mc
JOIN member_applications ma ON mc.member_application_id = ma.id
WHERE mc.company_id = 'company-uuid'
  AND mc.status = 'active'
ORDER BY mc.start_date DESC;
```

### Example 3: Member Work History
```sql
SELECT 
  c.name_th AS company_name,
  mc.position,
  mc.start_date,
  mc.end_date,
  mc.status,
  CASE 
    WHEN mc.end_date IS NULL THEN CURRENT_DATE - mc.start_date
    ELSE mc.end_date - mc.start_date
  END AS days_worked
FROM member_companies mc
JOIN companies c ON mc.company_id = c.id
WHERE mc.member_application_id = 'member-uuid'
ORDER BY mc.start_date DESC;
```

### Example 4: Company Statistics
```sql
SELECT 
  c.name,
  c.name_th,
  COUNT(DISTINCT mc.member_application_id) FILTER (WHERE mc.status = 'active') AS active_members,
  COUNT(DISTINCT mc.member_application_id) FILTER (WHERE mc.status = 'inactive') AS inactive_members,
  COUNT(DISTINCT mc.member_application_id) AS total_members_ever
FROM companies c
LEFT JOIN member_companies mc ON c.id = mc.company_id
GROUP BY c.id, c.name, c.name_th
ORDER BY active_members DESC;
```

---

## 🔒 RLS Policies

### Policy 1: Admin Access
```sql
-- Admins can do everything (SELECT, INSERT, UPDATE, DELETE)
member_companies_admin_all
```
**Who:** system_admin, admin, project_manager, qshe_manager  
**Access:** Full CRUD

### Policy 2: Public Read
```sql
-- Public can view active member-company relationships
member_companies_public_select
```
**Who:** Unauthenticated users (anon)  
**Access:** SELECT only active records  
**Use Case:** Public member lists in forms

---

## 🎨 Future Member Management Features

### Planned Features:

1. **Member Dashboard**
   - View member profile
   - See all companies (current + past)
   - Employment timeline
   - Position history

2. **Company Assignment**
   - Add member to new company
   - Transfer member between companies
   - Update position/role
   - Set start/end dates

3. **Work History Tracking**
   - See full employment history
   - Track positions at each company
   - Calculate tenure
   - Export reports

4. **Multi-Company Views**
   - See which members work for multiple companies
   - Identify shared resources
   - Track contractor movements

5. **Bulk Operations**
   - Assign multiple members to company
   - Transfer group of members
   - Batch status updates

---

## 📝 Migration Steps

### Step 1: Run Migration SQL
```cmd
type c:\pwa\qshe10\qshe\database\create_member_companies_table.sql
```
- Copy output
- Paste in Supabase SQL Editor
- Click "Run"

### Step 2: Verify Tables Created
```sql
-- Should return 1 row
SELECT * FROM information_schema.tables 
WHERE table_name = 'member_companies';

-- Should return 12 columns
SELECT COUNT(*) FROM information_schema.columns 
WHERE table_name = 'member_companies';
```

### Step 3: Test Trigger
```sql
-- Create a test member (if not exists)
-- Trigger should auto-create member_companies record

-- Check if record was created
SELECT * FROM member_companies 
WHERE member_application_id IN (
  SELECT id FROM member_applications LIMIT 1
);
```

### Step 4: Test View
```sql
-- Should show members with their companies
SELECT * FROM member_all_companies LIMIT 5;
```

---

## ⚠️ Important Notes

### Primary Company vs Additional Companies

**Primary Company** (`member_applications.company_id`):
- Set during registration (from token)
- Cannot be NULL
- Represents the company that registered the member
- Important for tracking origin

**Additional Companies** (`member_companies`):
- Can add unlimited companies
- Includes the primary company (via trigger)
- Has start/end dates
- Has position and status tracking

### Data Integrity

**Cascade Delete:**
- If member is deleted → All member_companies records deleted
- If company is deleted → All member_companies records for that company deleted

**Unique Constraint:**
- Member can only be linked to each company ONCE
- If need to re-add, UPDATE the existing record instead

**Status Tracking:**
- `active` - Currently working
- `inactive` - No longer working
- `terminated` - Employment terminated

---

## 🚀 Next Steps

1. **Run the migration** (create_member_companies_table.sql)
2. **Test with existing members** (trigger should work)
3. **Build Member Management UI** (future feature)
4. **Add company assignment features** (admin interface)
5. **Create reports** (member work history, company rosters)

---

## 📊 Benefits of This Design

✅ **Scalability:** Support unlimited companies per member  
✅ **Historical Data:** Track full employment history  
✅ **Flexibility:** Easy to add/remove company relationships  
✅ **Reporting:** Rich data for analytics and reports  
✅ **Real-World:** Matches how contractors actually work  
✅ **Future-Proof:** Ready for advanced member management  

---

**Status:** ✅ **DESIGN COMPLETE** - Ready to migrate!

**Files Created:**
1. `database/create_member_companies_table.sql` - Migration script
2. `database/schema/schema_member_companies` - Schema file
3. `MEMBER_COMPANIES_DESIGN.md` - This documentation
