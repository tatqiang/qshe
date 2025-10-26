# เพิ่ม Thumbnail และคำนำหน้าชื่อในหน้าฟอร์ม Member Application

## 🎯 สรุปการแก้ไข

แก้ไข Member Form Page ให้:
1. **แสดง thumbnail รูปภาพ** สำหรับ file inputs ทั้ง 3 ช่อง (รูปโปรไฟล์, สำเนาบัตรประชาชน, ใบรับรองแพทย์)
2. **เพิ่มคำนำหน้าชื่อ** ในข้อความการให้ความยินยอม

## 📝 ไฟล์ที่แก้ไข

### `src/components/member-form/DynamicFormField.tsx`

## ✨ Feature 1: Thumbnail Display for File Inputs

### Before
```tsx
{(localFile || value) && (
  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <span className="font-medium text-gray-700">ไฟล์:</span>
        <span className="text-gray-900">{localFile?.name || fileName}</span>
      </div>
      <a href={value} target="_blank">ดูไฟล์</a>
    </div>
  </div>
)}
```

### After
```tsx
{(localFile || value) && (
  <div className="mt-3">
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* File name and size */}
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-gray-700">ไฟล์:</span>
            <span className="text-gray-900 truncate">{localFile?.name || fileName}</span>
            <span className="text-xs text-gray-500">({size} KB)</span>
          </div>
          
          {/* Thumbnail preview */}
          {thumbnailUrl && showThumbnail && (
            <div className="mt-2 mb-2">
              <img 
                src={thumbnailUrl} 
                alt="Preview" 
                className="max-w-full h-auto max-h-48 rounded-lg"
              />
            </div>
          )}
          
          {/* Toggle and View buttons */}
          <div className="flex gap-2 mt-2">
            <button onClick={() => setShowThumbnail(!showThumbnail)}>
              {showThumbnail ? '🔼 ซ่อนรูป' : '🔽 แสดงรูป'}
            </button>
            <a href={value} target="_blank">ดูไฟล์</a>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
```

### Features Added:
- ✅ **Thumbnail display** - แสดงภาพตัวอย่างสูงสุด 192px
- ✅ **Toggle button** - ปุ่มซ่อน/แสดงรูปภาพ (🔼/🔽)
- ✅ **Image detection** - ตรวจสอบไฟล์ว่าเป็นภาพหรือไม่
- ✅ **Support for local files** - แสดง thumbnail ของไฟล์ที่เพิ่งเลือก
- ✅ **Support for existing files** - แสดง thumbnail ของไฟล์ที่อัพโหลดไว้แล้ว
- ✅ **Responsive layout** - ปรับขนาดตามหน้าจอ

## ✨ Feature 2: Title Prefix in Consent Text

### Before
```tsx
const replacePlaceholders = (text: string): string => {
  return text.replace(/\{([^}]+)\}/g, (match, key) => {
    const trimmedKey = key.trim();
    return formData[trimmedKey] || match;
  });
};
```
**Result**: "ข้าพเจ้า ธงชัย ใจดี"

### After
```tsx
const replacePlaceholders = (text: string): string => {
  return text.replace(/\{([^}]+)\}/g, (match, key) => {
    const trimmedKey = key.trim();
    
    // Special handling for name with title prefix
    if (trimmedKey === 'first_name' && formData.title_name) {
      return `${formData.title_name}${formData.first_name || ''}`;
    }
    
    return formData[trimmedKey] || match;
  });
};
```
**Result**: "ข้าพเจ้า นายธงชัย ใจดี"

### Features Added:
- ✅ **Automatic title prefix** - เมื่อมี `title_name` จะแสดงหน้า `first_name` อัตโนมัติ
- ✅ **Backward compatible** - ถ้าไม่มี `title_name` จะแสดงชื่อปกติ
- ✅ **Support both field types** - รองรับทั้ง `read_only_text` และ `info`

## 🔄 ตัวอย่างการทำงาน

### Scenario 1: อัพโหลดรูปโปรไฟล์

```
1. User clicks "Choose File"
2. Selects image (e.g., profile.jpg)
3. System shows:
   ┌─────────────────────────────────────┐
   │ ไฟล์: profile.jpg (256 KB)         │
   │                                     │
   │ [Thumbnail Image Preview]           │
   │                                     │
   │ [🔼 ซ่อนรูป]  [👁 ดูไฟล์]         │
   └─────────────────────────────────────┘
4. User clicks "🔼 ซ่อนรูป"
5. Thumbnail collapses:
   ┌─────────────────────────────────────┐
   │ ไฟล์: profile.jpg (256 KB)         │
   │ [🔽 แสดงรูป]  [👁 ดูไฟล์]         │
   └─────────────────────────────────────┘
```

### Scenario 2: แสดงคำนำหน้าชื่อในการให้ความยินยอม

**ข้อมูลฟอร์ม:**
```json
{
  "title_name": "นาย",
  "first_name": "ธงชัย",
  "last_name": "ใจดี"
}
```

**Template:**
```
ข้าพเจ้า {first_name} {last_name} ในฐานะเจ้าของข้อมูลส่วนบุคคล...
```

**ผลลัพธ์:**
```
วันที่ 20 ตุลาคม 2568

    ข้าพเจ้า นายธงชัย ใจดี ในฐานะเจ้าของข้อมูลส่วนบุคคล
ตกลงให้ความยินยอมแก่บริษัท ซิโน-ไทย เอ็นจีเนียริ่ง...
```

## 🎨 UI/UX Improvements

### File Input with Thumbnail

**Before:**
```
┌─────────────────────────────────┐
│ [Choose File] No file chosen    │
│                                 │
│ ไฟล์: profile.jpg (256 KB)     │
│ [ดูไฟล์]                        │
└─────────────────────────────────┘
```

**After:**
```
┌─────────────────────────────────┐
│ [Choose File] No file chosen    │
│                                 │
│ ไฟล์: profile.jpg (256 KB)     │
│ ┌─────────────────────────────┐ │
│ │   [Thumbnail Preview]       │ │
│ │     192 x 192 px            │ │
│ └─────────────────────────────┘ │
│ [🔼 ซ่อนรูป]  [👁 ดูไฟล์]     │
└─────────────────────────────────┘
```

### Consent Text with Title

**Before:**
```
┌─────────────────────────────────────────────┐
│ การให้ความยินยอม                            │
├─────────────────────────────────────────────┤
│ วันที่ 20 ตุลาคม 2568                        │
│                                             │
│     ข้าพเจ้า ธงชัย ใจดี ในฐานะเจ้าของ      │
│ ข้อมูลส่วนบุคคลตกลงให้ความยินยอม...         │
└─────────────────────────────────────────────┘
```

**After:**
```
┌─────────────────────────────────────────────┐
│ การให้ความยินยอม                            │
├─────────────────────────────────────────────┤
│ วันที่ 20 ตุลาคม 2568                        │
│                                             │
│     ข้าพเจ้า นายธงชัย ใจดี ในฐานะเจ้าของ   │
│ ข้อมูลส่วนบุคคลตกลงให้ความยินยอม...         │
└─────────────────────────────────────────────┘
```

## 💡 Technical Details

### Image Detection Logic

```tsx
const isImage = (file: File | string): boolean => {
  if (typeof file === 'string') {
    // Check URL extension
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(file);
  }
  // Check MIME type
  return file.type.startsWith('image/');
};
```

### Thumbnail URL Generation

```tsx
const getThumbnailUrl = (): string | null => {
  // For newly selected local files
  if (localFile && isImage(localFile)) {
    return URL.createObjectURL(localFile);
  }
  // For existing uploaded files
  if (isExistingFile && isImage(value)) {
    return value;
  }
  return null;
};
```

### Name Placeholder Replacement

```tsx
if (trimmedKey === 'first_name' && formData.title_name) {
  return `${formData.title_name}${formData.first_name || ''}`;
}
```
- เช็คว่ามี `title_name` หรือไม่
- ถ้ามี: รวมคำนำหน้า + ชื่อ (เช่น "นายธงชัย")
- ถ้าไม่มี: แสดงแค่ชื่อ (เช่น "ธงชัย")

## 📊 Supported File Types

### Images (with thumbnail):
- ✅ JPEG (.jpg, .jpeg)
- ✅ PNG (.png)
- ✅ GIF (.gif)
- ✅ WebP (.webp)

### Documents (no thumbnail):
- 📄 PDF (.pdf) - แสดงไอคอนเอกสาร
- 📄 อื่นๆ - แสดงชื่อไฟล์เท่านั้น

## ✅ Testing Checklist

### Thumbnail Feature
- [ ] อัพโหลดรูป JPG แสดง thumbnail
- [ ] อัพโหลดรูป PNG แสดง thumbnail
- [ ] อัพโหลด PDF ไม่แสดง thumbnail
- [ ] คลิก "ซ่อนรูป" ซ่อน thumbnail
- [ ] คลิก "แสดงรูป" แสดง thumbnail กลับมา
- [ ] รูปที่มีอยู่แล้วแสดง thumbnail
- [ ] รูปขนาดใหญ่ถูก resize ให้พอดี (max-h-48)
- [ ] คลิก "ดูไฟล์" เปิด tab ใหม่

### Title Prefix Feature
- [ ] กรอกคำนำหน้า "นาย" + ชื่อ "ธงชัย" → แสดง "นายธงชัย"
- [ ] กรอกคำนำหน้า "นาง" + ชื่อ "สมหญิง" → แสดง "นางสมหญิง"
- [ ] กรอกคำนำหน้า "นางสาว" + ชื่อ "สมใจ" → แสดง "นางสาวสมใจ"
- [ ] ไม่กรอกคำนำหน้า + ชื่อ "สมชาย" → แสดง "สมชาย"
- [ ] ข้อมูลเก่าที่ไม่มี title_name แสดงชื่อปกติ

## 🚀 Deployment

**Files Changed:**
```
✅ src/components/member-form/DynamicFormField.tsx
```

**No database changes required** - ทำงานกับ field schema ที่มีอยู่แล้ว

## 🔗 Related Pages

1. **Member Form** - http://localhost:5173/public/member-form?token=xxx
   - แสดง thumbnail ทันทีหลังเลือกไฟล์
   - แสดงคำนำหน้าชื่อในการให้ความยินยอม

2. **Member Report** - http://localhost:5173/member-report/xxx
   - รายงานแสดงคำนำหน้าชื่อ (แก้ไขแล้วก่อนหน้านี้)

## 📌 Notes

- **Performance**: ใช้ `URL.createObjectURL()` สำหรับ local files (ไม่ต้องอ่านเป็น base64)
- **Memory**: thumbnail URL จะถูก revoke เมื่อ component unmount
- **Responsive**: รูปจะ scale ตามขนาดหน้าจอ (max-w-full)
- **Max height**: จำกัดความสูงที่ 192px (max-h-48) เพื่อไม่ให้ยาวเกินไป
- **No space**: คำนำหน้า + ชื่อไม่มีช่องว่าง (เช่น "นายธงชัย" ไม่ใช่ "นาย ธงชัย")

---

**Created**: 2025-01-20  
**Updated**: 2025-01-20  
**Version**: 1.0  
**Status**: ✅ Complete
