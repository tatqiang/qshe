# 🎯 Member Application - Updated Flow

## 📋 สรุปการเปลี่ยนแปลง

### **เดิม (Old Flow)**
- ❌ 1 Token = 1 Person
- ❌ Token ใช้ครั้งเดียว
- ❌ ไม่ได้ผูกกับบริษัท

### **ใหม่ (New Flow)** ✅
- ✅ **1 Token = 1 Company = Multiple People**
- ✅ Token ใช้ได้หลายครั้ง (max 999 คน)
- ✅ ผูกกับบริษัทเฉพาะ (company_id required)
- ✅ หน้าแรก = สรุปรายชื่อ
- ✅ เพิ่มทีละคน บันทึกทันที
- ✅ บันทึกรายงานเป็นรูป PNG ลงมือถือ

---

## 🏗️ สถาปัตยกรรมใหม่

```
┌─────────────────────────────────────────┐
│  Admin Creates Token                    │
│  - เลือก Project                        │
│  - เลือก Company (dropdown + search)    │
│  - สร้าง Token                          │
│  → https://app.com/m?t=abc123xyz        │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  User Opens Link                        │
│  - ตรวจสอบ Token                        │
│  - โหลดชื่อบริษัทจาก Token              │
│  - แสดงหน้า "สรุปรายชื่อ"               │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Summary Page (หน้าสรุปรายชื่อ)          │
│                                         │
│  รายชื่อพนักงาน - บริษัท ABC            │
│  ┌───────────────────────────────────┐  │
│  │ (ว่างเปล่า)                        │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [+ เพิ่มพนักงาน]                       │
│  [💾 บันทึกรายงาน (PNG)]                │
└─────────────────────────────────────────┘
           │
           │ (กด "เพิ่มพนักงาน")
           ▼
┌─────────────────────────────────────────┐
│  Form Page (กรอกข้อมูล 1 คน)            │
│                                         │
│  📝 ข้อมูลพนักงาน                        │
│  ├─ ชื่อ-นามสกุล                        │
│  ├─ เบอร์โทร                            │
│  ├─ วันเกิด, อายุ                       │
│  ├─ ที่อยู่                              │
│  ├─ การศึกษา, สัญชาติ, ศาสนา            │
│  ├─ เลขบัตรประชาชน                      │
│  ├─ ตำแหน่งที่สมัคร                     │
│  │                                     │
│  📋 ประวัติการทำงาน                      │
│  ├─ ประสบการณ์งานก่อสร้าง               │
│  │                                     │
│  🏥 สุขภาพ                               │
│  ├─ กลัวความสูง                         │
│  ├─ โรคประจำตัว                         │
│  ├─ ตาบอดสี, ลมชัก                      │
│  │                                     │
│  📁 เอกสาร                               │
│  ├─ 📸 รูปโปรไฟล์ (jpg/png, 3MB)        │
│  ├─ 🆔 บัตรประชาชน (jpg/png/pdf, 5MB)  │
│  ├─ 🏥 ใบรับรองแพทย์ (jpg/png/pdf, 5MB) │
│  │                                     │
│  ✍️ ลายเซ็นผู้สมัคร                     │
│                                         │
│  [บันทึก] [ยกเลิก]                      │
└─────────────────────────────────────────┘
           │
           │ (กด "บันทึก")
           ▼
┌─────────────────────────────────────────┐
│  Save to Database                       │
│  - INSERT member_applications           │
│  - Upload 3 files → Supabase Storage    │
│  - INSERT member_application_documents  │
│  - Update token.current_uses += 1       │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Back to Summary Page                   │
│                                         │
│  รายชื่อพนักงาน - บริษัท ABC            │
│  ┌───────────────────────────────────┐  │
│  │ 1. สมชาย ใจดี     [แก้ไข] [ลบ]   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [+ เพิ่มพนักงาน]                       │
│  [💾 บันทึกรายงาน (PNG)]                │
└─────────────────────────────────────────┘
           │
           │ (กด "เพิ่มพนักงาน" อีก)
           ▼
        [ทำซ้ำ...]
           │
           │ (เพิ่มจนครบ เช่น 10 คน)
           ▼
┌─────────────────────────────────────────┐
│  Summary Page (ครบ 10 คน)               │
│                                         │
│  รายชื่อพนักงาน - บริษัท ABC            │
│  ┌───────────────────────────────────┐  │
│  │ 1. สมชาย ใจดี     [แก้ไข] [ลบ]   │  │
│  │ 2. สมหญิง รักงาน   [แก้ไข] [ลบ]   │  │
│  │ 3. สมศักดิ์ มั่นคง [แก้ไข] [ลบ]   │  │
│  │ 4. สมพงษ์ เก่งกาจ  [แก้ไข] [ลบ]   │  │
│  │ 5. สมบัติ รวยเงิน  [แก้ไข] [ลบ]   │  │
│  │ 6. สมปอง แข็งแรง   [แก้ไข] [ลบ]   │  │
│  │ 7. สมหมาย ขยัน     [แก้ไข] [ลบ]   │  │
│  │ 8. สมควร ดี        [แก้ไข] [ลบ]   │  │
│  │ 9. สมบูรณ์ พร้อม   [แก้ไข] [ลบ]   │  │
│  │ 10. สมจิตร ซื่อ    [แก้ไข] [ลบ]   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [+ เพิ่มพนักงาน]                       │
│  [💾 บันทึกรายงาน (PNG)] ← กดนี้!       │
└─────────────────────────────────────────┘
           │
           │ (กด "บันทึกรายงาน")
           ▼
┌─────────────────────────────────────────┐
│  Generate Report Screenshot             │
│  - Render HTML with all names           │
│  - Use html2canvas library              │
│  - Convert to PNG image                 │
│  - Download to mobile device            │
│  → "รายชื่อพนักงาน-ABC-2025-10-18.png"  │
└─────────────────────────────────────────┘
```

---

## 📊 Database Changes Summary

### **1. member_application_tokens**
```sql
-- เพิ่ม company_id (required)
company_id UUID NOT NULL REFERENCES companies(id)

-- เปลี่ยน token settings
is_one_time_use = false  -- ใช้ได้หลายครั้ง
max_uses = 999           -- รองรับหลายคน
```

### **2. member_applications**
```sql
-- เพิ่ม company_id (copy จาก token)
company_id UUID REFERENCES companies(id)
```

### **3. project_form_configs**
```sql
-- เพิ่ม company_id (optional)
company_id UUID REFERENCES companies(id)

-- เปลี่ยนค่า default
allow_multiple_submissions = true  -- อนุญาตหลายคน
```

### **4. member_application_documents**
```sql
-- เปลี่ยน document_type
-- เดิม: 'id_card', 'medical_certificate'
-- ใหม่: 'profile_photo', 'id_card', 'medical_certificate'
```

### **5. form_fields**
```sql
-- เพิ่มฟิลด์ใหม่: document_profile_photo
-- รวมเป็น 27 fields (เพิ่มจาก 26)
```

---

## 🎯 UI Components ที่ต้องสร้าง

### **1. Admin: Create Token Page**
```tsx
<CreateTokenPage>
  <ProjectSelect /> {/* เลือกโครงการ */}
  <CompanySelect /> {/* Dropdown + Search + Add New (เหมือน Audit Form) */}
  <ExpirationDate /> {/* กำหนดวันหมดอายุ */}
  <MaxUses /> {/* จำนวนคนสูงสุด (default 999) */}
  <GenerateButton /> {/* สร้าง Token */}
  <TokenLinkDisplay /> {/* แสดง Link + QR Code */}
  <SendViaEmail /> {/* ส่ง Email */}
  <SendViaLine /> {/* ส่ง Line */}
</CreateTokenPage>
```

### **2. Public: Summary Page (หน้าสรุปรายชื่อ)**
```tsx
<SummaryPage token={token}>
  <Header>
    <CompanyName /> {/* จาก token.company */}
    <TokenExpiry /> {/* หมดอายุ: 2025-11-18 */}
    <MemberCount /> {/* 10/999 คน */}
  </Header>
  
  <MemberList>
    {members.map(member => (
      <MemberCard key={member.id}>
        <Avatar src={member.profile_photo} />
        <Name>{member.first_name} {member.last_name}</Name>
        <Phone>{member.phone}</Phone>
        <EditButton onClick={() => goToEditForm(member.id)} />
        <DeleteButton onClick={() => deleteMember(member.id)} />
      </MemberCard>
    ))}
  </MemberList>
  
  <Actions>
    <AddMemberButton onClick={() => goToAddForm()} />
    <SaveReportButton onClick={() => downloadPNG()} />
  </Actions>
</SummaryPage>
```

### **3. Public: Member Form Page**
```tsx
<MemberFormPage token={token} memberId={memberId}>
  <DynamicForm fields={fields}>
    {/* 27 fields rendered dynamically */}
    
    {/* Section: Personal Info */}
    <TextInput field="first_name" />
    <TextInput field="last_name" />
    <TextInput field="phone" />
    {/* ... */}
    
    {/* Section: Documents */}
    <FileUpload 
      field="document_profile_photo"
      accept="image/jpeg,image/png"
      maxSize={3 * 1024 * 1024}
    />
    <FileUpload 
      field="document_id_card"
      accept="image/jpeg,image/png,application/pdf"
      maxSize={5 * 1024 * 1024}
    />
    <FileUpload 
      field="document_medical_certificate"
      accept="image/jpeg,image/png,application/pdf"
      maxSize={5 * 1024 * 1024}
    />
    
    {/* Section: Signature */}
    <SignaturePad field="applicant_signature" />
  </DynamicForm>
  
  <Actions>
    <SaveButton onClick={handleSave} />
    <CancelButton onClick={goBack} />
  </Actions>
</MemberFormPage>
```

### **4. Admin: Members List (Menu ใหม่)**
```tsx
<MembersPage>
  <Filters>
    <ProjectFilter />
    <CompanyFilter />
    <StatusFilter />
    <DateRangeFilter />
  </Filters>
  
  <MembersTable>
    <Column>รูป</Column>
    <Column>ชื่อ-นามสกุล</Column>
    <Column>บริษัท</Column>
    <Column>โครงการ</Column>
    <Column>ตำแหน่ง</Column>
    <Column>วันที่ลงทะเบียน</Column>
    <Column>สถานะ</Column>
    <Column>จัดการ</Column>
  </MembersTable>
  
  <Actions>
    <ExportExcel />
    <ExportPDF />
    <BulkApprove />
    <BulkReject />
  </Actions>
</MembersPage>
```

---

## 🔄 API Endpoints

### **1. Token Management**
```typescript
// Create Token
POST /api/member-tokens
{
  "project_id": "uuid",
  "company_id": "uuid",  // Required
  "expires_at": "2025-11-18",
  "max_uses": 999
}
→ Returns: { token: "abc123xyz", url: "https://app.com/m?t=abc123xyz" }

// Validate Token
GET /api/member-tokens/validate?token=abc123xyz
→ Returns: { valid: true, company: {...}, project: {...}, remaining_uses: 989 }

// Get Token Stats
GET /api/member-tokens/:token/stats
→ Returns: { total_uses: 10, members: [...] }
```

### **2. Member Management**
```typescript
// List Members by Token
GET /api/members?token=abc123xyz
→ Returns: [ { id, first_name, last_name, profile_photo, ... }, ... ]

// Create Member
POST /api/members
{
  "token": "abc123xyz",
  "form_data": { first_name, last_name, ... },
  "documents": [
    { type: "profile_photo", file: File },
    { type: "id_card", file: File },
    { type: "medical_certificate", file: File }
  ]
}
→ Returns: { id: "uuid", submission_number: "MA-2025-001" }

// Update Member
PATCH /api/members/:id
{
  "form_data": { ... },
  "documents": [ ... ]
}

// Delete Member
DELETE /api/members/:id
```

### **3. Report Generation**
```typescript
// Generate PNG Report
POST /api/members/report
{
  "token": "abc123xyz",
  "format": "png"
}
→ Returns: { url: "https://.../*.png" }
```

---

## 📱 Mobile UX Enhancements

### **1. Summary Page - Mobile Optimized**
```css
/* Responsive grid for member cards */
.member-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 768px) {
  .member-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .member-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### **2. File Upload - Mobile Friendly**
```tsx
<FileInput
  accept="image/*"
  capture="environment" // เปิดกล้องบนมือถือ
  onChange={handleFileChange}
/>

// แต่ในกรณีนี้ใช้ input file ธรรมดา (ไม่มีปุ่มถ่ายรูป)
<input 
  type="file" 
  accept="image/jpeg,image/png" 
  onChange={handleUpload}
/>
```

### **3. Screenshot Report - html2canvas**
```typescript
import html2canvas from 'html2canvas';

async function downloadReport() {
  const element = document.getElementById('summary-report');
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2 // High quality
  });
  
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `รายชื่อพนักงาน-${companyName}-${date}.png`;
    a.click();
  }, 'image/png');
}
```

---

## ✅ Summary of Changes

| ส่วนที่เปลี่ยน | เดิม | ใหม่ |
|---------------|------|------|
| **Token Usage** | 1 คน | หลายคน (999) |
| **Company** | ไม่มี | Required |
| **Summary Page** | ไม่มี | มี (หน้าแรก) |
| **Save Flow** | Submit ครั้งเดียว | ทีละคน (incremental) |
| **Report** | PDF template | PNG screenshot |
| **Documents** | 2 ไฟล์ | 3 ไฟล์ (+รูปโปรไฟล์) |
| **Fields** | 26 | 27 |
| **Menu** | Users | Users + Members |

---

## 🚀 Next Steps

1. ✅ Database Schema Updated
2. ✅ Seed Data Updated (27 fields)
3. ⏭️ สร้าง Company Dropdown Component (พร้อม search + add)
4. ⏭️ สร้าง Summary Page UI
5. ⏭️ สร้าง Dynamic Member Form
6. ⏭️ สร้าง Token Management UI
7. ⏭️ สร้าง Members Menu
8. ⏭️ Integration html2canvas
9. ⏭️ Testing

**พร้อมเริ่มสร้าง UI แล้วครับ!** 🎨
