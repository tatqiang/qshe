# 🔍 Debug Guide: Infinite Refresh After Login

## Problem Description
After successful login, the application refreshes repeatedly instead of staying on the dashboard.

## Debug Logging Added

### 1. Login.tsx - Track Authentication Flow
```
🔍 [DEBUG] Login useEffect triggered - Shows when Login component mounts
🔍 [DEBUG] Current URL - Shows current page URL
🔍 [DEBUG] Has auth params - Shows if URL contains OAuth parameters
🔍 [DEBUG] ===== handleLoginComplete STARTED ===== - Entry point for login processing
🔍 [DEBUG] Existing user - Shows user found in database
🔍 [DEBUG] About to redirect - Shows redirect is about to happen
🔍 [DEBUG] Redirect happening in 100ms - Small delay before redirect
🚀 REDIRECTING TO DASHBOARD (/) - Actual redirect execution
🔍 [DEBUG] Delayed check - isLoggedIn - Shows if Azure session exists after delay
🔍 [DEBUG] Has auth params - Checks for OAuth params in delayed check
🔍 [DEBUG] Calling handleLoginComplete from setTimeout - Manual trigger for existing sessions
🔍 [DEBUG] Auth params present, MSAL callback should handle this - Skips manual trigger
🔍 [DEBUG] No existing session found - No Azure session detected
```

### 2. AuthWrapper.tsx - Track Authentication Checks
```
🔍 [DEBUG] AuthWrapper useEffect triggered - Shows when auth check runs
🔍 [DEBUG] Dispatching checkAuthStatus - Triggering Redux auth check
🔍 [DEBUG] Bypassing auth check (public route) - Skipping auth for public pages
```

### 3. Dashboard.tsx - Track Component Lifecycle
```
📊 loadDashboardData called - Dashboard data loading started
✅ Dashboard data loaded successfully - Data loading completed
```

## How to Debug

### Step 1: Open Browser Console
1. Press `F12` or `Ctrl+Shift+I` (Windows) to open DevTools
2. Click the "Console" tab
3. Clear all existing logs: Click 🚫 icon or press `Ctrl+L`

### Step 2: Enable Persistent Logs
1. In Console, check the "Preserve log" checkbox
2. This keeps logs across page navigation and refreshes

### Step 3: Test Login Flow
1. Clear browser cache and localStorage:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```
2. Go to login page
3. Click "Sign in with Company Account"
4. Complete Microsoft login
5. Watch console logs carefully

### Step 4: Analyze Log Pattern

#### 🟢 HEALTHY LOGIN (No Refresh Loop):
```
🔍 [DEBUG] Login useEffect triggered - hasCheckedSession: false
🔍 [DEBUG] Current URL: http://localhost:5176/
🔄 LOGIN COMPONENT MOUNTED - Azure AD redirect handling...
🔍 [DEBUG] Has auth params: true
✅ Azure Auth redirect handled successfully
🔍 [DEBUG] ===== handleLoginComplete STARTED =====
🎉 Login redirect completed, processing user...
✅ Current Azure user retrieved
🔄 Checking if user exists...
✅ User already exists, logging in...
🔍 [DEBUG] Existing user: {id: "...", email: "...", role: "..."}
🔍 [DEBUG] About to redirect - Current URL: http://localhost:5176/
🔍 [DEBUG] Redirect happening in 100ms...
🚀 REDIRECTING TO DASHBOARD (/)

[Page navigates to dashboard - NEW PAGE LOAD]

🔍 [DEBUG] AuthWrapper useEffect triggered {shouldBypassAuth: false, pathname: "/dashboard"}
🔍 [DEBUG] Dispatching checkAuthStatus...
✅ checkAuthStatus: Restored from session manager
📊 loadDashboardData called
✅ Dashboard data loaded successfully
```

#### 🔴 INFINITE REFRESH LOOP (Problem):
```
🔍 [DEBUG] Login useEffect triggered - hasCheckedSession: false
🔍 [DEBUG] Current URL: http://localhost:5176/
🔄 LOGIN COMPONENT MOUNTED - Azure AD redirect handling...
🚀 REDIRECTING TO DASHBOARD (/)

[Page loads dashboard]

🔍 [DEBUG] AuthWrapper useEffect triggered {shouldBypassAuth: false, pathname: "/dashboard"}
🔍 [DEBUG] Dispatching checkAuthStatus...
✅ checkAuthStatus: Restored from session manager

[THEN IT REPEATS - This is the problem!]

🔍 [DEBUG] Login useEffect triggered - hasCheckedSession: false  ← SHOULD NOT HAPPEN!
🔍 [DEBUG] Current URL: http://localhost:5176/dashboard
🔄 LOGIN COMPONENT MOUNTED - Azure AD redirect handling...  ← LOGIN MOUNTING AGAIN!
```

## Root Causes to Check

### Cause 1: Login Component Mounting After Redirect
**Symptom:** Login logs appear AFTER dashboard logs
**Why:** AuthWrapper might be re-rendering Login component even though user is authenticated

**Check:**
```javascript
// In console, check authentication state
console.log('Auth state:', localStorage.getItem('session'));
console.log('Redux state:', window.__REDUX_DEVTOOLS_EXTENSION__);
```

**Fix Location:** `src/components/features/auth/AuthWrapper.tsx`
- Ensure `isAuthenticated` is true after redirect
- Check if `checkAuthStatus` is failing silently

### Cause 2: useEffect Dependency Array Causing Re-runs
**Symptom:** Same component logs appear multiple times
**Why:** useEffect dependencies are changing on every render

**Check Dashboard.tsx line 152:**
```typescript
useEffect(() => {
  loadDashboardData();
}, [filterProject]); // Should ONLY depend on filterProject
```

**Check AuthWrapper.tsx:**
```typescript
useEffect(() => {
  if (!shouldBypassAuth) {
    dispatch(checkAuthStatus());
  }
}, [dispatch, shouldBypassAuth]); // Dependencies might be unstable
```

### Cause 3: Redirect URL Causing Login to Re-mount
**Symptom:** URL keeps changing between `/` and `/dashboard`
**Why:** App.tsx has redirect from `/` to `/dashboard`, but Login mounts on `/`

**Check App.tsx line 74:**
```typescript
<Route path="/" element={<Navigate to="/dashboard" replace />} />
```

**Potential Fix:** Change Login redirect target
```typescript
// In Login.tsx, instead of:
window.location.href = '/';

// Use:
window.location.href = '/dashboard';
```

### Cause 4: sessionManager or Redux State Not Persisting
**Symptom:** User authenticated but `checkAuthStatus` returns null
**Why:** Session cleared too quickly or not saved properly

**Check in console:**
```javascript
// Check if session exists
console.log('SessionManager:', localStorage.getItem('session'));

// Check if Redux state has user
// Open Redux DevTools and look at auth.user
```

## Testing Commands

### Run Development Server
```cmd
cd c:\pwa\qshe10\qshe
npm run dev
```

### Clear All State and Test Fresh Login
```javascript
// Run in browser console
localStorage.clear();
sessionStorage.clear();
window.location.reload();
```

### Force Check Authentication State
```javascript
// Run in browser console
window.__checkAuth = () => {
  console.log('=== AUTH STATE DEBUG ===');
  console.log('localStorage session:', localStorage.getItem('session'));
  console.log('MSAL accounts:', localStorage.getItem('msal.account.keys'));
  console.log('Selected project:', localStorage.getItem('selected-project'));
  console.log('Current URL:', window.location.href);
};

window.__checkAuth();
```

### Monitor Component Mounts
```javascript
// Add to Login.tsx temporarily
console.log('🔍 [MOUNT] Login component mounted at:', new Date().toISOString());

// Add to Dashboard.tsx temporarily  
console.log('🔍 [MOUNT] Dashboard component mounted at:', new Date().toISOString());

// Add to AuthWrapper.tsx temporarily
console.log('🔍 [MOUNT] AuthWrapper component mounted at:', new Date().toISOString());
```

## Expected Timeline

### Successful Login (No Refresh Loop)
```
T+0ms:    User clicks login button
T+100ms:  Redirect to Microsoft
T+2000ms: Microsoft auth completes
T+2100ms: Redirect back to app with OAuth code
T+2200ms: Login component mounts, processes OAuth
T+2300ms: User fetched from database
T+2400ms: Redux state updated
T+2500ms: Session saved
T+2600ms: Redirect to /dashboard
T+2700ms: Dashboard mounts ONCE
T+2800ms: Dashboard loads data
T+3000ms: DONE - No more redirects
```

### Broken Flow (Refresh Loop)
```
T+0ms:    User clicks login button
T+100ms:  Redirect to Microsoft
T+2000ms: Microsoft auth completes
T+2100ms: Redirect back to app
T+2200ms: Login mounts, processes OAuth
T+2300ms: Redirect to /dashboard
T+2400ms: Dashboard mounts
T+2500ms: Login mounts AGAIN ← PROBLEM!
T+2600ms: Another redirect happens
T+2700ms: Dashboard mounts AGAIN
T+2800ms: Login mounts AGAIN ← LOOP CONTINUES!
```

## Quick Fixes to Try

### Fix 1: Add Early Return in Login useEffect
```typescript
// In Login.tsx useEffect
const handleLoginComplete = async () => {
  console.log('🔍 [DEBUG] ===== handleLoginComplete STARTED =====');
  
  // CRITICAL: Check if we're already on dashboard
  if (window.location.pathname === '/dashboard') {
    console.log('⚠️ Already on dashboard, skipping login complete');
    return;
  }
  
  // ... rest of code
};
```

### Fix 2: Change Redirect Target
```typescript
// In Login.tsx, change both redirects:
// From:
window.location.href = '/';

// To:
window.location.href = '/dashboard';
```

### Fix 3: Add Guard in AuthWrapper
```typescript
// In AuthWrapper.tsx
if (!isAuthenticated && location.pathname === '/dashboard') {
  console.log('🔍 [DEBUG] Not authenticated but on dashboard, redirecting to login');
  // Don't show Login component, let router handle it
  return null;
}
```

## Next Steps

1. **Run the app** with `npm run dev`
2. **Open browser console** with F12
3. **Enable "Preserve log"**
4. **Test login** and capture full console output
5. **Look for patterns** matching the examples above
6. **Share console logs** - Copy and paste the full console output to identify exact issue

## Report Format

When reporting the issue, please provide:

```
### Environment
- Browser: [Chrome/Edge/Firefox]
- URL: [http://localhost:5176]
- Time: [HH:MM:SS]

### Console Output
[Paste full console logs here, especially logs with 🔍 [DEBUG] prefix]

### Observations
- Does Login component mount more than once? [Yes/No]
- Does Dashboard component mount more than once? [Yes/No]
- Is there a redirect loop between / and /dashboard? [Yes/No]
- Does the URL keep changing? [Yes/No]

### localStorage State
[Paste output of: console.log('session:', localStorage.getItem('session'))]
```

---

## Advanced Debugging

### Enable React DevTools Profiler
1. Install React DevTools extension
2. Open DevTools > Components tab
3. Click ⚙️ > Enable "Highlight updates"
4. Watch which components re-render during login

### Check Network Tab
1. Open DevTools > Network tab
2. Enable "Preserve log"
3. Watch for repeated API calls to:
   - `/auth/session` 
   - `/users` endpoint
   - Microsoft Graph API

### Monitor URL Changes
```javascript
// Add to index.html or run in console
let lastUrl = window.location.href;
setInterval(() => {
  if (window.location.href !== lastUrl) {
    console.log('🔗 URL CHANGED:', {
      from: lastUrl,
      to: window.location.href,
      timestamp: new Date().toISOString()
    });
    lastUrl = window.location.href;
  }
}, 100);
```

This will help identify if there's a redirect loop!
