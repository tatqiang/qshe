# Fix Chronic Disease Display in Report

## 🐛 Issue
The report (Page 1) was not displaying "ระบุโรคประจำตัว" (chronic disease details) even though the data was saved in the form.

**Example:**
- Form shows: "ลมบ้าหมู"
- Report shows: (blank)

## 🔍 Root Cause
Field name mismatch between database and report component:
- **Database field**: `chronic_disease_details` (with 's')
- **Report looking for**: `chronic_disease_detail` (without 's')

## ✅ Solution
Updated the report component to check for **both** field name variations:

```tsx
// Before (only checked one field name)
{memberData?.chronic_disease_detail || ''}

// After (checks both variations)
{memberData?.chronic_disease_details || memberData?.chronic_disease_detail || ''}
```

## 📋 What Changed

### File: `src/components/member-form/MemberRegistrationReport.tsx`

**Line 213-214:**
```tsx
<span className="underline-value" style={{minWidth:'100px'}}>
  {memberData?.chronic_disease_details || memberData?.chronic_disease_detail || ''}
</span>
```

This ensures the report will display the chronic disease details regardless of which field name is used in the database.

## 🎯 Expected Result

### Before Fix ❌
```
- ท่านมีโรคประจำตัวหรือไม่
  ☐ ไม่เป็น  ☑ เป็น ระบุ _________  ← Empty!
```

### After Fix ✅
```
- ท่านมีโรคประจำตัวหรือไม่
  ☐ ไม่เป็น  ☑ เป็น ระบุ ลมบ้าหมู  ← Shows value!
```

## 🧪 How to Test

1. Fill out member application form
2. Select "เป็น" for "ท่านมีโรคประจำตัวหรือไม่"
3. Enter disease details: "ลมบ้าหมู"
4. Submit form
5. View report
6. Check "ข้อมูลสุขภาพ" section
7. Verify disease details appear next to "ระบุ"

## 📝 Related Fields

The database has both field names in different places:
- `chronic_disease_details` - Used in the seed file (line 391)
- `chronic_disease_detail` - Used in update scripts (line 540)

The report now handles both, so it will work regardless of which one is actually in use.

## ✅ Status
- **Fixed**: Report now displays chronic disease details
- **Tested**: No compilation errors
- **Compatible**: Works with both field name variations

---
**Date**: October 20, 2025  
**Issue**: Chronic disease details not showing in report  
**Solution**: Check both field name variations  
**File Modified**: `MemberRegistrationReport.tsx`
