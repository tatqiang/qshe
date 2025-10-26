# Field Sync Issue - Complete Solution

## 🐛 Problem

When you add a new field (like "ถนน" street field):
1. ✅ Field exists in `form_fields` table
2. ✅ Config page shows the field
3. ❌ **Public form doesn't show the field**

## 🔍 Root Cause

The **MemberFormPage** loads fields from `project_field_configs` with condition:
```typescript
.eq('is_visible', true)
```

**New fields don't have config records yet**, so they don't appear!

## ✅ Complete Solution

### Solution 1: Run Sync Script (Recommended)

**Run this script to add all missing fields to existing projects:**

```cmd
sync_street_field.bat
```

Or manually:
```cmd
psql -U postgres -d qshe_pwa -f database\sync_street_field_to_projects.sql
```

This will:
- ✅ Add `address_street` (ถนน) to all projects
- ✅ Set `is_visible = true` (default)
- ✅ Set `custom_display_order = 105`
- ✅ Set `is_required = false` (default)

### Solution 2: Re-run Init Script

If you want to sync ALL fields (not just new ones):

```cmd
init_project_configs.bat
```

The script now includes `custom_display_order` column!

## 📊 How the System Works

### Field Loading Flow:

```
1. form_fields table
   ↓
   Contains ALL field definitions
   (including newly added fields)

2. project_field_configs table
   ↓
   Contains project-specific overrides
   (only for fields that have been configured)

3. MemberFormPage query
   ↓
   SELECT * FROM project_field_configs
   WHERE is_visible = true
   ↓
   ❌ If field has no config → NOT RETURNED
```

### The Problem:

```
NEW FIELD ADDED
     ↓
form_fields: ✅ Has record
     ↓
project_field_configs: ❌ No record yet
     ↓
MemberFormPage: ❌ Field not loaded
```

### The Solution:

```
RUN SYNC SCRIPT
     ↓
Creates missing config records
     ↓
project_field_configs: ✅ Has record with is_visible=true
     ↓
MemberFormPage: ✅ Field loaded and displayed!
```

## 🎯 What the Sync Script Does

### Before Running:
```sql
-- form_fields table
address_house_number ✅
address_street ✅  ← NEW FIELD
address_moo ✅

-- project_field_configs (Project: Under Test)
address_house_number ✅ (is_visible=true)
address_moo ✅ (is_visible=true)
-- address_street is MISSING!
```

### After Running:
```sql
-- project_field_configs (Project: Under Test)
address_house_number ✅ (is_visible=true, order=100)
address_street ✅ (is_visible=true, order=105) ← ADDED!
address_moo ✅ (is_visible=true, order=110)
```

## 🚀 Testing Steps

### 1. Run the Sync Script
```cmd
sync_street_field.bat
```

Expected output:
```
🔄 Syncing new fields to existing project configurations...
✅ Added 1 missing field configuration(s)

📊 Summary by Form Template:
   📋 แบบฟอร์มขึ้นทะเบียนบุคลากร: 1 projects × 28 fields
```

### 2. Refresh Config Page
- Go to `/admin/project-form-config`
- Select "Under Test" project
- You should see **28 fields** (including ถนน)

### 3. Check Public Form
- Open the member form with token
- You should see "ถนน" field after "เลขที่"

### 4. Verify in Database
```sql
-- Check if street field config exists
SELECT 
    p.name,
    ff.label_th,
    pf.is_visible,
    pf.custom_display_order
FROM project_field_configs pf
JOIN project_form_configs pfc ON pfc.id = pf.project_form_config_id
JOIN projects p ON p.id = pfc.project_id
JOIN form_fields ff ON ff.id = pf.form_field_id
WHERE ff.field_key = 'address_street';
```

Expected result:
```
name        | label_th | is_visible | custom_display_order
------------|----------|------------|--------------------
Under Test  | ถนน      | true       | 105
```

## 📝 Future: Automatic Sync

**Ideally**, when you add a new field, it should automatically get config records.

### Option A: Database Trigger (Recommended)
Create a trigger that runs when new fields are added:

```sql
CREATE OR REPLACE FUNCTION sync_new_field_to_projects()
RETURNS TRIGGER AS $$
BEGIN
    -- When a new field is added, create configs for all projects
    INSERT INTO project_field_configs (
        project_form_config_id,
        form_field_id,
        is_visible,
        is_required,
        custom_display_order
    )
    SELECT 
        pfc.id,
        NEW.id,
        NEW.is_visible_by_default,
        NEW.is_required_by_default,
        NEW.display_order
    FROM project_form_configs pfc
    WHERE pfc.form_template_id = NEW.form_template_id
    ON CONFLICT DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_new_field_trigger
AFTER INSERT ON form_fields
FOR EACH ROW
EXECUTE FUNCTION sync_new_field_to_projects();
```

### Option B: Application-Level Sync
Modify `add_address_street_field.sql` to include sync step:

```sql
-- Step 1: Add field
INSERT INTO form_fields (...) VALUES (...);

-- Step 2: Auto-sync to all projects
INSERT INTO project_field_configs (...)
SELECT ... FROM project_form_configs ...
```

## 🔧 Files Modified

### Updated Files:
1. `database/init_project_form_configs.sql`
   - Now includes `custom_display_order` column
   
2. `database/sync_street_field_to_projects.sql`
   - Generalized to sync ALL missing fields
   - Shows summary report

3. `sync_street_field.bat`
   - Updated description

## 📚 Key Takeaways

1. **Config page shows all fields** ✅ (loads from `form_fields`)
2. **Public form shows only configured fields** ⚠️ (loads from `project_field_configs`)
3. **New fields need config records** to appear in forms
4. **Run sync script** after adding new fields
5. **Consider database trigger** for automatic sync in future

## 🎉 Summary

**Run this now:**
```cmd
sync_street_field.bat
```

Then refresh your form - the "ถนน" field will appear! 🎊
