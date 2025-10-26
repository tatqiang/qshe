# 🔍 Authentication Flow: First Login vs Returning Login

## Overview
This document explains the **exact differences** between first-time login and returning login to help debug infinite loading issues.

---

## 🆕 **FIRST TIME LOGIN** (New User - Never Logged In Before)

### Step-by-Step Flow:

```
1. USER CLICKS "Sign in with Company Account"
   ├─ File: src/components/features/auth/Login.tsx
   ├─ Function: handleCompanyLogin()
   ├─ Console: "🔐 Starting Jardine Engineering company login redirect..."
   └─ State: setIsLoading(true)

2. REDIRECT TO MICROSOFT
   ├─ File: src/lib/auth/azureAuthService.ts
   ├─ Function: loginWithMicrosoft()
   ├─ Action: msalInstance.loginRedirect()
   ├─ Console: "🔑 Starting Microsoft login redirect..."
   └─ URL: User redirected to login.microsoftonline.com

3. USER LOGS IN AT MICROSOFT
   ├─ External: Microsoft login page
   ├─ User enters: @th.jec.com credentials
   └─ Microsoft validates credentials

4. REDIRECT BACK TO APP
   ├─ URL: http://localhost:5176/?code=xxx&state=xxx#
   ├─ Console: "🔄 LOGIN COMPONENT MOUNTED - Azure AD redirect handling..."
   └─ URL has auth params: hash or code=

5. MSAL PROCESSES REDIRECT
   ├─ File: src/lib/auth/azureAuthService.ts
   ├─ Function: initializeMsal() → handleRedirectPromise()
   ├─ Console: "✅ Azure Auth redirect handled successfully"
   ├─ Action: Sets active account in MSAL
   └─ Triggers: onLoginComplete callback

6. LOGIN COMPLETE CALLBACK RUNS
   ├─ File: src/components/features/auth/Login.tsx
   ├─ Function: handleLoginComplete()
   ├─ Console: "🎉 Login redirect completed, processing user..."
   └─ State: setIsLoading(true) ← FIRST LOADING SPINNER

7. GET AZURE USER PROFILE
   ├─ Function: azureAuthService.getCurrentAzureUser()
   ├─ API Call: Microsoft Graph API /me
   ├─ Console: "✅ Current Azure user retrieved"
   └─ Returns: { id, email, displayName, firstName, lastName, jobTitle, department }

8. CHECK IF USER EXISTS IN SUPABASE
   ├─ Function: checkUserExists(email)
   ├─ Query: SELECT * FROM users WHERE email = ?
   ├─ Console: "🔄 Checking if user exists..."
   └─ Result: FALSE (new user) ← KEY DIFFERENCE!

9. NEW USER DETECTED - SHOW REGISTRATION MODAL
   ├─ Console: "🆕 New user detected, showing registration modal..."
   ├─ Action: setAzureUserData({ email, name, ... })
   ├─ Action: setShowRegistrationModal(true)
   ├─ Action: setIsLoading(false) ← SHOULD STOP LOADING
   └─ UI: Registration modal appears

10. USER CONFIRMS REGISTRATION
    ├─ File: src/components/common/RegistrationModal.tsx
    ├─ User clicks: "Confirm Registration"
    ├─ Function: handleRegistrationConfirm()
    └─ Console: "🔄 Confirming user registration..."

11. CREATE USER IN SUPABASE
    ├─ Function: registerUser()
    ├─ Query: INSERT INTO users (email, first_name, last_name, ...)
    ├─ Console: "✅ User registered successfully"
    └─ Returns: { id, email, first_name, last_name, role }

12. SET USER IN REDUX & REDIRECT
    ├─ Action: dispatch(setAzureUser({ ... }))
    ├─ Action: sessionManager.saveSession()
    ├─ Console: "✅ AuthSlice: Azure AD user set successfully"
    └─ Redirect: window.location.href = '/'

13. DASHBOARD LOADS
    ├─ File: src/components/features/Dashboard.tsx
    ├─ State: currentProject = null, selectedProject = null
    ├─ Check: showProjectSelection || (!currentProject && !selectedProject)
    ├─ Result: TRUE ← SHOULD SHOW PROJECT SELECTION
    └─ Component: <ProjectSelection /> renders

14. PROJECT SELECTION LOADS
    ├─ File: src/components/features/projects/ProjectSelection.tsx
    ├─ useEffect: Runs on mount
    ├─ Function: loadProjects()
    ├─ Console: "🔄 ProjectSelection: Starting to load projects..."
    └─ State: setLoading(true) ← SECOND LOADING SPINNER

15. FETCH PROJECTS FROM SUPABASE
    ├─ Function: ProjectService.getAllProjects()
    ├─ Query: SELECT * FROM projects
    ├─ Console: "📦 ProjectSelection: All projects from service: 5"
    └─ Filter: status === 'active' → 3 projects

16. DISPLAY PROJECTS
    ├─ Action: setProjects(activeProjects)
    ├─ Action: setLoading(false) ← SHOULD STOP LOADING
    ├─ Console: "✅ ProjectSelection: Loading complete"
    └─ UI: Project cards displayed
```

---

## 🔁 **RETURNING LOGIN** (Existing User - Already Registered)

### Step-by-Step Flow:

```
1. USER OPENS LOGIN PAGE
   ├─ File: src/components/features/auth/Login.tsx
   ├─ useEffect: Runs on component mount
   ├─ Console: "🔄 LOGIN COMPONENT MOUNTED - Azure AD redirect handling..."
   └─ Check: azureAuthService.isLoggedIn()

2. CHECK FOR EXISTING AZURE SESSION
   ├─ File: src/lib/auth/azureAuthService.ts
   ├─ Function: isLoggedIn() → getAllAccounts()
   ├─ Check: MSAL localStorage cache
   └─ Result: 
      - TRUE: Session exists (user logged in within last 24 hours)
      - FALSE: No session (need to login again)

3A. IF SESSION EXISTS (Skip to Step 3A)
    ├─ Console: "✅ Found existing Azure AD session: user@th.jec.com"
    ├─ Function: azureAuthService.getCurrentUser()
    ├─ Data: Retrieved from MSAL cache (no API call)
    └─ Continues to Step 7

3B. IF NO SESSION (Repeat Steps 1-6 from First Login)
    ├─ User must click login button
    ├─ Redirect to Microsoft
    └─ Returns to Step 7 after authentication

7. CHECK IF USER EXISTS IN SUPABASE
   ├─ Function: checkUserExists(email)
   ├─ Query: SELECT * FROM users WHERE email = ?
   ├─ Console: "🔄 Checking if user exists..."
   └─ Result: TRUE (existing user) ← KEY DIFFERENCE!

8. USER EXISTS - AUTO LOGIN
   ├─ Console: "✅ User already exists, logging in..."
   ├─ Action: dispatch(setAzureUser({ ... }))
   ├─ Action: sessionManager.saveSession()
   ├─ Console: "✅ AuthSlice: Azure AD user set successfully"
   └─ Redirect: window.location.href = '/' ← IMMEDIATE REDIRECT

9. DASHBOARD LOADS
   ├─ File: src/components/features/Dashboard.tsx
   ├─ Check: localStorage.getItem('selected-project')
   ├─ Result: 
      - EXISTS: selectedProject set from localStorage
      - NULL: showProjectSelection = true
   └─ Component: Shows either Dashboard or ProjectSelection

10A. IF PROJECT ALREADY SELECTED (From Last Session)
     ├─ State: selectedProject = { id, name, project_code, ... }
     ├─ Check: currentProject || selectedProject
     ├─ Result: TRUE ← Shows Dashboard directly
     └─ UI: Full dashboard with stats, no project selection

10B. IF NO PROJECT SELECTED
     ├─ State: showProjectSelection = true
     ├─ Check: showProjectSelection || (!currentProject && !selectedProject)
     ├─ Result: TRUE ← Shows ProjectSelection
     └─ Same as First Login Steps 14-16
```

---

## 🔑 **KEY DIFFERENCES**

| Aspect | First Login | Returning Login |
|--------|------------|-----------------|
| **User Check Result** | `checkUserExists()` → FALSE | `checkUserExists()` → TRUE |
| **Registration Modal** | ✅ Shows modal | ❌ Skipped |
| **Loading States** | 2 loading states:<br>1. Login processing<br>2. Project loading | 1-2 loading states:<br>1. Login (if no session)<br>2. Project loading (if no project selected) |
| **Redirect Path** | Login → Register → Dashboard → ProjectSelection | Login → Dashboard → (ProjectSelection or Dashboard view) |
| **localStorage Check** | No project in localStorage | May have project in localStorage |
| **MSAL Session** | No active session | May have active session (24hr validity) |
| **Time to Dashboard** | ~10-15 seconds (with registration) | ~3-5 seconds (auto-login) |

---

## 🐛 **COMMON INFINITE LOADING CAUSES**

### 1. **Registration Modal Not Stopping Loading**
```typescript
// ❌ WRONG: Modal shows but loading=true
setShowRegistrationModal(true);

// ✅ CORRECT: Stop loading when modal appears
setShowRegistrationModal(true);
setIsLoading(false);
```

### 2. **Dashboard useEffect Loop**
```typescript
// ❌ WRONG: Re-runs on every state change
useEffect(() => {
  loadDashboardData();
}, [currentProject, selectedProject, filterProject]);

// ✅ CORRECT: Only run on mount + filter change
useEffect(() => {
  loadDashboardData();
}, [filterProject]);
```

### 3. **ProjectSelection Re-mounting**
```typescript
// ❌ WRONG: Condition causes repeated re-renders
if (showProjectSelection || (!currentProject && !selectedProject)) {
  return <ProjectSelection />; // Re-mounts on every render
}

// ✅ CORRECT: Use React.memo or stable condition
const ProjectSelectionMemo = React.memo(ProjectSelection);
if (showProjectSelection) {
  return <ProjectSelectionMemo />;
}
```

### 4. **MSAL Retry Loop**
```typescript
// ❌ WRONG: Infinite retry without timeout
if (!recheckLoggedIn && retries < maxRetries) {
  setTimeout(checkAuthentication, checkInterval); // Forever loop
}

// ✅ CORRECT: Max retries with error state
if (!recheckLoggedIn && retries < maxRetries) {
  setTimeout(checkAuthentication, checkInterval);
} else {
  setError('Authentication timeout');
  setIsLoading(false);
}
```

---

## 🔍 **DEBUGGING CHECKLIST**

### For First Login:
- [ ] Check console for: "🆕 New user detected"
- [ ] Check console for: "setIsLoading(false)" after modal appears
- [ ] Verify registration modal is visible (not hidden by loading spinner)
- [ ] Check if `showRegistrationModal` state is true
- [ ] Verify `isLoading` state is false when modal shown

### For Returning Login:
- [ ] Check console for: "✅ User already exists, logging in..."
- [ ] Check console for: "window.location.href = '/'"
- [ ] Verify redirect happens immediately
- [ ] Check if localStorage has 'selected-project'
- [ ] Verify Dashboard mounts only once

### For Both:
- [ ] Check console for repeated "loadDashboardData called"
- [ ] Check console for repeated "ProjectSelection: Starting to load"
- [ ] Verify no infinite useEffect loops
- [ ] Check React DevTools for component re-mount count
- [ ] Monitor network tab for repeated API calls

---

## 🛠️ **DEBUG COMMANDS**

Add these to browser console while stuck in loading:

```javascript
// Check current loading states
console.log('Loading States:', {
  dashboardLoading: document.querySelector('.animate-spin'),
  modalVisible: document.querySelector('[role="dialog"]'),
  projectSelectionVisible: document.querySelector('h1:contains("Select Project")')
});

// Check Redux state
console.log('Redux Auth:', window.__REDUX_DEVTOOLS_EXTENSION__);

// Check MSAL session
console.log('MSAL Accounts:', localStorage.getItem('msal.account.keys'));

// Check selected project
console.log('Selected Project:', localStorage.getItem('selected-project'));

// Force stop loading (emergency)
document.querySelectorAll('.animate-spin').forEach(el => el.remove());
```

---

## 📊 **CONSOLE LOG PATTERNS**

### Healthy First Login:
```
🔐 Starting Jardine Engineering company login redirect...
🔑 Starting Microsoft login redirect...
[Microsoft login page]
🔄 LOGIN COMPONENT MOUNTED - Azure AD redirect handling...
✅ Azure Auth redirect handled successfully
🎉 Login redirect completed, processing user...
✅ Current Azure user retrieved
🔄 Checking if user exists...
🆕 New user detected, showing registration modal...
[User fills registration modal]
🔄 Confirming user registration...
✅ User registered successfully
✅ AuthSlice: Azure AD user set successfully
📊 loadDashboardData called
🔄 ProjectSelection: Starting to load projects...
✅ ProjectSelection: Loading complete
```

### Healthy Returning Login:
```
🔄 LOGIN COMPONENT MOUNTED - Azure AD redirect handling...
✅ Found existing Azure AD session: user@th.jec.com
🔄 Checking if user exists...
✅ User already exists, logging in...
✅ AuthSlice: Azure AD user set successfully
[Redirect to dashboard]
📊 loadDashboardData called
🔄 ProjectSelection: Starting to load projects...
✅ ProjectSelection: Loading complete
```

### Infinite Loading (Bad):
```
📊 loadDashboardData called
🔄 ProjectSelection: Starting to load projects...
📊 loadDashboardData called  ← REPEATED!
🔄 ProjectSelection: Starting to load projects...  ← REPEATED!
📊 loadDashboardData called  ← LOOP!
🔄 ProjectSelection: Starting to load projects...  ← LOOP!
[Never stops...]
```

---

## 💡 **NEXT DEBUGGING STEPS**

1. **Open browser console**
2. **Clear localStorage**: `localStorage.clear()`
3. **Hard refresh**: Ctrl+Shift+R
4. **Login and watch console logs**
5. **Compare logs to patterns above**
6. **Identify where flow deviates**

If you share console logs, I can pinpoint exactly where the flow breaks! 🔍
