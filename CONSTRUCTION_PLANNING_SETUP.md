# Construction Project Planning with Google Workspace Integration

## Overview

This module enables construction project planning with Gantt chart visualization and Google Workspace integration (Google Sheets, Calendar, Drive). Projects can be created from templates, synced to Google Sheets for collaboration, and managed through an interactive Gantt chart interface.

## Features

✅ **Interactive Gantt Chart** - Visual timeline of construction phases and tasks
✅ **Google Sheets Integration** - Store and sync project data in Google Sheets
✅ **Default Construction Template** - 7-phase standard construction workflow
✅ **Real-time Updates** - Sync task progress, status, and dates
✅ **Task Management** - Track dependencies, assignees, progress, and costs
✅ **Collaboration** - Share projects via Google Sheets
✅ **Offline Capability** - PWA features enable offline work

## Setup Instructions

### 1. Google Cloud Project Setup

You need to create a Google Cloud Project and enable the necessary APIs:

#### A. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: "Construction Planning PWA"
4. Click "Create"

#### B. Enable Required APIs

1. In Google Cloud Console, go to "APIs & Services" → "Library"
2. Search and enable these APIs:
   - **Google Sheets API**
   - **Google Drive API**
   - **Google Calendar API** (optional, for future features)

#### C. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure OAuth consent screen:
   - User Type: External (for testing) or Internal (for organization)
   - App name: "Construction Planning PWA"
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Add these scopes:
     - `.../auth/spreadsheets`
     - `.../auth/drive.file`
     - `.../auth/calendar` (optional)
   - Test users: Add your Google account email
4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: "Construction Planning Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:5173` (for development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:5173` (for development)
     - `https://yourdomain.com` (for production)
5. Click "Create"
6. **Save your Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)

#### D. Create API Key

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API key"
3. **Save your API Key**
4. Click "Edit API key"
5. Under "API restrictions", select "Restrict key"
6. Check:
   - Google Sheets API
   - Google Drive API
   - Google Calendar API
7. Click "Save"

### 2. Environment Configuration

Create a `.env` file in your project root:

```env
# Google API Credentials
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=your-api-key
```

**Important:** Add `.env` to your `.gitignore` to keep credentials secure!

### 3. Install Dependencies

Dependencies are already installed. If you need to reinstall:

```bash
npm install frappe-gantt @types/google.accounts @types/gapi vue-google-oauth2
```

### 4. Test the Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:5173/construction-planning`

3. Click "Sign in with Google"

4. Verify you can:
   - Sign in with Google
   - Create a new project
   - See the Gantt chart
   - Sync to Google Sheets

### 5. OAuth Consent Screen Verification (For Production)

For production use:

1. Submit your app for verification in Google Cloud Console
2. This is required if you want users outside your test user list
3. Verification process takes 1-2 weeks
4. Until verified, users will see a warning but can still proceed

## Usage Guide

### Creating a New Project

1. Sign in with Google
2. Click "Create Project"
3. A default construction project template will be created with:
   - 7 phases (Pre-Construction → Final Completion)
   - 25+ tasks with dependencies
   - 180-day timeline
4. Project is automatically saved to Google Sheets

### Loading an Existing Project

1. Open your Google Sheet
2. Copy the Sheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
   ```
3. In the app, paste the Sheet ID and click "Load"

### Using the Gantt Chart

**View Modes:**
- Day view - Detailed daily timeline
- Week view - Weekly overview
- Month view - Monthly planning (default)
- Quarter view - Long-term planning

**Task Interactions:**
- **Click a task** - View details and update status/progress
- **Drag task bars** - Change task duration
- **Drag progress handle** - Update completion percentage

**Updating Tasks:**
- Progress slider in task modal
- Status dropdown (Not Started, In Progress, Completed, On Hold, Delayed)
- Changes auto-sync to Google Sheets

### Collaboration

**Share your project:**
1. Click "Open in Sheets"
2. In Google Sheets, click "Share"
3. Add team members by email
4. Set permissions (Viewer, Editor)

**Team members can:**
- View the project in Google Sheets
- Edit task details directly in Sheets
- Load the Sheet ID in the PWA to see Gantt chart

### Export Options

**Export to JSON:**
- Click "Export JSON"
- Save project data as a local backup
- Can be imported later

**Sync to Sheets:**
- Click "Sync to Sheets"
- Manually sync all changes
- Auto-sync happens on task updates

## Default Construction Template

The template includes these phases:

### Phase 1: Pre-Construction (30 days)
- Site Survey & Investigation
- Design & Engineering
- Permits & Approvals

### Phase 2: Site Preparation (15 days)
- Site Clearing & Grading
- Utility Connections

### Phase 3: Foundation Work (20 days)
- Excavation
- Formwork & Reinforcement
- Concrete Pouring & Curing

### Phase 4: Structural Construction (45 days)
- Frame Construction
- Roof Structure
- External Walls

### Phase 5: MEP Systems (35 days)
- Electrical Rough-In
- Plumbing Installation
- HVAC Installation

### Phase 6: Interior Finishing (40 days)
- Drywall & Insulation
- Flooring
- Painting & Trim

### Phase 7: Final Completion (15 days)
- Fixtures & Fittings
- Cleanup & Landscaping
- Final Inspections
- Project Handover (Milestone)

**Total Duration:** ~180 days (6 months)

## Data Structure

### Google Sheets Format

Each project is stored in a Google Sheet with columns:

| Column | Description |
|--------|-------------|
| Task ID | Unique identifier |
| Task Name | Task description |
| Type | phase, milestone, task, subtask |
| Start Date | YYYY-MM-DD format |
| End Date | YYYY-MM-DD format |
| Progress (%) | 0-100 |
| Status | not-started, in-progress, completed, on-hold, delayed |
| Priority | low, medium, high, critical |
| Dependencies | Comma-separated task IDs |
| Assignee | Person responsible |
| Description | Detailed notes |
| Cost | Budget allocation |
| Actual Start | When work actually started |
| Actual End | When work actually completed |
| Location | Site location |
| Crew | Team assigned |
| Equipment | Equipment needed |
| Materials | Materials required |
| Notes | Additional information |

## Customization

### Modify Default Template

Edit [src/types/construction-project.ts](../src/types/construction-project.ts):

```typescript
export const DEFAULT_CONSTRUCTION_TEMPLATE = {
  // Customize project details
  name: 'Your Project Name',
  tasks: [
    // Add/modify tasks
  ]
}
```

### Add Custom Task Fields

1. Update TypeScript interface in `construction-project.ts`
2. Update Google Sheets service in `googleSheetsService.ts`
3. Update Gantt chart component to display new fields

### Change Gantt Chart Styling

Edit [src/components/GanttChart.vue](../src/components/GanttChart.vue):

```css
:deep(.bar) {
  fill: #your-color;
}
```

## Troubleshooting

### "Failed to initialize Google services"

**Problem:** Missing or invalid API credentials

**Solution:**
1. Check `.env` file exists with correct credentials
2. Verify Client ID and API Key are correct
3. Restart dev server after adding `.env` file

### "This app isn't verified" warning

**Problem:** OAuth consent screen not verified

**Solutions:**
- For testing: Click "Advanced" → "Go to [App Name] (unsafe)"
- For production: Submit app for Google verification

### "Access denied" when syncing

**Problem:** Insufficient API scopes

**Solution:**
1. Sign out and sign back in
2. Grant all requested permissions
3. Check OAuth scopes in Google Cloud Console

### Sheet not loading

**Problem:** Invalid Sheet ID or no access

**Solutions:**
1. Verify Sheet ID is correct (from URL)
2. Ensure you have View access to the sheet
3. Check sheet has correct structure/headers

### Gantt chart not displaying

**Problem:** Missing Frappe Gantt CSS

**Solution:**
- Check browser console for errors
- Verify `frappe-gantt` package is installed
- Clear browser cache

## API Quotas

Google API free tier limits:

- **Sheets API:** 100 requests/100 seconds per user
- **Drive API:** 1,000 requests/100 seconds per user
- **Daily limit:** ~10,000 requests per day

For large teams, consider:
- Batch updates to reduce API calls
- Implement local caching
- Upgrade to paid Google Workspace account

## Security Best Practices

1. **Never commit `.env` file** - Keep credentials secure
2. **Use environment variables** - Different creds for dev/production
3. **Restrict API keys** - Limit to specific APIs and domains
4. **Review OAuth scopes** - Only request necessary permissions
5. **Implement rate limiting** - Prevent API quota exhaustion
6. **Regular credential rotation** - Update keys periodically

## Future Enhancements

Potential features to add:

- 📅 **Google Calendar integration** - Sync milestones to calendar
- 📁 **Google Drive integration** - Attach documents to tasks
- 📧 **Email notifications** - Task reminders and updates
- 👥 **Resource management** - Crew scheduling and allocation
- 💰 **Budget tracking** - Cost management and reporting
- 📊 **Analytics dashboard** - Project metrics and KPIs
- 📱 **Mobile optimization** - Enhanced mobile experience
- 🔔 **Real-time collaboration** - Live updates via WebSockets
- 📑 **Template library** - Multiple project types
- 🎨 **Custom branding** - Company logos and colors

## Support

For issues or questions:
1. Check this documentation
2. Review Google Cloud Console setup
3. Check browser console for errors
4. Verify API credentials in `.env`

## License

This module is part of the QSHE PWA project.
