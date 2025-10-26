# 🚀 Quick Debug Commands

## Open in Browser Console (F12)

### 1. Clear All State (Start Fresh)
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### 2. Check Current Auth State
```javascript
console.log('=== AUTH STATE ===');
console.log('Session:', localStorage.getItem('session'));
console.log('MSAL:', localStorage.getItem('msal.account.keys'));
console.log('Authenticated:', !!localStorage.getItem('session'));
```

### 3. Monitor URL Changes (Track Redirects)
```javascript
let lastUrl = location.href;
const urlMonitor = setInterval(() => {
  if (location.href !== lastUrl) {
    console.log('🔗 URL CHANGED:', {
      from: lastUrl,
      to: location.href,
      time: new Date().toISOString()
    });
    lastUrl = location.href;
  }
}, 100);

// Stop monitoring:
clearInterval(urlMonitor);
```

### 4. Check Component Mount Count
```javascript
// Run this BEFORE logging in, then watch during login:
window.__mountCounts = { login: 0, dashboard: 0 };

// Check counts:
console.log('Mount counts:', window.__mountCounts);
```

### 5. Force Check Auth Status
```javascript
// Check Redux state (if Redux DevTools installed):
window.__REDUX_DEVTOOLS_EXTENSION__?.();
```

### 6. Debug Session Manager
```javascript
console.log('=== SESSION DEBUG ===');
const session = localStorage.getItem('session');
if (session) {
  try {
    const parsed = JSON.parse(session);
    console.log('User:', parsed.user?.email);
    console.log('Token exists:', !!parsed.token);
    console.log('Expires:', new Date(parsed.expiresAt).toLocaleString());
  } catch (e) {
    console.error('Invalid session JSON:', e);
  }
} else {
  console.log('No session found');
}
```

## What to Look For

### ✅ Good Pattern (Success)
```
🔄 LOGIN COMPONENT MOUNTED
🔍 [DEBUG] Login useEffect triggered - hasCheckedSession: false
✅ Azure Auth redirect handled successfully
🔍 [DEBUG] ===== handleLoginComplete STARTED =====
✅ User already exists, logging in...
🚀 REDIRECTING TO DASHBOARD (/dashboard)

[Dashboard loads]

📊 loadDashboardData called
✅ Dashboard data loaded successfully

[STOPS - No more logs]
```

### ❌ Bad Pattern (Infinite Loop)
```
🔄 LOGIN COMPONENT MOUNTED
🚀 REDIRECTING TO DASHBOARD (/dashboard)
[Dashboard loads]
🔄 LOGIN COMPONENT MOUNTED  ← PROBLEM!
🚀 REDIRECTING TO DASHBOARD (/dashboard)  ← LOOP!
[Repeats forever...]
```

### Key Indicators of Loop:
1. "🔄 LOGIN COMPONENT MOUNTED" appears more than once
2. "🚀 REDIRECTING TO DASHBOARD" appears more than once
3. Dashboard logs appear, then Login logs appear again
4. URL keeps changing in Network tab

## Testing Checklist

- [ ] Clear localStorage and sessionStorage
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Enable "Preserve log" in Console
- [ ] Click login button
- [ ] Complete Microsoft auth
- [ ] Watch for single redirect to dashboard
- [ ] Verify dashboard loads once
- [ ] Check no more Login logs appear
- [ ] Reload page - should auto-login without loop

## Common Issues

### Issue 1: "Login component mounted" appears twice
**Cause:** Component re-mounting after redirect  
**Check:** Look for URL changing between / and /dashboard  
**Fix Applied:** Direct redirect to /dashboard (skip /)

### Issue 2: Dashboard loads but then Login appears again
**Cause:** Auth state not persisting  
**Check:** `localStorage.getItem('session')` should not be null  
**Fix Applied:** Added 100ms delay before redirect to save state

### Issue 3: Endless redirect loop
**Cause:** handleLoginComplete running on dashboard route  
**Check:** Look for dashboard pathname in logs  
**Fix Applied:** Guard prevents execution if pathname includes '/dashboard'

## Report Format

When sharing console output, include:

```
### Environment
Browser: [Chrome/Edge/Firefox + version]
URL when started: [http://localhost:5176]
Time: [HH:MM:SS]

### Full Console Output
[Paste everything from console, especially 🔍 [DEBUG] lines]

### Observed Behavior
- Login button clicked: [Yes/No]
- Microsoft auth completed: [Yes/No]
- Dashboard loaded: [Yes/No]
- Page refreshed after: [Yes/No/Multiple times]
- How many times did you see "LOGIN COMPONENT MOUNTED": [number]

### localStorage State After Redirect
Session: [paste output of: localStorage.getItem('session')]
MSAL: [paste output of: localStorage.getItem('msal.account.keys')]
```

## Emergency Reset

If you get stuck in an infinite loop:

```javascript
// Run in console to force stop:
localStorage.clear();
sessionStorage.clear();
window.location.href = '/';
```

Then close and reopen the tab.
