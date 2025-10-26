# 🔧 Fix Name Display and Save Button - Instructions

## ⚠️ Problem
1. ❌ `{{full_name_th}}` showing instead of actual name
2. ❌ "บันทึกการแก้ไข" button not working

## ✅ Solutions Applied

### Solution 1: Update Database Field (REQUIRED!)

**You MUST run this SQL in Supabase SQL Editor:**

```sql
-- Copy and paste this entire block into Supabase SQL Editor

UPDATE form_fields
SET options = jsonb_build_object(
    'content_th', 'ข้าพเจ้า {{first_name}} {{last_name}} ในฐานะเจ้าของข้อมูลส่วนบุคคลตกลงให้ความยินยอมแก่บริษัท ซิโน-ไทย เอ็นจีเนียริ่ง แอนด์ คอนสตรัคชั่น จำกัด (มหาชน) ในการเก็บรวบรวม เปิดเผย หรือใช้ข้อมูลส่วนบุคคล ข้อมูลส่วนบุคคลอ่อนไหว และข้อมูลส่วนบุคคลอื่นใดที่สามารถระบุว่าเป็นข้าพเจ้าได้ เพื่อเป็นหลักฐานในการยืนยันตัวตน เพื่อใช้ในการดำเนินกิจการ กิจกรรม และธุรกรรมของบริษัท ข้าพเจ้าทราบว่าเจ้าของข้อมูลส่วนบุคคล มีสิทธิที่จะให้ความยินยอมหรือไม่ก็ได้และมีสิทธิตามที่พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562',
    'content_en', 'I, {{first_name}} {{last_name}}, as the owner of personal data, consent to Sino-Thai Engineering and Construction Public Company Limited to collect, disclose, or use personal data, sensitive personal data, and any other personal data that can identify me as evidence of identity verification for use in the company''s operations, activities, and transactions. I acknowledge that the owner of personal data has the right to give or not give consent and has rights under the Personal Data Protection Act B.E. 2562 (2019).',
    'date_label_th', 'วันที่',
    'date_label_en', 'Date',
    'show_date', true
)
WHERE field_key = 'consent_text'
AND form_template_id = (SELECT id FROM form_templates WHERE code = 'MEMBER_APPLICATION');
```

**OR use the prepared file:**
- File: `database/migrations/fix_consent_placeholders.sql`
- Open in Supabase SQL Editor and run it

### Solution 2: Frontend Code Fixed

**Changes applied to code:**

1. **Skip read-only fields in validation** (`MemberFormPage.tsx`)
   - Read-only text fields are now skipped during validation
   - This prevents validation errors on non-editable fields

2. **Added debug logging**
   - Console logs to help identify issues
   - Check browser console (F12) when clicking save button

## 📋 Step-by-Step Instructions

### Step 1: Run Database Migration

1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy the SQL above (or from `database/migrations/fix_consent_placeholders.sql`)
5. Paste and click **Run**
6. You should see: ✅ Success message

### Step 2: Test the Form

1. Open browser and go to member registration form
2. Fill in the form (especially **ชื่อ** and **นามสกุล**)
3. Scroll to **การให้ความยินยอม** section
4. **Verify**: Name should appear instead of `{{full_name_th}}`
   - Should show: "ข้าพเจ้า สมชาย ใจดี ในฐานะ..."
   - NOT: "ข้าพเจ้า {{full_name_th}} ในฐานะ..."

### Step 3: Test Save Button

1. Fill all required fields
2. Open browser console (Press F12)
3. Click "บันทึกการแก้ไข" or "บันทึกข้อมูล"
4. **Check console** for:
   ```
   🚀 Form submitted!
   📝 Form data: {...}
   🔍 Validation starting...
   ✅ Validation passed
   ```
5. If you see ❌ errors, check what fields are missing

## 🐛 Troubleshooting

### Issue: Name still shows {{full_name_th}}

**Cause**: Database not updated yet  
**Fix**: 
1. Make sure you ran the SQL migration in Supabase
2. Refresh the browser page (Ctrl+R)
3. Clear cache (Ctrl+Shift+R)

### Issue: Save button still not working

**Cause**: Validation failing  
**Fix**:
1. Open browser console (F12)
2. Look for error messages
3. Check which fields are marked as required but empty
4. Common issues:
   - Required files not uploaded
   - Required text fields empty
   - Phone number format incorrect

### Issue: Console shows validation errors

**Example error in console:**
```
❌ Validation failed
Errors: { id_card_number: "กรุณากรอกเลขที่บัตรประชาชน" }
```

**Fix**: Fill in the missing field shown in the error

## 🔍 Debug Checklist

When save button doesn't work:

- [ ] Open browser console (F12)
- [ ] Click the save button
- [ ] Check for "🚀 Form submitted!" message
- [ ] If no message: Form submit not triggering (check button type="submit")
- [ ] If message appears but stops at validation: Check error messages
- [ ] Look for red error text under form fields
- [ ] Make sure all required fields (*) are filled

## 📝 Files Modified

1. ✅ `database/migrations/fix_consent_placeholders.sql` (NEW)
   - Quick fix SQL to update consent field

2. ✅ `src/pages/public/MemberFormPage.tsx`
   - Added validation skip for read_only_text fields
   - Added debug console logs
   - Fixed potential validation blocking issue

## ✨ Expected Result

### Before Fix
```
การให้ความยินยอม *

วันที่ 20 ตุลาคม 2568

    ข้าพเจ้า {{full_name_th}} ในฐานะ...  ❌ Wrong!
```

### After Fix
```
การให้ความยินยอม *

วันที่ 20 ตุลาคม 2568

    ข้าพเจ้า สมชาย ใจดี ในฐานะ...  ✅ Correct!
```

### Save Button
- Should submit form when clicked
- Console shows progress messages
- Files upload
- Data saves
- Redirects to summary page

## 🚨 IMPORTANT

**You MUST run the SQL migration!** The frontend code is already fixed, but the database still has the old placeholder `{{full_name_th}}`. Running the SQL will update it to `{{first_name}} {{last_name}}`.

---
**Quick Steps:**
1. Run SQL in Supabase ← **DO THIS FIRST!**
2. Refresh browser
3. Test form
4. Check console if save fails

**Status**: Code ready, database needs update
**Action Required**: Run SQL migration in Supabase
