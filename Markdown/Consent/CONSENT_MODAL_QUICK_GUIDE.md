# 🎉 Consent Modal - Quick Reference

## What It Does
Shows a consent confirmation dialog **before** saving member application data.

## User Experience

### Step 1: User Fills Form
```
[Form Fields]
ชื่อ: สมชาย
นามสกุล: ใจดี
...

[บันทึกข้อมูล Button]  ← Click here
```

### Step 2: Modal Appears
```
╔══════════════════════════════════════════════╗
║  หนังสือให้ความยินยอมในการเปิดเผยข้อมูล     ║  [X]
║  (Personal Data Consent Form)               ║
╠══════════════════════════════════════════════╣
║                                              ║
║  วันที่ 20 ตุลาคม 2568                       ║
║                                              ║
║      ข้าพเจ้า สมชาย ใจดี ในฐานะเจ้า         ║
║  ของข้อมูลส่วนบุคคลตกลงให้ความยินยอม...      ║
║                                              ║
║  ทั้งนี้เอกสารที่ข้าพเจ้าแนบมาด้วย:         ║
║  ☑ สำเนาบัตรประชาชน (จำเป็น)               ║
║  ☑ ใบรับรองแพทย์ (จำเป็น)                  ║
║                                              ║
║  ┌────────────────────────────────────┐     ║
║  │ ⚠️ โปรดอ่านและทำความเข้าใจก่อน... │     ║
║  └────────────────────────────────────┘     ║
╠══════════════════════════════════════════════╣
║                    [ปฏิเสธ]  [ยอมรับ]        ║
╚══════════════════════════════════════════════╝
```

### Step 3a: Click "ยอมรับ" ✅
```
Modal closes
   ↓
⏳ Uploading files...
   ↓
💾 Saving data...
   ↓
✅ "บันทึกข้อมูลสำเร็จ"
   ↓
🔄 Redirect to summary page
```

### Step 3b: Click "ปฏิเสธ" ❌
```
Modal closes
   ↓
❌ "คุณได้ปฏิเสธการให้ความยินยอม
    ข้อมูลจะไม่ถูกบันทึก"
   ↓
📝 Stay on form page
   (No data saved)
```

## Button Actions

| Action | Button | Color | Result |
|--------|--------|-------|--------|
| Accept | ยอมรับ | Blue 🔵 | Saves data ✅ |
| Reject | ปฏิเสธ | Gray ⚪ | Cancels ❌ |
| Close X | ✕ | Gray ⚪ | Cancels ❌ |
| Click Outside | Backdrop | - | Cancels ❌ |

## Key Features

✅ **Dynamic Name** - Shows user's first and last name  
✅ **Auto Date** - Current date in Thai format  
✅ **Scrollable** - Content scrolls if too long  
✅ **Warning Box** - Yellow alert about consent  
✅ **Document List** - Shows required documents  
✅ **Responsive** - Works on mobile & desktop  
✅ **Accessible** - ESC key closes modal  

## Files

```
📁 src/
  ├─ components/
  │   └─ member-form/
  │       ├─ ConsentModal.tsx         ← NEW! Modal component
  │       └─ DynamicFormField.tsx
  │
  └─ pages/
      └─ public/
          └─ MemberFormPage.tsx       ← MODIFIED! Added modal logic
```

## Quick Test

1. Go to member registration form
2. Fill in first name and last name
3. Click "บันทึกข้อมูล"
4. **Modal should appear** with your name
5. Try "ปฏิเสธ" - should NOT save
6. Fill again and click "บันทึกข้อมูล"
7. Try "ยอมรับ" - should save ✅

---
**Status**: ✅ Ready to Use  
**PDPA Compliant**: Yes  
**User Tested**: Pending  
