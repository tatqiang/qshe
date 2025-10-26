# Field Name Fix - Consent Form

## 🐛 Issue Found
The consent form was not displaying member names because:
- Code was using `first_name_th` and `last_name_th`
- Database actually uses `first_name` and `last_name`

## ✅ Files Fixed

### 1. `src/components/member-form/MemberRegistrationReport.tsx`
**Consent Text Section:**
```tsx
// BEFORE (wrong field names)
ข้าพเจ้า {memberData?.first_name_th || ''} {memberData?.last_name_th || ''} ในฐานะ...

// AFTER (correct field names)
ข้าพเจ้า {memberData?.first_name || ''} {memberData?.last_name || ''} ในฐานะ...
```

**Signature Section:**
```tsx
// BEFORE (wrong field names)
({memberData?.first_name_th || ''} {memberData?.last_name_th || ''})

// AFTER (correct field names)
({memberData?.first_name || ''} {memberData?.last_name || ''})
```

### 2. `database/migrations/restructure_consent_form.sql`
**Placeholder Names:**
```sql
-- BEFORE (wrong placeholders)
'content_th', 'ข้าพเจ้า {{full_name_th}} ในฐานะ...'
'content_en', 'I, {{full_name_en}}, as the owner...'

-- AFTER (correct placeholders)
'content_th', 'ข้าพเจ้า {{first_name}} {{last_name}} ในฐานะ...'
'content_en', 'I, {{first_name}} {{last_name}}, as the owner...'
```

## 📋 Database Field Names (Confirmed)

From `database/member_application_seed.sql`:
- ✅ `first_name` - ชื่อ (First Name)
- ✅ `last_name` - นามสกุล (Last Name)

**NOT** `first_name_th` or `last_name_th`

## 🎯 Expected Output

### Report Page 2 - Now Shows:
```
วันที่ 18 ตุลาคม 2568

    ข้าพเจ้า สมชาย ใจดี ในฐานะเจ้าของข้อมูล
ส่วนบุคคลตกลงให้ความยินยอม...


         [Signature Image]
      ──────────────────
           ลายเซ็น
        (สมชาย ใจดี)    ← Now displays correctly!
       ผู้ให้ความยินยอม
```

### Form Display - Dynamic Field:
The `read_only_text` field in the form will now show:
```
การให้ความยินยอม

┌────────────────────────────────────┐
│ วันที่ 18 ตุลาคม 2568              │
│                                    │
│ ข้าพเจ้า สมชาย ใจดี ในฐานะเจ้า    │  ← Now shows name!
│ ของข้อมูลส่วนบุคคล...             │
└────────────────────────────────────┘
```

## 🧪 Testing

To verify the fix:
1. ✅ Fill out member application form with first name and last name
2. ✅ Submit the form
3. ✅ View the report
4. ✅ Check Page 2:
   - Name should appear after "ข้าพเจ้า"
   - Name should appear in parentheses under signature

## 🔧 Technical Details

### DynamicFormField Component
The `read_only_text` renderer uses this function:
```typescript
const replacePlaceholders = (text: string): string => {
  return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    return formData[trimmedKey] || match;
  });
};
```

This replaces:
- `{{first_name}}` → actual first name from formData
- `{{last_name}}` → actual last name from formData

### Report Component
Direct access to memberData:
```typescript
{memberData?.first_name || ''}  // Gets value directly
{memberData?.last_name || ''}   // Gets value directly
```

---
**Status**: ✅ Fixed
**Issue**: Field name mismatch
**Solution**: Changed `first_name_th/last_name_th` → `first_name/last_name`
**Date**: October 20, 2025
