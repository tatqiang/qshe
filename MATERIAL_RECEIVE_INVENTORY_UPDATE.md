# Material Receive Workflow - Inventory Integration Update

**Date:** 2024-11-16  
**Status:** ✅ Complete

## Overview

Updated the Material Receive workflow to select from pre-populated `material_inventory` instead of `material_templates`. This implements a two-phase approach:

1. **Phase 1 - Add to Inventory:** Pre-populate materials with templates, dimensions, brands, and codes
2. **Phase 2 - Receive Materials:** Select from inventory and only enter received quantities

## Changes Made

### 1. New Component: MaterialInventorySelector.vue

**Location:** `src/components/materials/receive/MaterialInventorySelector.vue`

**Purpose:** Searchable selector that fetches from `material_inventory` table instead of `material_templates`

**Features:**
- Fetches inventory filtered by `project_id` and optional `store_id`
- Joins with `material_templates`, `dimensions`, `brands`, `material_codes`
- Display format: `description | dimension info | Brand: name`
- Shows current stock quantity
- Search by material description
- Emits full inventory record on selection

**Props:**
```typescript
modelValue: string | null  // Selected inventory ID
projectId: string          // Required
storeId?: string          // Optional filter
```

**Emits:**
```typescript
@update:modelValue  // Inventory ID
@select             // Full inventory record
```

---

### 2. Updated Step1Prepare.vue

**Location:** `src/components/materials/receive/Step1Prepare.vue`

#### Removed Components:
- ❌ MaterialTemplateSelector
- ❌ MaterialCodeSelector  
- ❌ UnitSelector
- ❌ Description input field
- ❌ Dimension selector (now part of inventory)

#### Added Components:
- ✅ MaterialInventorySelector

#### New UI Elements:
Display inventory details (read-only) when item is selected:
- Material Code
- Description
- Specific Detail (dimension info)
- Current Stock Quantity
- Unit of Measure

#### Updated Data Structure:
```typescript
// OLD - Template-based
{
  material_template_id: number
  material_code_id: string
  dimension_id: number
  material_description: string
  unit_of_measure: string
  // ... dimension UI fields
}

// NEW - Inventory-based
{
  material_inventory_id: string
  material_code: string        // For display
  material_description: string
  specific_detail: string
  unit_of_measure: string
  current_quantity: number     // For display
  prepared_quantity: number    // User input
  remark: string              // User input
}
```

#### Handler Changes:
```typescript
// OLD
handleTemplateSelect(index, template) {
  // Load dimensions, auto-fill from inventory
}

// NEW
handleInventorySelect(index, inventoryRecord) {
  // Auto-fill all fields from inventory
  item.material_code = inventoryRecord.material_codes?.material_code
  item.material_description = inventoryRecord.material_description
  item.specific_detail = inventoryRecord.specific_detail
  item.unit_of_measure = inventoryRecord.unit_of_measure
  item.current_quantity = inventoryRecord.current_quantity
}
```

---

### 3. Updated Types

**Location:** `src/types/materialSystem.ts`

#### Modified CreateMaterialReceiveItemDTO:
```typescript
export interface CreateMaterialReceiveItemDTO {
  line_number: number
  material_inventory_id: string  // ✅ NEW - replaced material_template_id
  material_code?: string         // For display purposes
  material_description: string
  specific_detail?: string
  unit_of_measure: string
  current_quantity?: number      // For display purposes
  prepared_quantity: number
  unit_price?: number
  remark?: string
}
```

**Removed fields:**
- ❌ `material_template_id: number`
- ❌ `material_code_id: string`
- ❌ `dimension_id: number`
- ❌ `unit_of_measure_th: string`

---

### 4. Updated Material Service

**Location:** `src/services/materialService.ts`

#### Modified createMaterialReceive():

**Key Changes:**
1. Accept `material_inventory_id` in DTO items
2. Query `material_inventory` to get `material_template_id`, `material_code_id`, `dimension_id`
3. Populate `material_receive_items` with both inventory_id and template fields

**Implementation:**
```typescript
async createMaterialReceive(dto: CreateMaterialReceiveDTO, userId: string) {
  // ... create receive header ...
  
  // Fetch inventory records to get template_id and other required fields
  const inventoryIds = dto.items.map(item => item.material_inventory_id)
  const { data: inventoryRecords } = await supabase
    .from('material_inventory')
    .select('id, material_template_id, material_code_id, dimension_id')
    .in('id', inventoryIds)
  
  // Create a map for quick lookup
  const inventoryMap = new Map(inventoryRecords?.map(rec => [rec.id, rec]))
  
  // Create receive items with both inventory_id and template fields
  const items = dto.items.map(item => {
    const inventory = inventoryMap.get(item.material_inventory_id)
    
    return {
      material_receive_id: receive.id,
      material_inventory_id: item.material_inventory_id,  // NEW
      material_template_id: inventory.material_template_id,
      material_code_id: inventory.material_code_id,
      dimension_id: inventory.dimension_id,
      material_description: item.material_description,
      specific_detail: item.specific_detail,
      unit_of_measure: item.unit_of_measure,
      prepared_quantity: item.prepared_quantity,
      // ...
    }
  })
}
```

**Why keep template_id?**
The `material_receive_items` table still has `material_template_id NOT NULL` constraint. We fetch it from the inventory record to maintain backward compatibility and database integrity.

---

## Database Schema

The `material_receive_items` table already supports this workflow:

```sql
CREATE TABLE material_receive_items (
  id UUID PRIMARY KEY,
  material_receive_id UUID NOT NULL,
  
  -- Both fields supported
  material_template_id INTEGER NOT NULL,    -- Still required
  material_inventory_id UUID,               -- ✅ NEW field
  
  material_code_id UUID,
  dimension_id INTEGER,
  
  material_description TEXT NOT NULL,
  specific_detail TEXT,
  unit_of_measure TEXT NOT NULL,
  
  prepared_quantity NUMERIC(15, 3) NOT NULL,
  -- ...
  
  CONSTRAINT material_receive_items_inventory_id_fkey 
    FOREIGN KEY (material_inventory_id) 
    REFERENCES material_inventory (id) ON DELETE SET NULL
);
```

**Note:** No database migration needed - the table already has the `material_inventory_id` column.

---

## User Workflow

### Before (Template-based):
1. Select material template
2. Select dimension (if applicable)
3. Enter material code manually
4. Enter description manually
5. Select unit manually
6. Enter quantity
7. Enter remark

### After (Inventory-based):
1. ✅ Select material from inventory (includes template + dimension + code)
2. ✅ View auto-filled details (code, description, dimension, current stock)
3. ✅ Enter quantity received
4. ✅ Enter remark (optional)

**Benefits:**
- ⚡ Faster data entry (4 steps vs 7 steps)
- ✅ Consistent data (no manual entry errors)
- 📊 Visibility of current stock levels
- 🔗 Direct link between receive and inventory

---

## Testing Checklist

### Prerequisites:
- [x] Materials exist in `material_inventory` (use Add to Inventory feature)
- [x] Store exists for the project
- [x] User is logged in

### Test Steps:
1. Navigate to Material Receive
2. Click "Add New Receive"
3. Select store
4. Click "Select Material from Inventory"
5. Verify dropdown shows inventory items with:
   - Material description
   - Material code
   - Dimension info
   - Brand
   - Current stock quantity
6. Select an item
7. Verify display shows:
   - Material Code (read-only)
   - Description (read-only)
   - Specific Detail (read-only)
   - Current Stock (read-only)
   - Unit (read-only)
8. Enter quantity received
9. Enter remark (optional)
10. Click "Next"
11. Verify Step 2 shows correct details
12. Complete receive workflow

### Expected Results:
- ✅ Inventory selector loads items correctly
- ✅ Selection auto-fills all details
- ✅ Only quantity and remark are editable
- ✅ Current stock is visible
- ✅ Save creates receive with inventory_id link

---

## Files Modified

1. ✅ `src/components/materials/receive/MaterialInventorySelector.vue` (NEW)
2. ✅ `src/components/materials/receive/Step1Prepare.vue` (UPDATED)
3. ✅ `src/types/materialSystem.ts` (UPDATED)
4. ✅ `src/services/materialService.ts` (UPDATED)

---

## Next Steps (Optional Future Enhancements)

### Database Schema Update:
Consider making `material_template_id` nullable and `material_inventory_id` required:

```sql
ALTER TABLE material_receive_items 
  ALTER COLUMN material_template_id DROP NOT NULL,
  ALTER COLUMN material_inventory_id SET NOT NULL;
```

This would fully decouple receives from templates and rely entirely on inventory.

### Step2ReceiveCheck Updates:
- Show inventory-based details instead of template-based
- Display current stock + received = new total
- Update calculations to use inventory quantities

### Inventory Quantity Updates:
When completing receive (Step 3):
```typescript
// Update material_inventory.current_quantity
await supabase
  .from('material_inventory')
  .update({
    current_quantity: current_quantity + received_quantity
  })
  .eq('id', material_inventory_id)
```

---

## Notes

- TypeScript path resolution errors (`Cannot find module '@/composables/...'`) are build-time warnings only and don't affect runtime
- The dev server automatically handles these with Vite's path aliases
- No compiled `.js` files should exist in `src/components/` directory
- Clear browser cache if changes don't appear immediately
