# Safety Audit v3 - Progress Update

## ✅ Completed Steps

### 1. Database Migration (DONE ✅)
- ✅ Executed `safety_audit_schema_v3_multi_category.sql`
- ✅ Updated category IDs (cat01-cat07)
- ✅ Removed `category_id` and `revision_id` from `safety_audits` table
- ✅ Added `audit_criteria_rev` JSONB field
- ✅ Added `category_scores` JSONB field
- ✅ Added `category_id` to `safety_audit_results` table
- ✅ Added `category_id` to `safety_audit_photos` table
- ✅ Created helper views and score calculation functions
- ✅ Inserted 22 requirements (A=4, B=6 Rev 1, C=7)

### 2. Migration Verification (DONE ✅)
```
✅ Categories: 7 (A-G)
✅ Revisions: 4
✅ Active Requirements: 17
   - Category A: 4 items
   - Category B: 6 items (Rev 1 ACTIVE)
   - Category C: 7 items
```

### 3. TypeScript Types Updated (DONE ✅)

**Changes Made:**

#### SafetyAudit Type
```typescript
// REMOVED
- category_id: string;
- revision_id: string;

// ADDED
+ audit_criteria_rev: Record<string, number>; // {"cat01": 0, "cat02": 1}
+ category_scores: Record<string, CategoryScore>; // Per-category scores
```

#### CategoryScore Type (NEW)
```typescript
export type CategoryScore = {
  total_score: number;
  max_score: number;
  weighted_avg: number;
  percentage: number;
  item_count: number;
  na_count: number;
};
```

#### SafetyAuditResult Type
```typescript
+ category_id: string; // For filtering by category tabs
```

#### SafetyAuditPhoto Type
```typescript
+ category_id: string | null; // Photos organized per category
```

#### SafetyAuditFormData Type
```typescript
// REMOVED
- category_id: string;
- results: {...}[];

// ADDED
+ resultsByCategory: Record<string, {...}[]>; // Results grouped by category
+ audit_criteria_rev: Record<string, number>; // Track revision per category
+ photosByCategory: Record<string, (File | string)[]>; // Photos per category
```

#### ActiveAuditRequirement Type (NEW)
```typescript
export type ActiveAuditRequirement = {
  category_id: string;
  category_code: string; // 'A', 'B', 'C'
  category_identifier: string; // 'cat01', 'cat02'
  category_name_th: string;
  revision_id: string;
  revision_number: number;
  requirement_id: string;
  item_number: number;
  description_th: string;
  criteria_th: string;
  weight: number;
  // ...
};
```

---

## 🎯 Next Steps

### 4. Create SafetyAuditForm with Category Tabs (IN PROGRESS)

**Form Structure:**

```
┌────────────────────────────────────────────────┐
│ HEADER SECTION - General Information          │
├────────────────────────────────────────────────┤
│ Project: [Dropdown]  Date: [Date Picker]      │
│ Location: [Area] → [Sub1] → [Sub2]           │
│ Companies: [☑ A] [☑ B] [☐ C]                  │
│ Personnel: [___]                               │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ CATEGORY TABS                                  │
├────────────────────────────────────────────────┤
│ [==A==] [ B ] [ C ] [ D ] [ E ] [ F ] [ G ]   │
│                                                │
│ Category A: ความพร้อมของผู้ปฏิบัติงาน          │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ REQUIREMENTS (Category A)                      │
├────────────────────────────────────────────────┤
│ 1. บัตรอนุญาตทำงาน (Weight: 1)                │
│    Criteria: ติดบัตรอนุญาตถูกต้อง             │
│    Score: [3] [2] [1] [0] [N/A]               │
│    Comment: [_________________________]        │
│                                                │
│ 2. หมวกนิรภัย พร้อมสายรัดคาง (Weight: 2)      │
│    ...                                         │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ PHOTOS (Category A)                            │
├────────────────────────────────────────────────┤
│ [+ Add Photo]  📷 📷 📷                        │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ SCORE SUMMARY                                  │
├────────────────────────────────────────────────┤
│ Category A: 85% (17/20 points)                │
│ Category B: 90% (27/30 points)                │
│ Overall: 87.5%                                 │
└────────────────────────────────────────────────┘
```

**Implementation Plan:**

1. **Header Component**
   - Project selector
   - Date picker
   - Location (HierarchicalAreaInput)
   - Company multi-select
   - Personnel count

2. **Category Tabs Component**
   - 7 tabs (A-G)
   - Active tab highlighting
   - Display category description
   - Load requirements for selected category

3. **Requirements List Component**
   - Filtered by selected category
   - Display item number, description, criteria, weight
   - Score button group (3/2/1/0/N/A)
   - Comment textarea per requirement
   - Real-time score calculation

4. **Photos Component**
   - Upload button
   - Photo gallery
   - Link to category_id
   - Optional link to requirement_id

5. **Score Summary Component**
   - Per-category percentages
   - Overall score
   - Progress indicators

### 5. Score Calculation Logic
- Implement `calculateCategoryScore()` function
- Exclude N/A items from calculation
- Update `category_scores` JSONB in real-time
- Display percentages per category

### 6. Service Methods
- Update `safetyAuditService.ts`
- Handle `category_id` in results
- Track `audit_criteria_rev`
- Query methods for category filtering

---

## 📊 Data Flow

### Loading Form
```typescript
// 1. Load all active requirements
const { data: requirements } = await supabase
  .from('v_active_audit_requirements')
  .select('*');

// 2. Group by category
const requirementsByCategory = groupBy(requirements, 'category_identifier');
// Result: { "cat01": [...], "cat02": [...], "cat03": [...] }
```

### Saving Results
```typescript
// 1. Prepare results for all categories
const allResults = [];
Object.entries(formData.resultsByCategory).forEach(([categoryId, results]) => {
  results.forEach(result => {
    allResults.push({
      audit_id: auditId,
      category_id: categoryId,
      requirement_id: result.requirement_id,
      score: result.score,
      comment: result.comment,
      weighted_score: result.score * requirement.weight
    });
  });
});

// 2. Batch insert
await supabase
  .from('safety_audit_results')
  .insert(allResults);

// 3. Trigger automatically updates category_scores and overall scores
```

---

## 🎯 Ready for Next Phase

All foundational work is complete:
- ✅ Database schema migrated
- ✅ Sample data loaded
- ✅ TypeScript types updated
- ⏳ Ready to build form UI

Let's proceed with creating the SafetyAuditForm component! 🚀
