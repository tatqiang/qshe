# 🔧 แก้ไขปุ่ม "แก้ไข" ใน Member Report - กระโดดไป Dashboard

## ❌ ปัญหาเดิม

เมื่อคลิกปุ่ม **"แก้ไข"** ในหน้า Member Report:
- แสดง toast "Invalid token"
- กระโดดไปที่ Dashboard
- **ไม่สามารถแก้ไขข้อมูลสมาชิกได้**

---

## 🔍 สาเหตุ

### โค้ดเดิม (MemberReportPage.tsx - บรรทัด 85-88)

```typescript
const handleEdit = () => {
  navigate(`/public/member-form/${memberId}`);
};
```

**ปัญหา:**
1. Navigate ไป `/public/member-form/123` **ไม่มี token**
2. MemberFormPage เช็คว่าไม่มี token
3. แสดง error และ redirect ไป dashboard

### Flow ที่เกิดขึ้น

```
คลิกปุ่ม "แก้ไข"
    ↓
Navigate ไป: /public/member-form/123  (ไม่มี token!)
    ↓
MemberFormPage.tsx (บรรทัด 56-60):
    if (!token) {
      toast.error('Invalid token');
      navigate('/');  ← Jump ไป dashboard!
    }
```

---

## ✅ การแก้ไข

### 1. เพิ่ม `token_id` ใน Interface

```typescript
interface MemberData {
  id: string;
  submission_number: string;
  form_data: any;
  status: string;
  submitted_at: string;
  company_id: string;
  project_id: string;
  token_id: string;  // ← เพิ่มบรรทัดนี้
  companies?: { ... };
  projects?: { ... };
}
```

### 2. แก้ไข `handleEdit` Function

**โค้ดใหม่:**

```typescript
const handleEdit = async () => {
  // Get token from member data first
  if (!member?.token_id) {
    toast.error('ไม่พบข้อมูล token');
    return;
  }

  try {
    // Fetch the actual token value
    const { data: tokenData, error } = await (supabase
      .from('member_application_tokens') as any)
      .select('token')
      .eq('id', member.token_id)
      .single();

    if (error) throw error;

    if (!tokenData || !tokenData.token) {
      toast.error('ไม่พบ token ที่ถูกต้อง');
      return;
    }

    // Navigate with token and member ID
    navigate(`/public/member-form?token=${tokenData.token}&id=${memberId}`);
  } catch (error) {
    console.error('Error getting token:', error);
    toast.error('เกิดข้อผิดพลาดในการโหลด token');
  }
};
```

**สิ่งที่เปลี่ยนแปลง:**
1. ✅ Query database เพื่อดึง token value จาก `token_id`
2. ✅ Navigate พร้อม token: `/public/member-form?token=xxx&id=123`
3. ✅ เพิ่ม error handling

---

## 🎯 Flow ใหม่ที่ถูกต้อง

```
คลิกปุ่ม "แก้ไข"
    ↓
Query database: member_application_tokens
    ↓
ได้ token value
    ↓
Navigate ไป: /public/member-form?token=abc123&id=456
    ↓
MemberFormPage รับ token ✅
    ↓
โหลดฟอร์มแก้ไขสำเร็จ! 🎉
```

---

## 📝 ไฟล์ที่แก้ไข

**File:** `src/pages/public/MemberReportPage.tsx`

**บรรทัดที่แก้:**
- บรรทัด 9-24: เพิ่ม `token_id` ใน `MemberData` interface
- บรรทัด 86-113: แก้ไข `handleEdit` function เป็น async และดึง token

---

## 🧪 การทดสอบ

### ขั้นตอนทดสอบ:

1. ไปที่ `/admin/member-tokens`
2. คลิก "View Members"
3. คลิกปุ่ม **"Report"** ของสมาชิกใดก็ได้
4. ในหน้า Report คลิกปุ่ม **"แก้ไข"** (มุมบนขวา)

### ผลลัพธ์ที่ถูกต้อง:

- ✅ ไม่แสดง "Invalid token" error
- ✅ ไม่กระโดดไป dashboard
- ✅ เปิดหน้าฟอร์มแก้ไขพร้อมข้อมูลเดิม
- ✅ URL มีรูปแบบ: `/public/member-form?token=xxx&id=yyy`
- ✅ สามารถแก้ไขและบันทึกข้อมูลได้

---

## 💡 Technical Notes

### ทำไมต้องดึง token?

`member_applications` table มี:
- `token_id` (UUID) - Reference to token record
- ไม่มี token value (string) เก็บไว้

ต้อง query `member_application_tokens` table เพื่อเอา `token` value มา

### Query ที่ใช้

```sql
SELECT token 
FROM member_application_tokens 
WHERE id = '<token_id>';
```

### Alternative Approach (ไม่ได้ใช้)

อาจจะแก้ใน `loadMemberData()` ให้ join token เลยก็ได้:

```typescript
const { data } = await supabase
  .from('member_applications')
  .select(`
    *,
    companies (name, name_th),
    projects (name),
    member_application_tokens (token)  // ← เพิ่มบรรทัดนี้
  `)
  .eq('id', memberId)
  .single();
```

แต่วิธีปัจจุบันดีกว่าเพราะ:
- ไม่โหลด token ที่ไม่จำเป็นในทุก case
- Query แยกชัดเจน
- Error handling ดีกว่า

---

## 🚀 สรุป

**ปัญหา:** ปุ่มแก้ไขส่ง URL ไม่มี token → Form page reject → redirect dashboard

**วิธีแก้:** ดึง token จาก database ก่อน navigate → ส่ง URL พร้อม token → Form page accept

**ผลลัพธ์:** สามารถแก้ไขข้อมูลสมาชิกได้ตามปกติ ✅

---

**อัพเดทเมื่อ:** 20 ตุลาคม 2568  
**สถานะ:** ✅ แก้ไขเสร็จสิ้น
