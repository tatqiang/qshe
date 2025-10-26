# เพิ่มฟิลด์ Title และ Gender ในฟอร์ม Member Application

## 📋 สรุป

เพิ่มฟิลด์ใหม่ 2 รายการในส่วน **ข้อมูลส่วนตัว (personal_info)**:

1. **คำนำหน้าชื่อ** (`title_name`) - Dropdown: นาย / นาง / นางสาว
2. **เพศ** (`gender`) - Dropdown: ชาย / หญิง

## 🎯 รายละเอียดฟิลด์

### 1. คำนำหน้าชื่อ (Title Name)

- **Field Key**: `title_name`
- **Field Type**: `select`
- **Label (TH)**: คำนำหน้าชื่อ
- **Label (EN)**: Title
- **Display Order**: 1 (แสดงเป็นฟิลด์แรกใน personal_info)
- **Required**: ✅ Yes
- **Visible**: ✅ Yes
- **Options**:
  - นาย (Mr.)
  - นาง (Mrs.)
  - นางสาว (Miss)

### 2. เพศ (Gender)

- **Field Key**: `gender`
- **Field Type**: `select`
- **Label (TH)**: เพศ
- **Label (EN)**: Gender
- **Display Order**: 35 (หลัง phone, ก่อน birth_date)
- **Required**: ✅ Yes
- **Visible**: ✅ Yes
- **Options**:
  - ชาย (Male)
  - หญิง (Female)

## 📊 ลำดับฟิลด์ใน Personal Info Section

หลังจากเพิ่มฟิลด์ใหม่ ลำดับฟิลด์จะเป็นดังนี้:

| Order | Field Key    | Label (TH)     | Type   |
|-------|--------------|----------------|--------|
| 1     | title_name   | คำนำหน้าชื่อ   | select |
| 10    | first_name   | ชื่อ           | text   |
| 20    | last_name    | นามสกุล        | text   |
| 30    | phone        | เบอร์โทร       | text   |
| 35    | gender       | เพศ            | select |
| 40    | birth_date   | เกิดวันที่     | date   |
| 50    | age          | อายุ (ปี)      | number |

## 🚀 วิธีการติดตั้ง

### ขั้นตอนที่ 1: รัน SQL Migration

เปิด Command Prompt หรือ Terminal และรันคำสั่ง:

```cmd
add_title_gender_fields.bat
```

หรือรัน SQL โดยตรง (ถ้ามี psql installed):

```cmd
psql -h aws-0-ap-southeast-1.pooler.supabase.com -p 6543 -d postgres -U postgres.lnmzbrzwmfbmokfmjzrv -f database\add_title_and_gender_fields.sql
```

### ขั้นตอนที่ 2: Refresh หน้า Form Config

1. เปิดเบราว์เซอร์ไปที่: http://localhost:5173/admin/project-form-config
2. เลือก **Project** และ **Form Template** (MEMBER_APPLICATION)
3. คลิก Refresh หรือโหลดหน้าใหม่
4. จะเห็นฟิลด์ใหม่ในส่วน **ข้อมูลส่วนตัว**

## 📁 ไฟล์ที่สร้าง

### 1. `database/add_title_and_gender_fields.sql`

SQL Migration script ที่:
- เพิ่มฟิลด์ `title_name` และ `gender` เข้าตาราง `form_fields`
- กำหนด options สำหรับ dropdown
- อัพเดต display_order ของฟิลด์อื่นๆ ในส่วน personal_info
- รองรับการรัน script ซ้ำ (idempotent) - ถ้าฟิลด์มีอยู่แล้วจะทำการ UPDATE แทน

### 2. `add_title_gender_fields.bat`

Batch file สำหรับรัน SQL script บน Windows:
- อ่านค่า connection จากไฟล์ `.env`
- เชื่อมต่อกับ Supabase Pooler
- รัน SQL migration
- แสดงผลลัพธ์

## 🔧 Technical Details

### Database Schema

ฟิลด์จะถูกเพิ่มในตาราง `form_fields`:

```sql
INSERT INTO form_fields (
    form_template_id,
    field_key,
    field_type,
    label_th,
    label_en,
    options,
    section,
    display_order,
    is_required_by_default,
    is_visible_by_default
) VALUES (
    -- title_name
    ..., 'title_name', 'select', 'คำนำหน้าชื่อ', 'Title',
    '[{"value":"นาย","label_th":"นาย","label_en":"Mr."},...]'::jsonb,
    'personal_info', 1, true, true
);
```

### Frontend Component

Component `DynamicFormField.tsx` รองรับฟิลด์ประเภท `select` อยู่แล้ว:

```tsx
if (field.field_type === 'select') {
  return (
    <select>
      <option value="">เลือก...</option>
      {field.options?.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label_th}
        </option>
      ))}
    </select>
  );
}
```

### Data Storage

ข้อมูลจะถูกเก็บในตาราง `member_applications` ในคอลัมน์ `form_data` (JSONB):

```json
{
  "title_name": "นาย",
  "first_name": "สมชาย",
  "last_name": "ใจดี",
  "phone": "0812345678",
  "gender": "ชาย",
  "birth_date": "1990-01-15",
  "age": 35
}
```

## ✅ Testing Checklist

หลังจากรัน migration แล้ว ให้ทดสอบ:

- [ ] ฟิลด์ใหม่แสดงในหน้า Project Form Config
- [ ] สามารถลาก-วางฟิลด์เพื่อเรียงลำดับได้
- [ ] Toggle Visible/Required ทำงานปกติ
- [ ] ฟิลด์แสดงในฟอร์ม Public Member Application
- [ ] Dropdown options แสดงถูกต้อง (นาย/นาง/นางสาว และ ชาย/หญิง)
- [ ] บันทึกข้อมูลได้ปกติ
- [ ] ข้อมูลแสดงในรายงานถูกต้อง

## 🔄 Rollback (ถ้าต้องการลบฟิลด์)

หากต้องการลบฟิลด์เหล่านี้ออก:

```sql
DELETE FROM form_fields
WHERE form_template_id = (
    SELECT id FROM form_templates WHERE code = 'MEMBER_APPLICATION'
)
AND field_key IN ('title_name', 'gender');
```

## 📝 Notes

- ฟิลด์เหล่านี้เป็นฟิลด์ใหม่ ไม่กระทบกับข้อมูลเก่าที่มีอยู่
- ถ้าต้องการแก้ไข options (เช่น เพิ่ม "อื่นๆ" ให้กับ gender) สามารถแก้ใน SQL script ได้
- Component `DynamicFormField.tsx` รองรับ field type `select` อยู่แล้ว ไม่ต้องแก้ไข code
- Auto-save ทำงานอัตโนมัติเมื่อเปลี่ยนแปลง Visible/Required

## 🎨 UI Preview

หน้าฟอร์มจะแสดงเป็น:

```
┌─────────────────────────────────┐
│ ข้อมูลส่วนตัว                   │
├─────────────────────────────────┤
│ คำนำหน้าชื่อ *                  │
│ ▼ เลือกคำนำหน้าชื่อ            │
│   - นาย                         │
│   - นาง                         │
│   - นางสาว                      │
│                                 │
│ ชื่อ *                          │
│ [_________________________]     │
│                                 │
│ นามสกุล *                       │
│ [_________________________]     │
│                                 │
│ เบอร์โทร *                      │
│ [_________________________]     │
│                                 │
│ เพศ *                           │
│ ▼ เลือกเพศ                      │
│   - ชาย                         │
│   - หญิง                        │
│                                 │
│ เกิดวันที่ *                    │
│ [___/__/____]                   │
│                                 │
│ อายุ (ปี)                       │
│ [__] (คำนวณอัตโนมัติ)          │
└─────────────────────────────────┘
```

## 🆘 Support

หากพบปัญหา:
1. ตรวจสอบ console log ใน browser (F12)
2. ตรวจสอบ database connection
3. ตรวจสอบว่าฟิลด์ถูกสร้างใน `form_fields` table
4. ตรวจสอบว่า `form_template_id` ถูกต้อง

---

**Created**: 2025-01-20  
**Updated**: 2025-01-20  
**Version**: 1.0  
