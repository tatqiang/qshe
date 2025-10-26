# Duplicate Key Error Fix

## 🐛 Problem

When toggling checkboxes in Project Form Config page, you got this error:

```
Error 409 (Conflict)
duplicate key value violates unique constraint 
"project_field_configs_project_form_config_id_form_field_id_key"
```

## 🔍 Root Cause

1. **Init script created records**: When you ran `init_project_form_configs.sql`, it created `project_field_configs` records for all fields
2. **Code tried to INSERT**: The `updateFieldConfig` function checked if config exists in memory, but if not found, tried to INSERT
3. **Record already exists in DB**: This caused a unique constraint violation

## ✅ Solution Applied

### Changed INSERT to UPSERT

**Before:**
```typescript
// Create new
const { data, error } = await supabase
  .from('project_field_configs')
  .insert({
    project_form_config_id: projectFormConfigId,
    form_field_id: fieldId,
    ...updates,
  })
  .select()
  .single();
```

**After:**
```typescript
// Create new - use UPSERT to handle duplicates
const { data, error } = await supabase
  .from('project_field_configs')
  .upsert({
    project_form_config_id: projectFormConfigId,
    form_field_id: fieldId,
    ...updates,
  }, {
    onConflict: 'project_form_config_id,form_field_id',
    ignoreDuplicates: false, // Update existing record
  })
  .select()
  .single();
```

### Added Debug Logging

Added console logs to help diagnose future issues:
- `📊 Loaded field configs: X` - Shows how many configs loaded
- `📝 Form fields: X` - Shows how many fields in template
- `🔍 Looking for config for field X: FOUND/NOT FOUND` - Shows if config exists

## 🎯 How UPSERT Works

```sql
-- UPSERT = UPDATE + INSERT
ON CONFLICT (project_form_config_id, form_field_id) DO UPDATE
```

If record exists → **UPDATE** it
If record doesn't exist → **INSERT** it

This prevents the duplicate key error!

## 🧪 Testing Steps

1. **Open browser console** (F12)
2. **Navigate to** `/admin/project-form-config`
3. **Select** project "Under Test" and template
4. **Watch console** for logs:
   ```
   📊 Loaded field configs: 27
   📝 Form fields: 27
   ```
5. **Toggle checkbox**
6. **Watch console**:
   ```
   🔍 Looking for config for field abc-123: FOUND
   ✓ Saved ✓
   ```

## 🔧 What Changed

### Files Modified:
- `src/pages/admin/ProjectFormConfigPage.tsx`

### Changes:
1. ✅ Changed `.insert()` to `.upsert()` with conflict handling
2. ✅ Added `onConflict` specification
3. ✅ Updated state management to handle both new and updated records
4. ✅ Added debug console logs
5. ✅ Improved error handling

## 📝 Additional Notes

### Why the error happened:

1. **First time**: No configs exist → INSERT works
2. **After init script**: Configs exist in DB
3. **React state**: May not have loaded all configs
4. **Toggle checkbox**: Code doesn't find in state → tries INSERT
5. **Database**: Record already exists → ERROR!

### UPSERT prevents this:

- Doesn't care if record exists or not
- Will UPDATE if exists, INSERT if not
- Always succeeds (unless other constraints violated)

## 🚀 Next Steps

The fix is complete! You should now be able to:
- ✅ Toggle "Visible" checkboxes without errors
- ✅ Toggle "Required" checkboxes without errors
- ✅ Drag & drop to reorder fields
- ✅ See "Saved ✓" toast notifications

If you still see errors, check the browser console for the debug logs.
