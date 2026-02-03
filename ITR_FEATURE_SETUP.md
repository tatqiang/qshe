# ITR (Inspection and Test Request) Feature - Complete Setup Guide

## Overview
Enhanced ITR feature with sophisticated workflow management, project teams, flexible status labels, and comprehensive file management. Users can request inspections for construction tasks with a complete approval workflow from Plan → Internal Request → Confirmation → Review → Approval/Rejection.

## 🎯 What's New in Enhanced Version
- ✅ **4-Stage Workflow**: Plan, Internal Requested, Confirm Requested, Approved/In Review/Rejected
- ✅ **Flexible Status Labels**: Change display text without touching code (enum + table approach)
- ✅ **Project Teams**: QA/QC, MEP, Planning, Safety, Engineering teams
- ✅ **Team Notifications**: Auto-notify QA/QC team when ITR is internally requested
- ✅ **ITR No Assignment**: Hidden until QA/QC confirms (Stage 3)
- ✅ **DO Files**: Add Delivery Order file attachments
- ✅ **Multiple File Types**: PDF and images (jpg, png, gif, webp)
- ✅ **Additional Files**: Attach multiple files (drawings, photos, documents)

## Database Setup

### Step 1: Run Migrations (IN THIS ORDER!)

Execute these SQL files in your Supabase database **in the exact order listed**:

1. **`database/migrations/create_construction_systems_table.sql`**
   - Creates `construction_systems` table
   - Stores project-specific systems (HVAC, Plumbing, Fire Protection, Electrical, Structural)

2. **`database/migrations/create_construction_itr_types_table.sql`**
   - Creates `construction_itr_types` table
   - Stores ITR types (Installation and Test, Materials, Benchmark, Training)

3. **`database/migrations/create_construction_itrs_table.sql`**
   - Creates `construction_itrs` table (basic version)
   - Main ITR records with foreign keys to systems, ITR types, tasks, and areas

4. **`database/migrations/create_itr_status_definitions.sql`** ⭐ NEW
   - Creates `itr_status_code` enum (plan, internal_requested, confirm_requested, in_review, approved, rejected)
   - Creates `itr_status_definitions` table with editable display labels
   - Seeds default status definitions with colors and icons

5. **`database/migrations/create_project_teams.sql`** ⭐ NEW
   - Creates `project_teams` table (QA/QC, MEP, Planning, Safety, Engineering)
   - Creates `project_team_members` table (many-to-many relationship)
   - Sets up RLS policies

6. **`database/migrations/update_itrs_for_workflow.sql`** ⭐ NEW
   - Updates `construction_itrs` table with workflow columns
   - Adds status_code, PIC, timestamps, reviewers, DO file, additional files
   - Creates `itr_with_details` view for complete ITR information

7. **`database/migrations/create_team_functions.sql`** ⭐ NEW
   - Creates `create_default_project_teams()` function
   - Creates `auto_assign_member_to_teams()` function for auto-assignment based on position

### Step 2: Use Existing Storage Bucket
You'll use your existing **`qshe`** bucket with a new folder for ITR files:

**Folder Structure:**
```
qshe/
├── patrols/           (existing patrol photos)
├── construction-itrs/ (NEW - ITR documents)
```

**What's stored in `construction-itrs/`:**
- 📄 Drawing files (PDF, images)
- 📦 DO (Delivery Order) files
- 📎 Additional files (inspection reports, certificates, photos, etc.)

**✅ No action needed** - Your existing `qshe` bucket already has the necessary policies!

If you need to verify or update policies for the `qshe` bucket, run in Supabase SQL Editor:

```sql
-- Verify existing policies (should already exist from patrol setup)
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- If policies don't exist, create them:
CREATE POLICY "Users can upload files to qshe"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'qshe');

CREATE POLICY "Users can view files in qshe"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'qshe');

CREATE POLICY "Users can update files in qshe"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'qshe');

CREATE POLICY "Users can delete files in qshe"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'qshe');
```

### Step 3: Initialize Project Teams
For each existing project, create default teams:

```sql
-- Replace {project-id} and {user-id} with actual values
SELECT create_default_project_teams('{project-id}'::uuid, '{user-id}'::uuid);
```

This creates 5 default teams:
- QA/QC Team (QAQC)
- MEP Team (MEP)
- Planning Team (PLAN)
- Safety Team (SAFE)
- Engineering Team (ENG)

### Step 4: Assign Members to Teams
Auto-assign existing project members based on their position:

```sql
-- For each project member
SELECT auto_assign_member_to_teams('{project-member-id}'::uuid);
```

Or manually assign via SQL:
```sql
INSERT INTO project_team_members (project_team_id, project_member_id, role_in_team)
SELECT 
  pt.id,
  pm.id,
  'Member'
FROM project_teams pt
CROSS JOIN project_members pm
WHERE pt.project_id = pm.project_id
  AND pt.team_code = 'QAQC'
  AND pm.user_id IN (
    SELECT id FROM users WHERE position_id IN (
      SELECT id FROM positions WHERE code IN ('QAM', 'QE-E', 'QE-M', 'Q-Adm')
    )
  )
ON CONFLICT DO NOTHING;
```

## Google Sheets Integration

### Step 5: Get Google Sheets API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google Sheets API**
4. Create **API Key** (restrict to Google Sheets API)
5. Add to `.env` file:
   ```env
   VITE_GOOGLE_SHEETS_API_KEY=your_api_key_here
   ```

### Google Sheets Configuration
The feature integrates with two Google Sheets for autocomplete:

**ITP Sheet:**
- Sheet ID: `1DvfGfTpIdevgHk3JQJy9n6I6LyTzvR7j4x6VNQjop-k`
- Sheet Name: `ITP`
- Columns: A=Item, B=Discipline, C=Doc_no, D=Title
- Must be publicly readable or shared with service account

**Materials Sheet:**
- Sheet ID: `1TLPnJFUGduj3Ypjba0pNPb3IKZrcqCKazxz9fCocnok`
- Sheet Name: `Materials`
- Columns: A=Item, B=Discipline, C=Doc_no, D=Title, E=Link
- Must be publicly readable or shared with service account

## Enhanced ITR Workflow

### Workflow Stages

#### Stage 1: Plan (Initial State)
**Status:** `plan` (Display: "Plan")  
**Who:** Person in Charge (PIC)  
**Actions:**
- Create new ITR
- Fill all required fields (Title, System, ITR Type)
- Fill optional fields (ITP, Location, Drawing, Material)
- Upload files (Drawing PDF/Image, DO PDF/Image, Additional files)
- **ITR No field:** Hidden (not yet assigned)

#### Stage 2: Internal Requested
**Status:** `internal_requested` (Display: "Internal Requested")  
**Who:** PIC clicks "Request Internally"  
**Actions:**
- System changes status to `internal_requested`
- Records timestamp and requester
- **Notifies all QA/QC team members** 📧
- **ITR No field:** Still hidden

#### Stage 3: Confirm Requested
**Status:** `confirm_requested` (Display: "Confirm Requested")  
**Who:** QA/QC Team member  
**Actions:**
- QA/QC reviews ITR
- **Assigns ITR No** (e.g., `ITR-CHN1A-FP-001`)
- **ITR No field:** Now visible and editable ✅
- Records timestamp and confirmer
- Notifies PIC

#### Stage 4: Review & Approval
**Status:** `in_review`, `approved`, or `rejected`  
**Who:** QA/QC or External Inspector  
**Actions:**
- Set to `in_review` when inspection starts
- Add review comments
- Attach inspection photos/documents
- Final status: `approved` or `rejected`
- If rejected, can resubmit (new ITR or revision)

### File Management

**Drawing File:**
- Single file
- Supports: PDF, JPG, PNG, GIF, WEBP
- Field: `drawing_file_url`

**DO File (Delivery Order):** ⭐ NEW
- Single file
- Supports: PDF, JPG, PNG, GIF, WEBP
- Fields: `do_file_url`, `do_file_name`

**Additional Files:** ⭐ NEW
- Multiple files
- Supports: PDF, JPG, PNG, GIF, WEBP
- Stored as JSONB array: `additional_files`
- Each file includes: url, name, type, size, uploadedAt, uploadedBy

## Feature Components

### Database Tables Created:
1. **`construction_systems`** - Project-specific systems (HVAC, Plumbing, FP, Electrical, Structural)
2. **`construction_itr_types`** - ITR types (Installation & Test, Materials, Benchmark, Training)
3. **`construction_itrs`** - Main ITR records with workflow columns
4. **`itr_status_definitions`** ⭐ NEW - Editable status labels with colors/icons
5. **`project_teams`** ⭐ NEW - Teams within projects (QA/QC, MEP, Planning, Safety, Engineering)
6. **`project_team_members`** ⭐ NEW - Team membership (many-to-many)

### Views Created:
1. **`itr_with_details`** ⭐ NEW - Complete ITR view with:
   - Status display labels and colors
   - PIC, requester, confirmer, reviewer names
   - Team information
   - Task and project details

### Functions Created:
1. **`create_default_project_teams()`** ⭐ NEW - Auto-create teams for new projects
2. **`auto_assign_member_to_teams()`** ⭐ NEW - Auto-assign members based on position codes

### TypeScript Types (in `src/types/construction-project.ts`):
- `ITRStatusCode` ⭐ NEW - Enum for status codes
- `ITRStatusDefinition` ⭐ NEW - Status definition interface
- `ProjectTeam` ⭐ NEW - Project team interface
- `ProjectTeamMember` ⭐ NEW - Team member interface
- `FileAttachment` ⭐ NEW - File attachment interface
- `ConstructionSystem`
- `ITRType`
- `ITPDocument`
- `MaterialDocument`
- `ConstructionITR` (enhanced with workflow fields)

### Service Layer (`src/services/constructionITRService.ts`):
- Systems CRUD operations
- ITR Types CRUD operations
- ITRs CRUD operations with workflow
- Google Sheets integration (ITP, Materials)
- File upload to Supabase Storage
- Auto-seeding of default data
- ⭐ NEW: Team management methods
- ⭐ NEW: Status transition validation
- ⭐ NEW: Workflow state management

### UI Components:
1. **`src/components/ITRRequestModal.vue`** - Enhanced ITR request form
   - Status-aware form (shows/hides fields based on status)
   - DO file upload ⭐ NEW
   - Additional files upload ⭐ NEW
   - Team selector ⭐ NEW
   
2. **`src/components/GanttChart.vue`** - Added 📋 Request ITR button to tasks/subtasks

3. **`src/views/ProjectPlanningView.vue`** - Integrated ITR modal with workflow handlers

## Usage Guide

### For PIC (Person in Charge):

#### Creating an ITR (Stage 1: Plan)
1. Open a project in Project Planning view
2. Find the task or subtask in the Gantt chart
3. Click the **📋** button next to the task name
4. Fill out the form:
   - **Required:** ITR Title, System, ITR Type
   - **Optional:** ITP reference (autocomplete), Location, Drawing No, Material reference
5. Upload files:
   - Drawing file (PDF or image)
   - DO file (PDF or image) ⭐ NEW
   - Additional files (multiple PDFs/images) ⭐ NEW
6. Click **"Save as Draft"** to save in `plan` status

#### Requesting Internally (Stage 2)
1. Open saved ITR from ITR list
2. Review all information
3. Click **"Request Internally"** button
4. System notifies QA/QC team
5. Status changes to `internal_requested`

### For QA/QC Team:

#### Confirming ITR (Stage 3)
1. Receive notification of new ITR request
2. Open ITR from notifications or ITR list
3. Review details
4. Click **"Confirm & Assign ITR No"**
5. Enter or generate ITR No (e.g., `ITR-CHN1A-FP-001`)
6. Status changes to `confirm_requested`
7. ITR No now visible to all users

#### Reviewing ITR (Stage 4)
1. Click **"Start Review"** → status becomes `in_review`
2. Conduct inspection
3. Add review comments
4. Upload additional photos/documents if needed
5. Click **"Approve"** or **"Reject"**
6. Final status: `approved` or `rejected`

## Default Data

### Default Systems (Auto-seeded):
| Item | Code | Description |
|------|------|-------------|
| 1 | M | HVAC |
| 2 | P | Plumbing-Process Piping |
| 3 | FP | Fire Protection |
| 4 | E | Electrical |
| 5 | S | Structural |

### Default ITR Types (Auto-seeded):
| Item | Type Name |
|------|-----------|
| 1 | Installation and Test |
| 2 | Materials |
| 3 | Benchmark |
| 4 | Training |

### Default Project Teams (Created per project):
| Code | Team Name | Typical Members |
|------|-----------|-----------------|
| QAQC | QA/QC Team | QAM, QE-E, QE-M, Q-Adm |
| MEP | MEP Team | PE, SE (MEP-related) |
| PLAN | Planning Team | PM, APM, PD |
| SAFE | Safety Team | QSHEM, SO |
| ENG | Engineering Team | PE, SE |

### Default Status Definitions:
| Code | Display | Color | Icon | Can Edit |
|------|---------|-------|------|----------|
| plan | Plan | Orange | 📝 | Yes |
| internal_requested | Internal Requested | Blue | 📤 | Yes |
| confirm_requested | Confirm Requested | Purple | ✅ | Yes |
| in_review | In Review | Orange | 🔍 | Yes |
| approved | Approved | Green | ✓ | Yes |
| rejected | Rejected | Red | ✗ | Yes |

**Note:** Display names, colors, and icons can be edited in `itr_status_definitions` table without affecting workflow logic!

## Quick Setup Checklist

- [ ] Run all 7 SQL migrations in order
- [ ] ✅ Storage bucket ready (using existing `qshe` bucket)
- [ ] Verify storage bucket policies (optional)
- [ ] Get Google Sheets API key and add to `.env`
- [ ] Initialize project teams for existing projects
- [ ] Auto-assign members to teams
- [ ] Test creating ITR in `plan` status
- [ ] Test requesting internally (notify QA/QC)
- [ ] Test QA/QC confirming and assigning ITR No
- [ ] Test approval/rejection workflow

## Advanced Features

### Customizing Status Labels
You can change status display names without affecting code:

```sql
UPDATE itr_status_definitions
SET display_name = 'Draft', -- Changed from "Plan"
    description = 'ITR is in draft stage',
    color = '#f59e0b'
WHERE code = 'plan';
```

### Creating Custom Teams
```sql
INSERT INTO project_teams (project_id, team_name, team_code, description, created_by)
VALUES 
  ('{project-id}', 'Commissioning Team', 'COMM', 'Commissioning and testing', '{user-id}');
```

### Manual Team Assignment
```sql
INSERT INTO project_team_members (project_team_id, project_member_id, role_in_team)
VALUES 
  ('{team-id}', '{member-id}', 'Team Lead');
```

### Querying ITRs with Full Details
```sql
SELECT * FROM itr_with_details
WHERE project_id = '{project-id}'
  AND status_code = 'internal_requested'
ORDER BY internal_requested_at DESC;
```

## Troubleshooting

### Google Sheets not loading:
- Check API key is correct in `.env`
- Verify sheets are publicly readable
- Check sheet IDs and sheet names match exactly
- Verify columns A-D (ITP) or A-E (Materials) have data in row 1 (headers)

### File upload fails:
- Check storage bucket `qshe` exists (should already exist from patrol feature)
- Verify storage policies are set correctly (run SELECT query in Step 2)
- Check file type is PDF or image (jpg, png, gif, webp)
- Verify user is authenticated
- Check file size (default limit is 50MB)
- Verify path starts with `construction-itrs/`

### Systems/Types not appearing:
- Default data auto-seeds on first modal open
- Check database migrations ran successfully
- Verify RLS policies allow read access
- Check `project_id` matches

### Team notifications not working:
- Verify project teams exist for the project
- Check team has members assigned
- Verify `target_team_id` is set correctly
- Check notification system is configured

### ITR No field not showing:
- ITR No is hidden in `plan` and `internal_requested` statuses
- Field appears when status is `confirm_requested` or later
- Check `status_code` in database

### Status not changing:
- Verify user has permission to change status
- Check workflow transition is valid (use `canTransition()` logic)
- Verify all required fields are filled for status change
- Check database trigger constraints

## API Integration Examples

### Create ITR (Stage 1)
```typescript
const itr = await constructionITRService.createITR({
  taskId: 'task-uuid',
  projectId: 'project-uuid',
  itrTitle: 'Fire Protection Pipe Installation',
  systemId: 'system-uuid',
  itrTypeId: 'type-uuid',
  picUserId: currentUser.id,
  statusCode: 'plan'
})
```

### Request Internally (Stage 1 → 2)
```typescript
await constructionITRService.requestInternally(itr.id, {
  targetTeamId: qaqcTeamId,
  internalRequestedBy: currentUser.id
})
// Notifies all QA/QC team members
```

### Confirm and Assign ITR No (Stage 2 → 3)
```typescript
await constructionITRService.confirmRequest(itr.id, {
  itrNo: 'ITR-CHN1A-FP-001',
  confirmRequestedBy: qaqcUser.id
})
// ITR No now visible
```

### Approve ITR (Stage 4)
```typescript
await constructionITRService.approveITR(itr.id, {
  reviewComments: 'All inspections passed',
  reviewedBy: inspectorUser.id
})
```

## Related Documentation
- **[ITR_WORKFLOW_DESIGN.md](ITR_WORKFLOW_DESIGN.md)** - Complete workflow specification, API endpoints, UI components
- **Database Schema** - See migration files for detailed table structures
- **TypeScript Types** - See `src/types/construction-project.ts` for interface definitions

## Next Steps After Setup
1. ✅ Test complete workflow from Plan to Approved
2. ✅ Customize status labels for your organization
3. ✅ Set up team structure for each project
4. ✅ Configure notification preferences
5. ✅ Train users on ITR workflow
6. ✅ Create ITR templates for common inspections (future)
7. ✅ Set up automated ITR reporting (future)
