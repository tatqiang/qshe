# ✅ Patrol Photo Upload - User ID Fix

## Problem
When creating a new patrol record and trying to upload photos, the app showed:
```
[PATROL_PHOTO] No user ID available
```

This prevented users from uploading photos to patrol records.

## Root Cause

The `PatrolPhotoUpload` component uses `useUserId()` hook to get the current user ID:

```typescript
const userId = useUserId();

if (!userId) {
  console.error('[PATROL_PHOTO] No user ID available');
  return;
}
```

However, `useUserId()` was only checking `AppContext` for the user, which wasn't synced properly after Azure AD login. The user data was in Redux auth store but not accessible to the hook.

## Solution Implemented

### 1. Enhanced `useUserId()` Hook ✅
**File:** `src/hooks/useGlobalState.ts`

**Before:**
```typescript
export const useUserId = (): string | null => {
  const currentUser = useCurrentUser(); // Only checked AppContext
  return currentUser?.id || null;
};
```

**After:**
```typescript
export const useUserId = (): string | null => {
  // Try AppContext first (legacy support)
  const currentUser = useCurrentUser();
  
  // If not in AppContext, try Redux auth store (for Azure AD users)
  const reduxUser = useAppSelector((state) => state.auth.user);
  
  // Return first available user ID
  const userId = currentUser?.id || reduxUser?.id || null;
  
  if (!userId) {
    console.warn('[useUserId] No user ID available from AppContext or Redux');
  }
  
  return userId;
};
```

**Why This Works:**
- Checks **both** AppContext and Redux auth store
- Prioritizes AppContext for backwards compatibility
- Falls back to Redux for Azure AD authenticated users
- Provides clear warning when no user found

### 2. Fixed Azure Login to Include `userDetails` ✅
**File:** `src/components/features/auth/Login.tsx`

**Before:**
```typescript
dispatch(setAzureUser({
  id: existingUser.id,
  email: existingUser.email,
  firstName: existingUser.first_name,
  lastName: existingUser.last_name,
  role: existingUser.role,
  azureId: existingUser.azure_user_id,
  isAzureUser: true,
}));
```

**After:**
```typescript
dispatch(setAzureUser({
  id: existingUser.id,
  email: existingUser.email,
  role: existingUser.role,
  userDetails: {  // ✅ Added userDetails object
    id: existingUser.id,
    firstName: existingUser.first_name,
    lastName: existingUser.last_name,
    email: existingUser.email,
    role: existingUser.role,
    userType: existingUser.user_type,
    status: existingUser.status,
    createdAt: existingUser.created_at,
    updatedAt: existingUser.updated_at
  }
}));
```

**Why This Matters:**
- `AuthUser` type requires `userDetails` field for AppContext sync
- AppContext relies on `userDetails` to populate the user object
- Without `userDetails`, AppContext couldn't sync with Redux properly

## How It Works Now

### Flow After Azure Login:

```
1. User logs in with Azure AD
   ├─ Login.tsx: Fetches user from database
   └─ User data: { id, email, first_name, last_name, role, ... }

2. Dispatch setAzureUser with userDetails
   ├─ Redux Store: auth.user = { id, email, role, userDetails: {...} }
   └─ sessionManager: Saves session

3. AppContext syncs with Redux
   ├─ useEffect watches auth.user
   ├─ Extracts userDetails
   └─ AppContext.user = userDetails

4. Components can now access user
   ├─ useUserId() → checks AppContext (synced)
   ├─ useUserId() → checks Redux (direct)
   └─ Returns user ID from either source
```

### Photo Upload Flow:

```
1. User opens patrol form
2. Clicks "Choose Photos" or "Take Photo"
3. PatrolPhotoUpload component:
   ├─ const userId = useUserId()
   ├─ useUserId checks AppContext → ✅ Found
   ├─ OR useUserId checks Redux → ✅ Found
   └─ userId is available

4. Photos are uploaded:
   ├─ uploadPatrolPhotos(files, patrolId, userId)
   ├─ Files uploaded to Cloudflare R2
   └─ URLs saved to patrol record
```

## Files Modified

1. ✅ `src/hooks/useGlobalState.ts`
   - Imported `useAppSelector` from Redux
   - Enhanced `useUserId()` to check both AppContext and Redux
   - Added warning log when no user ID found
   - Enhanced `useRequiredUserId()` with better error logs

2. ✅ `src/components/features/auth/Login.tsx`
   - Added `userDetails` object to `setAzureUser()` call (existing user)
   - Added `userDetails` object to `setAzureUser()` call (new user registration)
   - Ensures full user data is available in Redux store

## Testing Instructions

### Test 1: Photo Upload After Fresh Login
1. Clear browser cache: `localStorage.clear()`
2. Login with Azure AD
3. Navigate to Patrol form
4. Click "Choose Photos"
5. Select a photo
6. **Expected:** Photo uploads successfully
7. **Expected:** No "[PATROL_PHOTO] No user ID available" error

### Test 2: Photo Upload After Page Reload
1. Login and reach dashboard
2. Reload page (F5)
3. Navigate to Patrol form
4. Try uploading photo
5. **Expected:** Photo uploads successfully
6. **Expected:** User ID is found from AppContext or Redux

### Test 3: Multiple Photos Upload
1. Login with Azure AD
2. Create new patrol
3. Upload 5 photos
4. **Expected:** All photos upload successfully
5. **Expected:** URLs are saved to patrol record

### Test 4: Take Photo (Camera)
1. Login with Azure AD
2. Create new patrol
3. Click "Take Photo" button
4. Take a photo with camera
5. **Expected:** Photo captures and uploads
6. **Expected:** No user ID errors

## Console Logs

### ✅ Success Pattern:
```
[PATROL_PHOTO] Component initialized: {
  patrolId: "patrol-123",
  userId: "user-abc-def",  ← User ID found!
  initialPhotos: 0,
  r2Configured: true
}
[PATROL_PHOTO] Uploading 1 files to R2
✅ [R2] Photo uploaded successfully: photo-1.jpg
```

### ❌ Old Error Pattern (Fixed):
```
[PATROL_PHOTO] Component initialized: {
  patrolId: "patrol-123",
  userId: null,  ← No user ID!
  initialPhotos: 0,
  r2Configured: true
}
[PATROL_PHOTO] No user ID available
```

### 🔍 Debug Logs:
```
[useUserId] No user ID available from AppContext or Redux  ← If still appearing
```

If you see this warning, check:
1. Is user logged in? Check Redux DevTools: `state.auth.user`
2. Does auth.user have `userDetails`?
3. Check AppContext: `window.qsheDebug.getUser()` (if debug tools enabled)

## Troubleshooting

### Issue: Still getting "No user ID available"

**Solution 1: Check Redux State**
```javascript
// In browser console:
// Open Redux DevTools or run:
console.log('Auth user:', window.__REDUX_DEVTOOLS_EXTENSION__);
```

Should show:
```javascript
{
  auth: {
    user: {
      id: "user-123",
      email: "user@th.jec.com",
      role: "member",
      userDetails: { ... }  ← This should exist!
    }
  }
}
```

**Solution 2: Check AppContext**
```javascript
// In browser console:
const appContext = document.querySelector('[data-testid="app-context"]');
console.log('App user:', appContext);
```

**Solution 3: Force Re-login**
```javascript
// Clear everything and re-login:
localStorage.clear();
sessionStorage.clear();
location.href = '/';
```

### Issue: Photos upload but user ID is from wrong source

**Check which source provided the user ID:**
```javascript
// Add to PatrolPhotoUpload.tsx temporarily:
console.log('User ID sources:', {
  fromAppContext: useCurrentUser()?.id,
  fromRedux: useAppSelector(state => state.auth.user?.id)
});
```

## Benefits

1. ✅ **Dual Source Support** - Works with both AppContext and Redux
2. ✅ **Azure AD Compatible** - Properly handles Azure authenticated users
3. ✅ **Backwards Compatible** - Still works with legacy AppContext users
4. ✅ **Better Debugging** - Clear logs show where user ID comes from
5. ✅ **Robust Fallback** - If one source fails, tries the other

## Related Components

These components also use `useUserId()` and will benefit from the fix:
- `PatrolPhotoUpload.tsx` - Patrol photo uploads
- `IssuePhotoUpload.tsx` - Issue photo uploads (if exists)
- `ProfilePhotoUpload.tsx` - Profile photo uploads (if exists)
- Any component that tracks user actions

## Next Steps

1. **Test photo upload** after Azure AD login
2. **Verify user ID** is found in console logs
3. **Check multiple photos** upload successfully
4. **Test camera feature** if used
5. **Monitor for warnings** about missing user ID

---

**Status:** ✅ Fixed  
**Testing:** 🔄 Ready for User Testing  
**Expected:** Photo uploads work after Azure AD login
