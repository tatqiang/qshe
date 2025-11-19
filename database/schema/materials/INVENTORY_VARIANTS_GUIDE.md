# Material Inventory Flexibility - Multiple Variants Guide

## Overview
The material inventory system allows **multiple inventory records** from the **same material template** within a project. This provides flexibility for tracking different variants of the same base material.

## Key Concept

**One Template → Multiple Inventory Records**

A single material template (e.g., "Steel Clamp") can have multiple distinct inventory entries with:
- Different **material codes**
- Different **specific details** (e.g., "Hot dip", "Galvanized", "Painted red")
- Different **units of measure** (if applicable)
- Different **stores**
- Different **dimensions** (if template has dimension group)

## Database Design

### No Unique Constraint
```sql
-- OLD (restrictive):
UNIQUE (material_template_id, store_id, dimension_id)
-- Only ONE inventory record per template+store+dimension

-- NEW (flexible):
-- No unique constraint
-- ALLOWS multiple inventory records per template+store+dimension
```

### Why This Matters
Projects can track nuanced differences between materials without creating new templates.

## Examples

### Example 1: Steel Clamp with Different Treatments

**Material Template:**
- Name: Steel Clamp
- Group: Fasteners
- Dimension: 2 inch

**Multiple Inventory Records (Same Store):**

| Material Code | Specific Detail | Qty | Unit | Note |
|---------------|-----------------|-----|------|------|
| CLAMP-001 | Hot dip | 500 | PCS | Hot-dip galvanized |
| CLAMP-002 | Electro-galvanized | 300 | PCS | Electro-plated |
| CLAMP-003 | Painted (Red) | 150 | PCS | Red painted |
| CLAMP-004 | Stainless steel | 100 | PCS | SS304 |

**All from same template, different variants tracked separately!**

### Example 2: Wire Cable with Different Colors

**Material Template:**
- Name: Electrical Wire
- Type: Copper
- Size: 2.5 mm²

**Multiple Inventory Records:**

| Material Code | Specific Detail | Qty | Unit | Color |
|---------------|-----------------|-----|------|-------|
| WIRE-2.5-BLK | Black insulation | 1000 | M | Black |
| WIRE-2.5-RED | Red insulation | 800 | M | Red |
| WIRE-2.5-BLU | Blue insulation | 500 | M | Blue |
| WIRE-2.5-YLW | Yellow insulation | 300 | M | Yellow |

### Example 3: Cement with Different Packaging

**Material Template:**
- Name: Portland Cement Type I

**Multiple Inventory Records:**

| Material Code | Specific Detail | Qty | Unit | Packaging |
|---------------|-----------------|-----|------|-----------|
| CEMENT-50KG | 50kg bag | 200 | BAG | Standard |
| CEMENT-25KG | 25kg bag | 100 | BAG | Half size |
| CEMENT-BULK | Bulk delivery | 5000 | KG | Loose |

### Example 4: Paint with Different Colors

**Material Template:**
- Name: Acrylic Paint
- Brand: TOA
- Type: Exterior

**Multiple Inventory Records:**

| Material Code | Specific Detail | Qty | Unit (Thai) |
|---------------|-----------------|-----|-------------|
| PAINT-WHT | White (Super White) | 50 | กระป๋อง |
| PAINT-BEG | Beige (Sand) | 30 | กระป๋อง |
| PAINT-GRY | Gray (Storm) | 25 | กระป๋อง |

## UI/UX Flow for Creating Variants

### Step 1: Select Material Template
```
Select Material Template: [Search/Dropdown]
├─ Steel Clamp | 2 inch
└─ Selected ✓
```

### Step 2: Check Existing Variants (Auto-suggest)
```
Existing variants of "Steel Clamp 2 inch" in this store:
┌────────────────────────────────────────────────┐
│ CLAMP-001 - Hot dip (500 PCS)                  │
│ CLAMP-002 - Electro-galvanized (300 PCS)      │
│ CLAMP-003 - Painted (Red) (150 PCS)           │
│ ──────────────────────────────────────────     │
│ + Add New Variant                              │
└────────────────────────────────────────────────┘
```

### Step 3: Select Existing or Create New

**Option A: Add to Existing Variant**
```
Selected: CLAMP-001 - Hot dip
└─ Will add quantity to existing inventory record
```

**Option B: Create New Variant**
```
┌─────────────────────────────────────────────┐
│ Create New Variant                          │
│                                             │
│ Base Template: Steel Clamp | 2 inch        │
│                                             │
│ Material Code: *                            │
│ ┌─────────────────────────────────┐        │
│ │ CLAMP-004                       │        │
│ └─────────────────────────────────┘        │
│                                             │
│ Specific Detail: (Optional)                 │
│ ┌─────────────────────────────────┐        │
│ │ Stainless steel (SS304)         │        │
│ └─────────────────────────────────┘        │
│                                             │
│ Unit: ▼                                     │
│ ┌─────────────────────────────────┐        │
│ │ PCS                             │        │
│ └─────────────────────────────────┘        │
│                                             │
│ Unit (Thai): (Optional)                     │
│ ┌─────────────────────────────────┐        │
│ │ ตัว                             │        │
│ └─────────────────────────────────┘        │
│                                             │
│ Quantity:                                   │
│ ┌─────────────────────────────────┐        │
│ │ 100                             │        │
│ └─────────────────────────────────┘        │
│                                             │
│     [Cancel]  [Create Variant]              │
└─────────────────────────────────────────────┘
```

## Database Queries

### Get All Variants of a Template in a Store
```sql
SELECT 
  mi.id,
  mi.inventory_code,
  mc.material_code,
  mi.specific_detail,
  mi.material_description,
  mi.current_quantity,
  mi.unit_of_measure
FROM material_inventory mi
LEFT JOIN material_codes mc ON mc.id = mi.material_code_id
WHERE mi.material_template_id = :template_id
  AND mi.store_id = :store_id
  AND mi.is_active = TRUE
ORDER BY mc.material_code;
```

### Check if Exact Variant Exists (for Auto-fill)
```sql
-- Check by material_code + specific_detail
SELECT mi.*
FROM material_inventory mi
WHERE mi.material_template_id = :template_id
  AND mi.store_id = :store_id
  AND mi.material_code_id = :material_code_id
  AND COALESCE(mi.specific_detail, '') = COALESCE(:specific_detail, '')
  AND mi.dimension_id IS NOT DISTINCT FROM :dimension_id
LIMIT 1;
```

### Search Variants by Specific Detail
```sql
SELECT mi.*, mc.material_code
FROM material_inventory mi
LEFT JOIN material_codes mc ON mc.id = mi.material_code_id
WHERE mi.material_template_id = :template_id
  AND mi.specific_detail ILIKE '%' || :search_term || '%'
  AND mi.is_active = TRUE;
```

## Material Receive Process with Variants

### Step 5.1: Prepare - Add Line Item

**Scenario 1: Adding to Existing Variant**
```
1. Select template: "Steel Clamp | 2 inch"
2. System shows existing variants:
   - CLAMP-001 - Hot dip (500 PCS)
   - CLAMP-002 - Electro-galvanized (300 PCS)
3. User selects: CLAMP-001 - Hot dip
4. Material code auto-filled: CLAMP-001
5. Specific detail auto-filled: Hot dip
6. User enters quantity: 200
7. On Step 5.2 completion: Adds 200 to existing inventory (500 → 700)
```

**Scenario 2: Creating New Variant**
```
1. Select template: "Steel Clamp | 2 inch"
2. User clicks: "+ Add New Variant"
3. User creates new material code: CLAMP-005
4. User enters specific detail: "Zinc-plated"
5. User enters quantity: 150
6. On Step 5.2 completion: Creates NEW inventory record
   - Template: Steel Clamp | 2 inch
   - Code: CLAMP-005
   - Detail: Zinc-plated
   - Qty: 150
```

## Business Rules

### 1. Variant Identification
A unique variant is identified by:
- material_template_id
- material_code_id
- specific_detail (optional)
- dimension_id (if applicable)
- store_id

### 2. When to Create New Inventory Record
Create new record when:
- ✅ Different material_code
- ✅ Different specific_detail (even if same template + code)
- ✅ Different dimension
- ✅ Different store
- ✅ Explicitly requested by user

### 3. When to Update Existing Inventory Record
Update existing when:
- ✅ Exact match on template + code + specific_detail + dimension + store
- ✅ User selects existing variant from list

### 4. Validation
- ✅ Material code required (can't have anonymous variants)
- ✅ Specific detail optional but recommended for variants
- ✅ Unit can differ between variants of same template
- ✅ All variants tracked separately in transactions

## UI Display Examples

### Inventory List View
```
┌─────────────────────────────────────────────────────────────┐
│ Material Inventory - Main Warehouse                         │
├────────────┬──────────────────────┬──────────┬──────┬───────┤
│ Code       │ Description          │ Detail   │ Qty  │ Unit  │
├────────────┼──────────────────────┼──────────┼──────┼───────┤
│ CLAMP-001  │ Steel Clamp | 2 inch│ Hot dip  │  700 │ PCS   │
│ CLAMP-002  │ Steel Clamp | 2 inch│ Electro  │  300 │ PCS   │
│ CLAMP-003  │ Steel Clamp | 2 inch│ Red paint│  150 │ PCS   │
│ CLAMP-004  │ Steel Clamp | 2 inch│ Stainless│  100 │ PCS   │
│ CLAMP-005  │ Steel Clamp | 2 inch│ Zinc     │  150 │ PCS   │
├────────────┴──────────────────────┴──────────┴──────┴───────┤
│ Total Steel Clamp | 2 inch: 1400 PCS (5 variants)          │
└─────────────────────────────────────────────────────────────┘
```

### Grouped View
```
Steel Clamp | 2 inch (Total: 1400 PCS)
├─ CLAMP-001 - Hot dip: 700 PCS
├─ CLAMP-002 - Electro-galvanized: 300 PCS
├─ CLAMP-003 - Painted (Red): 150 PCS
├─ CLAMP-004 - Stainless steel: 100 PCS
└─ CLAMP-005 - Zinc-plated: 150 PCS
```

## Best Practices

### 1. Naming Specific Details
```
✅ Good:
- "Hot dip galvanized"
- "Painted (RAL 3000 Red)"
- "Stainless steel (SS304)"
- "Black insulation"

❌ Avoid:
- "Type 1" (not descriptive)
- "Good one" (subjective)
- "New" (becomes outdated)
```

### 2. When to Create New Template vs New Variant
**New Template:**
- Fundamentally different material
- Different category/group
- Different base specification

**New Variant:**
- Same base material
- Surface treatment difference
- Color/finish difference
- Packaging difference

### 3. Material Code Strategy
```
Template: Steel Clamp | 2 inch

Option 1: Sequential
CLAMP-001, CLAMP-002, CLAMP-003

Option 2: Descriptive
CLAMP-HD (Hot dip)
CLAMP-EG (Electro-galvanized)
CLAMP-SS (Stainless)

Option 3: Combined
CLAMP-2IN-HD
CLAMP-2IN-EG
CLAMP-2IN-SS
```

## Advantages

1. ✅ **Flexibility** - Track nuanced differences without template explosion
2. ✅ **Simplicity** - One template, multiple variants
3. ✅ **Accuracy** - Precise inventory tracking per variant
4. ✅ **Reporting** - Can aggregate or drill down by variant
5. ✅ **User-friendly** - Users decide granularity level

## Migration Notes

If converting from old system with unique constraints:
```sql
-- Find potential duplicates (same template+store+dimension)
SELECT 
  material_template_id,
  store_id,
  dimension_id,
  COUNT(*) as variant_count,
  STRING_AGG(material_code, ', ') as codes
FROM material_inventory
GROUP BY material_template_id, store_id, dimension_id
HAVING COUNT(*) > 1;

-- These are now valid and can coexist!
```

## Summary

The `specific_detail` field combined with flexible material codes enables:
- **Multiple variants** of same material template
- **User-defined differentiation** (Hot dip, colors, treatments, etc.)
- **Flexible unit assignment** per variant
- **No artificial template proliferation**
- **Better inventory accuracy**

This design matches real-world warehouse operations where the same base material comes in different variants!
