# 🧪 Member Application System - Testing Guide

## ✅ Prerequisites Checklist

### 1. Database Setup
- [ ] Run `member_application_cleanup.sql` (if you had errors before)
- [ ] Run `member_application_schema.sql` in Supabase SQL Editor
- [ ] Run `member_application_seed.sql` in Supabase SQL Editor
- [ ] Run `member_application_remove_project.sql` (NEW: removes project dependency)
- [ ] Verify 8 tables created: `form_templates`, `form_fields`, `project_form_configs`, `project_field_configs`, `report_templates`, `member_applications`, `member_application_documents`, `member_application_tokens`
- [ ] Verify form_fields has 27-29 records

### 2. Storage Bucket Setup
- [ ] Create storage bucket named `documents` in Supabase
- [ ] Set public access for the bucket (for file downloads)

### 3. Code Setup
- [ ] All files compiled without errors
- [ ] `npm install react-hot-toast` completed
- [ ] Routes added to App.tsx
- [ ] Updated to use `CompanyMultiSelect` with bilingual modal

---

## 📝 Testing Steps

### Phase 1: Admin Token Creation

1. **Login as Admin**
   - Navigate to your app
   - Login with system_admin or admin account

2. **Navigate to Token Management**
   - Go to: `http://localhost:5173/admin/member-tokens`
   - You should see the Token Management page

3. **Create New Tokens**
   - Click "Create Token" button
   - Fill in the form:
     - **Companies** (NEW: Multi-select with bilingual modal):
       - Search for existing company OR
       - Type "Test Company" → Click "Add new company 'Test Company'"
       - Modal opens with English + Thai name fields
       - Enter English: "Test Company"
       - Enter Thai: "บริษัท เทสต์ จำกัด" (optional)
       - Click "Create Company"
       - Select one or more companies (blue tags appear)
     - **Expires in (days)**: Leave default 30 days or change
     - **Maximum registrations**: Leave default 999 or change to 5 for testing
   - Click "Generate Tokens" (plural if multiple companies selected)
   - ✅ **Expected**: Success toast showing number of tokens created, tokens appear in list below

4. **Copy Registration Link**
   - Find your newly created token in the list
   - ✅ **Expected**: Each company gets its own token/link
   - Click the "Copy" icon (📋) for the company you want to test
   - ✅ **Expected**: "Link copied to clipboard!" toast
   - The link should look like: `http://localhost:5173/public/member-apply?token=abc123...`

---

### Phase 2: Public Registration (Summary Page)

5. **Open Registration Link**
   - Open a **new incognito/private window** (to simulate public user)
   - Paste the copied link
   - ✅ **Expected**: See Summary Page with:
     - Company name (NO project name - members are not linked to projects)
     - Usage counter (0/999)
     - Expiry date
     - "เพิ่มข้อมูลบุคลากร" button
     - Empty member list message

6. **Add First Member**
   - Click "เพิ่มข้อมูลบุคลากร" button
   - ✅ **Expected**: Navigate to Member Form page

---

### Phase 3: Fill Member Form

7. **Complete the Form** (Test all field types)

   **Section 1: ข้อมูลส่วนตัว (Personal Info)**
   - ชื่อ (First Name): `สมชาย`
   - นามสกุล (Last Name): `ใจดี`
   - เบอร์โทร (Phone): `0812345678`
   - เกิดวันที่ (Birth Date): `1990-05-15`
   - ✅ อายุควรคำนวณอัตโนมัติเป็น 34-35 ปี
   - วุฒิการศึกษา: `มัธยมศึกษา`
   - สัญชาติ: `ไทย` (default)
   - ศาสนา: `พุทธ`
   - เลขที่บัตรประชาชน: `1234567890123`
   - ตำแหน่ง: `ช่างเชื่อม`

   **Section 2: ที่อยู่ (Address)**
   - เลขที่: `123`
   - หมู่: `5`
   - ซอย: `ลาดพร้าว`
   - ตำบล: `บางกะปิ`
   - อำเภอ: `ห้วยขวาง`
   - จังหวัด: `กรุงเทพมหานคร`

   **Section 3: ประสบการณ์ทำงาน (Work History)**
   - มีประสบการณ์ในการทำงานก่อสร้างหรือไม่: เลือก `เคย`
   - ✅ ช่อง "เป็นเวลา (ปี)" ควรปรากฏขึ้น (conditional field)
   - เป็นเวลา: `5` ปี

   **Section 4: ข้อมูลสุขภาพ (Health)**
   - กลัวความสูง: `ไม่เป็น`
   - โรคประจำตัว: เลือก `เป็น`
   - ✅ ช่อง "ระบุโรคประจำตัว" ควรปรากฏขึ้น
   - ระบุโรคประจำตัว: `ความดันโลหิตสูง`
   - ตาบอดสี: `ไม่เป็น`
   - โรคลมชัก: `ไม่เป็น`
   - อื่นๆ: (เว้นว่าง)

   **Section 5: เอกสารแนบ (Documents)**
   - รูปถ่ายโปรไฟล์: อัปโหลดรูป JPG/PNG
   - สำเนาบัตรประชาชน: อัปโหลดรูป JPG/PNG/PDF
   - ใบรับรองแพทย์: อัปโหลดรูป JPG/PNG/PDF
   - ✅ **Expected**: แสดงชื่อไฟล์และขนาดหลังเลือก

   **Section 6: ลายเซ็น (Signatures)**
   - วาดลายเซ็นในกล่อง (ใช้ mouse หรือ touch)
   - ทดสอบปุ่ม "ล้างลายเซ็น"
   - วาดลายเซ็นใหม่

8. **Submit Form**
   - Click "บันทึกข้อมูล" button
   - ✅ **Expected**:
     - Loading toast: "กำลังอัปโหลด รูปถ่ายโปรไฟล์..."
     - Loading toast: "กำลังอัปโหลด สำเนาบัตรประชาชน..."
     - Loading toast: "กำลังอัปโหลด ใบรับรองแพทย์..."
     - Success toast: "บันทึกข้อมูลสำเร็จ"
     - Navigate back to Summary Page

---

### Phase 4: Verify Summary Page

9. **Check Member List**
   - ✅ **Expected**: See 1 member card showing:
     - Name: "สมชาย ใจดี"
     - Status badge: "รอตรวจสอบ" (yellow)
     - รหัส: MA-2025-001 (or similar)
     - ตำแหน่ง: ช่างเชื่อม
     - เบอร์โทร: 0812345678
     - วันที่บันทึก: Today's date
     - Edit (✏️) and Delete (🗑️) buttons

10. **Test Edit Function**
    - Click Edit icon
    - ✅ **Expected**: Navigate to form with pre-filled data
    - Change phone number to `0898765432`
    - Click "บันทึกการแก้ไข"
    - ✅ **Expected**: Return to summary, phone updated

11. **Add Second Member**
    - Click "เพิ่มข้อมูลบุคลากร" again
    - Fill with different data:
      - ชื่อ: `สมหญิง`
      - นามสกุล: `รักสงบ`
      - เบอร์โทร: `0823456789`
      - (Fill other required fields)
    - Submit
    - ✅ **Expected**: Now showing 2 members
    - Usage counter shows: 2/999

12. **Test Delete Function**
    - Click Delete icon on second member
    - ✅ **Expected**: Confirmation dialog
    - Click OK
    - ✅ **Expected**: Member removed, usage counter: 1/999

---

### Phase 5: Admin Verification

13. **Check Database**
    - In Supabase SQL Editor, run:
    ```sql
    SELECT * FROM member_applications ORDER BY created_at DESC LIMIT 5;
    ```
    - ✅ **Expected**: See your test records with JSONB form_data

14. **Check Token Usage**
    - Run:
    ```sql
    SELECT token, current_uses, max_uses, is_active 
    FROM member_application_tokens 
    ORDER BY created_at DESC LIMIT 1;
    ```
    - ✅ **Expected**: `current_uses = 1` (after delete)

15. **Check File Storage**
    - Go to Supabase Storage → `documents` bucket
    - Navigate to `member-applications/[company_id]/`
    - ✅ **Expected**: See uploaded files

16. **Test Token Revoke**
    - Go back to `/admin/member-tokens`
    - Click "Revoke" (🚫) icon on your test token
    - ✅ **Expected**: Confirm dialog → Status changes to "Inactive"
    - Try to open the registration link again
    - ✅ **Expected**: Error page: "This registration link has been revoked"

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot find module 'react-hot-toast'"
**Solution:**
```bash
npm install react-hot-toast
```

### Issue 2: Form fields not showing
**Solution:**
- Verify seed data loaded: `SELECT COUNT(*) FROM form_fields;` should return 27
- Check browser console for errors

### Issue 3: File upload fails
**Solution:**
- Create `documents` bucket in Supabase Storage
- Enable public access: Storage → documents → Settings → Public

### Issue 4: Age not auto-calculating
**Solution:**
- Check birth_date field is filled first
- Age field should be disabled (gray background)

### Issue 5: Conditional fields not showing/hiding
**Solution:**
- Verify the parent field value matches `depends_on.value`
- Example: Experience years only shows when "มีประสบการณ์" = "เคย"

### Issue 6: Token validation fails
**Solution:**
- Check token is active: `is_active = true`
- Check not expired: `expires_at > now()`
- Check usage: `current_uses < max_uses`

---

## ✅ Success Criteria

**Form System:**
- [ ] All 8 field types render correctly
- [ ] Conditional fields show/hide properly
- [ ] Age auto-calculates from birth_date
- [ ] File uploads work (3 files)
- [ ] Signature pad works (mouse + touch)
- [ ] Form validation prevents incomplete submissions
- [ ] Edit mode pre-fills all fields correctly

**Data Flow:**
- [ ] Token creation increments usage counter
- [ ] Form data saves to `member_applications` table as JSONB
- [ ] Files upload to Supabase Storage
- [ ] Summary page displays all registered members
- [ ] Edit/Delete functions work correctly

**Error Handling:**
- [ ] Invalid token shows error page
- [ ] Expired token shows error message
- [ ] Revoked token shows error message
- [ ] Max usage reached shows error message

---

## 📸 Testing Checklist Screenshots

Take screenshots of:
1. Token Management page with created token
2. Summary page (empty state)
3. Member form (all sections)
4. Summary page with 2 members
5. Edit form with pre-filled data
6. Revoked token error page

---

## 🎯 Next Steps After Testing

If all tests pass:
1. ✅ Mark "Dynamic Member Form" as complete
2. 🚀 Proceed to PNG Report Generator (html2canvas)
3. 📱 Add Members menu to admin dashboard
4. 🧪 Full integration testing

---

## 📞 Support

If you encounter issues:
1. Check browser console (F12) for errors
2. Check Supabase logs for database errors
3. Verify all SQL scripts ran successfully
4. Review this testing guide step-by-step
