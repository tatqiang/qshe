# System Admin Menu Not Showing - Troubleshooting Guide

## Problem
User is logged in with `system_admin` role but the Administration menu section is not visible in the sidebar.

## Root Causes

### 1. Redux State Not Updated
The Redux `auth` state may not have the correct role after login.

### 2. Role Field Mismatch
Database might have role in different column or format.

### 3. Cache Issue
Browser cache or localStorage might have stale data.

## Quick Fixes

### Fix 1: Force Page Refresh
**Simplest solution - Try this first!**

```
Press Ctrl + Shift + R (Windows) or Cmd + Shift + R (Mac)
```

This clears browser cache and reloads fresh data.

### Fix 2: Clear LocalStorage and Re-login

1. Open browser console (F12)
2. Run:
```javascript
localStorage.clear();
sessionStorage.clear();
window.location.href = '/';
```
3. Log in again

### Fix 3: Check and Fix Redux State

1. Open browser console (F12)
2. Run the debug script:
```javascript
// Check current Redux state
const state = window.store?.getState();
console.log('Auth State:', state?.auth);
console.log('User Role:', state?.auth?.user?.role);
```

**Expected output:**
```javascript
{
  isAuthenticated: true,
  user: {
    id: "...",
    email: "nithat.su@th.jec.com",
    role: "system_admin",  // ✅ Must be "system_admin"
    userDetails: { ... }
  }
}
```

## Diagnostic Steps

### Step 1: Check Database
Run in Supabase SQL Editor:

```sql
SELECT 
  id,
  email,
  role,
  status,
  user_type
FROM users
WHERE email = 'nithat.su@th.jec.com';
```

**Expected:**
- `role`: `system_admin` ✅

### Step 2: Check Redux State
Open console and run:

```javascript
// Method 1: Check Redux directly
window.store.getState().auth.user.role

// Method 2: Use the debug script
// Copy and paste content from debug_system_admin_menu.js
```

### Step 3: Check Sidebar Render
In console:

```javascript
// Check what useUserRole returns
// (You'll see this in console logs when Sidebar renders)
// Look for: "Sidebar - isSystemAdmin: true/false"
```

## Common Issues & Solutions

### Issue 1: Role is 'member' instead of 'system_admin'

**Cause:** Database role not set correctly

**Fix:**
```sql
UPDATE users 
SET role = 'system_admin'
WHERE email = 'nithat.su@th.jec.com';
```

Then logout and login again.

### Issue 2: Role is correct but menu still not showing

**Cause:** Redux state stale

**Fix:**
```javascript
// In console
localStorage.clear();
window.location.reload();
```

### Issue 3: User Details Not Loading

**Cause:** checkAuthStatus not fetching user profile

**Fix:** Check network tab in DevTools for failed API calls to users table.

## Code Flow

### 1. Login Process
```
Login.tsx
  ↓
setAzureUser({ role: userFromDB.role })
  ↓
Redux authSlice.user.role = "system_admin"
```

### 2. Sidebar Render
```
Sidebar.tsx
  ↓
useUserRole()
  ↓
const isSystemAdmin = user?.role === 'system_admin'
  ↓
{isSystemAdmin && <AdminMenu />}
```

### 3. Role Check
```typescript
// In RoleGuard.tsx
export const useUserRole = () => {
  const { user } = useAppSelector((state) => state.auth);
  
  return {
    isSystemAdmin: user?.role === 'system_admin',  // Must be true
    // ...
  };
};
```

## Verification Checklist

After applying fixes, verify:

- [ ] Database: `role = 'system_admin'` in users table
- [ ] Redux: `state.auth.user.role === 'system_admin'`
- [ ] Console: `Sidebar - isSystemAdmin: true`
- [ ] UI: "Administration" section visible in sidebar
- [ ] Menu items: "System Settings", "User Management", "Roles & Permissions" visible

## Expected Sidebar Structure

```
Sidebar
├── Dashboard
├── Safety & Quality
│   ├── Safety Patrols
│   ├── Permit to Work
│   └── Quality Control
├── Projects
├── Team
└── Administration          ← Should be visible for system_admin
    ├── System Settings
    ├── User Management
    └── Roles & Permissions
```

## Manual Fix (If all else fails)

### Option 1: Force role in Redux (Temporary Debug)

Open console:
```javascript
// Get current Redux state
const store = window.store;
const state = store.getState();

// Dispatch action to update role
store.dispatch({
  type: 'auth/setAzureUser',
  payload: {
    ...state.auth.user,
    role: 'system_admin'
  }
});

// Refresh page
window.location.reload();
```

### Option 2: Update authSlice directly

Edit `src/store/authSlice.ts`, find the `setAzureUser` reducer and add console log:

```typescript
setAzureUser: (state, action) => {
  state.user = action.payload;
  state.isAuthenticated = true;
  
  // ✅ Add debug log
  console.log('🔧 setAzureUser called with role:', action.payload.role);
  console.log('🔧 Is system_admin?', action.payload.role === 'system_admin');
},
```

## Files to Check

1. ✅ `src/components/layouts/Sidebar.tsx` - Menu rendering
2. ✅ `src/components/common/RoleGuard.tsx` - useUserRole hook
3. ✅ `src/store/authSlice.ts` - Redux state management
4. ✅ Database: `users` table, `role` column

## Prevention

To prevent this issue in future:

1. **Always verify role after login:**
   ```javascript
   console.log('Logged in with role:', user.role);
   ```

2. **Add role display in UI:**
   Add a badge showing current role in navbar

3. **Test with multiple roles:**
   Create test accounts for each role to verify menu visibility

## Support

If none of these fixes work:

1. Export console logs:
   - Open DevTools → Console
   - Right-click → Save as...
   - Send logs for analysis

2. Check for JavaScript errors:
   - Look for red errors in console
   - May indicate deeper issue

3. Verify database connection:
   - Check Supabase dashboard
   - Ensure RLS policies allow reading users table

## Quick Debug Script

Run this in console to get all info:

```javascript
(function debugAuth() {
  console.log('=== AUTH DEBUG ===');
  
  // Redux
  const state = window.store?.getState();
  console.log('1. Redux Auth:', state?.auth);
  console.log('   Role:', state?.auth?.user?.role);
  console.log('   Is system_admin?', state?.auth?.user?.role === 'system_admin');
  
  // LocalStorage
  const stored = localStorage.getItem('app-user');
  if (stored) {
    const user = JSON.parse(stored);
    console.log('2. LocalStorage:', user);
    console.log('   Role:', user.role);
  }
  
  // Session
  const session = localStorage.getItem('session');
  if (session) {
    const sessionData = JSON.parse(session);
    console.log('3. Session:', sessionData);
  }
  
  console.log('=== END DEBUG ===');
})();
```

## Expected Result

After successful fix:

```
✅ Console shows: "Sidebar - isSystemAdmin: true"
✅ Sidebar shows "Administration" section
✅ Can access /admin/system, /admin/users routes
✅ Dashboard shows "Demo Features" section
```
