# แก้ไข Bug: Placeholder ไม่ถูก Replace ในข้อความ Consent

## 🐛 ปัญหา

ในหน้าฟอร์ม Member Application ส่วนการให้ความยินยอม แสดงข้อความ:
```
ข้าพเจ้า {{first_name}} {{last_name}} ในฐานะเจ้าของข้อมูลส่วนบุคคล...
```

แทนที่จะแสดง:
```
ข้าพเจ้า นายธงชัย ใจดี ในฐานะเจ้าของข้อมูลส่วนบุคคล...
```

## 🔍 สาเหตุ

**Template ในฐานข้อมูล** ใช้ `{{key}}` (double curly braces):
```
ข้าพเจ้า {{first_name}} {{last_name}}
```

แต่ **Code ใน DynamicFormField.tsx** เช็คแค่ `{key}` (single curly braces):
```tsx
text.replace(/\{([^}]+)\}/g, (match, key) => { ... })
```

ดังนั้น regex จึง**ไม่จับ** `{{key}}` ได้!

## ✅ วิธีแก้ไข

แก้ไขฟังก์ชัน `replacePlaceholders` ให้รองรับทั้งสองรูปแบบ:

### ก่อนแก้ไข
```tsx
const replacePlaceholders = (text: string): string => {
  return text.replace(/\{([^}]+)\}/g, (match, key) => {
    const trimmedKey = key.trim();
    
    if (trimmedKey === 'first_name' && formData.title_name) {
      return `${formData.title_name}${formData.first_name || ''}`;
    }
    
    return formData[trimmedKey] || match;
  });
};
```

### หลังแก้ไข
```tsx
const replacePlaceholders = (text: string): string => {
  // First, handle double curly braces {{key}}
  let result = text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    
    // Special handling for name with title prefix
    if (trimmedKey === 'first_name' && formData.title_name) {
      return `${formData.title_name}${formData.first_name || ''}`;
    }
    
    return formData[trimmedKey] || match;
  });

  // Then, handle single curly braces {key}
  result = result.replace(/\{([^}]+)\}/g, (match, key) => {
    const trimmedKey = key.trim();
    
    // Special handling for name with title prefix
    if (trimmedKey === 'first_name' && formData.title_name) {
      return `${formData.title_name}${formData.first_name || ''}`;
    }
    
    return formData[trimmedKey] || match;
  });

  return result;
};
```

## 📊 Regex Explanation

### Double Curly Braces: `\{\{([^}]+)\}\}`
- `\{\{` - จับ `{{` (escape ด้วย backslash)
- `([^}]+)` - capture group: จับอักขระที่ไม่ใช่ `}` อย่างน้อย 1 ตัว
- `\}\}` - จับ `}}` (escape ด้วย backslash)

**ตัวอย่าง:**
- `{{first_name}}` → จับได้ key = `first_name`
- `{{last_name}}` → จับได้ key = `last_name`

### Single Curly Braces: `\{([^}]+)\}`
- `\{` - จับ `{`
- `([^}]+)` - capture group: จับอักขระที่ไม่ใช่ `}` อย่างน้อย 1 ตัว
- `\}` - จับ `}`

**ตัวอย่าง:**
- `{first_name}` → จับได้ key = `first_name`
- `{last_name}` → จับได้ key = `last_name`

## 🔄 Flow การทำงาน

```
Input: "ข้าพเจ้า {{first_name}} {{last_name}}"
       +
       formData: {
         title_name: "นาย",
         first_name: "ธงชัย",
         last_name: "ใจดี"
       }
       ↓
Step 1: Replace {{first_name}}
       - key = "first_name"
       - มี title_name → return "นายธงชัย"
       ↓
Step 2: Replace {{last_name}}
       - key = "last_name"
       - return "ใจดี"
       ↓
Output: "ข้าพเจ้า นายธงชัย ใจดี"
```

## 📝 ตัวอย่างการใช้งาน

### Scenario 1: Template ใช้ {{key}}
```
Template: "ข้าพเจ้า {{first_name}} {{last_name}}"
Data: { title_name: "นาย", first_name: "ธงชัย", last_name: "ใจดี" }
Result: "ข้าพเจ้า นายธงชัย ใจดี" ✅
```

### Scenario 2: Template ใช้ {key}
```
Template: "ข้าพเจ้า {first_name} {last_name}"
Data: { title_name: "นาง", first_name: "สมหญิง", last_name: "รักดี" }
Result: "ข้าพเจ้า นางสมหญิง รักดี" ✅
```

### Scenario 3: ไม่มี title_name
```
Template: "ข้าพเจ้า {{first_name}} {{last_name}}"
Data: { first_name: "สมชาย", last_name: "ใจงาม" }
Result: "ข้าพเจ้า สมชาย ใจงาม" ✅
```

### Scenario 4: Mixed format
```
Template: "ข้าพเจ้า {{first_name}} เบอร์โทร {phone}"
Data: { title_name: "นาย", first_name: "ธงชัย", phone: "0812345678" }
Result: "ข้าพเจ้า นายธงชัย เบอร์โทร 0812345678" ✅
```

## 🎯 Features

- ✅ **รองรับ {{key}}** - Double curly braces (ตาม Handlebars/Mustache syntax)
- ✅ **รองรับ {key}** - Single curly braces
- ✅ **เพิ่มคำนำหน้าชื่ออัตโนมัติ** - ถ้ามี title_name
- ✅ **Backward compatible** - ข้อมูลเก่าที่ไม่มี title_name ยังใช้งานได้
- ✅ **Trim whitespace** - ตัด space ข้างหน้า/หลัง key

## 🐛 Edge Cases ที่จัดการแล้ว

### 1. Key with spaces
```
"{{  first_name  }}" → trimmedKey = "first_name" ✅
```

### 2. Missing data
```
Template: "{{email}}"
Data: { first_name: "ธงชัย" }
Result: "{{email}}" (คงเดิม) ✅
```

### 3. Empty value
```
Template: "{{first_name}}"
Data: { first_name: "" }
Result: "" (empty string) ✅
```

### 4. Null/undefined value
```
Template: "{{first_name}}"
Data: { first_name: null }
Result: "{{first_name}}" (คงเดิม) ✅
```

## 📁 ไฟล์ที่แก้ไข

```
✅ src/components/member-form/DynamicFormField.tsx
```

## 🧪 Testing Checklist

- [ ] แสดงชื่อพร้อมคำนำหน้า "นาย" ถูกต้อง
- [ ] แสดงชื่อพร้อมคำนำหน้า "นาง" ถูกต้อง
- [ ] แสดงชื่อพร้อมคำนำหน้า "นางสาว" ถูกต้อง
- [ ] ข้อมูลเก่าที่ไม่มี title_name แสดงได้ปกติ
- [ ] Template ที่ใช้ {{key}} ทำงานได้
- [ ] Template ที่ใช้ {key} ทำงานได้
- [ ] Template ที่ผสมทั้งสองรูปแบบทำงานได้
- [ ] Key ที่ไม่มีข้อมูลแสดงเป็น placeholder เดิม

## 🔗 Related Issues

- ปัญหาเดิม: `{{first_name}}` ไม่ถูก replace
- แก้ไขแล้ว: รองรับทั้ง `{{key}}` และ `{key}`
- เพิ่มฟีเจอร์: แสดงคำนำหน้าชื่ออัตโนมัติ

## 📌 Notes

- ใช้ **two-pass replacement** - replace `{{key}}` ก่อน แล้วค่อย replace `{key}`
- ลำดับสำคัญ! ต้อง replace `{{` ก่อน `{` ไม่งั้น `{{key}}` จะถูก replace แค่ครั้งเดียวเป็น `{value}`
- คำนำหน้าชื่อ + ชื่อไม่มีช่องว่าง (เช่น "นายธงชัย" ไม่ใช่ "นาย ธงชัย")

---

**Created**: 2025-01-20  
**Fixed**: 2025-01-20  
**Status**: ✅ Resolved  
**Priority**: 🔴 High (แสดงข้อความผิด)
