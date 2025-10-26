# Safety Audit - Multi-Category Design

## Overview

**Key Concept:** ONE audit form assesses ALL safety categories (A-G) in a single session, with category tabs to switch between different requirement sets.

## Database Design (Schema v3)

### 1. Core Tables

#### `safety_audit_categories`
Static reference table for 7 categories:
```
A - ความพร้อมของผู้ปฏิบัติงาน (Worker Readiness)
B - Tools & Equipment
C - Hot Work
D - High Work
E - LOTO
F - Confined Space
G - Crane Lifting
```

#### `safety_audits` (HEADER - One per audit session)
```sql
id UUID PRIMARY KEY
audit_number VARCHAR(50) UNIQUE              -- 'SA-2025-001'
project_id, area IDs, audit_date, auditor_id
number_of_personnel INTEGER
audit_criteria_rev JSONB                     -- {"sfs21sw": 0, "e2r532d": 1, ...}
category_scores JSONB                        -- Per-category score summary
total_score, max_possible_score
weighted_average, percentage_score
status VARCHAR(20)                           -- 'draft', 'submitted', etc.
```

**Key Field: `audit_criteria_rev`**
- Stores which revision was used for each category
- Format: `{"category_id": revision_number}`
- Example: `{"sfs21sw": 0, "e2r532d": 1, "ddsd12a": 0}`
- This ensures audit results can be displayed correctly even after requirements are updated

#### `safety_audit_results` (DETAILS - One per requirement)
```sql
id UUID PRIMARY KEY
audit_id UUID REFERENCES safety_audits
category_id UUID REFERENCES safety_audit_categories   -- NEW: For tab filtering
requirement_id UUID REFERENCES safety_audit_requirements
score INTEGER                                -- 3, 2, 1, 0, or NULL (N/A)
comment TEXT
weighted_score DECIMAL(5,2)                 -- score × weight
```

**Score Values:**
- `3` = Compliant (ปฏิบัติครบถ้วน)
- `2` = Partial (ปฏิบัติได้บางส่วน / หลักฐานไม่ครบ)
- `1` = Minimal (ปฏิบัติได้เป็นส่วนน้อย / พบหลักฐานบางส่วน)
- `0` = Non-Compliant (ไม่ปฏิบัติ / ไม่มีหลักฐาน)
- `NULL` = N/A (ไม่เกี่ยวข้อง) - excluded from score calculation

#### `safety_audit_photos`
```sql
id UUID PRIMARY KEY
audit_id UUID REFERENCES safety_audits
category_id UUID                            -- NEW: Photos organized per category
requirement_id UUID                         -- Optional: Link to specific requirement
photo_url TEXT
latitude, longitude                         -- GPS coordinates
```

### 2. Requirement Management

#### `safety_audit_requirement_revisions`
Tracks versions of requirements for each category:
```sql
id UUID PRIMARY KEY
category_id UUID REFERENCES safety_audit_categories
revision_number INTEGER                     -- 0, 1, 2, ...
is_active BOOLEAN                          -- Only one active per category
effective_date DATE
```

#### `safety_audit_requirements`
Individual checklist items:
```sql
id UUID PRIMARY KEY
revision_id UUID REFERENCES safety_audit_requirement_revisions
item_number INTEGER                        -- 1, 2, 3, ...
description_th TEXT                        -- 'บัตรอนุญาตทำงาน'
criteria_th TEXT                           -- 'ติดบัตรอนุญาตถูกต้อง'
weight INTEGER (1-5)                       -- Importance factor
```

**Example Requirements:**

**Category A (Worker Readiness) - Rev 0:**
| Item | Description | Criteria | Weight |
|------|-------------|----------|---------|
| 1 | บัตรอนุญาตทำงาน | ติดบัตรอนุญาตถูกต้อง | 1 |
| 2 | หมวกนิรภัย พร้อมสายรัดคาง | สวมหมวกนิรภัย พร้อมรายรัดคางได้ถูกต้อง | 2 |
| 3 | รองเท้านิรภัย | สวมรองเท้านิรภัยที่ได้มาตรฐาน | 2 |
| 4 | ความเหมาะสมของ PPE อื่นๆ | ตรวจสอบ PPE Matrix ตามลักษณะงาน | 3 |

**Category B (Tools & Equipment) - Rev 1:**
| Item | Description | Criteria | Weight |
|------|-------------|----------|---------|
| 1 | สติ๊กเกอร์อนุญาต การใช้เครื่องมือ อุปกรณ์ | ตรวจอนุญาตได้ถูกต้องตามระยะเวลา | 1 |
| 2 | เซฟตี้การ์ด เช่น ครอบใบตัด | มีเซฟตี้ครอบส่วนที่เคลื่อนไหว อันตรายของเครื่องมือ | 2 |
| 3 | สภาพเพาเวอร์ปลั๊ก และสายไฟฟ้า | อยู่ในสภาพที่ปลอดภัย | 2 |
| 4 | สวิตช์เปิด-ปิด | สามารถใช้งานได้เป็นปกติ | 2 |
| 5 | การตรวจสอบทางกายภาพ | อยู่ในสภาพที่ปลอดภัย | 2 |
| 6 | กล่องต่อสายไฟฟ้าชั่วคราว | ต้องใช้กล่องต่อสายแบบมี เบรกเกอร์ เท่านั้น | 3 |

## UI Form Flow

### 1. Header Section (General Info)
- **Project**: Dropdown (from projects table)
- **Audit Date**: Date picker
- **Location**: Hierarchical area input (Main Area → Sub Area 1 → Sub Area 2 → Specific Location)
- **Companies**: Multi-select checkbox (via safety_audit_companies table)
- **Number of Personnel**: Number input
- **Auditor**: Auto-filled from current user

### 2. Category Tabs
```
[ A ] [ B ] [ C ] [ D ] [ E ] [ F ] [ G ]
```
- Click tab to switch category
- Display category name and description below tabs
- Show requirements for selected category only

### 3. Requirements Section (Per Category)
For each requirement in the selected category:

```
┌─────────────────────────────────────────────────────────────┐
│ Item 1: บัตรอนุญาตทำงาน (Weight: 1)                         │
│ Criteria: ติดบัตรอนุญาตถูกต้อง                              │
│                                                             │
│ Score: [3] [2] [1] [0] [N/A]    (button group)            │
│ Comment: [___________________________________]              │
└─────────────────────────────────────────────────────────────┘
```

### 4. Photos Section (Per Category)
- Upload button: "Add Photo"
- Display uploaded photos for current category
- Optional: Link photo to specific requirement

### 5. Score Display (Real-time)
Show per-category and overall scores:
```
Category A: 85% (17/20 points)
Category B: 90% (27/30 points)
Overall: 87.5%
```

## Data Storage Strategy

### Option 1: Store in safety_audit_results table (RECOMMENDED)
**Pros:**
- ✅ Queryable (can filter by score, requirement, category)
- ✅ Relational integrity (foreign keys)
- ✅ Easy to generate reports
- ✅ Can update individual items without parsing JSON

**Example Data:**
```sql
INSERT INTO safety_audit_results 
  (audit_id, category_id, requirement_id, score, comment, weighted_score)
VALUES
  ('audit-123', 'cat-a-uuid', 'req-1-uuid', 3, 'Good', 3.0),
  ('audit-123', 'cat-a-uuid', 'req-2-uuid', 2, 'Need improvement', 4.0),
  ('audit-123', 'cat-b-uuid', 'req-5-uuid', NULL, 'N/A - not applicable', NULL);
```

### Option 2: Store as JSON in safety_audits (Alternative)
**Pros:**
- ✅ Simpler schema
- ✅ Flexible structure

**Cons:**
- ❌ Hard to query individual scores
- ❌ Must parse JSON for reports
- ❌ No referential integrity

**JSON Format:**
```json
{
  "results": [
    {
      "requirement_id": "req-1-uuid",
      "category_id": "cat-a-uuid",
      "score": 3,
      "comment": "Good"
    },
    {
      "requirement_id": "req-2-uuid",
      "category_id": "cat-a-uuid",
      "score": 2,
      "comment": "Need improvement"
    }
  ]
}
```

## Score Calculation

### Per-Category Score
```typescript
function calculateCategoryScore(results: AuditResult[], requirements: Requirement[]) {
  let totalScore = 0;
  let maxScore = 0;
  
  results.forEach(result => {
    if (result.score !== null) {  // Exclude N/A
      const req = requirements.find(r => r.id === result.requirement_id);
      totalScore += result.score * req.weight;
      maxScore += 3 * req.weight;  // Max score per item = 3
    }
  });
  
  const weightedAverage = maxScore > 0 ? (totalScore / maxScore) * 3 : 0;
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  
  return {
    totalScore,
    maxScore,
    weightedAverage,
    percentage
  };
}
```

### Overall Score
```typescript
function calculateOverallScore(categoryScores: CategoryScore[]) {
  const totalScore = categoryScores.reduce((sum, cat) => sum + cat.totalScore, 0);
  const maxScore = categoryScores.reduce((sum, cat) => sum + cat.maxScore, 0);
  
  return {
    totalScore,
    maxScore,
    weightedAverage: maxScore > 0 ? (totalScore / maxScore) * 3 : 0,
    percentage: maxScore > 0 ? (totalScore / maxScore) * 100 : 0
  };
}
```

## SQL Queries

### Get Active Requirements for a Category
```sql
SELECT 
  req.id,
  req.item_number,
  req.description_th,
  req.criteria_th,
  req.weight
FROM safety_audit_requirements req
JOIN safety_audit_requirement_revisions rev ON req.revision_id = rev.id
WHERE rev.category_id = $1
  AND rev.is_active = true
ORDER BY req.display_order, req.item_number;
```

### Get Audit Results by Category
```sql
SELECT 
  r.id,
  r.requirement_id,
  r.score,
  r.comment,
  r.weighted_score,
  req.description_th,
  req.criteria_th,
  req.weight
FROM safety_audit_results r
JOIN safety_audit_requirements req ON r.requirement_id = req.id
WHERE r.audit_id = $1
  AND r.category_id = $2
ORDER BY req.item_number;
```

### Get Audit Summary with All Scores
```sql
SELECT 
  a.id,
  a.audit_number,
  a.audit_date,
  a.total_score,
  a.max_possible_score,
  a.weighted_average,
  a.percentage_score,
  a.category_scores,
  -- Count of categories with results
  COUNT(DISTINCT r.category_id) AS categories_completed
FROM safety_audits a
LEFT JOIN safety_audit_results r ON a.id = r.audit_id
WHERE a.id = $1
GROUP BY a.id;
```

## Migration from v2 to v3

Run the migration SQL file:
```bash
psql -h your-db-host -U your-user -d your-db -f safety_audit_schema_v3_multi_category.sql
```

This will:
1. ✅ Remove `category_id` from `safety_audits` table
2. ✅ Add `audit_criteria_rev` JSONB field
3. ✅ Add `category_id` to `safety_audit_results` table
4. ✅ Add `category_id` to `safety_audit_photos` table
5. ✅ Create helper views and functions
6. ✅ Insert sample requirements for categories A, B, C
7. ✅ Create automatic score calculation triggers

## Benefits of This Design

1. **✅ Flexible Revisions**: Track which version of requirements was used
2. **✅ Multi-Category Support**: One audit session covers all categories
3. **✅ Efficient Storage**: Normalized data with JSON where appropriate
4. **✅ Easy Querying**: Can filter and report by category, score, date, etc.
5. **✅ Automatic Calculations**: Triggers update scores in real-time
6. **✅ Historical Accuracy**: Old audits display with the requirements that were active at the time
7. **✅ Photo Organization**: Photos grouped by category for easy viewing
