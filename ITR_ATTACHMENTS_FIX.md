# ITR Attachments - Read Only Mode Fix

## ปัญหา
เมื่อเปิด ITR ในโหมด read-only (ไม่ได้กด Edit) ไม่แสดงไฟล์แนบ (attachments) ที่บันทึกไว้ หรือแสดงแบบรวมกันไม่แยกตาม type

## ความต้องการ
แสดง attachments ในโหมด read-only แบบแยกตาม type (Drawing Files, DO Files, Photos) เหมือนกับในฟอร์มสร้าง/แก้ไข ITR เพื่อให้ผู้ใช้เห็นไฟล์แนบอยู่ในตำแหน่งที่สอดคล้องกับประเภทของไฟล์

## สาเหตุ
1. **Data Transform Issue**: Database ใช้ snake_case (`file_name`, `file_url`) แต่ Vue component พยายามเข้าถึงด้วย camelCase (`fileName`, `fileUrl`)
2. **Missing Loading State**: ไม่มี UI feedback ขณะโหลดไฟล์แนบ
3. **Poor UX for Read Mode**: แสดง attachments แบบ list card รวมกัน ไม่แยกตาม type ทำให้ไม่เหมือนกับฟอร์ม

## การแก้ไข

### 1. Transform Data ใน Service (`constructionITRService.ts`)
แก้ไข `getAttachments()` ให้แปลง snake_case เป็น camelCase:

```typescript
async getAttachments(itrId: string) {
  const { data, error } = await supabase
    .from('construction_itr_attachments')
    .select('*')
    .eq('itr_id', itrId)
    .order('uploaded_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching attachments:', error)
    throw new Error(`Failed to fetch attachments: ${error.message}`)
  }
  
  // Transform snake_case to camelCase for frontend
  return (data || []).map(att => ({
    id: att.id,
    itrId: att.itr_id,
    attachmentType: att.attachment_type,
    fileName: att.file_name,
    fileUrl: att.file_url,
    fileSize: att.file_size,
    mimeType: att.mime_type,
    description: att.description,
    uploadedBy: att.uploaded_by,
    uploadedAt: att.uploaded_at,
    createdAt: att.created_at,
    updatedAt: att.updated_at
  }))
}
```

### 2. ปรับโครงสร้าง UI ใน ITRDetailModal.vue

#### แสดง Existing Files Summary
```vue
<!-- Existing Files Summary (if any) -->
<div v-if="attachments.length > 0" class="existing-files-summary">
  <h4 class="text-sm font-semibold mb-3 text-gray-700">Existing Files</h4>
  <div class="existing-files-grid">
    <div v-for="att in attachments" :key="att.id" class="existing-file-item">
      <span class="file-icon">
        {{ att.attachmentType === 'drawing' ? '📄' : att.attachmentType === 'delivery_order' ? '📋' : '🖼️' }}
      </span>
      <a :href="att.fileUrl" target="_blank" class="file-link">
        {{ att.fileName }}
      </a>
      <span class="file-size">{{ formatFileSize(att.fileSize) }}</span>
    </div>
  </div>
</div>
```

#### แยก Attachments ตาม Type
```vue
<!-- Drawing Files Section -->
<div class="attachment-section">
  <div class="form-group">
    <label>Drawing No</label>
    <input v-model="formData.drawingNo" type="text" disabled />
  </div>
  <div class="form-group">
    <label>Drawing Files (PDF or Images)</label>
    <div v-if="attachmentsByType('drawing').length > 0" class="readonly-file-list">
      <div v-for="att in attachmentsByType('drawing')" :key="att.id" class="readonly-file-item">
        <span class="file-icon">📄</span>
        <a :href="att.fileUrl" target="_blank" class="file-name">{{ att.fileName }}</a>
        <span class="file-size">{{ formatFileSize(att.fileSize) }}</span>
      </div>
    </div>
    <div v-else class="no-files-message">No drawing files</div>
  </div>
</div>

<!-- Delivery Order Files Section -->
<div class="attachment-section">
  <div class="form-group">
    <label>Delivery Order (DO) Files</label>
    <div v-if="attachmentsByType('delivery_order').length > 0" class="readonly-file-list">
      <!-- Similar structure -->
    </div>
    <div v-else class="no-files-message">No delivery order files</div>
  </div>
</div>

<!-- Photos Section -->
<div class="attachment-section">
  <div class="form-group">
    <label>Photos</label>
    <div v-if="attachmentsByType('photo').length > 0" class="readonly-file-list">
      <!-- Similar structure -->
    </div>
    <div v-else class="no-files-message">No photos</div>
  </div>
</div>
```

#### เพิ่ม Helper Function
```typescript
// Filter attachments by type
const attachmentsByType = (type: string) => {
  return attachments.value.filter(att => att.attachmentType === type)
}
```

### 3. ปรับโครงสร้าง Layout
- ย้าย Material Information ออกจากก่อน Attachments
- เพิ่ม Material Reference section หลัง Attachments
- เพิ่ม Note section ใน Attachments area
- ลบ Material No ที่ซ้ำใน ITR Information section

### 4. เพิ่ม CSS Styles
```css
/* Existing Files Summary */
.existing-files-summary {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

/* Read-only File List */
.readonly-file-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.readonly-file-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  transition: all 0.2s;
}

/* No Files Message */
.no-files-message {
  padding: 1rem;
  text-align: center;
  color: #9ca3af;
  font-size: 0.875rem;
  background: #f9fafb;
  border: 1px dashed #e5e7eb;
  border-radius: 6px;
  margin-top: 0.5rem;
}
```

## การตรวจสอบ

### 1. ตรวจสอบ Database
```bash
cd database/migrations
psql -h <your-host> -U <your-user> -d postgres -f test_itr_attachments.sql
```

### 2. ตรวจสอบ Console Logs
เปิด Browser DevTools > Console และดูข้อความ:
- `[ITRDetailModal] Loading attachments for ITR: <uuid>`
- `[ITRDetailModal] Loaded attachments: [...]`

### 3. ตรวจสอบ UI
- เปิด ITR ที่มีไฟล์แนบในโหมด view (ไม่กด Edit)
- ควรเห็น "Existing Files" summary ด้านบน
- ควรเห็นไฟล์แนบแยกตาม type: Drawing Files, DO Files, Photos
- แต่ละ section แสดง "No [type] files" ถ้าไม่มีไฟล์ประเภทนั้น

## ไฟล์ที่แก้ไข
1. ✅ `src/services/constructionITRService.ts` - Transform data เป็น camelCase
2. ✅ `src/components/ITRDetailModal.vue` - ปรับโครงสร้าง UI แยก attachments ตาม type
3. ✅ `database/migrations/test_itr_attachments.sql` - สคริปต์ทดสอบ

## ผลลัพธ์
- ✅ แสดง loading spinner ขณะโหลดไฟล์แนบ
- ✅ แสดง "Existing Files" summary ด้านบน
- ✅ แสดงไฟล์แนบแยกตาม type (Drawing/DO/Photos)
- ✅ แสดง Drawing No field พร้อมกับ Drawing Files
- ✅ แสดง Note field หลังไฟล์ Photos
- ✅ แสดง Material Reference section หลัง Attachments
- ✅ แสดง "No files" message เมื่อไม่มีไฟล์แต่ละประเภท
- ✅ มี console logs สำหรับ debug
- ✅ Data format สอดคล้องกันระหว่าง backend และ frontend

## Layout Structure (Read-only Mode)
```
ITR Information
├── ITR Title
├── System
├── ITR Type
├── Location
└── Drawing No

ITP Information (if exists)
├── ITP Doc No
└── ITP Title

Attachments
├── Existing Files Summary (all files overview)
├── Drawing No + Drawing Files
├── Delivery Order Files
├── Photos
└── Note

Material Reference (if exists)
├── Material No
├── Material Doc No
└── Material Title
```

## Next Steps
หากยังพบปัญหา:
1. เช็ค Console logs ว่ามี error อะไร
2. รัน `test_itr_attachments.sql` เพื่อดูข้อมูลใน database
3. ตรวจสอบว่า RLS policies ถูก apply หรือยัง
4. ตรวจสอบ Network tab ใน DevTools ว่า API call สำเร็จหรือไม่
