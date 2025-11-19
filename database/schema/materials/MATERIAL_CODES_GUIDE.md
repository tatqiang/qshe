# Material Codes - Quick Reference

## Overview
Material codes are **user-defined codes** that projects can assign to materials for easier identification and tracking. Each project maintains its own coding system.

## Table Structure

```sql
CREATE TABLE material_codes (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL (FK to projects),
  material_code VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE (project_id, material_code)
);
```

## Usage in Material Receive Process

### Step 5.1: Prepare Material Receive

When adding line items, the system handles material codes as follows:

#### Existing Material (Found in Inventory)
```
User selects: Black Steel | ERW | Sch 40 | Grade A | Pipe 1/2"
System checks: Does this exist in current store inventory?
  └─ YES → Auto-display saved material_code: "STEEL-PIPE-001"
           (User can see but doesn't need to re-select)
```

#### New Material (From Template, Not in Inventory)
```
User selects: Concrete | Portland | Type I | 50 kg
System checks: Does this exist in current store inventory?
  └─ NO → User must SELECT or CREATE material_code
          AND optionally add specific_detail
          
Options:
1. Select existing code from dropdown (material_codes for this project)
   Example: "CEMENT-PORT-01", "CEMENT-PORT-02", etc.
   Then optionally add specific_detail: "Bulk delivery", "Bagged", etc.
   
2. Create new code:
   - Enter new material_code: "CEMENT-001"
   - Enter description: "Portland Type I Cement"
   - Optionally add specific_detail: "50kg bags"
   - Save → Added to material_codes table
```

## Material Code Selection UI

### Auto-Fill Scenario (Existing Inventory)
```
┌─────────────────────────────────────────────┐
│ Material Template: ▼ Selected                │
│ Black Steel | ERW | Sch 40 | Grade A | 1/2" │
│                                               │
│ Material Code: STEEL-PIPE-001 ✓              │
│ (Auto-filled from inventory)                 │
└─────────────────────────────────────────────┘
```

### Manual Selection (New Material)
```
┌─────────────────────────────────────────────┐
│ Material Template: ▼ Selected                │
│ Concrete | Portland | Type I | 50 kg        │
│                                               │
│ Material Code: ▼ Select or Create New        │
│ ┌───────────────────────────────────────┐   │
│ │ CEMENT-001 - Portland Type I          │   │
│ │ CEMENT-002 - Portland Type II         │   │
│ │ CEMENT-003 - Blended Cement           │   │
│ │ ─────────────────────────────────     │   │
│ │ + Create New Code                     │   │
│ └───────────────────────────────────────┘   │
│                                               │
│ Specific Detail: (Optional)                   │
│ ┌───────────────────────────────────────┐   │
│ │ 50kg bags                             │   │
│ └───────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Create New Code Dialog
```
┌─────────────────────────────────────────┐
│ Create New Material Code                │
│                                         │
│ Material Code: *                        │
│ ┌─────────────────────────────────┐    │
│ │ CEMENT-001                      │    │
│ └─────────────────────────────────┘    │
│                                         │
│ Description:                            │
│ ┌─────────────────────────────────┐    │
│ │ Portland Type I Cement 50kg     │    │
│ └─────────────────────────────────┘    │
│                                         │
│     [Cancel]  [Create & Use]            │
└─────────────────────────────────────────┘
```

## Database Flow

### 1. Check for Existing Inventory
```sql
SELECT mi.material_code_id, mc.material_code, mc.description, mi.specific_detail
FROM material_inventory mi
JOIN material_codes mc ON mc.id = mi.material_code_id
WHERE mi.material_template_id = :template_id
  AND mi.store_id = :store_id
  AND mi.dimension_id = :dimension_id
  AND mi.project_id = :project_id
ORDER BY mi.created_at DESC
LIMIT 10; -- Show recent variants for selection
```

**Result:**
- **Found** → Show list of variants with codes and specific_details
- **Not Found** → Show material code selector dropdown

### 2. Get Available Material Codes for Project
```sql
SELECT id, material_code, description
FROM material_codes
WHERE project_id = :project_id
  AND is_active = TRUE
ORDER BY material_code;
```

### 3. Create New Material Code
```sql
INSERT INTO material_codes (
  project_id,
  material_code,
  description,
  created_by
) VALUES (
  :project_id,
  :material_code,
  :description,
  :user_id
)
RETURNING id;
```

### 4. Save to Receive Item
```sql
INSERT INTO material_receive_items (
  material_receive_id,
  material_template_id,
  material_code_id,  -- Either auto-filled or user-selected
  dimension_id,
  specific_detail,   -- User-added variant detail
  ...
) VALUES (...);
```

### 5. Save to Inventory (Step 5.2)
```sql
INSERT INTO material_inventory (
  material_template_id,
  material_code_id,  -- Copied from receive item
  store_id,
  specific_detail,   -- Copied from receive item
  ...
) VALUES (...);

-- Note: Same template can have multiple inventory records
-- with different codes and/or specific_details
```

## Business Rules

1. ✅ **Material codes are project-specific**
   - Same code can exist in different projects
   - UNIQUE constraint: (project_id, material_code)

2. ✅ **Auto-fill logic**
   - Search by: template_id + store_id + dimension_id
   - If found in inventory → use existing material_code_id
   - If not found → user must select/create

3. ✅ **Code creation**
   - Can create new codes during receive preparation
   - Instantly available for selection
   - Saved to material_codes table

4. ✅ **Inventory linkage**
   - material_inventory.material_code_id links to material_codes
   - Shows material code in inventory views
   - Helps with quick identification

5. ✅ **Flexibility**
   - Projects can use any coding system (numbers, alphanumeric, etc.)
   - Examples: MAT-001, STEEL-A, PIPE-DN50, CEMENT-TYPE1
   
6. ✅ **Multiple Variants**
   - Same template can have multiple inventory records
   - Different material_code and/or specific_detail per variant
   - Example: CLAMP-001 (Hot dip), CLAMP-002 (Galvanized) - same template

## Example Coding Systems

### Option 1: Category-Based
```
STEEL-PIPE-001, STEEL-PIPE-002
CEMENT-PORT-001, CEMENT-PORT-002
WIRE-COPPER-001, WIRE-COPPER-002
```

### Option 2: Sequential
```
MAT-00001, MAT-00002, MAT-00003
```

### Option 3: Descriptive
```
PIPE-DN50-SCH40
CEMENT-50KG-TYPE1
WIRE-2.5MM-COPPER
```

### Option 4: Hybrid
```
A-STEEL-001 (Category A - Steel)
B-CEMENT-001 (Category B - Cement)
C-WIRE-001 (Category C - Wire)
```

## UI/UX Considerations

### Display in Inventory List
```
Material Code    | Description                           | Specific Detail
─────────────────┼───────────────────────────────────────┼──────────────────
STEEL-PIPE-001   | Black Steel ERW Sch 40 Grade A | 1/2" | Hot dip galvanized
STEEL-PIPE-002   | Black Steel ERW Sch 40 Grade A | 1/2" | Painted (Red)
CEMENT-001       | Portland Type I Cement 50kg           | Bagged
CEMENT-002       | Portland Type I Cement 50kg           | Bulk delivery
WIRE-001         | Copper Wire 2.5mm²                    | Black insulation
WIRE-002         | Copper Wire 2.5mm²                    | Red insulation
```

### Search by Material Code
```
Search: [STEEL-PIPE-____]  🔍

Results:
STEEL-PIPE-001 - Black Steel Pipe 1/2"
STEEL-PIPE-002 - Black Steel Pipe 3/4"
STEEL-PIPE-003 - Black Steel Pipe 1"
```

### Barcode/QR Code Integration
```
Material Code: STEEL-PIPE-001
QR Code: [QR_IMAGE] 
  └─ Contains: project_id + material_code + store_id
  └─ Scan to quickly view inventory details
```

## Benefits

1. ✅ **Familiar coding** - Projects can use their existing material coding system
2. ✅ **Quick identification** - Easier to reference materials in conversations
3. ✅ **Barcode integration** - Can print labels with material codes
4. ✅ **Reduced errors** - Auto-fill prevents duplicate coding for same material
5. ✅ **Flexibility** - Each project controls their own coding scheme
6. ✅ **Traceability** - Track materials from receive to inventory using codes

## Migration Notes

For existing materials without codes:
```sql
-- Generate default codes for existing inventory
UPDATE material_inventory mi
SET material_code_id = (
  INSERT INTO material_codes (project_id, material_code, description)
  VALUES (
    mi.project_id,
    'AUTO-' || SUBSTRING(mi.id::text, 1, 8),
    mi.material_description
  )
  ON CONFLICT (project_id, material_code) DO NOTHING
  RETURNING id
)
WHERE mi.material_code_id IS NULL;
```

Or allow projects to manually assign codes through a "Material Code Assignment" tool.
