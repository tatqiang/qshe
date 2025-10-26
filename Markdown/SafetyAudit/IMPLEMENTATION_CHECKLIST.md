# ✅ Safety Audit Implementation Checklist

> **Ready to implement?** Follow this step-by-step checklist

---

## 📋 Phase 1: Database Setup (30 minutes)

### Step 1: Run Database Schema

- [ ] Open Supabase SQL Editor
- [ ] Copy content from `SAFETY_AUDIT_DATABASE_SCHEMA.sql`
- [ ] Paste and execute in SQL Editor
- [ ] Verify tables created:
  ```sql
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name LIKE 'safety_audit%'
  ORDER BY table_name;
  ```
- [ ] Expected output:
  - `safety_audit_categories`
  - `safety_audit_photos`
  - `safety_audit_requirements`
  - `safety_audit_results`
  - `safety_audits`

### Step 2: Verify Sample Data

- [ ] Check categories inserted:
  ```sql
  SELECT * FROM safety_audit_categories ORDER BY display_order;
  ```
- [ ] Should see 7 categories (A-G)

- [ ] Check requirements inserted:
  ```sql
  SELECT 
    category_id,
    revision,
    COUNT(*) as requirement_count
  FROM safety_audit_requirements
  GROUP BY category_id, revision
  ORDER BY category_id, revision;
  ```
- [ ] Should see requirements for categories A, B, C with multiple revisions

### Step 3: Test Helper Functions

- [ ] Test get_latest_revision function:
  ```sql
  SELECT get_latest_revision('e2r532d') as latest_rev;
  ```
- [ ] Should return: `1`

- [ ] Test generate_audit_number function:
  ```sql
  SELECT generate_audit_number() as sample_audit_number;
  ```
- [ ] Should return: `AUD-2025-0001`

---

## 📋 Phase 2: TypeScript Interfaces (20 minutes)

### Step 4: Create Type Definitions

- [ ] Create file: `src/types/safetyAudit.ts`
- [ ] Copy interfaces from `SAFETY_AUDIT_DESIGN.md` section "Step 2"
- [ ] Export all interfaces:
  - `SafetyAuditCategory`
  - `SafetyAuditRequirement`
  - `SafetyAudit`
  - `SafetyAuditResult`
  - `SafetyAuditPhoto`
  - `SafetyAuditFormData`

### Step 5: Update Main Types Index

- [ ] Add to `src/types/index.ts`:
  ```typescript
  export * from './safetyAudit';
  ```

---

## 📋 Phase 3: Service Layer (1 hour)

### Step 6: Create SafetyAuditService

- [ ] Create file: `src/services/SafetyAuditService.ts`
- [ ] Implement core methods:
  - [ ] `getCategories()` - Get all audit categories
  - [ ] `getLatestRequirements(categoryId)` - Get requirements for category
  - [ ] `createAudit(formData)` - Create new audit with results
  - [ ] `getAuditById(auditId)` - Get audit details
  - [ ] `updateAuditResult(resultId, data)` - Update individual score
  - [ ] `uploadPhotos(auditId, photos)` - Upload audit photos
  - [ ] `submitAudit(auditId)` - Submit for review
  - [ ] `getAuditsByProject(projectId)` - List audits for project

### Step 7: Test Service Methods

- [ ] Create test file: `src/services/__tests__/SafetyAuditService.test.ts`
- [ ] Test basic CRUD operations
- [ ] Verify score calculations

---

## 📋 Phase 4: UI Components (3-4 hours)

### Step 8: Create List Component

- [ ] Create: `src/components/SafetyAudit/SafetyAuditList.tsx`
- [ ] Features:
  - [ ] Display all audits in table
  - [ ] Filter by project, category, date range
  - [ ] Show audit number, date, category, score, status
  - [ ] Click row to view details
  - [ ] New Audit button

### Step 9: Create Form Component

- [ ] Create: `src/components/SafetyAudit/SafetyAuditForm.tsx`
- [ ] Structure:
  - [ ] General Info Section
    - [ ] Project dropdown
    - [ ] Location selectors (main_area, sub_area1, sub_area2)
    - [ ] Specific location input
    - [ ] Company dropdown
    - [ ] Audit date picker
  - [ ] Category Tabs (A, B, C, D, E, F, G)
    - [ ] Display category name and description
    - [ ] Show revision being used
  - [ ] Requirements Table
    - [ ] Item number
    - [ ] Item name (Thai)
    - [ ] Description/Criteria
    - [ ] Weight
    - [ ] Score dropdown (0, 1, 2, 3, N/A)
    - [ ] Comment input
  - [ ] Score Summary
    - [ ] Total score / Max score
    - [ ] Percentage
    - [ ] Items scored vs N/A count
  - [ ] Photos Section
    - [ ] Upload button
    - [ ] Photo grid with preview
    - [ ] Caption input per photo
    - [ ] Delete photo button
  - [ ] Actions
    - [ ] Save Draft
    - [ ] Submit for Review
    - [ ] Cancel

### Step 10: Create Detail/View Component

- [ ] Create: `src/components/SafetyAudit/SafetyAuditDetail.tsx`
- [ ] Features:
  - [ ] Read-only view of audit
  - [ ] Display all general info
  - [ ] Show all requirements with scores and comments
  - [ ] Display photos in gallery
  - [ ] Show score summary
  - [ ] Edit button (if draft)
  - [ ] Approve/Reject buttons (if reviewer)
  - [ ] Export PDF button

### Step 11: Create Report Component

- [ ] Create: `src/components/SafetyAudit/SafetyAuditReport.tsx`
- [ ] Features:
  - [ ] Category performance chart
  - [ ] Trend analysis
  - [ ] Non-compliance items list
  - [ ] Export to Excel

---

## 📋 Phase 5: Routing & Navigation (30 minutes)

### Step 12: Add Routes

- [ ] Update: `src/routes/AppRoutes.tsx`
  ```typescript
  <Route path="/safety-audits" element={<SafetyAuditList />} />
  <Route path="/safety-audits/new" element={<SafetyAuditForm />} />
  <Route path="/safety-audits/:id" element={<SafetyAuditDetail />} />
  <Route path="/safety-audits/:id/edit" element={<SafetyAuditForm />} />
  <Route path="/safety-audits/reports" element={<SafetyAuditReport />} />
  ```

### Step 13: Add to Navigation Menu

- [ ] Update main menu to include "Safety Audit"
- [ ] Add icon (🔍 or similar)
- [ ] Position after "Safety Patrols"

---

## 📋 Phase 6: Testing (2-3 hours)

### Step 14: Manual Testing Checklist

**Create Audit Flow:**
- [ ] Can create new audit
- [ ] Can select project and locations
- [ ] Can select audit category
- [ ] Requirements load correctly for selected category
- [ ] Can select scores (0, 1, 2, 3, N/A)
- [ ] Can add comments
- [ ] Scores calculate correctly
- [ ] Can upload photos
- [ ] Can save as draft
- [ ] Can submit for review

**View Audit Flow:**
- [ ] Can view audit list
- [ ] Can filter by project, category, date
- [ ] Can click to view details
- [ ] All data displays correctly
- [ ] Photos display in gallery

**Edit Audit Flow:**
- [ ] Can edit draft audits
- [ ] Cannot edit completed audits
- [ ] Changes save correctly

**Review Audit Flow:**
- [ ] Supervisor can review audits
- [ ] Can approve/reject
- [ ] Status updates correctly

### Step 15: Test Edge Cases

- [ ] What happens if all items are N/A?
- [ ] What if no requirements exist for a category?
- [ ] What if audit is created without photos?
- [ ] What if location fields are empty?
- [ ] Can handle large number of photos?

### Step 16: Performance Testing

- [ ] Test with 100+ audits
- [ ] Test with 50+ requirements in one audit
- [ ] Test photo upload with 10+ photos
- [ ] Check load times
- [ ] Verify no memory leaks

---

## 📋 Phase 7: Mobile Optimization (2 hours)

### Step 17: Mobile Responsive Design

- [ ] Form is usable on mobile (360px width)
- [ ] Category tabs scrollable horizontally
- [ ] Table responsive (card layout on mobile)
- [ ] Score dropdowns easy to tap
- [ ] Photo upload works on mobile camera
- [ ] Date picker mobile-friendly

### Step 18: PWA Features

- [ ] Works offline (show offline indicator)
- [ ] Queues submissions when offline
- [ ] Syncs when back online
- [ ] Photos cache correctly

---

## 📋 Phase 8: Documentation & Training (1 hour)

### Step 19: Create User Guide

- [ ] Write: `docs/SafetyAudit/USER_GUIDE.md`
- [ ] Include screenshots
- [ ] Step-by-step instructions
- [ ] Common scenarios
- [ ] Troubleshooting section

### Step 20: Create Admin Guide

- [ ] Write: `docs/SafetyAudit/ADMIN_GUIDE.md`
- [ ] How to add new categories
- [ ] How to create new requirement revisions
- [ ] How to review audits
- [ ] How to generate reports

---

## 📋 Phase 9: Deployment (1 hour)

### Step 21: Pre-Deployment Checklist

- [ ] All tests passing
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Database migrations documented
- [ ] Environment variables configured
- [ ] RLS policies configured (if needed)

### Step 22: Deploy to Production

- [ ] Run database schema in production Supabase
- [ ] Deploy frontend to Vercel
- [ ] Test in production environment
- [ ] Monitor error logs
- [ ] Verify performance

### Step 23: Post-Deployment

- [ ] Create sample audit in production
- [ ] Train first users
- [ ] Gather feedback
- [ ] Monitor usage
- [ ] Document lessons learned

---

## 📊 Estimated Timeline

```
┌─────────────────────────┬──────────────┬──────────────┐
│ Phase                   │ Time         │ Priority     │
├─────────────────────────┼──────────────┼──────────────┤
│ 1. Database Setup       │ 30 min       │ HIGH         │
│ 2. TypeScript Types     │ 20 min       │ HIGH         │
│ 3. Service Layer        │ 1 hour       │ HIGH         │
│ 4. UI Components        │ 3-4 hours    │ HIGH         │
│ 5. Routing              │ 30 min       │ HIGH         │
│ 6. Testing              │ 2-3 hours    │ HIGH         │
│ 7. Mobile Optimization  │ 2 hours      │ MEDIUM       │
│ 8. Documentation        │ 1 hour       │ MEDIUM       │
│ 9. Deployment           │ 1 hour       │ HIGH         │
├─────────────────────────┼──────────────┼──────────────┤
│ TOTAL                   │ 11-14 hours  │              │
└─────────────────────────┴──────────────┴──────────────┘

Estimated: 2-3 working days for one developer
```

---

## ✅ Success Criteria

### MVP (Minimum Viable Product)

- [x] Users can create safety audits
- [x] Users can select audit category
- [x] Users can score all requirements
- [x] Users can add comments
- [x] Users can upload photos
- [x] Users can view audit list
- [x] Users can view audit details
- [x] Scores calculate automatically
- [x] Data saves to database correctly

### Full Feature Set

- [ ] Mobile responsive
- [ ] Works offline
- [ ] Reports and analytics
- [ ] Email notifications
- [ ] PDF export
- [ ] Multi-language support (EN/TH)
- [ ] Advanced filtering
- [ ] Bulk operations

---

## 📚 Reference Documents

1. **`SAFETY_AUDIT_DATABASE_SCHEMA.sql`** - Complete database schema
2. **`SAFETY_AUDIT_DESIGN.md`** - Full design documentation
3. **`DATABASE_DESIGN_RECOMMENDATION.md`** - Design decision rationale
4. **This checklist** - Implementation steps

---

## 🆘 Need Help?

**Common Issues:**

1. **"Table already exists" error**
   - Drop existing tables first or use `IF NOT EXISTS`

2. **"Function not found" error**
   - Make sure helper functions are created before triggers

3. **"Foreign key constraint violation"**
   - Ensure parent records exist before inserting child records

4. **TypeScript type errors**
   - Check that interfaces match database schema exactly

5. **Photos not uploading**
   - Verify storage service (R2/Azure) is configured
   - Check file size limits
   - Verify CORS settings

---

**Ready to start?** Begin with Phase 1: Database Setup!

**Questions?** Review the design documents first, then ask!

**Status**: ✅ Ready to implement  
**Complexity**: Medium  
**Timeline**: 2-3 days  
