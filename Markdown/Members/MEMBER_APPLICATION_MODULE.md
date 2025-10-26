# 📋 Member Application Module

## ภาพรวม (Overview)

**Member Application Module** คือระบบแบบฟอร์มแบบ Dynamic สำหรับขึ้นทะเบียนบุคลากรทุกระดับ (พนักงานและผู้รับเหมา) ที่รองรับ:

✅ **หลายแบบฟอร์ม**: Member Application, PTW, Toolbox Talk, และอื่นๆ  
✅ **Config แบบ Per-Project**: กำหนดว่าแต่ละ field จะแสดง/required หรือไม่ในแต่ละโครงการ  
✅ **หลาย Report Template**: แต่ละโครงการเลือกใช้ template การพิมพ์ต่างกันได้  
✅ **Public Form Access**: ใช้ token-based link ไม่ต้อง login  
✅ **อัปโหลดเอกสาร**: บัตรประชาชน, ใบรับรองแพทย์ (รองรับ jpg/png/pdf)

---

## 🏗️ สถาปัตยกรรมระบบ

```
┌──────────────────┐
│ form_templates   │ ← Master Form Types (Member App, PTW, etc.)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ form_fields      │ ← Field Definitions (26 fields)
└────────┬─────────┘
         │
         ▼
┌─────────────────────────┐
│ project_form_configs    │ ← Which forms enabled per project
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ project_field_configs   │ ← Per-project field customization
└────────┬────────────────┘   (visible, required, labels)
         │
         ▼
┌──────────────────┐
│ report_templates │ ← HTML/CSS for PDF generation
└──────────────────┘

         ▼
┌──────────────────────────┐
│ member_applications      │ ← Actual Submissions (JSONB)
└────────┬─────────────────┘
         │
         ├─► member_application_documents (Files)
         └─► member_application_tokens (Public Access)
```

---

## 📊 ตารางฐานข้อมูล (Database Tables)

| # | ตาราง | จุดประสงค์ |
|---|-------|-----------|
| 1 | `form_templates` | Master list ของแบบฟอร์มทั้งหมด |
| 2 | `form_fields` | ฟิลด์ที่มีในแต่ละฟอร์ม (26 fields สำหรับ Member App) |
| 3 | `project_form_configs` | ผูกโครงการกับฟอร์มที่ใช้ |
| 4 | `project_field_configs` | กำหนดว่าแต่ละฟิลด์จะแสดง/required ในโครงการนั้นๆ หรือไม่ |
| 5 | `report_templates` | HTML/CSS template สำหรับพิมพ์ PDF |
| 6 | `member_applications` | ข้อมูลที่ผู้ใช้กรอก (เก็บแบบ JSONB) |
| 7 | `member_application_documents` | ไฟล์อัปโหลด (บัตรประชาชน, ใบรับรองแพทย์) |
| 8 | `member_application_tokens` | Token สำหรับ public form access |

---

## 📝 ฟิลด์ในฟอร์ม Member Application (26 ฟิลด์)

### **ข้อมูลส่วนตัว (9 fields)**
1. ชื่อ (first_name)
2. นามสกุล (last_name)
3. เบอร์โทร (phone)
4. วันเกิด (birth_date)
5. อายุ (age) - คำนวณอัตโนมัติ
6. วุฒิการศึกษา (education_level)
7. สัญชาติ (nationality)
8. ศาสนา (religion)
9. เลขบัตรประชาชน (id_card_number)
10. ตำแหน่งที่สมัคร (position_applied)

### **ที่อยู่ (6 fields)**
11. เลขที่ (address_house_number)
12. หมู่ (address_moo)
13. ซอย (address_soi)
14. ตำบล (address_tambon)
15. อำเภอ (address_amphoe)
16. จังหวัด (address_province)

### **ประวัติการทำงาน (2 fields)**
17. ประสบการณ์งานก่อสร้าง (has_construction_experience)
18. จำนวนปี (construction_experience_years) - แสดงเมื่อเลือก "เคย"

### **สุขภาพ (6 fields)**
19. กลัวความสูง (has_acrophobia)
20. โรคประจำตัว (has_chronic_disease)
21. รายละเอียดโรค (chronic_disease_details) - แสดงเมื่อเลือก "เป็น"
22. ตาบอดสี (has_color_blindness)
23. ลมชัก (has_epilepsy)
24. อื่นๆ (other_health_issues)

### **เอกสาร (2 fields)**
25. บัตรประชาชน (document_id_card) - jpg/png/pdf
26. ใบรับรองแพทย์ (document_medical_certificate) - jpg/png/pdf

### **ลายเซ็น (2 fields - 1 hidden)**
27. ลายเซ็นผู้สมัคร (applicant_signature)
28. ลายเซ็นผู้ควบคุม (supervisor_signature) - ไม่แสดงใน public form

---

## 🚀 วิธีการติดตั้ง (Installation)

### **Step 1: รัน Database Migration**

1. เปิด **Supabase Dashboard** → **SQL Editor**
2. รัน `member_application_schema.sql` ก่อน:
   ```
   database/member_application_schema.sql
   ```
3. รัน `member_application_seed.sql` ตามหลัง:
   ```
   database/member_application_seed.sql
   ```

### **Step 2: ตรวจสอบว่าติดตั้งสำเร็จ**

รันใน SQL Editor:
```sql
-- Check tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%member_application%'
ORDER BY table_name;

-- Check form template created
SELECT code, name_th, name_en 
FROM form_templates 
WHERE code = 'MEMBER_APPLICATION';

-- Check fields created
SELECT COUNT(*) as total_fields 
FROM form_fields ff
JOIN form_templates ft ON ff.form_template_id = ft.id
WHERE ft.code = 'MEMBER_APPLICATION';
-- Should return: 26
```

ควรเห็น:
- ✅ 8 ตาราง
- ✅ 1 form template (MEMBER_APPLICATION)
- ✅ 26 fields

---

## 🎯 การใช้งาน (Usage)

### **1. Admin: สร้าง Token สำหรับ Public Form**

```sql
-- Generate token for a project
INSERT INTO member_application_tokens (
    token,
    project_id,
    form_template_id,
    is_one_time_use,
    max_uses,
    expires_at
) VALUES (
    generate_secure_token(32), -- Random 32-char token
    'YOUR_PROJECT_ID',
    (SELECT id FROM form_templates WHERE code = 'MEMBER_APPLICATION'),
    true,
    1,
    now() + interval '30 days' -- Expires in 30 days
) RETURNING *;
```

### **2. Public User: กรอกฟอร์ม**

URL: `https://yourapp.com/public/member-apply?token=abc123xyz`

- ตรวจสอบ token ว่า valid หรือไม่
- โหลด form fields ตาม project config
- กรอกข้อมูล + อัปโหลดเอกสาร
- Submit → บันทึกลง `member_applications` table

### **3. Admin: ดูรายการสมัคร**

```sql
-- View all applications
SELECT 
    ma.submission_number,
    ma.submitted_at,
    ma.form_data->>'first_name' as first_name,
    ma.form_data->>'last_name' as last_name,
    ma.status,
    p.name_th as project_name
FROM member_applications ma
JOIN projects p ON ma.project_id = p.id
ORDER BY ma.submitted_at DESC;
```

### **4. Admin: Export PDF**

- เลือก report template
- Merge ข้อมูลจาก `form_data` JSONB
- แสดง HTML พร้อม `@media print` CSS
- User กด "Print to PDF"

---

## 🔐 Security & RLS

- ✅ **RLS Enabled** บนทุกตาราง
- ✅ **Public Access**: Token-based validation ใน application code
- ✅ **Anon Role**: อนุญาตให้ INSERT ผ่าน token ที่ valid
- ✅ **Authenticated Users**: เข้าถึงข้อมูลโครงการของตนเองได้

---

## 📦 Assets (Logo & Images)

Logo บริษัทเก็บที่ **Cloudflare R2**:
```
URL: https://pub-79e4b0dc661242159b0d79ab81ffd428.r2.dev/qshe-assets/logos/Logo-STECON.jpg
```

ใช้ใน `report_templates.logo_url`

---

## 🎨 Features ที่ต้องพัฒนาต่อ

- [ ] Form Config UI (Admin)
- [ ] Report Template Builder UI
- [ ] Dynamic Public Form Component
- [ ] Token Management API & UI
- [ ] PDF Report Renderer
- [ ] Admin Dashboard

---

## 📚 เอกสารเพิ่มเติม

- `member_application_schema.sql` - Database schema
- `member_application_seed.sql` - Seed data (form + 26 fields)
- `JobApply.txt` - Original form specification
- `JobApply.png` - Original form layout

---

## 🐛 Troubleshooting

### ❌ ไม่มี table `users` หรือ `projects`

ระบบนี้ต้องการตาราง `users` และ `projects` อยู่แล้ว หากยังไม่มี ให้รันก่อน:
```sql
-- แก้ไข foreign key ใน schema หรือสร้างตาราง users/projects ก่อน
```

### ❌ Token ไม่ work

ตรวจสอบว่า:
1. `is_active = true`
2. `expires_at > now()`
3. `current_uses < max_uses`

```sql
SELECT * 
FROM member_application_tokens 
WHERE token = 'your_token_here'
  AND is_active = true
  AND expires_at > now();
```

---

## 👨‍💻 Developer Notes

### **JSONB Form Data Structure**

```json
{
  "first_name": "สมชาย",
  "last_name": "ใจดี",
  "phone": "0812345678",
  "birth_date": "1990-05-15",
  "age": 33,
  "education_level": "bachelor",
  "nationality": "ไทย",
  "religion": "buddhist",
  "id_card_number": "1234567890123",
  "position_applied": "ช่างเชื่อม",
  "address_house_number": "123",
  "address_moo": "5",
  "address_soi": "ลาดพร้าว 101",
  "address_tambon": "คลองจั่น",
  "address_amphoe": "บางกะปิ",
  "address_province": "กรุงเทพมหานคร",
  "has_construction_experience": "yes",
  "construction_experience_years": 5,
  "has_acrophobia": "no",
  "has_chronic_disease": "no",
  "has_color_blindness": "no",
  "has_epilepsy": "no",
  "other_health_issues": ""
}
```

### **Query JSONB Data**

```sql
-- Find applications by name
SELECT * FROM member_applications
WHERE form_data->>'first_name' = 'สมชาย';

-- Find applications with construction experience
SELECT * FROM member_applications
WHERE form_data->>'has_construction_experience' = 'yes';

-- Find applications by age range
SELECT * FROM member_applications
WHERE (form_data->>'age')::int BETWEEN 25 AND 35;
```

---

## ✅ Summary

✅ **8 Tables Created** - รองรับ dynamic forms  
✅ **26 Fields Defined** - ครอบคลุมทุกข้อมูลใน JobApply.txt  
✅ **Token-based Public Access** - ไม่ต้อง login  
✅ **RLS Policies** - ความปลอดภัย  
✅ **JSONB Flexibility** - เพิ่ม field ใหม่ได้ง่าย  
✅ **Multi-tenant** - แต่ละโครงการ config ต่างกันได้  
✅ **Multi-report** - พิมพ์ได้หลาย template  

🎉 **Ready to build the UI!**
