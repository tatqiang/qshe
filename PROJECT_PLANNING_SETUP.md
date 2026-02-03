# Construction Project Planning with Supabase Integration

## Overview

This module provides construction project planning with Gantt chart visualization, integrated with your existing Supabase `projects` table. Each project can have detailed construction tasks with area/location tracking for precise site management.

## Key Features

✅ **Integrated with Existing Projects** - Works with your current `projects` table
✅ **Area & Location Tracking** - Link tasks to main areas and sub-areas
✅ **Interactive Gantt Chart** - Visual timeline of construction phases
✅ **Default Construction Template** - 7-phase standard workflow (180 days)
✅ **Task Management** - Track progress, status, dependencies, costs
✅ **Database Storage** - All data stored in Supabase
✅ **Offline Capability** - PWA features for offline work
✅ **Optional Google Sheets Sync** - Export to Google Sheets for collaboration

## Database Setup

### 1. Run the Migration

Execute the schema file to create the `construction_tasks` table:

```bash
# Using psql
psql -U your_username -d your_database -f database/schema/schema_construction_tasks

# Or in Supabase SQL Editor
# Copy and paste the contents of database/schema/schema_construction_tasks
```

### 2. Database Structure

**construction_tasks** table includes:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| project_id | uuid | Links to projects table |
| task_id | varchar(100) | Custom ID for dependencies (e.g., task-1-1) |
| name | varchar | Task name |
| type | varchar(20) | phase, milestone, task, subtask |
| start_date | date | Task start date |
| end_date | date | Task end date |
| progress | integer | 0-100 completion percentage |
| status | varchar(20) | not-started, in-progress, completed, on-hold, delayed |
| priority | varchar(20) | low, medium, high, critical |
| dependencies | text | Comma-separated task IDs |
| assignee | varchar | Person responsible |
| description | text | Detailed description |
| cost | numeric | Budget allocation |
| actual_start | date | Actual start date |
| actual_end | date | Actual completion date |
| **main_area_id** | uuid | FK to main_areas table |
| **sub_area_1_id** | uuid | FK to sub_areas_1 table |
| **location_detail** | text | Specific location (e.g., "Building A, Floor 3, Room 301") |
| crew | varchar | Team assigned |
| equipment | text | Equipment needed (JSON array) |
| materials | text | Materials required (JSON array) |
| notes | text | Additional notes |

### 3. Foreign Key Relationships

```
construction_tasks
  └─ project_id → projects.id
  └─ main_area_id → main_areas.id
  └─ sub_area_1_id → sub_areas_1.id
  └─ created_by → users.id
```

## Usage Guide

### Accessing the Module

Navigate to: `/project-planning`

### Step 1: Select a Project

1. Click "Select Project" button
2. Choose from your existing projects in the database
3. The system will load any existing construction tasks

### Step 2: Create Construction Tasks

**Option A: Use Default Template**
1. Click "Create Default Tasks"
2. System generates 25+ tasks across 7 phases:
   - Pre-Construction (30 days)
   - Site Preparation (15 days)
   - Foundation Work (20 days)
   - Structural Construction (45 days)
   - MEP Systems (35 days)
   - Interior Finishing (40 days)
   - Final Completion (15 days)

**Option B: Add Custom Tasks**
1. Click "Add Task"
2. Fill in task details
3. Select main area and sub-area
4. Set dependencies and schedule

### Step 3: Manage Areas & Locations

1. Click "Manage Areas" button
2. View main areas and sub-areas from your project
3. These are pulled from the existing `main_areas` and `sub_areas_1` tables

### Step 4: Assign Tasks to Locations

When editing a task:
1. Select **Main Area** (e.g., "Building A", "Site North")
2. Select **Sub Area** (e.g., "Floor 3", "Foundation Zone")
3. Add **Location Detail** (e.g., "Room 301, Southeast Corner")

Example:
```
Main Area: Building A
Sub Area: Floor 3
Location Detail: Room 301 - Electrical installation for conference room
```

### Step 5: Use the Gantt Chart

**View Modes:**
- **Day View** - Detailed daily timeline
- **Week View** - Weekly overview
- **Month View** - Monthly planning (default)
- **Quarter View** - Long-term planning

**Interactions:**
- **Click a task** - Opens detailed modal with location info
- **Drag task bars** - Adjust duration
- **Drag progress handle** - Update completion percentage
- **Hover** - Quick preview with location

**Location Display:**
- 📍 Main Area shown in task popup
- 🏢 Sub Area shown in task modal
- Detailed location in task details

### Step 6: Track Progress

**In Task Modal:**
- Update Status (Not Started → In Progress → Completed)
- Adjust Progress slider (0-100%)
- Set actual start/end dates
- Add notes

**Auto-Save:**
- Changes are automatically saved to Supabase
- "Last synced" timestamp updates

### Step 7: Export & Backup

**Export to JSON:**
- Click "Export JSON"
- Downloads complete project data
- Can be used for backup or migration

**Export to Google Sheets** (Optional):
- Use the `/construction-planning` route instead
- Sign in with Google
- Sync to Google Sheets for team collaboration

## Area & Location System

### Hierarchy

```
Project
└─ Main Areas (main_areas table)
   ├─ Building A
   ├─ Building B
   └─ Site Area
      └─ Sub Areas (sub_areas_1 table)
         ├─ Floor 1
         ├─ Floor 2
         └─ Floor 3
            └─ Location Detail (text field)
               ├─ "Room 301 - Southeast corner"
               ├─ "Electrical room - Panel A"
               └─ "Conference Room - North wall"
```

### Use Cases

**1. Multi-Building Projects**
```
Task: Install HVAC System
Main Area: Building A
Sub Area: Floor 2
Location Detail: Mechanical room MR-202
```

**2. Site Work**
```
Task: Excavation
Main Area: Site North
Sub Area: Foundation Zone 1
Location Detail: Grid coordinates A1-A5
```

**3. Infrastructure**
```
Task: Electrical Conduit Installation
Main Area: Underground Utilities
Sub Area: Sector B
Location Detail: From junction box JB-12 to building entrance
```

### Benefits of Location Tracking

1. **Precise Coordination** - Teams know exactly where to work
2. **Resource Planning** - Allocate crew and equipment by area
3. **Progress Tracking** - Monitor completion by building/floor
4. **Conflict Resolution** - Identify overlapping work in same area
5. **Reporting** - Generate reports by location
6. **Quality Control** - Track inspections by specific areas

## Default Construction Template

### Phase 1: Pre-Construction (Days 1-30)
- Site Survey & Investigation
- Design & Engineering
- Permits & Approvals

### Phase 2: Site Preparation (Days 31-45)
- Site Clearing & Grading
- Utility Connections

### Phase 3: Foundation Work (Days 46-65)
- Excavation
- Formwork & Reinforcement
- Concrete Pouring & Curing

### Phase 4: Structural Construction (Days 66-110)
- Frame Construction
- Roof Structure
- External Walls

### Phase 5: MEP Systems (Days 101-135)
- Electrical Rough-In
- Plumbing Installation
- HVAC Installation

### Phase 6: Interior Finishing (Days 126-165)
- Drywall & Insulation
- Flooring
- Painting & Trim

### Phase 7: Final Completion (Days 166-180)
- Fixtures & Fittings
- Cleanup & Landscaping
- Final Inspections
- Project Handover

## API Reference

### Services

**constructionTasksService**

```typescript
// Get all tasks for a project
await constructionTasksService.getTasksByProject(projectId)

// Create a new task
await constructionTasksService.createTask(task)

// Create multiple tasks
await constructionTasksService.createTasks(tasks)

// Update a task
await constructionTasksService.updateTask(taskId, updates)

// Delete a task
await constructionTasksService.deleteTask(taskId)

// Get main areas
await constructionTasksService.getMainAreas(projectId)

// Get sub areas
await constructionTasksService.getSubAreas(mainAreaId)
```

### Types

```typescript
interface ConstructionTask {
  id: string
  taskId: string
  projectId: string
  name: string
  type: TaskType
  start: Date
  end: Date
  progress: number
  status: TaskStatus
  priority: TaskPriority
  dependencies: string[]
  location?: TaskLocation
  // ... other fields
}

interface TaskLocation {
  mainAreaId?: string
  mainAreaName?: string
  subArea1Id?: string
  subArea1Name?: string
  locationDetail?: string
}
```

## Integration with Existing Systems

### Projects Table
- Project planning uses existing projects as parent records
- No modifications needed to projects table
- Project dates sync with task dates

### Areas System
- Uses existing `main_areas` and `sub_areas_1` tables
- No additional area tables required
- Areas can be managed through existing interfaces

### Users System
- Tasks can be assigned to users
- Created by / updated by tracking
- Uses existing user authentication

## Customization

### Modify Default Template

Edit `src/types/construction-project.ts`:

```typescript
export const DEFAULT_CONSTRUCTION_TEMPLATE = {
  name: 'Your Custom Template',
  tasks: [
    {
      id: crypto.randomUUID(),
      taskId: 'custom-1',
      name: 'Your Task',
      type: 'task',
      // ... other properties
    }
  ]
}
```

### Add Custom Fields

1. Update database schema (`schema_construction_tasks`)
2. Update TypeScript interface (`construction-project.ts`)
3. Update service mapping (`constructionTasksService.ts`)
4. Update UI components (`GanttChart.vue`, `ProjectPlanningView.vue`)

## Troubleshooting

### Tasks Not Loading

**Problem:** Tasks don't appear after selecting project

**Solutions:**
1. Check browser console for errors
2. Verify `construction_tasks` table exists
3. Check RLS policies in Supabase
4. Ensure user has access to project

### Areas Not Showing

**Problem:** No areas available when assigning location

**Solutions:**
1. Ensure `main_areas` exist for the project
2. Check area status is 'active'
3. Verify foreign key relationships
4. Run query: `SELECT * FROM main_areas WHERE project_id = 'your-project-id'`

### Dependencies Not Working

**Problem:** Task dependencies not enforcing order

**Solution:**
- Dependencies use `taskId` (e.g., "task-1-1") not UUID
- Ensure taskId values are unique
- Check dependencies array format in database

### Sync Errors

**Problem:** "Failed to sync" error messages

**Solutions:**
1. Check Supabase connection
2. Verify RLS policies allow updates
3. Check for constraint violations
4. Review error messages in console

## Performance Considerations

### Large Projects

For projects with 100+ tasks:
- Gantt chart may slow down in Day/Week view
- Use Month or Quarter view for better performance
- Consider breaking into sub-projects
- Implement task pagination if needed

### Database Queries

- Indexes created on common query fields
- Use project_id filter for all queries
- Areas loaded once per session
- Tasks cached in component state

## Security

### Row Level Security (RLS)

The schema includes RLS policies:
- Users can only view tasks for their projects
- Authentication required for insert/update/delete
- Adjust policies based on your requirements

### Data Validation

- Progress constrained to 0-100
- Dates validated (end after start)
- Foreign keys ensure referential integrity
- Required fields enforced at database level

## Future Enhancements

Potential features to add:

- 📸 **Photo attachments** - Link to project photos by location
- 📋 **Checklists** - Sub-tasks and completion criteria
- 👥 **Team management** - Crew scheduling and allocation
- 📊 **Reports** - Progress reports by area/phase
- 🔔 **Notifications** - Task reminders and updates
- 📱 **Mobile app** - Field updates from mobile devices
- 🗓️ **Calendar view** - Alternative to Gantt chart
- 💰 **Cost tracking** - Actual vs budget reporting
- 🎯 **Milestones** - Critical path analysis
- 🔄 **Version history** - Track plan changes over time

## Support

For issues or questions:
1. Check this documentation
2. Review browser console for errors
3. Verify database setup and RLS policies
4. Check Supabase logs for API errors

## Routes

- `/project-planning` - Supabase-integrated view (recommended)
- `/construction-planning` - Google Sheets integration view (optional)

Both views provide similar functionality with different data storage backends.
