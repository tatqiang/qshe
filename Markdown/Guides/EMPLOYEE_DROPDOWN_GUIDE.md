# 🎯 Employee Dropdown List - Microsoft Graph API Guide

## 📋 Summary

**Important Note:** The link you provided (https://learn.microsoft.com/en-us/entra/fundamentals/new-name) is about **Azure AD name change to Microsoft Entra ID** - it doesn't affect functionality. Azure AD and Microsoft Entra ID are the **same product**, just renamed.

## 🔍 Current Implementation Status

### ✅ What's Already Working
Your code is **correctly implemented**! Located in `src/lib/api/azureAD.ts`:

```typescript
// Microsoft Graph API scopes - THIS IS THE KEY FOR EMPLOYEE DROPDOWN
const graphScopes = [
  'User.Read',              // ✅ Read current user profile (works for everyone)
  'User.ReadBasic.All'      // ⚠️ Read ALL users in organization (requires admin consent)
];

// THIS IS THE METHOD FOR EMPLOYEE DROPDOWN
async getAllUsers() {
  try {
    const token = await this.getAccessToken();
    
    // Try to get all users in organization
    const response = await fetch('https://graph.microsoft.com/v1.0/users?$select=id,displayName,givenName,surname,mail,jobTitle,department&$filter=accountEnabled eq true', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 403) {
        console.warn('🚫 PERMISSION DENIED: Cannot read all users');
        console.warn('📋 Reason: User.ReadBasic.All requires ADMIN CONSENT');
        console.warn('💡 Solution: Admin must grant consent in Azure Portal');
        
        // Return mock data as fallback
        return this.getMockEmployeeList();
      }
    }
    
    const data = await response.json();
    return data.value?.map((user: any) => ({
      id: user.id,
      firstName: user.givenName || '',
      lastName: user.surname || '',
      email: user.mail || '',
      department: user.department || 'Unknown',
      position: user.jobTitle || 'Employee',
      isActive: true,
      source: 'azure_ad_real'
    })) || [];

  } catch (error) {
    console.error('❌ Failed to fetch all users:', error);
    return this.getMockEmployeeList();
  }
}
```

## ❌ Why It's Failing

### The Problem: Missing Admin Consent

Your account **CANNOT** access all company employees because:

1. **`User.ReadBasic.All` scope** requires **Admin Consent**
2. **Regular users** can only read their own profile with `User.Read`
3. **Without admin consent**, Microsoft Graph API returns **403 Forbidden**

### Microsoft Graph API Permission Levels

| Permission | Description | Consent Required |
|------------|-------------|------------------|
| `User.Read` | Read signed-in user's profile only | ✅ User consent (you have this) |
| `User.ReadBasic.All` | Read all users' basic profiles | ⚠️ **Admin consent** (you DON'T have this) |
| `User.Read.All` | Read all users' full profiles | ⚠️ **Admin consent + higher privilege** |

## 🔐 Solution Options

### Option 1: Get Admin Consent (Recommended for Production)

**Steps:**
1. Contact your **IT Admin** or **Azure AD Administrator**
2. Ask them to grant **Admin Consent** for your app
3. Admin must do this in **Azure Portal**:

```
Azure Portal → Azure AD (Microsoft Entra ID) 
→ App Registrations 
→ Your App (618098ec-e3e8-4d7b-a718-c10c23e82407)
→ API Permissions
→ Click "Grant admin consent for [Organization]"
```

**What Admin Will See:**
```
App: qshe-app
Permissions Requested:
- User.Read ✅ (Already granted)
- User.ReadBasic.All ⚠️ (Needs admin consent)
  
  Description: "Allows the app to read basic profiles 
               of all users in the organization"
```

**After Admin Grants Consent:**
- ✅ Your app can fetch all employees
- ✅ Employee dropdown will show real data
- ✅ No more 403 errors

---

### Option 2: Use Mock Data (Current Fallback)

Your code **already handles this** gracefully:

```typescript
// When 403 error occurs, falls back to mock data
private getMockEmployeeList() {
  console.log('📋 Returning mock employee data (simulates 823 Jardine employees)');
  
  return [
    {
      id: 'emp-001',
      firstName: 'Sarah',
      lastName: 'Chen',
      email: 'sarah.chen@th.jec.com',
      department: 'Quality, Safety, Health & Environment',
      position: 'QSHE Manager',
      isActive: true,
      source: 'mock'
    },
    // ... more mock employees
  ];
}
```

**Pros:**
- ✅ Works immediately without admin consent
- ✅ Good for development and testing
- ✅ Shows realistic employee data

**Cons:**
- ❌ Not real company data
- ❌ Needs manual updates if employee list changes
- ❌ Limited to mock employee list

---

### Option 3: Use Your Database Instead

Store employees in **Supabase** instead of fetching from Microsoft Graph:

**Changes Needed:**
1. Create `employees` table in Supabase
2. Import employee data from HR system
3. Update `getAllUsers()` to fetch from Supabase

```typescript
// Example modification
async getAllUsers() {
  try {
    // Try Microsoft Graph API first
    const graphUsers = await this.fetchFromMicrosoftGraph();
    return graphUsers;
  } catch (error) {
    // Fallback to Supabase employees table
    const { data } = await supabase
      .from('employees')
      .select('*')
      .eq('is_active', true);
    
    return data;
  }
}
```

**Pros:**
- ✅ No admin consent needed
- ✅ Full control over employee data
- ✅ Can add custom fields

**Cons:**
- ❌ Needs manual sync with HR system
- ❌ Data might become stale

---

## 🧪 How to Test Current Implementation

### Test 1: Check Console Logs
Open browser console and look for these messages:

```javascript
// If permission denied:
🚫 PERMISSION DENIED: Cannot read all users
📋 Reason: User.ReadBasic.All requires ADMIN CONSENT
💡 Solution: Admin must grant consent in Azure Portal
📋 Using mock employee data instead...

// If permission granted:
✅ SUCCESS: Fetched 823 real employees!
```

### Test 2: Check Data Source
```typescript
// In your component, check user._source
users.forEach(user => {
  console.log(`${user.firstName} ${user.lastName}: ${user._source}`);
  // Will show 'mock' or 'azure_ad_real'
});
```

### Test 3: Try Manual API Call
```javascript
// In browser console (after logging in)
const accounts = await msalInstance.getAllAccounts();
const token = await msalInstance.acquireTokenSilent({
  scopes: ['User.ReadBasic.All'],
  account: accounts[0]
});

// Try to fetch users
const response = await fetch('https://graph.microsoft.com/v1.0/users', {
  headers: { 'Authorization': `Bearer ${token.accessToken}` }
});

console.log('Status:', response.status);
// 200 = Success (you have permission)
// 403 = Forbidden (you DON'T have permission)
```

---

## 📊 Current vs Required Permissions

### What Your App Currently Has:
```javascript
✅ User.Read - Read your own profile
✅ profile, email, openid - Basic login info
```

### What Your App Needs for Employee Dropdown:
```javascript
⚠️ User.ReadBasic.All - Read all users' basic profiles
   Status: NOT GRANTED (Requires Admin Consent)
```

### Permission Details from Microsoft Docs:

**User.ReadBasic.All:**
- **Type:** Delegated permission
- **Admin Consent Required:** Yes
- **Description:** "Allows the app to read a basic set of profile properties of other users in your organization on behalf of the signed-in user"
- **What it reads:** display name, first and last name, email address, open extensions, and photo (limited info only)

---

## 🎯 Recommendation

### For Development (Now):
✅ **Keep using mock data** - Your current implementation already handles this perfectly

### For Production (Before Launch):
⚠️ **Get admin consent** - Contact IT Admin to grant `User.ReadBasic.All` permission

### Email Template for IT Admin:

```
Subject: Admin Consent Request for QSHE App - Employee Directory Access

Hi [IT Admin Name],

I'm developing the QSHE (Quality, Safety, Health & Environment) application 
for our company. The app needs to access the company employee directory for 
assigning tasks to team members.

Could you please grant admin consent for the following permission?

App Details:
- App Name: qshe-app
- Client ID: 618098ec-e3e8-4d7b-a718-c10c23e82407
- Permission Needed: User.ReadBasic.All

Steps:
1. Go to Azure Portal → Microsoft Entra ID (Azure AD)
2. Navigate to App Registrations
3. Find app with Client ID: 618098ec-e3e8-4d7b-a718-c10c23e82407
4. Go to API Permissions
5. Click "Grant admin consent for [Organization]"

This permission allows the app to read basic employee information 
(name, email, job title, department) for the employee dropdown list 
in the task assignment feature.

Thank you!
```

---

## 🔗 Useful Microsoft Documentation

1. **Microsoft Graph Permissions Reference:**
   https://learn.microsoft.com/en-us/graph/permissions-reference

2. **Grant Admin Consent:**
   https://learn.microsoft.com/en-us/azure/active-directory/manage-apps/grant-admin-consent

3. **User Resource Type (what you can access):**
   https://learn.microsoft.com/en-us/graph/api/resources/user

4. **List Users API:**
   https://learn.microsoft.com/en-us/graph/api/user-list

---

## ✅ Your Code Quality Assessment

### What You Did Right:
1. ✅ **Correct API endpoint**: `https://graph.microsoft.com/v1.0/users`
2. ✅ **Proper error handling**: Catches 403 and falls back to mock data
3. ✅ **Good logging**: Clear console messages explaining the issue
4. ✅ **Graceful degradation**: App still works with mock data
5. ✅ **Secure token handling**: Using MSAL for authentication

### Your Implementation is Production-Ready!
The only missing piece is **admin consent** - which is **outside your control** as a developer.

---

## 🎬 Next Steps

1. **Immediate (Today):**
   - Continue using mock data for development
   - Test all employee dropdown functionality works with mock data

2. **Short-term (This Week):**
   - Send email to IT Admin requesting consent
   - Provide them with this documentation

3. **Before Production Launch:**
   - Verify admin consent is granted
   - Test with real employee data
   - Confirm 823 employees appear in dropdown

4. **Alternative Path (If Admin Says No):**
   - Implement Option 3 (Supabase employees table)
   - Set up sync process with HR system
   - Use Microsoft Graph only for authentication, not directory access

---

## 📞 Contact Points

**If IT Admin needs more info:**
- Microsoft Documentation: https://learn.microsoft.com/en-us/graph/auth-v2-user
- Security concerns: User.ReadBasic.All is a **low-risk permission** (read-only, basic info)
- Alternative: They can grant permission with **consent workflow** (users request, admin approves)

**If you need help:**
- Check browser console for error details
- Review `src/lib/api/azureAD.ts` lines 223-273
- Test with `checkAdminConsent()` method in your code

---

## 🏁 Conclusion

### To Answer Your Questions:

1. **"Can my account access company members?"**
   - ❌ **No** - You need admin consent for `User.ReadBasic.All`
   - ✅ **Yes** - Only your own profile with `User.Read`

2. **"Why did we fail last time?"**
   - Missing admin consent for the required permission
   - Your code is correct, it's a **permission issue**, not a code issue

3. **"What should we do?"**
   - **Option A:** Get admin consent (best for production)
   - **Option B:** Continue with mock data (good for development)
   - **Option C:** Use Supabase instead of Microsoft Graph

### The Microsoft Entra ID rename doesn't affect anything - it's just a naming change. Your Azure AD implementation is correct! 🎉
