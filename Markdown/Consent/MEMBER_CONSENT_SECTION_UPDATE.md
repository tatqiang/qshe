# Member Application Form - Consent Section Update

## 📋 Overview

Updated the member application form to include a proper **หนังสือให้ความยินยอม** (Personal Data Consent Form) section on page 2, following the PDPA (Personal Data Protection Act) requirements.

## 🔄 Changes Made

### 1. **Profile Photo Repositioned** ✅
- **Previous**: Located in `documents` section
- **New**: Moved to end of `personal_info` section (display_order: 170)
- **Features**:
  - File upload with thumbnail preview
  - Collapsible display
  - Accepts: JPG, PNG (max 3 MB)
  - Field key: `profile_photo`

### 2. **Section Renamed** ✅
- **Previous**: `documents` (เอกสารแนบ)
- **New**: `consent` (หนังสือให้ความยินยอม)

### 3. **Consent Text Field Added** ✅
- **Field**: `consent_text` (type: `info`)
- **Display Order**: 400 (first in consent section)
- **Features**:
  - Shows current date automatically
  - Interpolates user's name: `{first_name} {last_name}`
  - Full PDPA consent text in Thai and English
  - Based on Sino-Thai Engineering standard consent form

**Consent Text (Thai)**:
```
ข้าพเจ้า {first_name} {last_name} ในฐานะเจ้าของข้อมูลส่วนบุคคล
ตกลงให้ความยินยอมแก่บริษัท ซิโน-ไทย เอ็นจีเนียริ่ง แอนด์ คอนสตรัคชั่น จำกัด (มหาชน)
ในการเก็บรวบรวม เปิดเผย หรือใช้ข้อมูลส่วนบุคคล ข้อมูลส่วนบุคคลอ่อนไหว
และข้อมูลส่วนบุคคลอื่นใดที่สามารถระบุว่าเป็นข้าพเจ้าได้
เพื่อเป็นหลักฐานในการยืนยันตัวตน
เพื่อใช้ในการดำเนินกิจการ กิจกรรม และธุรกรรมของบริษัท
ข้าพเจ้าทราบว่าเจ้าของข้อมูลส่วนบุคคล
มีสิทธิที่จะให้ความยินยอมหรือไม่ก็ได้
และมีสิทธิตามที่พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
```

### 4. **Document Fields Updated** ✅

#### Field 1: Consent Text (400)
- Displays date and interpolated name

#### Field 2: ID Card Copy (410)
- **Label**: สำเนาบัตรประชาชน (จำเป็น)
- **Required**: Yes
- **Accepts**: JPG, PNG, PDF (max 5 MB)
- **Field key**: `document_id_card`

#### Field 3: Medical Certificate (420)
- **Label**: ใบรับรองแพทย์ / ประวัติทางด้านสุขภาพ (จำเป็น)
- **Required**: Yes
- **Accepts**: JPG, PNG, PDF (max 5 MB)
- **Field key**: `document_medical_certificate`

#### Field 4: Other Documents (430) 🆕
- **Label**: เอกสารแนบอื่นๆ
- **Required**: No (optional)
- **Accepts**: JPG, PNG, PDF (max 5 MB)
- **Multiple files**: Yes
- **Field key**: `document_other`
- **Examples**: สำเนาทะเบียนบ้าน, ใบอนุญาตขับขี่, สำเนาโฉนดที่ดิน

### 5. **Signature Field Updated** ✅
- **Previous Label**: ลายเซ็นผู้สมัคร (Applicant Signature)
- **New Label**: ลายเซ็นผู้ให้ความยินยอม (Consent Giver Signature)
- **Section**: `consent` (moved from `signatures`)
- **Display Order**: 500
- **Help Text**: กรุณาวาดลายเซ็นในกล่องเพื่อยืนยันความยินยอม

### 6. **Removed Fields** ✅
- ❌ `supervisor_signature` - No longer needed
- ❌ `signatures` section - Merged into consent section

## 📊 Form Structure

### Page 1: Personal Information
```
Section: personal_info (10-170)
├── first_name (10)
├── last_name (20)
├── phone (30)
├── birth_date (100)
├── age (110)
├── education_level (120)
├── nationality (130)
├── religion (140)
├── id_card_number (150)
├── position_applied (160)
└── profile_photo (170) ⬅️ NEW POSITION

Section: address (40-90)
├── address_house_number (40)
├── address_moo (50)
├── address_soi (60)
├── address_tambon (70)
├── address_amphoe (80)
└── address_province (90)

Section: work_history (200-210)
Section: health (300-350)
```

### Page 2: Consent Form (หนังสือให้ความยินยอม)
```
Section: consent (400-500)
├── consent_text (400) ⬅️ NEW
│   └── Shows: วันที่ {date}
│       ข้าพเจ้า {first_name} {last_name}...
├── document_id_card (410) ⬅️ Required
├── document_medical_certificate (420) ⬅️ Required
├── document_other (430) ⬅️ NEW, Optional
└── applicant_signature (500) ⬅️ Updated label
    └── ลายเซ็นผู้ให้ความยินยอม
```

## 🚀 Migration

### Run Migration
```cmd
update_consent_section.bat
```

Or manually:
```cmd
supabase db execute --file database/update_member_form_consent_section.sql
```

### Verify Changes
The migration script includes verification queries at the end:
1. List all `personal_info` fields (should show `profile_photo` at end)
2. List all `consent` section fields
3. Summary of all sections with field counts

## 📝 Field Specifications

### File Upload Fields

| Field Key | Label (TH) | Required | Max Size | File Types | Multiple | Thumbnail |
|-----------|-----------|----------|----------|------------|----------|-----------|
| `profile_photo` | รูปถ่าย | ✅ Yes | 3 MB | JPG, PNG | No | ✅ Yes |
| `document_id_card` | สำเนาบัตรประชาชน | ✅ Yes | 5 MB | JPG, PNG, PDF | No | No |
| `document_medical_certificate` | ใบรับรองแพทย์ | ✅ Yes | 5 MB | JPG, PNG, PDF | No | No |
| `document_other` | เอกสารแนบอื่นๆ | ❌ No | 5 MB | JPG, PNG, PDF | ✅ Yes | No |

### Info Field (consent_text)

```json
{
  "type": "consent_text",
  "showDate": true,
  "interpolate": ["first_name", "last_name"]
}
```

## 🎨 UI Implementation Notes

### Profile Photo (personal_info section)
- Show thumbnail preview after upload
- Collapsible container to save space
- Allow re-upload/replace

### Consent Text Field
- Display as read-only info box
- Auto-populate date (current date)
- Replace `{first_name}` and `{last_name}` with actual values from form
- Style similar to the paper document (white background, border)

### Document Upload Fields
- Show file name after upload
- File size validation before upload
- Support drag-and-drop
- `document_other` allows multiple files

### Signature Field
- Canvas-based signature pad
- Clear/redo button
- Save as base64 image
- Show label "ผู้ให้ความยินยอม" below signature

## 📄 Related Files

- `database/update_member_form_consent_section.sql` - Migration script
- `database/member_application_seed.sql` - Updated seed data
- `update_consent_section.bat` - Migration runner
- `docs/forms/หนังสือยินยอม.txt` - Original consent form text

## ✅ Testing Checklist

- [ ] Profile photo appears at end of personal_info section
- [ ] Profile photo shows thumbnail after upload
- [ ] Consent section displays with correct title
- [ ] Consent text shows current date
- [ ] Consent text interpolates user's name correctly
- [ ] ID card upload is required
- [ ] Medical certificate upload is required
- [ ] Other documents is optional and allows multiple files
- [ ] Signature field shows "ผู้ให้ความยินยอม" label
- [ ] No supervisor signature field appears
- [ ] Form validation works for all required fields

## 🔗 References

- PDPA (พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562)
- Original paper form: `docs/forms/หนังสือยินยอม.txt`
- Sino-Thai Engineering consent requirements

---

**Last Updated**: October 20, 2025
**Migration Status**: ✅ Ready to deploy
