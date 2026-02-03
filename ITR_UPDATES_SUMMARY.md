# ITR Feature Updates - Summary

## Issues Fixed

### 1. ✅ Spinner Z-Index Fixed
- **Problem**: Loading overlay appeared behind modal (z-index: 50 vs modal z-index: 1200)
- **Solution**: Updated LoadingOverlay to use `z-index: 9999`
- **File**: `src/components/ui/LoadingOverlay.vue`

### 2. ✅ Multiple Attachments Support
- **Problem**: Only single drawing file supported
- **Solution**: 
  - Created new migration for `construction_itr_attachments` table
  - Support 6 attachment types: drawing, delivery_order, material_cert, test_report, photo, other
  - Each type accepts multiple files
- **Files**:
  - `database/migrations/08_create_itr_attachments_table.sql` (NEW)
  - `src/components/ITRRequestModal.vue` (UPDATED)

### 3. ✅ Delivery Order (DO) Input Added
- **Problem**: No DO attachment field
- **Solution**: Added DO file upload accepting PDF, JPG, PNG with multiple file support
- **File**: `src/components/ITRRequestModal.vue`

### 4. 🔄 ITR List Panel (In Progress)
- **Solution**: Created new component to show ITRs with status filtering
- **File**: `src/components/ITRListPanel.vue` (NEW)
- **TODO**: Integrate into ProjectPlanningView.vue

## Database Changes

### New Migration: 08_create_itr_attachments_table.sql

```sql
CREATE TYPE itr_attachment_type AS ENUM (
  'drawing',
  'delivery_order',
  'material_cert',
  'test_report',
  'photo',
  'other'
);

CREATE TABLE construction_itr_attachments (
  id UUID PRIMARY KEY,
  itr_id UUID REFERENCES construction_itrs(id) ON DELETE CASCADE,
  attachment_type itr_attachment_type NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
```

**To Run**: Execute in Supabase SQL Editor

## UI Changes

### ITRRequestModal.vue - Attachments Section

**Before**:
- Single "Drawing File" input (PDF only)
- No DO input

**After**:
- **Drawing Files**: Multiple PDFs
- **Delivery Order Files**: Multiple PDF/JPG/PNG ✨ NEW
- **Material Certificates**: Multiple PDFs
- **Test Reports**: Multiple PDFs
- **Photos**: Multiple images
- **Other Documents**: Multiple files

Each section shows:
- File count
- File names with remove button (×)
- Visual icons (📄 📦 📋 📊 📷 📎)

## New Components

### 1. ITRListPanel.vue
**Purpose**: Display list of ITRs with status filtering

**Features**:
- Status filter dropdown (Plan, Internal, Requested, Approved, Rejected)
- Color-coded status badges
- Click to select ITR
- Shows: ITR No, Title, System, Type, Date
- Empty state with hint

**Usage**:
```vue
<ITRListPanel
  :itrs="allITRs"
  :loading="loading"
  :selectedITR="selectedITR"
  @select="handleSelectITR"
/>
```

## Next Steps

### 1. Run Database Migration
```sql
-- In Supabase SQL Editor
\i database/migrations/08_create_itr_attachments_table.sql
```

### 2. Update Service Layer
**File**: `src/services/constructionITRService.ts`

Add methods:
```typescript
async uploadAttachment(file: File, itrId: string, type: string): Promise<string>
async getAttachments(itrId: string): Promise<Attachment[]>
async deleteAttachment(attachmentId: string): Promise<void>
```

### 3. Integrate ITR List Panel
**File**: `src/views/ProjectPlanningView.vue`

Add to template:
```vue
<div class="project-layout">
  <div class="left-panel">
    <ITRListPanel 
      :itrs="projectITRs"
      :loading="loadingITRs"
      @select="handleSelectITR"
    />
  </div>
  <div class="main-panel">
    <!-- Existing Gantt chart -->
  </div>
</div>
```

Add to script:
```typescript
import ITRListPanel from '@/components/ITRListPanel.vue'
import { constructionITRService } from '@/services/constructionITRService'

const projectITRs = ref([])
const loadingITRs = ref(false)
const selectedITR = ref(null)

// Load ITRs when project changes
watch(() => projectStore.selectedProject, async (project) => {
  if (project) {
    loadingITRs.value = true
    try {
      projectITRs.value = await constructionITRService.getITRsByProject(project.id)
    } finally {
      loadingITRs.value = false
    }
  }
})

const handleSelectITR = (itr) => {
  selectedITR.value = itr
  // Show ITR details or highlight related task
}
```

### 4. Update Submission Handler
**File**: `src/views/ProjectPlanningView.vue`

Update `handleITRSubmit`:
```typescript
const handleITRSubmit = async (itrData: any) => {
  try {
    // 1. Create ITR
    const newITR = await constructionITRService.createITR(itrData)
    
    // 2. Upload all attachments
    if (itrData.attachments && itrData.attachments.length > 0) {
      for (const attachment of itrData.attachments) {
        await constructionITRService.uploadAttachment(
          attachment.file,
          newITR.id,
          attachment.type
        )
      }
    }
    
    // 3. Refresh ITR list
    projectITRs.value = await constructionITRService.getITRsByProject(projectId)
    
    showITRModal.value = false
    alert('ITR created successfully!')
  } catch (err) {
    console.error('Error creating ITR:', err)
    error.value = 'Failed to create ITR'
  }
}
```

## Testing Checklist

- [ ] Run migration 08
- [ ] Open ITR modal
- [ ] Upload drawing files (multiple PDFs)
- [ ] Upload DO files (multiple PDF/JPG/PNG)
- [ ] Upload material certs
- [ ] Upload test reports
- [ ] Upload photos
- [ ] Upload other files
- [ ] Remove files using × button
- [ ] Submit ITR with all attachments
- [ ] Verify files stored in `construction_itr_attachments` table
- [ ] Verify files uploaded to R2 bucket
- [ ] Check ITR list panel shows new ITR
- [ ] Filter ITRs by status
- [ ] Select ITR from list

## File Changes Summary

### Modified Files
1. `src/components/ui/LoadingOverlay.vue` - Fixed z-index
2. `src/components/ITRRequestModal.vue` - Multiple attachments UI

### New Files
1. `database/migrations/08_create_itr_attachments_table.sql` - Attachments table
2. `src/components/ITRListPanel.vue` - ITR list component
3. `ITR_UPDATES_SUMMARY.md` - This file

### Files to Update Next
1. `src/services/constructionITRService.ts` - Add attachment methods
2. `src/views/ProjectPlanningView.vue` - Integrate ITR list panel
3. `src/types/construction-project.ts` - Add Attachment interface

## Known Issues

1. ❌ ITRListPanel not yet integrated into ProjectPlanningView
2. ❌ Service methods for uploading/managing attachments not implemented
3. ❌ Attachment files not yet uploaded to R2 during submission

## Design Decisions

### Why separate attachments table?
- Supports unlimited attachments per ITR
- Easy to query by type
- Simpler to manage file lifecycle (delete, update)
- Better for future features (attachment history, versioning)

### Why 6 attachment types?
- **Drawing**: Technical drawings (PDF only)
- **Delivery Order**: DO documents (PDF/images)
- **Material Cert**: Material certificates (PDF)
- **Test Report**: Test/inspection reports (PDF)
- **Photo**: Site photos (images)
- **Other**: Any other documents

### Why multiple files per type?
- Construction projects often have multiple drawings
- DOs can come in multiple sheets
- Multiple test reports for different materials
- Multiple site photos from different angles
