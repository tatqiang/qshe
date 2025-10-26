# Consent Form Report - Final Updates

## ✅ Changes Made to Page 2 (Consent Form)

### 1. Added Outer Border Box
- ✅ Single border (`2px solid #000`) around entire content
- ✅ Similar to Page 1 style but **single line only**
- ✅ No separate inner boxes
- ✅ Padding: 15px inside the border
- ✅ Min height to fill the page

### 2. Updated Consent Text
**BEFORE:**
```
ข้าพเจ้า [underlined name] ในฐานะ...
```

**AFTER:**
```
ข้าพเจ้า ชื่อ นามสกุล ในฐานะเจ้าของข้อมูลส่วนบุคคล...
```
- ✅ Removed underline
- ✅ Name flows naturally in the sentence
- ✅ Text indent: 2em for first line
- ✅ Full justify alignment

### 3. Updated Signature Section
**ADDED name in parentheses:**
```
         [Signature Image]
      ──────────────────
           ลายเซ็น
     (ชื่อ นามสกุล)  ← ADDED
      ผู้ให้ความยินยอม
```
- ✅ Shows full name in parentheses below signature line
- ✅ Font size: 14px (consistent)
- ✅ Center aligned

## 📋 Complete Page 2 Structure

```
┌────────────────────────────────────────────┐
│                          [STECON LOGO] 🏢  │
│                                            │
│  หนังสือให้ความยินยอมในการเปิดเผยข้อมูล    │
│         ส่วนบุคคล                          │
│   (Personal Data Consent Form)             │
│                                            │
│  วันที่ 18 ตุลาคม 2568                     │
│                                            │
│      ข้าพเจ้า สมชาย ใจดี ในฐานะเจ้า        │
│  ของข้อมูลส่วนบุคคลตกลงให้ความยินยอม        │
│  แก่บริษัท ซิโน-ไทย เอ็นจีเนียริ่ง แอนด์   │
│  คอนสตรัคชั่น จำกัด (มหาชน) ในการ          │
│  เก็บรวบรวม เปิดเผย หรือใช้ข้อมูล           │
│  ส่วนบุคคล... พ.ศ. 2562                    │
│                                            │
│  ทั้งนี้เอกสารที่ข้าพเจ้าแนบมาด้วย มีดังนี้ │
│  ☑ สำเนาบัตรประชาชน (จำเป็น)             │
│  ☐ สำเนาทะเบียนบ้าน                       │
│  ☐ สำเนาใบอนุญาตขับรถ โปรดระบุ ประเภท ___ │
│  ☑ ใบรับรองแพทย์, ประวัติทางด้านสุขภาพ    │
│     (จำเป็น)                               │
│  ☐ สำเนาโฉนดที่ดิน                        │
│  ☐ อื่นๆ โปรดระบุ _______________         │
│                                            │
│                                            │
│            [Signature Image] ✍️            │
│          ──────────────────                │
│               ลายเซ็น                      │
│          (สมชาย ใจดี)     ← NEW            │
│          ผู้ให้ความยินยอม                  │
│                                            │
└────────────────────────────────────────────┘
     ↑ Single border box (2px solid)
```

## 🎨 Styling Details

### Border Box
```css
border: 2px solid #000
padding: 15px
minHeight: calc(297mm - 40px)
```

### Logo
```css
width: 80px
position: right-aligned
margin-bottom: 20px
```

### Title
```css
font-size: 16px (main title)
font-size: 13px (English subtitle)
text-align: center
font-weight: bold
```

### Date
```css
font-size: 14px
margin-bottom: 20px
```

### Consent Text
```css
font-size: 14px
line-height: 1.8
text-align: justify
text-indent: 2em (first line only)
```

### Document Checklist
```css
font-size: 14px
line-height: 2
margin-left: 20px
```

### Signature Section
```css
margin-top: 60px
text-align: center
font-size: 14px

Signature image: max-width 200px
Border line: 1px solid, width 250px
Name in parentheses: (ชื่อ นามสกุล)
```

## 📝 Key Differences from Original Request

### ✅ Implemented
1. Single outer border box (no inner boxes)
2. Name flows in consent text: "ข้าพเจ้า ชื่อ นามสกุล ในฐานะ..."
3. Name shown in parentheses at signature: "(ชื่อ นามสกุล)"

### 🎯 Matches Image Requirements
- Logo top right
- Single border around entire page
- Natural text flow (no underlines in body text)
- Professional layout
- Print-ready A4 format

## 🧪 Testing

To verify the changes:
1. Create/view a member application
2. Click "View Report"
3. Check Page 2 displays with:
   - ✅ Single border box
   - ✅ Name in consent text (no underline)
   - ✅ Name in parentheses at signature
   - ✅ Proper spacing and alignment

---
**Status**: ✅ Complete
**File Modified**: `src/components/member-form/MemberRegistrationReport.tsx`
**Date**: October 20, 2025
