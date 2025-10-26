# Member Report Approve/Reject Buttons - Role Access Control ✅

## Summary
ปุ่ม Approve และ Reject ในหน้า Member Report แสดงเฉพาะสำหรับ `system_admin` และ `admin` เท่านั้น

## Implementation Details

### Current Setup (Already Correct)

ในไฟล์ `MemberReportPage.tsx`:

```typescript
const { user, role, isAdmin } = useUserRole();

const canApprove = isAdmin; // Only system_admin and admin can approve
const isPending = member?.status === 'pending';
```

### Role Check Logic

จาก `RoleGuard.tsx`:
```typescript
export const useUserRole = () => {
  return {
    isAdmin: user?.role === 'admin' || user?.role === 'system_admin',
    // ... other properties
  };
};
```

### Button Visibility Conditions

1. **Edit Button** (ปุ่มแก้ไข - ไอคอน ✏️)
   - แสดงเมื่อ: `canApprove === true`
   - Roles: `system_admin`, `admin`

2. **Approve Button** (ปุ่มอนุมัติ - ไอคอน ✓)
   - แสดงเมื่อ: `canApprove === true && isPending === true`
   - Roles: `system_admin`, `admin`
   - Status: `pending` เท่านั้น

3. **Reject Button** (ปุ่มปฏิเสธ - ไอคอน ✗)
   - แสดงเมื่อ: `canApprove === true && isPending === true`
   - Roles: `system_admin`, `admin`
   - Status: `pending` เท่านั้น

## Code Reference

### MemberReportPage.tsx - Lines 288-319

```tsx
{/* Edit Icon - Show only for system_admin and admin */}
{canApprove && (
  <button onClick={handleEdit} className="...">
    <svg>...</svg> {/* Edit Icon */}
  </button>
)}

{/* Approve Icon - Show for admins when status is pending */}
{canApprove && isPending && (
  <button onClick={handleApprove} className="...">
    <svg>...</svg> {/* Check Icon */}
  </button>
)}

{/* Reject Icon - Show for admins when status is pending */}
{canApprove && isPending && (
  <button onClick={handleReject} className="...">
    <svg>...</svg> {/* X Icon */}
  </button>
)}
```

## Access Control Matrix

| Role | Edit | Approve | Reject | View Report |
|------|------|---------|--------|-------------|
| `system_admin` | ✅ | ✅ (if pending) | ✅ (if pending) | ✅ |
| `admin` | ✅ | ✅ (if pending) | ✅ (if pending) | ✅ |
| `member` | ❌ | ❌ | ❌ | ✅ |
| `worker` | ❌ | ❌ | ❌ | ✅ |

## Console Debug Output

เมื่อเข้าหน้า member report จะเห็น log:

```javascript
🔍 [MEMBER REPORT] Button visibility: {
  user: "user@example.com",
  role: "admin",
  isAdmin: true,
  canApprove: true,
  status: "pending",
  isPending: true,
  showApproveButtons: true,
  allowedRoles: "system_admin, admin"
}
```

## Testing Checklist

### As System Admin
- ✅ เห็นปุ่ม Edit
- ✅ เห็นปุ่ม Approve (เฉพาะ status = pending)
- ✅ เห็นปุ่ม Reject (เฉพาะ status = pending)

### As Admin
- ✅ เห็นปุ่ม Edit
- ✅ เห็นปุ่ม Approve (เฉพาะ status = pending)
- ✅ เห็นปุ่ม Reject (เฉพาะ status = pending)

### As Member
- ❌ ไม่เห็นปุ่ม Edit
- ❌ ไม่เห็นปุ่ม Approve
- ❌ ไม่เห็นปุ่ม Reject
- ✅ เห็นรายงานปกติ

### When Status is NOT Pending
- ✅ Admin เห็นปุ่ม Edit
- ❌ Admin ไม่เห็นปุ่ม Approve
- ❌ Admin ไม่เห็นปุ่ม Reject

## Files Modified
- `src/pages/public/MemberReportPage.tsx` - เพิ่ม comment ชัดเจนและ debug log

## Notes

- ระบบใช้ `useUserRole()` hook เพื่อตรวจสอบ role
- `isAdmin` จะ return `true` สำหรับทั้ง `system_admin` และ `admin`
- ปุ่ม Approve/Reject จะแสดงเฉพาะเมื่อ status = `pending` เท่านั้น
- ปุ่ม Edit แสดงทุกสถานะ (สำหรับ admin)

## Date
October 21, 2025
