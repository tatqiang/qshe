# เพิ่มคำนำหน้าชื่อในรายงาน Member Application

## 🎯 สรุป

แก้ไขรายงาน Member Application (หน้าที่ 2) ให้แสดงคำนำหน้าชื่อ (นาย/นาง/นางสาว) หน้าชื่อในส่วนการให้ความยินยอม

### ก่อนแก้ไข
```
ข้าพเจ้า ธงชัย ใจดี ในฐานะเจ้าของข้อมูลส่วนบุคคล...
```

### หลังแก้ไข
```
ข้าพเจ้า นายธงชัย ใจดี ในฐานะเจ้าของข้อมูลส่วนบุคคล...
```

## 📝 ไฟล์ที่แก้ไข

### 1. `src/components/member-form/MemberRegistrationReport.tsx`

**ก่อน:**
```tsx
ข้าพเจ้า {memberData?.first_name || ''} {memberData?.last_name || ''} ในฐานะเจ้าของข้อมูลส่วนบุคคล...
```

**หลัง:**
```tsx
ข้าพเจ้า {memberData?.title_name ? `${memberData.title_name}${memberData?.first_name || ''}` : memberData?.first_name || ''} {memberData?.last_name || ''} ในฐานะเจ้าของข้อมูลส่วนบุคคล...
```

**Logic:**
- ถ้ามี `title_name` (นาย/นาง/นางสาว) → แสดง "คำนำหน้า+ชื่อ นามสกุล" (เช่น "นายธงชัย ใจดี")
- ถ้าไม่มี `title_name` → แสดง "ชื่อ นามสกุล" แบบเดิม (เช่น "ธงชัย ใจดี")

### 2. `src/components/member-form/ConsentModal.tsx`

อัพเดต ConsentModal Component เพื่อรองรับ `titleName` prop (เผื่อใช้ในอนาคต)

**เพิ่ม Interface:**
```tsx
interface ConsentModalProps {
  // ...existing props
  titleName?: string;  // ← เพิ่ม
  firstName?: string;
  lastName?: string;
}
```

**อัพเดตการแสดงผล:**
```tsx
ข้าพเจ้า <span className="font-medium">
  {titleName ? `${titleName}${firstName}` : firstName} {lastName}
</span> ในฐานะเจ้าของข้อมูลส่วนบุคคล...
```

## 🔄 ตัวอย่างการทำงาน

### สถานการณ์ที่ 1: มีคำนำหน้าชื่อ
```json
{
  "title_name": "นาย",
  "first_name": "ธงชัย",
  "last_name": "ใจดี"
}
```
**ผลลัพธ์:** "ข้าพเจ้า นายธงชัย ใจดี ในฐานะเจ้าของข้อมูลส่วนบุคคล..."

### สถานการณ์ที่ 2: คำนำหน้าเป็น "นาง"
```json
{
  "title_name": "นาง",
  "first_name": "สมหญิง",
  "last_name": "รักดี"
}
```
**ผลลัพธ์:** "ข้าพเจ้า นางสมหญิง รักดี ในฐานะเจ้าของข้อมูลส่วนบุคคล..."

### สถานการณ์ที่ 3: ไม่มีคำนำหน้าชื่อ (ข้อมูลเก่า)
```json
{
  "first_name": "สมชาย",
  "last_name": "ใจงาม"
}
```
**ผลลัพธ์:** "ข้าพเจ้า สมชาย ใจงาม ในฐานะเจ้าของข้อมูลส่วนบุคคล..." (แบบเดิม)

## 📊 Data Flow

```
1. User fills form → title_name: "นาย", first_name: "ธงชัย"
                          ↓
2. Save to database → form_data: {"title_name": "นาย", "first_name": "ธงชัย", ...}
                          ↓
3. Load report → memberData.title_name = "นาย", memberData.first_name = "ธงชัย"
                          ↓
4. Render report → "ข้าพเจ้า นายธงชัย ใจดี..."
```

## ✅ Testing Checklist

- [ ] ทดสอบกับข้อมูลที่มีคำนำหน้า "นาย"
- [ ] ทดสอบกับข้อมูลที่มีคำนำหน้า "นาง"
- [ ] ทดสอบกับข้อมูลที่มีคำนำหน้า "นางสาว"
- [ ] ทดสอบกับข้อมูลเก่าที่ไม่มีคำนำหน้าชื่อ (backward compatibility)
- [ ] ตรวจสอบการแสดงผลในรายงาน PDF
- [ ] ตรวจสอบการแสดงผลใน Print Preview

## 🎨 UI Example

### รายงานหน้าที่ 2 (Personal Data Consent Form)

```
┌─────────────────────────────────────────────────────────┐
│ หนังสือให้ความยินยอมในการเปิดเผยข้อมูลส่วนบุคคล         │
│        (Personal Data Consent Form)                     │
├─────────────────────────────────────────────────────────┤
│ วันที่ 18 ตุลาคม 2568                                    │
│                                                         │
│     ข้าพเจ้า นายธงชัย ใจดี ในฐานะเจ้าของข้อมูล         │
│ ส่วนบุคคลตกลงให้ความยินยอมแก่บริษัท ซิโน-ไทย           │
│ เอ็นจีเนียริ่ง แอนด์ คอนสตรัคชั่น จำกัด (มหาชน)         │
│ ในการเก็บรวบรวม เปิดเผย หรือใช้ข้อมูลส่วนบุคคล...      │
│                                                         │
│ ทั้งนี้เอกสารที่ข้าพเจ้าแนบมาด้วย มีดังนี้              │
│ ☑ สำเนาบัตรประชาชน (จำเป็น)                            │
│ ☐ สำเนาทะเบียนบ้าน                                     │
│ ☐ สำเนาใบอนุญาตขับรถ โปรดระบุ ประเภท ___________        │
│ ☑ ใบรับรองแพทย์, ประวัติทางด้านสุขภาพ (จำเป็น)         │
└─────────────────────────────────────────────────────────┘
```

## 🔗 Related Files

ไฟล์ที่เกี่ยวข้องกับการแสดงชื่อในระบบ:

1. **Form Input**: `src/components/member-form/DynamicFormField.tsx` - รับค่า title_name จาก dropdown
2. **Report Display**: `src/components/member-form/MemberRegistrationReport.tsx` - แสดงในรายงาน ✅ **UPDATED**
3. **Consent Modal**: `src/components/member-form/ConsentModal.tsx` - แสดงใน modal ✅ **UPDATED**
4. **Database Schema**: `database/add_title_and_gender_fields.sql` - field definition

## 📌 Notes

- การแก้ไขนี้มี **backward compatibility** - ข้อมูลเก่าที่ไม่มี `title_name` จะยังแสดงชื่อตามปกติ
- ไม่มีช่องว่างระหว่างคำนำหน้าชื่อกับชื่อ (เช่น "นายธงชัย" ไม่ใช่ "นาย ธงชัย")
- ถ้า `title_name` เป็น `null` หรือ `undefined` จะไม่แสดงคำนำหน้า
- การแก้ไขนี้ใช้ได้กับ:
  - ✅ PDF Report Generation
  - ✅ Print View
  - ✅ Screen Display

## 🚀 Deployment

ไฟล์ที่ต้อง commit:
```
✅ src/components/member-form/MemberRegistrationReport.tsx
✅ src/components/member-form/ConsentModal.tsx
```

ไม่ต้องรัน migration เพิ่มเติม (ใช้ SQL ที่สร้างไว้แล้วใน `add_title_and_gender_fields.sql`)

---

**Created**: 2025-01-20  
**Updated**: 2025-01-20  
**Version**: 1.0  
**Status**: ✅ Complete
