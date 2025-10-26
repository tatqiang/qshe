# Database Service: Remove Azure AD User Fetching

## Issue
User Management page was attempting to fetch **all company users from Azure AD**, which caused:
1. ❌ 403 Forbidden error (requires admin permissions)
2. ❌ Shows "undefined undefined" for users not in Supabase database
3. ❌ Displays users who aren't actually in the QSHE system

**The system should ONLY show users from the Supabase `users` table** - the single source of truth.

## Root Cause

### Previous Implementation
`src/lib/api/database.ts` `getUsers()` method had complex logic:

```typescript
async getUsers(): Promise<DatabaseUser[]> {
  if (this.currentSource === 'azure') {
    if (azureADService.isLoggedIn()) {
      // ❌ Try to fetch ALL Azure AD users (requires admin consent)
      const azureADUsers = await azureADService.getAllUsers();
      return azureADUsers.map(...); // Shows users not in our system
    } else {
      // ❌ Use mock Azure users
      const azureUsers = await azureService.getUsers();
      return azureUsers.map(...);
    }
  } else {
    // ✅ Fetch from Supabase users table
    const { data } = await supabase.from('users').select('*');
    return data.map(...);
  }
}
```

### Problems
1. **Azure AD fetch requires `User.ReadBasic.All` permission** - Needs global admin consent
2. **Shows ALL company employees** - Not just QSHE system users
3. **No database records** - Azure AD users without Supabase records show as "undefined undefined"
4. **Wrong source of truth** - Supabase `users` table is the actual user database

## Solution

### Simplified Implementation
Removed all Azure AD and mock user logic. **Always fetch from Supabase only**:

```typescript
// Unified user fetching - ALWAYS from Supabase only
async getUsers(): Promise<DatabaseUser[]> {
  console.log('📊 Fetching users from SUPABASE ONLY');

  // ALWAYS use Supabase - this is the single source of truth
  // DO NOT fetch from Azure AD (requires admin permissions and shows users not in our system)
  try {
    console.log('🟡 Fetching from Supabase users table...');
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('🔴 Supabase error:', error);
      throw error;
    }

    console.log(`✅ Supabase users fetched: ${data?.length || 0} users`);
    
    return (data as any[] || []).map((user: any) => ({
      id: user.id,
      email: user.email,
      full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      thai_first_name: user.first_name_thai,
      thai_last_name: user.last_name_thai,
      position_title: user.position,
      phone_number: user.phone_number,
      employee_id: user.employee_id,
      department: user.department,
      authority_level: user.role,
      user_type: user.user_type,
      verification_status: user.status,
      worker_type: user.user_type === 'external' ? 'contractor' : 'internal',
      is_active: user.status === 'active',
      created_at: user.created_at,
      updated_at: user.updated_at,
      _source: 'supabase'
    }));
  } catch (error) {
    console.error('🔴 Supabase fetch failed:', error);
    throw error;
  }
}
```

## Changes Made

### File: `src/lib/api/database.ts`
**Line 73-120**: Completely rewrote `getUsers()` method

**Removed:**
- ❌ Azure AD user fetching logic
- ❌ Mock user logic
- ❌ `currentSource` branching for users
- ❌ Fallback to Supabase logic
- ❌ Complex mapping for Azure users

**Changed to:**
- ✅ Simple, direct Supabase query
- ✅ Single source of truth
- ✅ Proper error handling
- ✅ Clear logging

## Impact

### What Now Works
✅ User Management shows **only** users in Supabase `users` table
✅ No more 403 Forbidden errors from Azure AD
✅ No more "undefined undefined" names
✅ Correct user count (actual system users)
✅ All user data comes from database records
✅ No permission issues

### What Was Removed
❌ Azure AD company-wide user listing (never worked properly)
❌ Mock user data (testing artifact)
❌ Database source switching for users (unnecessary complexity)

## Azure AD Integration Clarification

### What Azure AD IS Used For (Still Works)
✅ **User Authentication** - Login with company credentials
✅ **Single Sign-On** - Seamless login experience
✅ **Profile Data Sync** - Get user info during registration

### What Azure AD Is NOT Used For (Removed)
❌ **User List** - Don't fetch all company employees
❌ **User Management** - Don't show non-system users
❌ **Directory Access** - Don't require admin permissions

### Correct Flow
```
1. User logs in with Azure AD (authentication) ✅
   └─> Gets user profile data (name, email, job title)

2. User completes registration form ✅
   └─> Creates record in Supabase users table

3. User appears in User Management ✅
   └─> Fetched from Supabase users table only
```

## Testing

### Verification Steps
1. ✅ Navigate to User Management page
2. ✅ Check console logs: "Fetching users from SUPABASE ONLY"
3. ✅ Verify no Azure AD API calls in Network tab
4. ✅ Confirm user count matches Supabase users table
5. ✅ All users show proper names (not "undefined undefined")
6. ✅ No 403 Forbidden errors

### Expected Console Output
```
📊 Fetching users from SUPABASE ONLY
🟡 Fetching from Supabase users table...
✅ Supabase users fetched: 5 users
```

### Database Verification
Run in Supabase SQL Editor:
```sql
SELECT 
  id,
  email,
  first_name,
  last_name,
  status,
  created_at
FROM users
ORDER BY created_at DESC;
```

User Management page should show **exactly these users only**.

## Database Switcher Component

### Current State
The `DatabaseSwitcher` component still exists but now:
- ✅ Shows CompanyLogin for Azure AD authentication
- ✅ Always fetches from Supabase regardless of "current source"
- ⚠️ The "Switch Database" buttons are now decorative (always uses Supabase)

### Future Consideration
The `DatabaseSwitcher` component could be:
1. **Simplified** - Remove database switching, keep just the user list
2. **Removed** - Integrate directly into UserManagement
3. **Repurposed** - Use for other admin tools

For now, it remains as-is but only serves the CompanyLogin component.

## Related Files

### Still Using Azure AD (Correctly)
- `src/lib/api/azureAD.ts` - Authentication service ✅
- `src/components/auth/CompanyLogin.tsx` - Login component ✅
- `src/components/auth/Login.tsx` - Registration with Azure profile ✅

### No Longer Using Azure AD User Fetching
- `src/lib/api/database.ts` - **FIXED** - Only Supabase now ✅
- `src/components/DatabaseSwitcher.tsx` - Still calls database.ts but gets Supabase users ✅

## Status
✅ **FIXED** - User Management now shows only Supabase users

No more Azure AD permission errors, no more "undefined undefined" users, no more confusion about which users are in the system.

## Prevention
- ✅ Single source of truth: Supabase `users` table
- ✅ Azure AD only for authentication, not user lists
- ✅ No more mock data or testing artifacts in production code
- ✅ Clear documentation of what Azure AD is/isn't used for
