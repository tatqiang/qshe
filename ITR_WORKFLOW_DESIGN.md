# ITR Workflow System - Complete Design

## Overview
Enhanced ITR (Inspection and Test Request) system with sophisticated workflow management, project teams, and flexible status labels.

## Workflow States

### 1. Plan (Initial State)
**Status Code:** `plan`  
**Display:** "Plan" (editable)  
**Who:** Person in Charge (PIC)  
**Actions:**
- Create new ITR
- Fill all ITR details
- Attach files (drawing, DO, additional files)
- Edit all fields
- **ITR No field:** Hidden (not yet assigned)

**Visible Fields:**
- ITR Title
- System
- ITR Type
- ITP Reference (autocomplete)
- Location (Area, Sub Area, Details)
- Drawing No + File Upload
- DO File Upload
- Material Reference (autocomplete)
- Additional Files Upload

### 2. Internal Requested
**Status Code:** `internal_requested`  
**Display:** "Internal Requested" (editable)  
**Who:** PIC confirms and sends to QA/QC Team  
**Actions:**
- PIC clicks "Request Internally" button
- System notifies all QA/QC team members
- Records timestamp and requester
- **ITR No field:** Still hidden

**Permissions:**
- PIC can still edit some fields
- QA/QC team members can view

### 3. Confirm Requested
**Status Code:** `confirm_requested`  
**Display:** "Confirm Requested" (editable)  
**Who:** QA/QC Team member  
**Actions:**
- QA/QC reviews and assigns ITR No
- **ITR No field:** Now visible and editable
- Records timestamp and confirmer
- System may generate ITR No automatically or manually entered

**ITR No Assignment:**
- Format: `ITR-{Project Code}-{System Code}-{Sequential}`
- Example: `ITR-CHN1A-FP-001`
- Can be obtained after external party acceptance

### 4. In Review
**Status Code:** `in_review`  
**Display:** "In Review" (editable)  
**Who:** QA/QC or External Inspector  
**Actions:**
- Inspection is being conducted
- QA/QC can add review comments
- Can attach inspection photos/documents

### 5. Approved
**Status Code:** `approved`  
**Display:** "Approved" (editable)  
**Who:** QA/QC or External Inspector  
**Actions:**
- ITR passed inspection
- Final review comments recorded
- Timestamp and approver recorded

### 6. Rejected
**Status Code:** `rejected`  
**Display:** "Rejected" (editable)  
**Who:** QA/QC or External Inspector  
**Actions:**
- ITR failed inspection
- Rejection reasons required
- Can resubmit (create new ITR or revise)

## Status Management Architecture

### Hybrid Approach: Enum + Table

**Why this design?**
- **Enum (`itr_status_code`)**: Ensures workflow integrity, prevents invalid states
- **Table (`itr_status_definitions`)**: Allows changing display labels without code changes

**Benefits:**
✅ Change "Plan" to "Draft" or "Planning" without touching code  
✅ Translate to Thai: "แผน" for "Plan"  
✅ Update colors/icons for better UX  
✅ Maintain strict workflow logic  
✅ Audit trail of label changes  

### Status Definition Table Structure
```sql
itr_status_definitions:
  - code: itr_status_code (enum, primary key)
  - display_name: VARCHAR(100) -- Editable!
  - description: TEXT
  - color: VARCHAR(20) -- e.g., '#10b981'
  - icon: VARCHAR(50) -- e.g., '✓' or '📝'
  - sort_order: INTEGER
  - can_edit: BOOLEAN -- Can user manually set?
```

### Workflow Rules
```typescript
Allowed Transitions:
plan → internal_requested
internal_requested → confirm_requested
confirm_requested → in_review
in_review → approved | rejected
rejected → plan (resubmit)

// Enforce in application layer
const canTransition = (from: ITRStatusCode, to: ITRStatusCode) => {
  const transitions = {
    plan: ['internal_requested'],
    internal_requested: ['confirm_requested'],
    confirm_requested: ['in_review'],
    in_review: ['approved', 'rejected'],
    rejected: ['plan'], // Allow resubmission
    approved: [] // Final state
  }
  return transitions[from]?.includes(to) || false
}
```

## Project Teams Structure

### team Structure
```
project_teams:
  - QA/QC Team (code: QAQC)
  - MEP Team (code: MEP)
  - Planning Team (code: PLAN)
  - Safety Team (code: SAFE)
  - Engineering Team (code: ENG)
```

### Team Membership
```
project_team_members (many-to-many):
  - One project member can join multiple teams
  - Each member has optional role_in_team ('Team Lead', 'Member', 'Reviewer')
```

### Auto-Assignment Rules
Based on position code from `positions` table:

**QA/QC Team:**
- QAM (QA/QC Manager) → Team Lead
- QE-E (Electrical QA/QC Engineer) → Engineer
- QE-M (Mechanical QA/QC Engineer) → Engineer
- Q-Adm (QA/QC Admin) → Admin

**MEP Team:**
- PE, SE → Engineer
- (Any MEP-related positions)

**Planning Team:**
- PM, APM, PD → Manager

**Safety Team:**
- QSHEM (QSHE Manager) → Team Lead
- SO (Safety Officer) → Officer

**Engineering Team:**
- PE (Project Engineer) → Engineer
- SE (Site Engineer) → Engineer

## File Management

### Supported File Types
- **PDF**: .pdf
- **Images**: .jpg, .jpeg, .png, .gif, .webp

### File Fields

1. **Drawing File** (`drawing_file_url`)
   - Single file
   - Supports PDF or Image
   - Stored in: `construction-drawings/{projectId}/{itrId}/drawing_{timestamp}.ext`

2. **DO File** (`do_file_url`, `do_file_name`)
   - Delivery Order file
   - Single file
   - Supports PDF or Image
   - Stored in: `construction-drawings/{projectId}/{itrId}/do_{timestamp}.ext`

3. **Additional Files** (`additional_files` JSONB array)
   - Multiple files
   - Each file:
     ```json
     {
       "url": "https://...",
       "name": "inspection_photo_1.jpg",
       "type": "image",
       "size": 1024000,
       "uploadedAt": "2026-02-01T...",
       "uploadedBy": "user-uuid"
     }
     ```
   - Stored in: `construction-drawings/{projectId}/{itrId}/additional_{timestamp}_{filename}.ext`

## Notifications

### When to Notify

1. **Internal Requested** → Notify all QA/QC team members
   - Recipients: All active members of target team (default: QA/QC)
   - Message: "New ITR #{itrNo} has been requested by {PIC name} for task {task name}"

2. **Confirm Requested** → Notify PIC
   - Recipient: Original PIC
   - Message: "ITR #{itrNo} has been confirmed and assigned"

3. **Approved/Rejected** → Notify PIC and relevant teams
   - Recipients: PIC + team members involved
   - Message: "ITR #{itrNo} has been {approved/rejected}"

## Database Schema Summary

### New Tables Created
1. `itr_status_definitions` - Editable status labels
2. `project_teams` - Teams within projects
3. `project_team_members` - Team membership (many-to-many)

### Updated Tables
1. `construction_itrs` - Added workflow columns:
   - `status_code` (enum)
   - `pic_user_id`
   - `internal_requested_at`, `internal_requested_by`
   - `confirm_requested_at`, `confirm_requested_by`
   - `itr_no_assigned_at`
   - `reviewed_at`, `reviewed_by`, `review_comments`
   - `target_team_id`
   - `do_file_url`, `do_file_name`
   - `additional_files` (JSONB array)

### Views Created
1. `itr_with_details` - Complete ITR view with:
   - Status display labels
   - User names (PIC, requesters, reviewers)
   - Team information
   - Task and project details

### Functions Created
1. `create_default_project_teams()` - Auto-create teams for new projects
2. `auto_assign_member_to_teams()` - Auto-assign members based on position

## Migration Order

Run in this sequence:
1. `create_itr_status_definitions.sql` - Status system
2. `create_project_teams.sql` - Team structure
3. `update_itrs_for_workflow.sql` - Update ITR table
4. `create_team_functions.sql` - Helper functions

## API Endpoints Needed

### Status Management
- `GET /api/itr/statuses` - Get all status definitions
- `PUT /api/itr/statuses/:code` - Update status display label (admin only)

### Team Management
- `GET /api/projects/:projectId/teams` - Get project teams
- `POST /api/projects/:projectId/teams` - Create team
- `GET /api/projects/:projectId/teams/:teamId/members` - Get team members
- `POST /api/projects/:projectId/teams/:teamId/members` - Add member to team
- `DELETE /api/projects/:projectId/teams/:teamId/members/:memberId` - Remove from team

### ITR Workflow
- `POST /api/itrs` - Create ITR (status: plan)
- `PUT /api/itrs/:id` - Update ITR
- `POST /api/itrs/:id/request-internal` - Change to internal_requested
- `POST /api/itrs/:id/confirm` - Change to confirm_requested (assign ITR No)
- `POST /api/itrs/:id/review` - Change to in_review
- `POST /api/itrs/:id/approve` - Change to approved
- `POST /api/itrs/:id/reject` - Change to rejected
- `POST /api/itrs/:id/files` - Upload additional files
- `GET /api/itrs/:id/files` - Get file list

### Notifications
- `GET /api/users/notifications` - Get user notifications
- `POST /api/notifications/mark-read/:id` - Mark as read

## UI Components Needed

### 1. ITR Status Badge
Shows current status with color and icon from definition table.

### 2. ITR Request Form (Enhanced)
- Show/hide ITR No field based on status
- File upload for drawing, DO, additional files
- Team selector (default: QA/QC)

### 3. Team Management Panel
- View teams
- Assign members to teams
- Set team roles

### 4. ITR Workflow Actions
Contextual buttons based on status:
- Plan: "Request Internally"
- Internal Requested: "Confirm & Assign ITR No" (QA/QC only)
- Confirm Requested: "Start Review"
- In Review: "Approve" / "Reject"

### 5. ITR List/Dashboard
Filter by:
- Status
- Team
- PIC
- Date range

## Example Workflow

```typescript
// 1. PIC creates ITR
const itr = await createITR({
  taskId: 'task-123',
  projectId: 'project-456',
  itrTitle: 'Fire Protection Pipe Installation',
  systemId: 'fp-system-id',
  itrTypeId: 'installation-type-id',
  statusCode: 'plan',
  picUserId: currentUser.id
})

// 2. PIC requests internally
await requestInternally(itr.id, {
  targetTeamId: qaqcTeamId
})
// Status → internal_requested
// Notify all QA/QC team members

// 3. QA/QC confirms and assigns ITR No
await confirmRequest(itr.id, {
  itrNo: 'ITR-CHN1A-FP-001',
  confirmRequestedBy: qaqcUser.id
})
// Status → confirm_requested
// ITR No now visible

// 4. Start review
await startReview(itr.id)
// Status → in_review

// 5. Approve or reject
await approveITR(itr.id, {
  reviewComments: 'All checks passed',
  reviewedBy: inspectorUser.id
})
// Status → approved
```

## Future Enhancements
- [ ] Email/SMS notifications
- [ ] ITR templates for common inspections
- [ ] Bulk ITR creation
- [ ] QR code for quick ITR lookup
- [ ] Mobile signature capture
- [ ] Offline mode
- [ ] ITR analytics dashboard
- [ ] Integration with external inspection systems
