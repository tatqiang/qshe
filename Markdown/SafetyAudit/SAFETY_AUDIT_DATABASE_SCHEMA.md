# 🔍 Safety Audit Module - Professional Database Schema

> **Date**: October 16, 2025  
> **Module**: Safety Audit System  
> **Version**: 1.0

---

## 📊 Current Requirements Analysis

### **Your Current Design:**

```
safety_audit_requirements.md:
- requirement_id (auto)
- cat_ID (sfs21sw, e2r532d, etc.)
- rev (0, 1, 2, ...)
- item (1, 2, 3, ...)
- description (Thai text)
- criteria (Thai text)
- weight (1, 2, 3)

safetyAudit_cat.md:
- ID (sfs21sw, e2r532d, etc.)
- category (A, B, C, ...)
- description (Thai text)

safety_audit table.md:
- project_id
- main_area_id, sub_area1_id, sub_area2_id
- specific_location
- company_id
- audit_date
- audit_criteria_rev (JSON: {category_id, rev})
- audit_score (JSON: {requirement_id, score})
- audit_note (JSON: {requirement_id, comment})
- average_score
- auditor_id
```

---

## 💡 Professional Recommendation: Normalized Database Schema

### **Option A: Fully Normalized (Recommended for Scalability)**

```sql
-- ============================================
-- 1. SAFETY AUDIT CATEGORIES TABLE
-- ============================================
CREATE TABLE safety_audit_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_code VARCHAR(10) UNIQUE NOT NULL,        -- 'A', 'B', 'C', etc.
  category_id VARCHAR(20) UNIQUE NOT NULL,          -- 'sfs21sw', 'e2r532d', etc.
  name_th TEXT NOT NULL,                            -- 'ความพร้อมของผู้ปฏิบัติงาน'
  name_en TEXT,                                     -- 'Worker Readiness'
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sample Data:
-- ('uuid-1', 'A', 'sfs21sw', 'ความพร้อมของผู้ปฏิบัติงาน', 'Worker Readiness', ...)
-- ('uuid-2', 'B', 'e2r532d', 'Tools & Equipment', 'Tools & Equipment', ...)


-- ============================================
-- 2. SAFETY AUDIT REQUIREMENT REVISIONS TABLE
-- ============================================
CREATE TABLE safety_audit_requirement_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES safety_audit_categories(id),
  revision_number INTEGER NOT NULL,                 -- 0, 1, 2, ...
  effective_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,                   -- Only one active per category
  approved_by UUID REFERENCES users(id),
  approval_date TIMESTAMP,
  change_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(category_id, revision_number)
);

-- ============================================
-- 3. SAFETY AUDIT REQUIREMENTS TABLE
-- ============================================
CREATE TABLE safety_audit_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id UUID REFERENCES safety_audit_requirement_revisions(id) ON DELETE CASCADE,
  item_number INTEGER NOT NULL,                     -- 1, 2, 3, ...
  description_th TEXT NOT NULL,                     -- 'บัตรอนุญาตทำงาน'
  description_en TEXT,
  criteria_th TEXT NOT NULL,                        -- 'ติดบัตรอนุญาตถูกต้อง'
  criteria_en TEXT,
  weight INTEGER NOT NULL CHECK (weight BETWEEN 1 AND 5),
  display_order INTEGER DEFAULT 0,
  is_optional BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(revision_id, item_number)
);

-- ============================================
-- 4. SAFETY AUDITS (HEADER) TABLE
-- ============================================
CREATE TABLE safety_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_number VARCHAR(50) UNIQUE NOT NULL,         -- 'SA-2025-001'
  
  -- Location Information
  project_id UUID REFERENCES projects(id),
  company_id UUID REFERENCES companies(id),
  main_area_id UUID REFERENCES areas(id),          -- nullable
  sub_area1_id UUID REFERENCES areas(id),          -- nullable
  sub_area2_id UUID REFERENCES areas(id),          -- nullable
  specific_location TEXT,
  
  -- Audit Information
  category_id UUID REFERENCES safety_audit_categories(id),
  revision_id UUID REFERENCES safety_audit_requirement_revisions(id),
  audit_date DATE NOT NULL,
  auditor_id UUID REFERENCES users(id),
  
  -- Scores
  total_score DECIMAL(5,2),                         -- Calculated sum
  max_possible_score DECIMAL(5,2),                  -- Max if all items = 3
  weighted_average DECIMAL(5,2),                    -- With weight consideration
  percentage_score DECIMAL(5,2),                    -- 0-100%
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft',               -- draft, submitted, reviewed, approved
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP,
  
  -- RLS
  CONSTRAINT check_status CHECK (status IN ('draft', 'submitted', 'reviewed', 'approved', 'rejected'))
);

-- ============================================
-- 5. SAFETY AUDIT RESULTS (DETAIL) TABLE
-- ============================================
CREATE TABLE safety_audit_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES safety_audits(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES safety_audit_requirements(id),
  
  -- Result
  score INTEGER CHECK (score IN (0, 1, 2, 3) OR score IS NULL),  -- null = N/A
  score_label VARCHAR(20),                          -- 'compliant', 'partial', 'non_compliant', 'n/a'
  comment TEXT,
  
  -- Calculated
  weighted_score DECIMAL(5,2),                      -- score * weight
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(audit_id, requirement_id)
);

-- ============================================
-- 6. SAFETY AUDIT PHOTOS TABLE
-- ============================================
CREATE TABLE safety_audit_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES safety_audits(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES safety_audit_requirements(id),  -- Optional: link to specific requirement
  
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  taken_at TIMESTAMP DEFAULT NOW(),
  uploaded_by UUID REFERENCES users(id),
  
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_safety_audits_project ON safety_audits(project_id);
CREATE INDEX idx_safety_audits_company ON safety_audits(company_id);
CREATE INDEX idx_safety_audits_category ON safety_audits(category_id);
CREATE INDEX idx_safety_audits_date ON safety_audits(audit_date);
CREATE INDEX idx_safety_audits_status ON safety_audits(status);
CREATE INDEX idx_safety_audit_results_audit ON safety_audit_results(audit_id);
CREATE INDEX idx_safety_audit_photos_audit ON safety_audit_photos(audit_id);
```

---

## 📐 Alternative Option B: Semi-Normalized (Simpler, Your Original Idea)

```sql
-- Simplified schema closer to your original design

-- ============================================
-- 1. CATEGORIES (Simple)
-- ============================================
CREATE TABLE safety_audit_categories (
  category_id VARCHAR(20) PRIMARY KEY,              -- 'sfs21sw'
  category_code VARCHAR(5) NOT NULL,                -- 'A'
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. REQUIREMENTS (With embedded revision)
-- ============================================
CREATE TABLE safety_audit_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id VARCHAR(20) REFERENCES safety_audit_categories(category_id),
  revision INTEGER NOT NULL,
  item_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  criteria TEXT NOT NULL,
  weight INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(category_id, revision, item_number)
);

-- ============================================
-- 3. AUDITS (With JSON for flexibility)
-- ============================================
CREATE TABLE safety_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Location
  project_id UUID REFERENCES projects(id),
  company_id UUID REFERENCES companies(id),
  area_hierarchy JSONB,                             -- {main_area_id, sub_area1_id, sub_area2_id}
  specific_location TEXT,
  
  -- Audit Info
  category_id VARCHAR(20) REFERENCES safety_audit_categories(category_id),
  audit_date DATE NOT NULL,
  auditor_id UUID REFERENCES users(id),
  
  -- Results (JSON)
  audit_criteria_rev JSONB NOT NULL,                -- {"category_id": "sfs21sw", "rev": 2}
  audit_results JSONB NOT NULL,                     -- [{"requirement_id": "uuid", "score": 3, "comment": "..."}]
  
  -- Calculated Scores
  average_score DECIMAL(5,2),
  weighted_average DECIMAL(5,2),
  
  -- Metadata
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 4. PHOTOS (Simple)
-- ============================================
CREATE TABLE safety_audit_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES safety_audits(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔄 Data Flow Examples

### **Example 1: Creating New Audit (Option A - Normalized)**

```typescript
// Step 1: User selects Category 'A'
const category = await supabase
  .from('safety_audit_categories')
  .select('*, active_revision:safety_audit_requirement_revisions!inner(*)')
  .eq('category_code', 'A')
  .eq('safety_audit_requirement_revisions.is_active', true)
  .single();

// category = {
//   id: 'uuid-category-a',
//   category_code: 'A',
//   name_th: 'ความพร้อมของผู้ปฏิบัติงาน',
//   active_revision: {
//     id: 'uuid-rev-2',
//     revision_number: 2
//   }
// }

// Step 2: Load requirements for latest revision
const requirements = await supabase
  .from('safety_audit_requirements')
  .select('*')
  .eq('revision_id', category.active_revision.id)
  .order('item_number');

// requirements = [
//   { id: 'uuid-req-1', item_number: 1, description_th: 'บัตรอนุญาตทำงาน', weight: 1 },
//   { id: 'uuid-req-2', item_number: 2, description_th: 'หมวกนิรภัย', weight: 2 },
//   ...
// ]

// Step 3: Create audit header
const { data: audit } = await supabase
  .from('safety_audits')
  .insert({
    audit_number: 'SA-2025-001',
    project_id: projectId,
    company_id: companyId,
    category_id: category.id,
    revision_id: category.active_revision.id,
    audit_date: new Date(),
    auditor_id: currentUser.id,
    status: 'draft'
  })
  .select()
  .single();

// Step 4: Save results for each requirement
for (const req of requirements) {
  await supabase
    .from('safety_audit_results')
    .insert({
      audit_id: audit.id,
      requirement_id: req.id,
      score: formData[req.id].score,        // 0, 1, 2, 3, or null
      score_label: getScoreLabel(formData[req.id].score),
      comment: formData[req.id].comment,
      weighted_score: calculateWeightedScore(formData[req.id].score, req.weight)
    });
}

// Step 5: Calculate and update total scores
const totalScore = calculateTotalScore(results, requirements);
await supabase
  .from('safety_audits')
  .update({
    total_score: totalScore.total,
    weighted_average: totalScore.weighted,
    percentage_score: totalScore.percentage
  })
  .eq('id', audit.id);
```

### **Example 2: Creating New Audit (Option B - JSON)**

```typescript
// Step 1: User selects Category 'A'
const category = await supabase
  .from('safety_audit_categories')
  .select('*')
  .eq('category_code', 'A')
  .single();

// Step 2: Load latest revision requirements
const { data: requirements } = await supabase
  .from('safety_audit_requirements')
  .select('*')
  .eq('category_id', category.category_id)
  .eq('is_active', true)
  .order('revision', { ascending: false })
  .order('item_number');

const latestRev = requirements[0]?.revision || 0;
const activeRequirements = requirements.filter(r => r.revision === latestRev);

// Step 3: Build JSON results
const auditResults = activeRequirements.map(req => ({
  requirement_id: req.id,
  item_number: req.item_number,
  score: formData[req.id].score,
  comment: formData[req.id].comment,
  weight: req.weight,
  weighted_score: formData[req.id].score * req.weight
}));

// Step 4: Calculate scores
const totalWeightedScore = auditResults
  .filter(r => r.score !== null)  // Exclude N/A
  .reduce((sum, r) => sum + r.weighted_score, 0);

const totalWeight = auditResults
  .filter(r => r.score !== null)
  .reduce((sum, r) => sum + r.weight, 0);

const weightedAverage = totalWeightedScore / totalWeight;

// Step 5: Insert single audit record
const { data: audit } = await supabase
  .from('safety_audits')
  .insert({
    project_id: projectId,
    company_id: companyId,
    category_id: category.category_id,
    audit_date: new Date(),
    auditor_id: currentUser.id,
    audit_criteria_rev: {
      category_id: category.category_id,
      rev: latestRev
    },
    audit_results: auditResults,
    weighted_average: weightedAverage,
    status: 'draft'
  })
  .select()
  .single();
```

---

## 📊 Score Calculation Logic

### **Weighted Average Formula**

```typescript
interface ScoreResult {
  requirement_id: string;
  score: number | null;  // 0, 1, 2, 3, or null (N/A)
  weight: number;        // 1-5
}

function calculateWeightedAverage(results: ScoreResult[]): number {
  // Filter out N/A items
  const scoredItems = results.filter(r => r.score !== null);
  
  if (scoredItems.length === 0) return 0;
  
  // Calculate weighted sum
  const weightedSum = scoredItems.reduce((sum, item) => {
    return sum + (item.score! * item.weight);
  }, 0);
  
  // Calculate total weight
  const totalWeight = scoredItems.reduce((sum, item) => {
    return sum + item.weight;
  }, 0);
  
  // Weighted average
  return weightedSum / totalWeight;
}

function calculatePercentage(weightedAverage: number): number {
  // Convert to percentage (max score is 3)
  return (weightedAverage / 3) * 100;
}

// Example:
const results = [
  { requirement_id: '1', score: 3, weight: 1 },  // 3 * 1 = 3
  { requirement_id: '2', score: 2, weight: 2 },  // 2 * 2 = 4
  { requirement_id: '3', score: 3, weight: 2 },  // 3 * 2 = 6
  { requirement_id: '4', score: null, weight: 3 } // N/A - excluded
];

// Weighted sum = 3 + 4 + 6 = 13
// Total weight = 1 + 2 + 2 = 5
// Weighted average = 13 / 5 = 2.6
// Percentage = (2.6 / 3) * 100 = 86.67%
```

---

## 🎨 UI Component Structure

### **Audit Form Component Hierarchy**

```
SafetyAuditForm/
├── AuditHeader
│   ├── ProjectSelector
│   ├── LocationSelector (main_area, sub_area1, sub_area2)
│   ├── SpecificLocationInput
│   └── AuditDatePicker
│
├── CategorySelector
│   └── Tab buttons (A, B, C, D, E, F, G)
│
├── CategoryDisplay
│   ├── Category code badge
│   └── Category description
│
├── AuditRecordsList
│   └── RequirementRow (for each requirement)
│       ├── Item number
│       ├── Description
│       ├── Criteria
│       ├── Weight badge
│       ├── ScoreDropdown
│       │   ├── 3 - Compliant (ปฏิบัติครบถ้วน)
│       │   ├── 2 - Partial (ปฏิบัติได้บางส่วน)
│       │   ├── 1 - Minimal (ปฏิบัติได้เป็นส่วนน้อย)
│       │   ├── 0 - Non-Compliant (ไม่ปฏิบัติ)
│       │   └── N/A (ไม่เกี่ยวข้อง)
│       └── CommentInput
│
├── ScoreSummary
│   ├── Total score
│   ├── Weighted average
│   └── Percentage
│
├── PhotoSection
│   ├── PhotoUpload
│   └── PhotoGallery
│
└── ActionButtons
    ├── Save Draft
    ├── Submit
    └── Cancel
```

---

## 📱 Sample Form State

```typescript
interface AuditFormState {
  // Header
  projectId: string;
  companyId: string;
  mainAreaId: string | null;
  subArea1Id: string | null;
  subArea2Id: string | null;
  specificLocation: string;
  auditDate: Date;
  
  // Category
  selectedCategoryId: string;
  selectedCategoryCode: string;
  categoryDescription: string;
  revisionId: string;
  revisionNumber: number;
  
  // Requirements
  requirements: Array<{
    id: string;
    itemNumber: number;
    description: string;
    criteria: string;
    weight: number;
  }>;
  
  // Results
  results: Record<string, {  // key = requirement_id
    score: 0 | 1 | 2 | 3 | null;  // null = N/A
    comment: string;
  }>;
  
  // Photos
  photos: Array<{
    file: File;
    preview: string;
    caption: string;
    requirementId?: string;  // Optional: link to specific requirement
  }>;
  
  // Calculated
  totalScore: number;
  weightedAverage: number;
  percentageScore: number;
  
  // Status
  status: 'draft' | 'submitted';
}
```

---

## 🔍 Query Examples

### **Get All Audits for a Project**

```sql
-- Option A (Normalized)
SELECT 
  sa.id,
  sa.audit_number,
  sa.audit_date,
  sac.category_code,
  sac.name_th as category_name,
  sa.weighted_average,
  sa.percentage_score,
  sa.status,
  u.full_name as auditor_name
FROM safety_audits sa
JOIN safety_audit_categories sac ON sa.category_id = sac.id
JOIN users u ON sa.auditor_id = u.id
WHERE sa.project_id = 'project-uuid'
ORDER BY sa.audit_date DESC;
```

### **Get Audit Detail with Results**

```sql
-- Option A (Normalized)
SELECT 
  sa.*,
  json_agg(
    json_build_object(
      'requirement_id', sar.requirement_id,
      'item_number', req.item_number,
      'description', req.description_th,
      'criteria', req.criteria_th,
      'weight', req.weight,
      'score', sar.score,
      'comment', sar.comment,
      'weighted_score', sar.weighted_score
    ) ORDER BY req.item_number
  ) as results
FROM safety_audits sa
LEFT JOIN safety_audit_results sar ON sa.id = sar.audit_id
LEFT JOIN safety_audit_requirements req ON sar.requirement_id = req.id
WHERE sa.id = 'audit-uuid'
GROUP BY sa.id;
```

---

## 📊 Comparison: Option A vs Option B

```
┌────────────────────────┬──────────────────────┬──────────────────────┐
│ Feature                │ Option A (Normalized)│ Option B (JSON)      │
├────────────────────────┼──────────────────────┼──────────────────────┤
│ Query Performance      │ ⭐⭐⭐⭐⭐           │ ⭐⭐⭐               │
│ Storage Efficiency     │ ⭐⭐⭐⭐⭐           │ ⭐⭐⭐⭐             │
│ Data Integrity         │ ⭐⭐⭐⭐⭐           │ ⭐⭐⭐               │
│ Flexibility            │ ⭐⭐⭐               │ ⭐⭐⭐⭐⭐           │
│ Reporting Ease         │ ⭐⭐⭐⭐⭐           │ ⭐⭐                 │
│ Schema Evolution       │ ⭐⭐⭐               │ ⭐⭐⭐⭐⭐           │
│ Implementation Speed   │ ⭐⭐⭐               │ ⭐⭐⭐⭐⭐           │
│ Maintenance            │ ⭐⭐⭐⭐             │ ⭐⭐⭐               │
│ Revision Management    │ ⭐⭐⭐⭐⭐           │ ⭐⭐⭐               │
│ Analytics/BI Ready     │ ⭐⭐⭐⭐⭐           │ ⭐⭐                 │
├────────────────────────┼──────────────────────┼──────────────────────┤
│ Total Score            │ 42/50                │ 35/50                │
└────────────────────────┴──────────────────────┴──────────────────────┘

Recommendation: Option A (Normalized) for production system
              Option B (JSON) for quick prototype/MVP
```

---

## ✅ Final Recommendation

### **Use Option A (Fully Normalized) Because:**

1. **Better Reporting** - Easy to query individual requirement scores
2. **Revision Management** - Clear separation of revisions
3. **Data Integrity** - Foreign keys prevent orphaned data
4. **Performance** - Indexed queries are fast
5. **Analytics** - Can easily aggregate scores across audits
6. **Scalability** - Supports millions of audit records

### **Start Simple, Grow Complex:**

```
Phase 1 (Week 1): Implement basic tables
  ├─ safety_audit_categories
  ├─ safety_audit_requirements (with embedded revision)
  └─ safety_audits (simplified)

Phase 2 (Week 2): Add normalized results
  ├─ safety_audit_results
  └─ safety_audit_photos

Phase 3 (Week 3): Add revision management
  └─ safety_audit_requirement_revisions
```

---

## 📝 Next Steps

1. **Review Schema** - Confirm which option (A or B)
2. **Create Tables** - Run SQL migrations
3. **Seed Sample Data** - Categories + Requirements
4. **Build UI Components** - Form + Results view
5. **Implement Calculations** - Weighted average logic
6. **Add Photo Upload** - With Cloudflare R2/Azure Blob
7. **Create Reports** - PDF generation

Would you like me to:
1. Create the SQL migration files?
2. Build the TypeScript types?
3. Create the React components?
4. Implement the calculation logic?

Let me know which part to implement first!
