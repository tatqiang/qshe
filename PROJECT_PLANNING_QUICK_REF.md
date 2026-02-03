# Construction Project Planning - Quick Reference

## 🚀 Quick Start

1. **Navigate** to `/project-planning`
2. **Click** "Select Project"
3. **Choose** your project
4. **Click** "Create Default Tasks"
5. **View** Gantt chart
6. **Click** tasks to edit

## 📋 What's New

✅ **Integrated with existing `projects` table**
✅ **Area & location tracking for each task**
✅ **Store all data in Supabase**
✅ **7-phase construction template (180 days)**
✅ **Interactive Gantt chart**

## 🗄️ Database Setup

```sql
-- Run this in Supabase SQL Editor:
-- Copy contents from: database/schema/schema_construction_tasks
```

Creates `construction_tasks` table with:
- Links to your projects
- Area/location fields
- Task dependencies
- Progress tracking

## 📍 Location System

Each task can have:
- **Main Area** → from `main_areas` table (e.g., "Building A")
- **Sub Area** → from `sub_areas_1` table (e.g., "Floor 3")
- **Location Detail** → text field (e.g., "Room 301, SE corner")

Example:
```
Task: Install Electrical Panels
├─ Main Area: Building A
├─ Sub Area: Floor 2  
└─ Location Detail: Electrical room ER-201
```

## 🎯 Key Features

| Feature | Description |
|---------|-------------|
| **Project Integration** | Uses existing projects table |
| **Area Tracking** | Link tasks to specific locations |
| **Dependencies** | Tasks wait for predecessors |
| **Progress** | 0-100% completion tracking |
| **Status** | not-started → in-progress → completed |
| **Gantt Chart** | Visual timeline (Day/Week/Month/Quarter) |
| **Auto-Save** | Changes saved to Supabase instantly |

## 🔨 Default Template

7 phases, 25+ tasks, 180 days:

1. **Pre-Construction** (30d) - Survey, Design, Permits
2. **Site Preparation** (15d) - Clearing, Utilities
3. **Foundation** (20d) - Excavation, Concrete
4. **Structural** (45d) - Frame, Roof, Walls
5. **MEP Systems** (35d) - Electrical, Plumbing, HVAC
6. **Interior** (40d) - Drywall, Flooring, Painting
7. **Completion** (15d) - Fixtures, Inspections, Handover

## 🎨 Task Types

- **Phase** - Major project phase
- **Milestone** - Key completion point
- **Task** - Standard work item
- **Subtask** - Detailed sub-work

## 📊 Progress Tracking

Click any task to update:
- **Status** → Dropdown selector
- **Progress** → 0-100% slider
- **Dates** → Start/end adjustment
- **Location** → Area selection
- **Notes** → Additional details

## 🔄 Two Views Available

### `/project-planning` (Recommended)
- ✅ Integrated with Supabase
- ✅ Uses existing projects
- ✅ Area/location tracking
- ✅ Auto-save to database

### `/construction-planning` (Optional)
- ✅ Google Sheets integration
- ✅ Team collaboration via Sheets
- ✅ Requires Google Cloud setup
- ⚠️ Separate from main database

## 🛠️ Common Tasks

### Add New Task
1. Click "Add Task"
2. Fill in details
3. Select area/location
4. Set dependencies
5. Auto-saved

### Update Progress
1. Click task in Gantt
2. Move progress slider
3. Or drag progress handle
4. Changes save instantly

### Assign Location
1. Open task details
2. Select Main Area dropdown
3. Select Sub Area dropdown
4. Enter location detail
5. Save

### Export Data
1. Click "Export JSON"
2. Downloads backup file
3. Contains all task data

## 🔗 Related Files

```
database/
  schema/
    schema_construction_tasks     ← Database table
  migrations/
    add_construction_tasks.sql    ← Migration script

src/
  types/
    construction-project.ts       ← TypeScript types
  services/
    constructionTasksService.ts   ← API service
  components/
    GanttChart.vue               ← Chart component
  views/
    ProjectPlanningView.vue      ← Main view (Supabase)
    ConstructionPlanningView.vue ← Google Sheets view
```

## 📖 Full Documentation

- **Setup Guide** → `PROJECT_PLANNING_SETUP.md`
- **Google Sheets** → `CONSTRUCTION_PLANNING_SETUP.md`

## 💡 Tips

- **Use Main Areas** for building/zone organization
- **Use Sub Areas** for floor/section details
- **Location Detail** for specific room/grid coordinates
- **Dependencies** use taskId (e.g., "task-1-1") not UUID
- **Export regularly** to backup project data
- **Month view** best for overview, Day view for details

## ⚠️ Prerequisites

- ✅ Projects table exists
- ✅ Main areas defined for project
- ✅ Supabase connection configured
- ✅ construction_tasks table created

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| No projects show | Check Supabase connection |
| Tasks won't load | Verify RLS policies |
| Areas not available | Create main_areas for project |
| Can't update | Check user permissions |
| Dependencies broken | Use taskId not UUID |

## 📞 Need Help?

1. Check browser console (F12)
2. Review `PROJECT_PLANNING_SETUP.md`
3. Verify database schema is created
4. Check Supabase logs

---

**Ready to start?** → Navigate to `/project-planning` 🚀
