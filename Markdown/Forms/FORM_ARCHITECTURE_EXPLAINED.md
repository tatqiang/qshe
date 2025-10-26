# How Form Configuration Actually Works

## 🎯 The Real Architecture

### **Config Page Structure:**
```
Flat list of ALL fields sorted by display_order:
01 - ชื่อ (personal_info)
02 - นามสกุล (personal_info)
03 - เบอร์โทร (personal_info)
04 - เกิดวันที่ (personal_info)
05 - เลขที่ (address)           ← Section changes here
06 - ถนน (address)
07 - หมู่ (address)
08 - ซอย (address)
...
```

### **Form Display Structure:**
```
Section: ข้อมูลส่วนตัว (personal_info)
  - ชื่อ (order 01)
  - นามสกุล (order 02)
  - เบอร์โทร (order 03)
  - เกิดวันที่ (order 04)

Section: ที่อยู่ (address)
  - เลขที่ (order 05)
  - ถนน (order 06)     ← Orders within this section!
  - หมู่ (order 07)
  - ซอย (order 08)
...
```

## 🔍 Why It Looks Different

### Config Page:
- Shows **ONE LONG LIST** of all fields
- Drag-and-drop changes `custom_display_order` globally
- No visual grouping by section

### Public Form:
- Shows **GROUPED BY SECTIONS** (hardcoded section titles)
- Fields sorted by `display_order` **within each section**
- Section order is determined by first field's order in that section

## ✅ How Ordering Actually Works

### Current Code Flow:

```typescript
1. Load fields with custom_display_order
   ↓
2. Sort ALL fields by display_order
   fields.sort((a, b) => a.display_order - b.display_order)
   ↓
3. Group by section (preserving order)
   sections[field.section].push(field)
   ↓
4. Sort within each section (I just added this)
   sections[sectionKey].sort((a, b) => a.display_order - b.display_order)
   ↓
5. Render sections with fields in order
```

### Example:

**Database:**
```
field_key            | section       | custom_display_order
---------------------|---------------|--------------------
first_name           | personal_info | 10
last_name            | personal_info | 20
phone                | personal_info | 30
address_house_number | address       | 100
address_street       | address       | 105  ← This determines position
address_moo          | address       | 110
address_soi          | address       | 115
```

**Rendered Form:**
```html
<section>ข้อมูลส่วนตัว</section>
  <field>ชื่อ</field>          (order 10)
  <field>นามสกุล</field>       (order 20)
  <field>เบอร์โทร</field>      (order 30)

<section>ที่อยู่</section>
  <field>เลขที่</field>        (order 100)
  <field>ถนน</field>           (order 105) ← Position based on order!
  <field>หมู่</field>          (order 110)
  <field>ซอย</field>           (order 115)
```

## 🛠️ What I Fixed

### Problem:
`groupFieldsBySection()` was NOT sorting fields within each section.

### Solution:
Added sorting within each section:

```typescript
const groupFieldsBySection = () => {
    const sections: Record<string, FormField[]> = {};
    
    // Group fields
    fields.forEach((field) => {
      if (!sections[field.section]) {
        sections[field.section] = [];
      }
      sections[field.section].push(field);
    });

    // 👇 ADDED THIS: Sort within each section
    Object.keys(sections).forEach((sectionKey) => {
      sections[sectionKey].sort((a, b) => a.display_order - b.display_order);
    });

    return sections;
  };
```

## 📋 Manual Testing Steps

### 1. Check Database
Copy-paste from `database/manual_fix_street_field.sql`:

```sql
-- See street field config
SELECT 
    p.name,
    ff.field_key,
    ff.label_th,
    pfc.is_visible,
    pfc.custom_display_order
FROM project_field_configs pfc
JOIN project_form_configs config ON config.id = pfc.project_form_config_id
JOIN projects p ON p.id = config.project_id
JOIN form_fields ff ON ff.id = pfc.form_field_id
WHERE p.name = 'Under Test'
AND ff.field_key = 'address_street';
```

Expected:
- `is_visible = true`
- `custom_display_order = 105 or 106` (between house_number and moo)

### 2. Fix NULL Values (if needed)
If `is_visible` is NULL:

```sql
UPDATE project_field_configs pfc
SET is_visible = ff.is_visible_by_default
FROM form_fields ff
WHERE pfc.form_field_id = ff.id
AND pfc.is_visible IS NULL;
```

### 3. Check All Address Fields Order

```sql
SELECT 
    pfc.custom_display_order,
    ff.field_key,
    ff.label_th,
    pfc.is_visible
FROM project_field_configs pfc
JOIN project_form_configs config ON config.id = pfc.project_form_config_id
JOIN projects p ON p.id = config.project_id
JOIN form_fields ff ON ff.id = pfc.form_field_id
WHERE p.name = 'Under Test'
AND ff.section = 'address'
ORDER BY pfc.custom_display_order;
```

Should show:
```
order | field_key            | label_th | is_visible
------|---------------------|----------|------------
100   | address_house_number| เลขที่   | true
105   | address_street      | ถนน      | true  ← HERE!
110   | address_moo         | หมู่     | true
115   | address_soi         | ซอย      | true
...
```

### 4. Refresh Browser
- Hard refresh: `Ctrl + Shift + R`
- Or clear cache

### 5. Check Form
The "ถนน" field should now appear in the "ที่อยู่" section between "เลขที่" and "หมู่".

## 🎯 Understanding Config Page Limitations

The config page **CANNOT show sections visually** because:
- It's designed to show ALL fields in ONE sortable list
- Adding section headers would break drag-and-drop
- Sections are defined by `field.section` column (not in config)

**What you CAN do:**
- ✅ Hide/show fields (checkbox)
- ✅ Make fields required/optional (checkbox)
- ✅ Reorder fields globally (drag-and-drop)

**What happens behind the scenes:**
- Fields are sorted by `custom_display_order`
- Then grouped by `section` when displayed
- Order within section is preserved

## 💡 Future Enhancement Ideas

If you want to see sections in the config page, you could:

### Option A: Add Section Headers (View Only)
```typescript
// In ProjectFormConfigPage.tsx
const groupedFields = fields.reduce((acc, field) => {
  if (!acc[field.section]) acc[field.section] = [];
  acc[field.section].push(field);
  return acc;
}, {});

// Render with section headers
{Object.entries(groupedFields).map(([section, sectionFields]) => (
  <div key={section}>
    <h3>{getSectionTitle(section)}</h3>
    {sectionFields.map(field => <Row field={field} />)}
  </div>
))}
```

### Option B: Add Section Column
Add a column showing which section each field belongs to:

```typescript
<td className="text-sm text-gray-600">
  {getSectionBadge(field.section)}
</td>
```

### Option C: Nested Drag-and-Drop
Allow reordering within sections only (more complex).

## 📝 Summary

**Current Behavior:**
- ✅ Config page: Flat list with drag-and-drop
- ✅ Form: Grouped by sections, sorted within each section
- ✅ `custom_display_order` controls position within section

**What I Fixed:**
- ✅ Added sorting within sections in `groupFieldsBySection()`
- ✅ Changed query to handle NULL `is_visible` values

**What You Need To Do:**
1. Run the SQL queries in `database/manual_fix_street_field.sql`
2. Verify `is_visible = true` for street field
3. Verify `custom_display_order` is correct (105-106 range)
4. Hard refresh browser

The form should now show fields in the correct order based on your configuration! 🎯
