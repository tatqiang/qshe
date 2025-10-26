# ✅ Logout & Re-login Fix Summary

## Problem
After successful logout, user cannot login again. Console shows:
```
⏸️ User already logged in, skipping redirect
⚠️ Login redirect may have failed - page should have redirected
```

## Root Cause Analysis

### Issue 1: MSAL Cache Not Cleared on Logout
- `logoutUser()` Redux action only cleared `sessionManager` and Supabase
- Did NOT call Azure AD `azureAuthService.logout()`
- MSAL kept the account cached in `localStorage`
- When trying to login again, `isLoggedIn()` returned `true` from cached account

### Issue 2: Login Guard Too Aggressive
- `loginWithMicrosoft()` checked `isLoggedIn()` and returned early
- This prevented login redirect even after logout
- Didn't distinguish between "valid session" vs "stale MSAL cache"

## Fixes Implemented

### Fix 1: Add Azure AD Logout to Redux Action ✅
**File:** `src/store/authSlice.ts`

**Added Azure AD logout to `logoutUser` thunk:**
```typescript
// 1. Logout from Azure AD (if using Azure authentication)
try {
  const { azureAuthService } = await import('../lib/auth/azureAuthService');
  if (azureAuthService.isLoggedIn()) {
    console.log('🚪 Logging out from Azure AD...');
    await azureAuthService.logout();
    console.log('✅ Azure AD logout initiated');
  }
} catch (azureError) {
  console.warn('⚠️ Azure AD logout failed (non-critical):', azureError);
}
```

**Why This Helps:**
- Now logout properly calls Azure AD logout
- MSAL will redirect to Microsoft to clear their session
- Returns to app with clean state

### Fix 2: Enhanced Logout Method ✅
**File:** `src/lib/auth/azureAuthService.ts`

**Improved `logout()` method:**
```typescript
async logout(): Promise<void> {
  try {
    console.log('🚪 Starting Azure AD logout...');
    
    const account = this.msalInstance.getActiveAccount();
    
    // Clear session manager first
    sessionManager.clearSession();
    console.log('✅ Session manager cleared');
    
    // Clear graph client
    this.graphClient = null;
    
    if (account) {
      console.log('🧹 Logging out account:', account.username);
      await this.msalInstance.logoutRedirect(logoutRequest);
      console.log('✅ Microsoft logout redirect initiated');
    } else {
      // Even if no active account, clear all accounts from cache
      const allAccounts = this.msalInstance.getAllAccounts();
      if (allAccounts.length > 0) {
        console.log(`🧹 Found ${allAccounts.length} cached accounts, removing...`);
        await this.msalInstance.logoutRedirect({
          postLogoutRedirectUri: msalConfig.auth.postLogoutRedirectUri
        });
      }
    }
  } catch (error) {
    console.error('❌ Logout failed:', error);
    // Clear session even if logout fails
    sessionManager.clearSession();
    this.graphClient = null;
    throw error;
  }
}
```

**Why This Helps:**
- Explicitly clears `sessionManager`
- Handles case where no active account but cached accounts exist
- Ensures cleanup even if logout fails

### Fix 3: Smarter Login Guard ✅
**File:** `src/lib/auth/azureAuthService.ts`

**Changed login check logic:**
```typescript
async loginWithMicrosoft(): Promise<void> {
  try {
    console.log('🔑 Starting Microsoft login redirect...');
    
    // Check if already logged in AND have a valid session
    const hasValidSession = this.isLoggedIn() && sessionManager.restoreSession();
    
    if (hasValidSession) {
      console.log('⏸️ User already logged in with valid session, skipping redirect');
      return;
    }
    
    // If we have an account but no valid session (e.g., after logout), clear it
    if (this.isLoggedIn() && !sessionManager.restoreSession()) {
      console.log('🧹 Found stale MSAL account without valid session, clearing...');
      const account = this.msalInstance.getActiveAccount();
      if (account) {
        await this.msalInstance.logout({ account });
      }
    }
    
    // ... continue with login redirect
  }
}
```

**Why This Helps:**
- Distinguishes between "valid session" and "stale MSAL cache"
- Only skips redirect if BOTH MSAL account AND session exist
- Clears stale MSAL account if session doesn't exist
- Allows login after logout

### Fix 4: Added sessionManager Import ✅
**File:** `src/lib/auth/azureAuthService.ts`

**Added import:**
```typescript
import { sessionManager } from './sessionManager';
```

**Why This Helps:**
- Allows checking session validity in login guard
- Enables clearing session from logout method

## Expected Flow After Fix

### Logout Flow:
```
1. User clicks logout button
   └─ Calls: dispatch(logoutUser())

2. Redux logoutUser thunk runs
   ├─ Clears sessionManager
   ├─ Calls azureAuthService.logout()
   │  ├─ Clears sessionManager again (safety)
   │  ├─ Clears graphClient
   │  └─ Calls msalInstance.logoutRedirect()
   ├─ Clears Supabase session
   └─ Returns success

3. MSAL redirects to Microsoft logout
   └─ URL: https://login.microsoftonline.com/logout

4. Microsoft clears their session
   └─ Redirects back to: http://localhost:5176

5. App loads with clean state
   ├─ No MSAL accounts cached
   ├─ No sessionManager data
   ├─ No Supabase session
   └─ Shows login page
```

### Re-login Flow:
```
1. User clicks login button
   └─ Calls: azureAuthService.loginWithMicrosoft()

2. Login guard checks
   ├─ isLoggedIn() = false (MSAL cache cleared)
   ├─ sessionManager.restoreSession() = null
   └─ hasValidSession = false ✅ Continue!

3. MSAL redirect to Microsoft
   └─ URL: https://login.microsoftonline.com/...

4. User logs in at Microsoft
   └─ Microsoft validates credentials

5. Redirects back to app
   └─ URL: http://localhost:5176/?code=...

6. MSAL processes redirect
   ├─ Creates new account
   ├─ Saves to cache
   └─ Triggers login callback

7. Login complete
   ├─ Fetches user from database
   ├─ Updates Redux state
   ├─ Saves session
   └─ Redirects to dashboard
```

## Testing Instructions

### Test 1: Logout
1. Login successfully and reach dashboard
2. Click logout button (user menu)
3. Watch console for logs:
   ```
   🧹 Session manager cleared
   🚪 Logging out from Azure AD...
   🚪 Starting Azure AD logout...
   🧹 Logging out account: user@th.jec.com
   ✅ Microsoft logout redirect initiated
   ```
4. Page should redirect to Microsoft logout
5. Then redirect back to login page
6. **Verify:** Login button is visible and clickable

### Test 2: Re-login After Logout
1. After logout (from Test 1), you should be on login page
2. Click "Sign in with Company Account"
3. Watch console for logs:
   ```
   🔑 Starting Microsoft login redirect...
   🔑 Login request: {...}
   ```
4. **Should NOT see:** "⏸️ User already logged in, skipping redirect"
5. Page should redirect to Microsoft login
6. Complete login
7. Should redirect to dashboard successfully

### Test 3: Check Session Clearing
1. After logout, open browser console
2. Run these commands:
   ```javascript
   // Should be null or empty
   console.log('Session:', localStorage.getItem('session'));
   
   // Should be null or empty
   console.log('MSAL keys:', localStorage.getItem('msal.account.keys'));
   
   // Should be empty array or null
   console.log('Selected project:', localStorage.getItem('selected-project'));
   ```
3. **Verify:** All should be cleared

### Test 4: Multiple Logout/Login Cycles
1. Login → Logout → Login → Logout → Login
2. Repeat 3 times
3. **Verify:** Each cycle works without errors
4. **Verify:** No "already logged in" messages after logout

## Console Log Patterns

### ✅ Good Logout Pattern:
```
🧹 Session manager cleared
🚪 Logging out from Azure AD...
🚪 Starting Azure AD logout...
✅ Session manager cleared
🧹 Logging out account: user@th.jec.com
✅ Microsoft logout redirect initiated
✅ Azure AD logout initiated
✅ Supabase session cleared
```

### ✅ Good Re-login Pattern:
```
🔑 Starting Microsoft login redirect...
🔑 Login request: {scopes: Array(1), domainHint: "th.jec.com", ...}
[Redirects to Microsoft]
[Microsoft login page]
[Redirects back]
🔄 LOGIN COMPONENT MOUNTED - Azure AD redirect handling...
✅ Azure Auth redirect handled successfully
🔍 [DEBUG] ===== handleLoginComplete STARTED =====
✅ User already exists, logging in...
🚀 REDIRECTING TO DASHBOARD (/dashboard)
```

### ❌ Bad Pattern (Still Broken):
```
🔑 Starting Microsoft login redirect...
⏸️ User already logged in, skipping redirect  ← PROBLEM!
⚠️ Login redirect may have failed - page should have redirected
```

If you still see this, it means:
- MSAL cache wasn't properly cleared
- Try running: `localStorage.clear()` in console

## Troubleshooting

### Issue: Still can't login after logout
**Solution 1: Clear Browser Cache**
```javascript
// In console:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

**Solution 2: Check MSAL Cache**
```javascript
// In console - check what's cached:
Object.keys(localStorage)
  .filter(key => key.includes('msal'))
  .forEach(key => console.log(key, localStorage.getItem(key)));

// Clear MSAL cache manually:
Object.keys(localStorage)
  .filter(key => key.includes('msal'))
  .forEach(key => localStorage.removeItem(key));
```

**Solution 3: Hard Logout**
```javascript
// Force complete logout:
localStorage.clear();
sessionStorage.clear();
indexedDB.deleteDatabase('msal.cache');
location.href = '/';
```

### Issue: Logout button doesn't work
**Check:** Is logout button calling the right action?
```javascript
// In MainLayout.tsx, should be:
const handleLogout = () => {
  dispatch(logoutUser());
};
```

### Issue: Redirects to Microsoft but stays logged in
**Check:** Post-logout redirect URI
- Should match Azure AD app registration
- Default: `http://localhost:5173` or `http://localhost:5176`
- Check `.env` file for correct port

## Files Modified

1. ✅ `src/store/authSlice.ts`
   - Added Azure AD logout to `logoutUser` thunk
   - Imports `azureAuthService` dynamically
   - Calls `azureAuthService.logout()` before Supabase logout

2. ✅ `src/lib/auth/azureAuthService.ts`
   - Imported `sessionManager`
   - Enhanced `logout()` method with better cleanup
   - Smarter `loginWithMicrosoft()` guard that checks session validity
   - Clears stale MSAL accounts when session doesn't exist

## Next Steps

1. **Test logout** - Click logout button and verify redirect
2. **Test re-login** - After logout, login again successfully
3. **Verify logs** - Check console matches expected patterns
4. **Report results** - Share console output if issues persist

## Rollback Instructions

If these changes cause issues:

```cmd
cd c:\pwa\qshe10\qshe
git diff src/store/authSlice.ts
git diff src/lib/auth/azureAuthService.ts

# To revert:
git checkout src/store/authSlice.ts
git checkout src/lib/auth/azureAuthService.ts
```

---

**Status:** ✅ Implementation Complete  
**Testing:** 🔄 Ready for User Testing  
**Expected Result:** User can logout and login multiple times successfully
