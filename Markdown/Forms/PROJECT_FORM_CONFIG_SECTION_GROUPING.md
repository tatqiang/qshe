# Project Form Config - Section-Based Ordering

## ✅ What Changed

The **Project Form Configuration** page now displays fields **grouped by section**, matching exactly how they appear in the actual member registration form.

## 🎯 Before vs After

### Before (Flat List)
```
[All Fields Mixed Together]
01 ↕️ ชื่อ (personal_info)
02 ↕️ นามสกุล (personal_info)
03 ↕️ เบอร์โทร (personal_info)
04 ↕️ เลขที่ (address)
05 ↕️ เกิดวันที่ (personal_info)  ← Out of order!
06 ↕️ ถนน (address)
...
```

**Problem:** You could drag fields anywhere, but the form still grouped by section, causing confusion.

---

### After (Section-Grouped) ✨
```
📋 ข้อมูลส่วนตัว (Personal Info) - 4 fields
┌─────────────────────────────┐
│ 01 ↕️ ชื่อ                  │
│ 02 ↕️ นามสกุล                │
│ 03 ↕️ เบอร์โทร              │
│ 04 ↕️ เกิดวันที่            │
└─────────────────────────────┘

📋 ที่อยู่ (Address) - 7 fields
┌─────────────────────────────┐
│ 05 ↕️ เลขที่                │
│ 06 ↕️ ถนน    ← Can reorder! │
│ 07 ↕️ หมู่                  │
│ 08 ↕️ ซอย                   │
│ 09 ↕️ ตำบล                  │
│ 10 ↕️ อำเภอ                 │
│ 11 ↕️ จังหวัด              │
└─────────────────────────────┘
```

**Benefit:** Visual layout matches actual form. Drag to reorder **within each section only**.

---

## 🔧 How to Use

### Reorder Fields
1. **Navigate to** `/admin/project-form-config`
2. **Select project** and **form template**
3. **Find the section** you want to edit (e.g., "ที่อยู่")
4. **Drag the ↕️ handle** to reorder fields within that section
5. **Auto-saves** - no save button needed!

### Hide/Show Fields
- **Click the Visible checkbox** - field appears/disappears in form
- **Click the Required checkbox** - adds/removes red asterisk (*)

---

## 📊 Sections Available

| Section Key      | Thai Name            | Typical Fields                           |
|------------------|----------------------|------------------------------------------|
| `personal_info`  | ข้อมูลส่วนตัว       | ชื่อ, นามสกุล, เบอร์โทร, เกิดวันที่    |
| `address`        | ที่อยู่              | เลขที่, ถนน, หมู่, ซอย, ตำบล, อำเภอ... |
| `work_history`   | ประสบการณ์ทำงาน      | บริษัท, ตำแหน่ง, ระยะเวลา...            |
| `health`         | ข้อมูลสุขภาพ         | โรคประจำตัว, แพ้ยา...                   |
| `documents`      | เอกสารแนบ            | บัตรประชาชน, ใบอนุญาตขับขี่...          |
| `signatures`     | ลายเซ็น              | ลายเซ็นผู้สมัคร...                      |

---

## 🚫 Cross-Section Dragging

**Cannot drag fields between sections.**

Example:
```
❌ BLOCKED: Cannot drag "ถนน" from Address section to Personal Info
✅ ALLOWED: Drag "ถนน" above "เลขที่" within Address section
```

If you try to drag between sections, you'll see:
```
🔴 Cannot move fields between sections
```

---

## 💾 Database Structure

### How It Works

1. **`form_fields.section`** - Defines which section a field belongs to
2. **`form_fields.display_order`** - Global order (not used for display)
3. **`project_field_configs.custom_display_order`** - Project-specific order **within section**

### Order Calculation
- Order within section: `custom_display_order` (10, 20, 30...)
- Sections displayed in order: personal_info → address → work_history → health → documents → signatures

---

## 🐛 Troubleshooting

### Field in Wrong Section
**Symptom:** "ถนน" appears in Personal Info instead of Address

**Fix:** Update `form_fields.section` in database:
```sql
UPDATE form_fields
SET section = 'address'
WHERE field_key = 'address_street';
```

### Cannot Drag at All
**Check:** Make sure you're dragging the ↕️ icon, not the field name.

### Order Not Saving
**Check:** 
1. Browser console for errors (F12)
2. Auto-save indicator should show "Auto-save enabled"
3. Toast notification "✓ Field order saved" should appear

---

## 📝 Technical Details

### File Modified
- `src/pages/admin/ProjectFormConfigPage.tsx`

### Key Changes
1. Added `section: string` to `FormField` interface
2. Created `groupFieldsBySection()` helper function
3. Created `getSectionTitle()` for Thai section names
4. Updated `handleDragEnd()` to validate same-section constraint
5. Replaced flat table with section-grouped cards

### Drag-and-Drop Logic
```typescript
// Prevent cross-section dragging
if (activeField.section !== overField.section) {
  toast.error('Cannot move fields between sections');
  return;
}

// Only update fields in the same section
const sectionFields = newFields.filter(f => f.section === activeField.section);
```

---

## 🎉 Benefits

1. **Visual Clarity** - Matches actual form layout
2. **Intuitive Ordering** - Drag within logical groups
3. **No Confusion** - Can't accidentally move fields to wrong section
4. **Better UX** - Section headers show field count
5. **Auto-Save** - Changes persist immediately

---

## 🚀 Next Steps

If you want to **add a new section**:

1. Add to `getSectionTitle()` mapping:
   ```typescript
   const titles: Record<string, string> = {
     // ... existing
     emergency_contact: 'ผู้ติดต่อฉุกเฉิน',  // new
   };
   ```

2. Create fields with that section:
   ```sql
   INSERT INTO form_fields (section, ...) 
   VALUES ('emergency_contact', ...);
   ```

3. Section will automatically appear in config page!

---

**Last Updated:** October 20, 2025
**Version:** 2.0 - Section-Grouped Interface
