# ITR Feature - Quick Start Guide

## 📋 What You Need to Complete

### 1. Database Setup (Supabase)
Run these 7 SQL files **in order** in Supabase SQL Editor:

```bash
1. database/migrations/create_construction_systems_table.sql
2. database/migrations/create_construction_itr_types_table.sql
3. database/migrations/create_construction_itrs_table.sql
4. database/migrations/create_itr_status_definitions.sql ⭐ NEW
5. database/migrations/create_project_teams.sql ⭐ NEW
6. database/migrations/update_itrs_for_workflow.sql ⭐ NEW
7. database/migrations/create_team_functions.sql ⭐ NEW
```

### 2. Storage Bucket
Use existing **`qshe`** bucket (no new bucket needed!):
- ✅ Already exists from patrol feature
- ✅ ITR files stored in `construction-itrs/` folder
- ✅ Existing policies apply automatically
- Stores: Drawing files, DO files, inspection reports, photos, certificates
- See [ITR_FEATURE_SETUP.md](ITR_FEATURE_SETUP.md) if you need to verify policies

### 3. Environment Variables
Add to `.env` file:
```env
VITE_GOOGLE_SHEETS_API_KEY=your_api_key_here
```

Get API key from: https://console.cloud.google.com/
- Enable Google Sheets API
- Create API Key
- Restrict to Google Sheets API

### 4. Initialize Teams (for existing projects)
Run in Supabase SQL Editor:
```sql
-- Replace with your project ID and user ID
SELECT create_default_project_teams(
  '{your-project-id}'::uuid,
  '{your-user-id}'::uuid
);
```

## 🎯 Enhanced Workflow

### 4 Stages:
1. **Plan** - PIC creates ITR (ITR No hidden)
2. **Internal Requested** - PIC requests, QA/QC notified (ITR No still hidden)
3. **Confirm Requested** - QA/QC assigns ITR No (ITR No now visible! ✅)
4. **Approved/Rejected** - Final review

### Key Features:
- ✅ ITR No hidden until QA/QC confirms (Stage 3)
- ✅ DO file upload (Delivery Order)
- ✅ Multiple additional files (PDFs + images)
- ✅ Project teams (QA/QC, MEP, Planning, Safety, Engineering)
- ✅ Team notifications
- ✅ Editable status labels

## 📚 Full Documentation
- **[ITR_FEATURE_SETUP.md](ITR_FEATURE_SETUP.md)** - Complete setup guide
- **[ITR_WORKFLOW_DESIGN.md](ITR_WORKFLOW_DESIGN.md)** - Detailed workflow specification

## ✅ Checklist
- [ ] 7 SQL migrations executed
- [ ] ✅ Storage bucket ready (using existing `qshe`)
- [ ] Storage policies verified (optional)
- [ ] Google Sheets API key added
- [ ] Teams initialized
- [ ] Test: Create ITR
- [ ] Test: Request internally
- [ ] Test: QA/QC confirms & assigns ITR No
- [ ] Test: Approve/Reject

## 🚀 Ready to Use!
Once completed, you'll see:
- 📋 button on all tasks/subtasks in Gantt chart
- ITR request modal with workflow
- Team management
- Complete approval workflow
