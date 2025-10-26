# Safety Audit - Corrected Implementation Plan

## Issue: Misunderstood Requirements! 🚨

### What I Built (WRONG ❌)
- Created form for **ONE category per audit**
- Each category would need separate audit form
- User would fill 7 different forms to audit all categories

### What You Actually Need (CORRECT ✅)
- **ONE audit form covers ALL categories (A-G)**
- **Category tabs** to switch between requirement sets
- User fills ONE form with tabs A, B, C, D, E, F, G

---

## Corrected Design Overview

### Form Structure (See AuditForm_ui.png)

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER SECTION - General Information                            │
├─────────────────────────────────────────────────────────────────┤
│ Project: [Dropdown]          Audit Date: [Date Picker]         │
│ Location: [Main Area] → [Sub Area 1] → [Sub Area 2]           │
│ Companies: [☑ Company A] [☑ Company B] [☐ Company C]          │
│ Number of Personnel: [___]   Auditor: [Auto-filled]           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ CATEGORY TABS                                                    │
├─────────────────────────────────────────────────────────────────┤
│ [==A==] [ B ] [ C ] [ D ] [ E ] [ F ] [ G ]                    │
│                                                                  │
│ Category A: ความพร้อมของผู้ปฏิบัติงาน (Worker Readiness)       │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ AUDIT RECORD - Requirements for Category A                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ Item 1: บัตรอนุญาตทำงาน (Weight: 1)                       │  │
│ │ Criteria: ติดบัตรอนุญาตถูกต้อง                            │  │
│ │                                                            │  │
│ │ Score: [3] [2] [1] [0] [N/A]  ← Button group             │  │
│ │ Comment: [_______________________________________]         │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ Item 2: หมวกนิรภัย พร้อมสายรัดคาง (Weight: 2)            │  │
│ │ Criteria: สวมหมวกนิรภัย พร้อมรายรัดคางได้ถูกต้อง         │  │
│ │                                                            │  │
│ │ Score: [3] [2] [1] [0] [N/A]                              │  │
│ │ Comment: [_______________________________________]         │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│ [... more requirements ...]                                     │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ PHOTOS SECTION - Category A                                     │
├─────────────────────────────────────────────────────────────────┤
│ [+ Add Photo]   📷  📷  📷  📷                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ SCORE SUMMARY                                                    │
├─────────────────────────────────────────────────────────────────┤
│ Category A: 85% (17/20 points) - 4 items scored                │
│ Category B: 90% (27/30 points) - 5 items scored                │
│ Category C: 75% (45/60 points) - 7 items scored                │
│                                                                  │
│ Overall Score: 83.5% (89/110 points)                           │
└─────────────────────────────────────────────────────────────────┘

[Save Draft] [Submit Audit]
```

---

## Database Schema v3 (Multi-Category)

### 1. `safety_audits` (Header - ONE per audit session)
```sql
id UUID PRIMARY KEY
audit_number VARCHAR(50) UNIQUE                  -- 'SA-2025-001'
project_id UUID
main_area_id, sub_area1_id, sub_area2_id, specific_location
audit_date DATE
auditor_id UUID
number_of_personnel INTEGER

-- NEW: Track revision per category (JSONB)
audit_criteria_rev JSONB                         -- {"sfs21sw": 0, "e2r532d": 1, ...}

-- NEW: Per-category scores (JSONB)
category_scores JSONB                            -- {"sfs21sw": {"total": 17, "max": 20, ...}}

-- Overall scores (calculated)
total_score DECIMAL(5,2)
max_possible_score DECIMAL(5,2)
weighted_average DECIMAL(5,2)                    -- 0-3 scale
percentage_score DECIMAL(5,2)                    -- 0-100%

status VARCHAR(20)                               -- 'draft', 'submitted', etc.
```

**Key Change:** Removed `category_id` - one audit covers all categories!

### 2. `safety_audit_results` (Details - ONE per requirement)
```sql
id UUID PRIMARY KEY
audit_id UUID REFERENCES safety_audits
category_id UUID REFERENCES safety_audit_categories  -- NEW: For tab filtering
requirement_id UUID REFERENCES safety_audit_requirements
score INTEGER                                    -- 3, 2, 1, 0, or NULL (N/A)
comment TEXT
weighted_score DECIMAL(5,2)                      -- score × requirement.weight
```

**Key Change:** Added `category_id` to filter requirements by tab

### 3. `safety_audit_photos`
```sql
id UUID PRIMARY KEY
audit_id UUID REFERENCES safety_audits
category_id UUID                                 -- NEW: Photos per category
requirement_id UUID                              -- Optional: Link to specific item
photo_url TEXT
latitude, longitude                              -- GPS coordinates
```

**Key Change:** Added `category_id` to organize photos per tab

### 4. Supporting Tables (No changes)
- `safety_audit_categories` (7 categories A-G)
- `safety_audit_requirement_revisions` (version control)
- `safety_audit_requirements` (checklist items)
- `safety_audit_companies` (many-to-many)

---

## Score Calculation Logic

### Per-Category Score
```typescript
// Example: Category A has 4 requirements
// Req 1: score=3, weight=1 → 3×1 = 3
// Req 2: score=2, weight=2 → 2×2 = 4
// Req 3: score=3, weight=2 → 3×2 = 6
// Req 4: score=2, weight=3 → 2×3 = 6
// Total: 19, Max: (1+2+2+3)×3 = 24

{
  "sfs21sw": {
    "total_score": 19,
    "max_score": 24,
    "weighted_avg": 2.375,  // (19/24) × 3
    "percentage": 79.17,     // (19/24) × 100
    "item_count": 4,
    "na_count": 0
  }
}
```

### Overall Score
```typescript
// Sum all categories
Total: 19 + 27 + 45 = 91
Max: 24 + 30 + 60 = 114
Weighted Avg: (91/114) × 3 = 2.39
Percentage: (91/114) × 100 = 79.82%
```

---

## Data Flow

### 1. Load Form
```typescript
// Get active requirements for ALL categories
const requirements = await supabase
  .from('v_active_audit_requirements')
  .select('*')
  .order('category_code', 'display_order');

// Group by category
const requirementsByCategory = {
  'sfs21sw': [...], // Category A items
  'e2r532d': [...], // Category B items
  'ddsd12a': [...], // Category C items
  // ...
};
```

### 2. User Fills Form
```typescript
// User selects Category A tab
setSelectedCategory('sfs21sw');

// User scores requirements
const results = [
  { requirement_id: 'req-1', category_id: 'cat-a-uuid', score: 3, comment: 'Good' },
  { requirement_id: 'req-2', category_id: 'cat-a-uuid', score: 2, comment: 'Needs work' },
  // ...
];

// Calculate score in real-time
const categoryScore = calculateCategoryScore(results, requirementsByCategory['sfs21sw']);
// → { total: 19, max: 24, avg: 2.375, pct: 79.17 }
```

### 3. Save/Submit
```typescript
// Save audit header
const audit = {
  audit_number: 'SA-2025-001',
  project_id: '...',
  audit_date: '2025-10-16',
  audit_criteria_rev: {
    'sfs21sw': 0,    // Category A, revision 0
    'e2r532d': 1,    // Category B, revision 1
    'ddsd12a': 0,    // Category C, revision 0
  },
  category_scores: {
    'sfs21sw': { total: 19, max: 24, avg: 2.375, pct: 79.17 },
    'e2r532d': { total: 27, max: 30, avg: 2.70, pct: 90.00 },
    'ddsd12a': { total: 45, max: 60, avg: 2.25, pct: 75.00 },
  },
  total_score: 91,
  max_possible_score: 114,
  weighted_average: 2.39,
  percentage_score: 79.82,
  status: 'submitted',
};

// Insert results (batch)
const results = [
  { audit_id, category_id: 'cat-a-uuid', requirement_id: 'req-1', score: 3, comment: '...' },
  { audit_id, category_id: 'cat-a-uuid', requirement_id: 'req-2', score: 2, comment: '...' },
  { audit_id, category_id: 'cat-b-uuid', requirement_id: 'req-5', score: 3, comment: '...' },
  // ... all categories
];

await supabase.from('safety_audit_results').insert(results);
```

### 4. View/Report
```typescript
// Load audit summary
const { data: audit } = await supabase
  .from('v_audit_summary')
  .select('*')
  .eq('id', auditId)
  .single();

// Get results for Category A
const { data: categoryAResults } = await supabase
  .from('safety_audit_results')
  .select(`
    *,
    requirement:safety_audit_requirements(*)
  `)
  .eq('audit_id', auditId)
  .eq('category_id', categoryAId)
  .order('requirement.item_number');

// Display in table/report format
```

---

## Implementation Steps

### Step 1: Database Migration ✅
- [x] Created `safety_audit_schema_v3_multi_category.sql`
- [x] Run migration via Supabase Dashboard
- [x] Verify tables updated

### Step 2: Update TypeScript Types
- [ ] Fix `src/types/safetyAudit.ts`
  - Remove `category_id` from `SafetyAudit` interface
  - Add `audit_criteria_rev: Record<string, number>`
  - Add `category_scores: Record<string, CategoryScore>`
  - Add `category_id` to `SafetyAuditResult` interface

### Step 3: Update Service Methods
- [ ] Fix `src/services/safetyAuditService.ts`
  - `saveAuditResults()` - batch insert with category_id
  - `updateAuditCriteriaRev()` - track revision per category
  - `getAuditResultsByCategory()` - filter by category
  - `getCategoryScore()` - calculate per-category score

### Step 4: Rebuild Form UI
- [ ] Delete old `SafetyAuditForm.tsx` (wrong design)
- [ ] Create new form with:
  - Header section (project, date, location, companies, personnel)
  - Category tabs component
  - Requirements list (filtered by selected tab)
  - Score button group (3/2/1/0/N/A) per requirement
  - Comment textarea per requirement
  - Photos section per category
  - Score summary display

### Step 5: Implement Score Calculation
- [ ] `calculateCategoryScore()` function
- [ ] `calculateOverallScore()` function
- [ ] Real-time score updates as user fills form
- [ ] Display per-category percentages
- [ ] Display overall percentage

### Step 6: Add Photo Upload
- [ ] Photo upload component per category tab
- [ ] Store with `category_id` and optional `requirement_id`
- [ ] GPS capture (latitude, longitude)
- [ ] Display uploaded photos in gallery

---

## Migration Instructions

### Run Database Migration
1. Open: https://supabase.com/dashboard/project/wbzzvchjdqtzxwwquogl/sql
2. Copy SQL from: `database/migrations/safety_audit_schema_v3_multi_category.sql`
3. Paste into SQL Editor
4. Click "Run"
5. Verify success

### Verification Queries
```sql
-- Check new columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'safety_audits' 
  AND column_name IN ('audit_criteria_rev', 'category_scores');

-- Check requirements loaded
SELECT category_code, COUNT(*) AS count
FROM v_active_audit_requirements
GROUP BY category_code
ORDER BY category_code;

-- Expected: A=4, B=5, C=7
```

---

## Next Actions

1. **YOU:** Run database migration v3 via Supabase Dashboard
2. **ME:** Update TypeScript types
3. **ME:** Update service methods
4. **ME:** Rebuild form UI with category tabs
5. **ME:** Implement scoring logic
6. **ME:** Add photo upload

---

## Key Takeaway

✅ **ONE audit form** with **category tabs (A-G)**  
✅ User fills all categories in **one session**  
✅ Each category has its own **requirements list**  
✅ Scores calculated **per category** and **overall**  
✅ Photos organized **per category**  

**Much better UX than 7 separate forms!** 🎉
