# Material Template Selector - Quick Reference

## 🚀 Deployment Checklist

### 1. Deploy RLS Policies
```sql
-- Run this in Supabase SQL Editor:
-- File: ex_qshe/CREATE_MATERIAL_TEMPLATE_RLS_POLICIES.sql
```

**Tables enabled:**
- material_groups
- material_templates  
- dimension_groups
- dimensions

### 2. Verify Data Exists
- ✅ Material groups created
- ✅ Material templates created
- ✅ (Optional) Dimension groups + dimensions
- ✅ (Optional) Material inventory records

---

## 📱 User Experience

### Material Receive Step 1 - New Flow:

1. **Select Material Template** ⬅️ NEW (Required)
   - Searchable dropdown
   - Filter by group
   - Multi-phrase search (comma separated)

2. **Auto-fill happens** ⬅️ NEW
   - Material code (if exists in inventory)
   - Description
   - Unit of measure

3. **Select Dimensions** ⬅️ NEW (if template has dimension group)
   - "Select All Dimensions" checkbox
   - Individual dimension checkboxes
   - Shows count: "5 dimension(s) selected"

4. **Material Code** (optional override)
5. **Description, Quantity, Unit, Price**

---

## 🔑 Key Features

### ✅ Requirement #1: Filter & Search
**Same as material_template edit modal**
- Group filter dropdown
- Multi-phrase search box
- Real-time filtering

### ✅ Requirement #2: Auto-fill from Inventory
**If material_template + project_id found in material_inventory:**
- Material code → auto-filled
- Description → auto-filled  
- Unit → auto-filled

### ✅ Requirement #3: Select All Dimensions
**When dimension group found:**
- "Select All Dimensions" checkbox
- Individual dimension checkboxes
- Selects entire dimension group at once

---

## 💻 Code Locations

| Component | Path |
|-----------|------|
| Template Selector | `src/components/materials/receive/MaterialTemplateSelector.vue` |
| Updated Step 1 | `src/components/materials/receive/Step1Prepare.vue` |
| API Methods | `src/lib/api/materialSystem.ts` |
| RLS Policies | `ex_qshe/CREATE_MATERIAL_TEMPLATE_RLS_POLICIES.sql` |

---

## 🧪 Testing Steps

1. **Deploy RLS policies**
2. **Create test data:**
   - 1 material group: "Pipes & Fittings"
   - 1 template: "Black Steel | ERW | Sch 40 | Pipe"
   - 1 dimension group: "Nominal Pipe"
   - 3 dimensions: "1/2 inch", "3/4 inch", "1 inch"
3. **Go to Material Receive**
4. **Click "Add Item"**
5. **Search for template** → should find it
6. **Select template** → dimensions should appear
7. **Click "Select All Dimensions"** → all 3 should check
8. **Verify count** → "3 dimension(s) selected"

---

## 🎯 Validation

### Required Fields (Step 1):
- ✅ Store
- ✅ Material Template (per item)
- ✅ Description (per item)
- ✅ Unit of Measure (per item)
- ✅ Quantity > 0 (per item)

### Optional Fields:
- Material Code (auto-filled when possible)
- Dimensions (only if template has dimension group)
- Unit Price
- Remark
- Storage Locations

---

## 🐛 Troubleshooting

### "Template dropdown is empty"
→ Deploy RLS policies for `material_templates` and `material_groups`

### "Dimensions don't appear"
→ Check if template has `dimension_group_id` set
→ Deploy RLS policies for `dimensions` and `dimension_groups`

### "Auto-fill doesn't work"
→ Verify `material_inventory` has record with:
  - Same `material_template_id`
  - Same `project_id`
→ Check `material_inventory` RLS policies exist

### "Select All doesn't work"
→ Check browser console for errors
→ Verify `availableDimensions` array is populated

---

## 📊 Data Flow

```
User selects template
    ↓
handleTemplateSelect() triggered
    ↓
├─ Check dimension_group_id?
│  └─ Yes → Load dimensions from DB
│         → Display dimension selector
│         → Enable "Select All"
│
├─ Query material_inventory
│  └─ Found? → Auto-fill material_code, description, unit
│
└─ Update form state
```

---

## 🔐 RLS Pattern

All material template tables use:
```sql
CREATE POLICY "Allow SELECT on table_name"
  ON table_name FOR SELECT USING (true);
```

**Why?** Azure AD authentication at application level, not Supabase auth.

---

## 📝 Form Data Structure

```typescript
{
  store_id: string,
  items: [{
    // NEW FIELDS
    material_template_id: number,        // Required
    dimension_group_id: number | null,
    selectedDimensions: number[],        // Array of dimension IDs
    selectAllDimensions: boolean,
    availableDimensions: Dimension[],
    
    // EXISTING FIELDS
    material_code_id: number | null,     // Auto-filled when possible
    material_description: string,        // Auto-filled when possible
    unit_of_measure: string,             // Auto-filled when possible
    prepared_quantity: number,
    unit_price: number | null,
    remark: string
  }]
}
```
