# Test Form Configuration Display

## 🧪 New Test Page Created!

A diagnostic page to see exactly how your configuration affects the form display.

### How to Access

**URL Format:**
```
/admin/test-form-config?project_id=YOUR_PROJECT_ID&template_id=YOUR_TEMPLATE_ID
```

### Get the IDs

Run this SQL to get your project and template IDs:

```sql
-- Get project ID for "Under Test"
SELECT id, name FROM projects WHERE name = 'Under Test';

-- Get template ID for member application
SELECT id, name_th FROM form_templates WHERE code = 'MEMBER_APPLICATION';
```

### Example URL

If your IDs are:
- Project ID: `abc-123-def-456`
- Template ID: `xyz-789-ghi-012`

Then visit:
```
http://localhost:5173/admin/test-form-config?project_id=abc-123-def-456&template_id=xyz-789-ghi-012
```

## 📊 What the Test Page Shows

### 1. Configuration Summary Table
Shows all visible fields with:
- **Order** - The `custom_display_order` value
- **Section** - Which section the field belongs to
- **Field Key** - Database column name
- **Label** - Thai label text
- **Type** - Field type (text, select, radio, etc.)
- **Visible** - ✓ or ✗
- **Required** - * or -

### 2. Grouped Form Preview
Shows how fields will appear in the actual form:
- Grouped by sections (ข้อมูลส่วนตัว, ที่อยู่, etc.)
- Sorted by `custom_display_order` within each section
- Shows field details and settings
- Mock input fields (disabled)

## 🔍 What to Check

### Address Section Should Show:
```
ที่อยู่ (Address Section)
  ├─ เลขที่ (order 50) ✓ *
  ├─ ถนน (order 60) ✓    ← SHOULD BE HERE!
  ├─ หมู่ (order 70) ✓
  ├─ ซอย (order 80) ✓
  ├─ ตำบล (order 90) ✓ *
  ├─ อำเภอ (order 100) ✓ *
  └─ จังหวัด (order 110) ✓ *
```

### If "ถนน" is Missing:

It means the config record doesn't exist! Run this SQL:

```sql
INSERT INTO project_field_configs (
    project_form_config_id,
    form_field_id,
    is_visible,
    is_required,
    custom_display_order
)
SELECT 
    pfc.id,
    ff.id,
    true,
    false,
    60
FROM project_form_configs pfc
JOIN projects p ON p.id = pfc.project_id
CROSS JOIN form_fields ff
WHERE p.name = 'Under Test'
AND ff.field_key = 'address_street'
AND NOT EXISTS (
    SELECT 1 FROM project_field_configs pfield
    WHERE pfield.project_form_config_id = pfc.id
    AND pfield.form_field_id = ff.id
);
```

Then refresh the test page!

## 🎯 How to Test Configuration Changes

### Test Workflow:

1. **Go to config page**: `/admin/project-form-config`
2. **Make a change**: Toggle visible, required, or drag to reorder
3. **Go to test page**: `/admin/test-form-config?project_id=...&template_id=...`
4. **Refresh** (Ctrl + Shift + R)
5. **Verify** the change appears correctly

### Example Tests:

**Test 1: Hide a field**
1. Config page: Uncheck "Visible" for "ซอย"
2. Test page: "ซอย" should disappear from address section

**Test 2: Change order**
1. Config page: Drag "ถนน" above "เลขที่"
2. Test page: "ถนน" should appear first in address section

**Test 3: Make required**
1. Config page: Check "Required" for "ถนน"
2. Test page: "ถนน" should show red asterisk (*)

## 🐛 Troubleshooting

### Page is blank
- Check browser console for errors
- Verify project_id and template_id are correct UUIDs
- Make sure you're logged in as admin

### Fields not appearing
- Check if `is_visible = true` in database
- Run QUERY 5 from manual_fix_street_field.sql
- Verify project_field_configs records exist

### Order is wrong
- Check `custom_display_order` values
- Make sure there are no NULL values
- Fields are sorted within each section

### Changes not showing
- Hard refresh: Ctrl + Shift + R
- Clear browser cache
- Check if database was actually updated

## 📝 SQL Helper Queries

### Check all address fields:
```sql
SELECT 
    pfc.custom_display_order,
    ff.field_key,
    ff.label_th,
    pfc.is_visible,
    pfc.is_required
FROM project_field_configs pfc
JOIN project_form_configs config ON config.id = pfc.project_form_config_id
JOIN projects p ON p.id = config.project_id
JOIN form_fields ff ON ff.id = pfc.form_field_id
WHERE p.name = 'Under Test'
AND ff.section = 'address'
ORDER BY pfc.custom_display_order;
```

### Count total fields:
```sql
SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN is_visible = true THEN 1 ELSE 0 END) as visible,
    SUM(CASE WHEN is_required = true THEN 1 ELSE 0 END) as required
FROM project_field_configs pfc
JOIN project_form_configs config ON config.id = pfc.project_form_config_id
JOIN projects p ON p.id = config.project_id
WHERE p.name = 'Under Test';
```

### Find fields with NULL visibility:
```sql
SELECT 
    ff.field_key,
    ff.label_th,
    pfc.is_visible,
    pfc.custom_display_order
FROM project_field_configs pfc
JOIN project_form_configs config ON config.id = pfc.project_form_config_id
JOIN projects p ON p.id = config.project_id
JOIN form_fields ff ON ff.id = pfc.form_field_id
WHERE p.name = 'Under Test'
AND pfc.is_visible IS NULL;
```

## 🎉 Success Criteria

The test page should show:
- ✅ All configured fields in correct order
- ✅ "ถนน" field in address section (order 60)
- ✅ Required fields marked with asterisk (*)
- ✅ Fields grouped by section properly
- ✅ Changes from config page reflected immediately

If all these pass, your configuration system is working correctly! 🎊
