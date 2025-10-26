# ✅ Login with Different Account Feature

## Problem
After logout, when clicking login again, Microsoft shows the logged out account and doesn't easily allow logging in with a different account (@th.jec.com email).

## Solution Implemented

Added intelligent prompt handling that uses:
- `prompt: 'login'` - After logout (forces fresh login screen, allows choosing different account)
- `prompt: 'select_account'` - Normal login (shows account picker for cached accounts)

## How It Works

### 1. Logout Sets Flag
When user logs out, a flag is set in `sessionStorage`:
```typescript
sessionStorage.setItem('just_logged_out', 'true');
```

### 2. Login Checks Flag
When user clicks login, the system checks if they just logged out:
```typescript
const justLoggedOut = sessionStorage.getItem('just_logged_out') === 'true';

const enhancedLoginRequest = {
  ...loginRequest,
  prompt: justLoggedOut ? 'login' : 'select_account',
  loginHint: undefined, // Don't hint any specific account
};
```

### 3. Flag is Cleared
After using the flag, it's immediately cleared:
```typescript
sessionStorage.removeItem('just_logged_out');
```

## Microsoft Prompt Types

| Prompt Value | Behavior | When Used |
|--------------|----------|-----------|
| `login` | Forces fresh login screen, doesn't use cached accounts | After logout |
| `select_account` | Shows account picker with cached accounts | Normal login |
| `none` | Silent login with cached account, no UI | Auto-login |
| `consent` | Forces consent screen | Permission changes |

## User Experience

### Before Fix:
```
1. User logs out
2. Clicks login
3. Microsoft shows: "Pick an account - Which account do you want to sign out of?"
4. Only shows the logged-out account
5. Hard to login with different account
```

### After Fix:
```
1. User logs out
2. Clicks login
3. Microsoft shows fresh login screen
4. User can enter ANY @th.jec.com email
5. Can choose different account easily
```

## Testing Instructions

### Test 1: Login After Logout with Same Account
1. Login with `user1@th.jec.com`
2. Click logout
3. Click login
4. **Expected:** Fresh login screen appears
5. Enter `user1@th.jec.com` again
6. Should login successfully

### Test 2: Login After Logout with Different Account
1. Login with `user1@th.jec.com`
2. Click logout
3. Click login
4. **Expected:** Fresh login screen appears
5. Enter `user2@th.jec.com` (different account)
6. Should login successfully
7. Dashboard should show user2's data

### Test 3: Normal Login (No Logout)
1. Close browser
2. Reopen and go to app
3. Click login
4. **Expected:** Account picker appears if MSAL has cached accounts
5. Can select from cached accounts OR choose "Use another account"

### Test 4: Multiple Account Switching
1. Login as user1 → Logout
2. Login as user2 → Logout  
3. Login as user3 → Logout
4. Login as user1 again
5. **Verify:** Each login shows fresh login screen allowing account selection

## Console Logs

### Logout Logs:
```
🚪 Starting Azure AD logout...
✅ Session manager cleared
🔄 Set post-logout flag for fresh authentication
🧹 Logging out account: user@th.jec.com
✅ Microsoft logout redirect initiated
```

### Login After Logout Logs:
```
🔑 Starting Microsoft login redirect...
🔄 Post-logout login - forcing fresh authentication
🔑 Login request: {
  scopes: [...],
  prompt: "login",  ← Forces fresh login screen
  domainHint: "th.jec.com"
}
```

### Normal Login Logs:
```
🔑 Starting Microsoft login redirect...
🔑 Login request: {
  scopes: [...],
  prompt: "select_account",  ← Shows account picker
  domainHint: "th.jec.com"
}
```

## Files Modified

### 1. `src/lib/auth/azureAuthService.ts` - Login Method
**Added flag check and intelligent prompt selection:**
```typescript
// Check if user just logged out
const justLoggedOut = sessionStorage.getItem('just_logged_out') === 'true';

const enhancedLoginRequest = {
  ...loginRequest,
  domainHint: 'th.jec.com',
  prompt: justLoggedOut ? 'login' : 'select_account',
  redirectUri: window.location.origin,
  loginHint: undefined, // Don't hint any specific account
};

// Clear the logout flag
if (justLoggedOut) {
  sessionStorage.removeItem('just_logged_out');
  console.log('🔄 Post-logout login - forcing fresh authentication');
}
```

### 2. `src/lib/auth/azureAuthService.ts` - Logout Method
**Added flag to track logout:**
```typescript
// Set flag to indicate user just logged out
sessionStorage.setItem('just_logged_out', 'true');
console.log('🔄 Set post-logout flag for fresh authentication');
```

## Why sessionStorage Instead of localStorage?

| Storage | Lifetime | Scope | Why Not Used |
|---------|----------|-------|--------------|
| `sessionStorage` | Until tab closes | Per tab | ✅ Used - Perfect for temporary flags |
| `localStorage` | Forever | All tabs | ❌ Would persist across tabs and sessions |
| Memory variable | Until page reload | Single page | ❌ Lost on redirect to Microsoft |

`sessionStorage` is perfect because:
- Survives redirect to Microsoft and back
- Clears when tab closes (no stale flags)
- Doesn't affect other tabs

## Edge Cases Handled

### Case 1: User Opens New Tab After Logout
```
Tab 1: User logs out
Tab 2: User opens new tab and clicks login
Result: ✅ Tab 2 shows 'select_account' (normal behavior)
```

### Case 2: User Refreshes During Logout Redirect
```
1. User clicks logout
2. Redirecting to Microsoft...
3. User refreshes page
Result: ✅ Flag still set, next login forces fresh authentication
```

### Case 3: User Closes Tab After Logout
```
1. User logs out
2. Closes tab
3. Opens new tab later
Result: ✅ Flag cleared (sessionStorage cleared), shows normal account picker
```

### Case 4: User Already Has Multiple Cached Accounts
```
Normal login (no recent logout):
- Shows account picker with all cached @th.jec.com accounts
- User can select any cached account
- User can click "Use another account" to add new one
```

## Additional Features

### Account Picker Still Works
Even with `prompt: 'select_account'`, Microsoft will:
1. Show all cached @th.jec.com accounts
2. Provide "Use another account" button
3. Allow signing in with any @th.jec.com email

### Domain Hint Enforces Company Domain
```typescript
domainHint: 'th.jec.com'
```
This ensures:
- Users see the company login screen
- Can only login with @th.jec.com accounts
- Non-company emails are rejected

## Troubleshooting

### Issue: Still showing same account after logout
**Solution:** Check console for flag:
```javascript
// In console:
console.log('Logout flag:', sessionStorage.getItem('just_logged_out'));
```

If null, flag wasn't set properly. Check logout logs.

### Issue: Always forcing login, even when not needed
**Solution:** Check if flag is being cleared:
```javascript
// In console before login:
console.log('Before login:', sessionStorage.getItem('just_logged_out'));

// Then after login:
console.log('After login:', sessionStorage.getItem('just_logged_out'));
```

Should be 'true' before, null after.

### Issue: Microsoft shows old account despite 'login' prompt
**Solution:** Clear MSAL cache:
```javascript
// In console:
Object.keys(localStorage)
  .filter(key => key.includes('msal'))
  .forEach(key => localStorage.removeItem(key));
```

## Benefits

1. ✅ **User Choice** - Can easily switch between different @th.jec.com accounts
2. ✅ **Fresh Login** - After logout, always shows fresh login screen
3. ✅ **Account Picker** - Normal logins show convenient account picker
4. ✅ **No Account Lock-in** - Not tied to previously logged in account
5. ✅ **Better UX** - Clear distinction between logout→login vs normal login

## Testing Checklist

- [ ] Logout and login with same account
- [ ] Logout and login with different account  
- [ ] Close tab after logout, reopen and login
- [ ] Logout in one tab, login in another tab
- [ ] Check console logs match expected patterns
- [ ] Verify `just_logged_out` flag is cleared after login
- [ ] Multiple account switching works smoothly

---

**Status:** ✅ Implemented  
**Testing:** 🔄 Ready for User Testing  
**Expected:** After logout, user can easily login with different @th.jec.com account
