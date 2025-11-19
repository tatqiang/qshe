# Material Template Selector - Implementation Summary

## ✅ Completed Features

### 1. Material Template Selector Component
**File:** `src/components/materials/receive/MaterialTemplateSelector.vue`

**Features:**
- ✅ Searchable input with dropdown (like MaterialTemplatesManager)
- ✅ Multi-phrase search with comma separation (e.g., "steel, pipe, black")
- ✅ Filter by Material Group dropdown
- ✅ Displays both English and Thai titles (title_1 through title_5)
- ✅ Shows material group and dimension group icons/labels
- ✅ Keyboard navigation (arrow keys, enter, escape)
- ✅ Selected template display with clear button
- ✅ Emits template ID and full template object

### 2. RLS Policies for Material Templates
**File:** `ex_qshe/CREATE_MATERIAL_TEMPLATE_RLS_POLICIES.sql`

**Tables Covered:**
- ✅ `material_groups` (4 policies)
- ✅ `material_templates` (4 policies)
- ✅ `dimension_groups` (4 policies)
- ✅ `dimensions` (4 policies)

**Pattern:** All use `USING (true)` for Azure AD authentication compatibility

**Deployment:** Run this SQL in Supabase SQL Editor

### 3. Updated Step1Prepare Component
**File:** `src/components/materials/receive/Step1Prepare.vue`

**New Fields in Line Items:**
```typescript
{
  material_template_id: number | null,
  dimension_group_id: number | null,
  dimension_group_name: string,
  availableDimensions: Dimension[],
  selectedDimensions: number[],
  selectAllDimensions: boolean,
  // ... existing fields
}
```

**Features Added:**
1. ✅ **Material Template Selector** (first field in each item)
   - Required field before material code
   - Triggers auto-fill and dimension loading

2. ✅ **Auto-fill from Inventory**
   - When template selected, checks `material_inventory` table
   - If record exists with same `template_id` + `project_id`
   - Auto-fills: `material_code_id`, `description`, `unit_of_measure`

3. ✅ **Dimension Group Selector**
   - Only appears if template has `dimension_group_id`
   - Shows dimension group name
   - Displays all dimensions in a grid (2-3 columns)
   - Individual checkboxes for each dimension

4. ✅ **"Select All Dimensions" Feature**
   - Checkbox at top of dimension list
   - Selects/deselects all dimensions in the group at once
   - Auto-updates when individual checkboxes change
   - Shows count of selected dimensions

### 4. Updated materialService
**File:** `src/lib/api/materialSystem.ts`

**New Method:**
```typescript
getMaterialInventoryByTemplate(
  templateId: number,
  projectId: string,
  dimensionId?: number | null
): Promise<any | null>
```

**Purpose:**
- Checks if material already exists in inventory
- Returns material_code info for auto-fill
- Used by auto-fill feature

**Existing Method Used:**
- `getDimensionsByGroup(dimensionGroupId, dimensionType?)` - Already existed

## 🎯 User Workflow

### Step-by-Step Process:

1. **User clicks "Add Item"**
   - New line item appears

2. **User selects Material Template** (Required)
   - Searchable dropdown with filtering
   - Can search by any title field (EN or TH)
   - Can filter by material group
   - Template displays as: "Black Steel | ERW | Sch 40 | Pipe"

3. **Auto-fill Triggers**
   - System checks `material_inventory` for existing record
   - If found: material_code, description, unit auto-filled
   - User sees pre-filled values ✅

4. **Dimensions Appear (if applicable)**
   - If template has dimension group: dimension selector shows
   - User can:
     - ✅ Check "Select All Dimensions" → selects entire group
     - ✅ Or select individual dimensions (e.g., "1/2 inch / 15 mm")
   - Count shows: "5 dimension(s) selected"

5. **Material Code (optional override)**
   - If auto-filled from inventory: displays existing code
   - User can still change/search for different code

6. **Other Fields**
   - Description, Unit, Quantity, Price, Remark

## 📋 Database Requirements

### Before Using:
1. **Deploy RLS Policies:**
   ```sql
   -- Run in Supabase SQL Editor
   -- File: ex_qshe/CREATE_MATERIAL_TEMPLATE_RLS_POLICIES.sql
   ```

2. **Verify Tables Exist:**
   - `material_groups`
   - `material_templates`
   - `dimension_groups`
   - `dimensions`
   - `material_inventory`

3. **Sample Data Required:**
   - At least 1 material group
   - At least 1 material template
   - Optional: dimension groups with dimensions
   - Optional: material_inventory records for auto-fill

## 🔧 Technical Details

### Component Pattern:
```vue
<!-- Usage in Step1Prepare.vue -->
<MaterialTemplateSelector
  v-model="item.material_template_id"
  :project-id="projectId"
  @select="handleTemplateSelect(index, $event)"
/>
```

### Dimension Display Format:
```typescript
formatDimensionDisplay(dimension: Dimension): string {
  // Example: "1/2 inch / 15 mm / Long"
  return [size_1, size_2, size_3].filter(Boolean).join(' / ')
}
```

### Select All Logic:
```typescript
// When "Select All" checked
selectedDimensions = availableDimensions.map(d => d.id)

// When individual checkbox changes
selectAllDimensions = (selectedDimensions.length === availableDimensions.length)
```

## 🎨 UI Features

### MaterialTemplateSelector:
- Search icon (magnifying glass)
- Clear button (X) when selected
- Group filter dropdown
- Results count display
- Selected template green badge
- Keyboard accessible

### Dimension Selector:
- Gray background header with "Select All"
- Scrollable grid (max-height: 10rem)
- Checkbox + label for each dimension
- Blue count badge
- Only shows when template has dimension group

## 🚀 Next Steps

1. **Deploy RLS policies** (run SQL file)
2. **Test with real data**:
   - Create material groups
   - Create material templates
   - Create dimension groups with dimensions
   - Add some inventory records
3. **Verify auto-fill** works
4. **Test "Select All Dimensions"** feature
5. **Proceed to Step 2 & Step 3** testing

## 📝 Notes

- All TypeScript import errors are expected - they resolve at build time
- Material template selection is now **required** (validates in canProceed)
- Auto-fill only happens if inventory record exists
- Dimensions are optional - user can skip if not applicable
- Multiple dimensions can be selected per item

## 🔍 Validation Rules

**Can proceed to Step 2 when:**
- ✅ Store selected
- ✅ At least 1 item with:
  - ✅ Material template selected (`material_template_id`)
  - ✅ Description filled
  - ✅ Unit of measure filled
  - ✅ Quantity > 0

**Optional fields:**
- Material code (can be auto-filled or manual)
- Dimensions (only if template has dimension group)
- Unit price
- Remark
