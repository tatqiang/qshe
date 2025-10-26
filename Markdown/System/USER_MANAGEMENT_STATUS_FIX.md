# User Management Status Badge Fix

## Issue
The User Management page was crashing with the error:
```
TypeError: Cannot read properties of undefined (reading 'charAt')
at getStatusBadge (UserManagement.tsx:131:33)
```

## Root Cause
The `getStatusBadge` and `getUserTypeBadge` functions were calling `.charAt()` on potentially `undefined` or `null` values. This happened when users had no `verification_status` or `status` field in their data.

**Problematic code:**
```typescript
const displayStatus = status === 'invited' ? 'Pending Profile' : 
                   status === 'pending_completion' ? 'Completing Profile' : 
                     status.charAt(0).toUpperCase() + status.slice(1);
                     // ❌ Crashes if status is undefined
```

## Solution
Added null/undefined checks at the beginning of both badge functions to return a default "Unknown" badge when the value is missing.

### File: `src/components/features/users/UserManagement.tsx`

#### 1. Fixed `getStatusBadge` Function (Line ~120)
**Added:**
```typescript
const getStatusBadge = (status: string) => {
  // Handle undefined or null status
  if (!status) {
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
        Unknown
      </span>
    );
  }
  // ... rest of function
};
```

#### 2. Fixed `getUserTypeBadge` Function (Line ~148)
**Added:**
```typescript
const getUserTypeBadge = (userType: string) => {
  // Handle undefined or null userType
  if (!userType) {
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
        Unknown
      </span>
    );
  }
  // ... rest of function
};
```

#### 3. Already Safe: `getPositionBadge` Function
This function already had proper null handling:
```typescript
const getPositionBadge = (positionTitle?: string) => {
  if (!positionTitle) {
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
        No Position
      </span>
    );
  }
  // ... rest of function
};
```

## Why This Happened

### Data Source Mismatch
Users can come from two sources:
1. **Supabase Database** - Has `verification_status` field
2. **Azure AD** - May not have status field initially

**User mapping logic (Line 487):**
```typescript
const displayUser = {
  status: user.verification_status || user.status,
  // If both are undefined, status becomes undefined
};
```

### When Undefined Occurs
- Azure AD users not yet synced to database
- Users with incomplete data migration
- Database records missing the status column
- New users during registration process

## Testing

### Verification Steps
1. ✅ Navigate to User Management page
2. ✅ Page loads without crashing
3. ✅ Users without status show "Unknown" badge (gray)
4. ✅ Users with status show correct colored badges
5. ✅ No console errors about `.charAt()`

### Expected Badge Display

**When Status Exists:**
- `active` → Green "Active" badge
- `invited` → Yellow "Pending Profile" badge
- `pending_completion` → Blue "Completing Profile" badge
- `inactive` → Red "Inactive" badge
- `suspended` → Gray "Suspended" badge

**When Status is Undefined:**
- Shows gray "Unknown" badge
- No crash, page continues to work

**When User Type Exists:**
- `internal` → Blue badge
- `external` → Purple badge
- `worker` → Gray badge

**When User Type is Undefined:**
- Shows gray "Unknown" badge

## Related Issues

### Azure AD Permission Error (Secondary Issue)
The console also shows:
```
GET https://graph.microsoft.com/v1.0/users 403 (Forbidden)
🚫 PERMISSION DENIED: Cannot read all users
📋 Reason: User.ReadBasic.All requires ADMIN CONSENT
```

**This is separate from the crash fix** and relates to Azure AD permissions. The page now handles this gracefully by:
1. Catching the error
2. Falling back to Supabase database users
3. Showing available users without crashing

### Fix Priority
✅ **HIGH PRIORITY - FIXED**: Page crash on undefined status
⚠️ **LOW PRIORITY**: Azure AD permissions (doesn't block functionality)

## Prevention

### Best Practices Applied
1. ✅ Always check for null/undefined before calling string methods
2. ✅ Provide fallback UI for missing data
3. ✅ Use optional chaining where appropriate
4. ✅ Handle data from multiple sources gracefully

### Pattern for Future Badge Functions
```typescript
const getBadge = (value: string) => {
  // 1. Check for null/undefined FIRST
  if (!value) {
    return <DefaultBadge />;
  }
  
  // 2. Then process the value
  const processed = value.charAt(0).toUpperCase() + value.slice(1);
  
  return <Badge>{processed}</Badge>;
};
```

## Status
✅ **FIXED** - User Management page now loads without crashing

Both `getStatusBadge` and `getUserTypeBadge` functions now safely handle undefined/null values by showing an "Unknown" badge instead of crashing.
