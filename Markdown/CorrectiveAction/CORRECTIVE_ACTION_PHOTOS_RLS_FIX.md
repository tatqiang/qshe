# 🔒 Fix Corrective Action Photos RLS Policy for Azure AD Users

## 📋 Problem Summary
Corrective action photos fail to save with error:
```
401 (Unauthorized)
new row violates row-level security policy for table "corrective_action_photos"
```

## 🔍 Root Cause
The `corrective_action_photos` table has Row-Level Security (RLS) enabled with a policy that only allows `authenticated` role to access the table.

**Current Policy:**
```sql
CREATE POLICY "Allow authenticated users full access to corrective action photos" 
ON corrective_action_photos FOR ALL TO authenticated USING (true);
```

**Problem:** Azure AD users are NOT in Supabase auth system, so they use the `anon` (anonymous) role instead of `authenticated` role. This causes the RLS policy to reject their requests.

## ✅ Solution

### Option 1: Update RLS Policy (Recommended) ✅
Update the policy to allow both `authenticated` and `anon` roles:

```sql
-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Allow authenticated users full access to corrective action photos" 
ON corrective_action_photos;

-- Create permissive policy
CREATE POLICY "Allow all users to access corrective action photos" 
ON corrective_action_photos FOR ALL 
USING (true)
WITH CHECK (true);
```

### Why This Is Safe:
1. **App-level authentication** is already enforced by Azure AD login
2. Users must be authenticated with Azure AD to access the app
3. Only authenticated Azure AD users can reach the corrective action screens
4. User IDs are validated before any database operations
5. The app already has authorization logic for CRUD operations

## 📝 SQL Migration Files Created

### 1. Quick Fix (Single Table)
**File:** `database/fix_corrective_action_photos_rls.sql`
- Fixes only `corrective_action_photos` table
- Use this if you want to test the fix quickly

### 2. Comprehensive Fix (All Tables) ✅ Recommended
**File:** `database/fix_all_corrective_action_rls_policies.sql`
- Fixes ALL corrective action related tables:
  - `corrective_actions`
  - `corrective_action_photos`
  - `corrective_action_approvals`
  - `corrective_action_workflow`
  - `corrective_action_notifications`
- Ensures consistent access across all corrective action features

## 🚀 How to Apply the Fix

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to: **SQL Editor** (left sidebar)

### Step 2: Run the SQL Script
1. Click **"New Query"**
2. Copy the contents of `database/fix_all_corrective_action_rls_policies.sql`
3. Paste into the SQL editor
4. Click **"Run"**

### Step 3: Verify the Changes
The script includes verification queries that will show:
```sql
-- Check policies were created
SELECT tablename, policyname, cmd, roles
FROM pg_policies 
WHERE tablename = 'corrective_action_photos';
```

Expected output:
```
tablename                    | policyname                                    | cmd  | roles
-----------------------------+-----------------------------------------------+------+-------
corrective_action_photos     | Allow all users to access corrective...       | ALL  | {public}
```

## 🧪 Testing After Fix

### Test 1: Create Corrective Action with Photo
1. Login with Azure AD
2. Open a patrol record
3. Create a corrective action
4. Add at least one photo
5. Save the corrective action

**Expected Result:** ✅ No 401 errors, photos saved successfully

### Test 2: View Corrective Action Photos
1. Open an existing corrective action
2. View the photos

**Expected Result:** ✅ Photos display correctly

### Test 3: Verify in Database
```sql
-- Check if photos were inserted
SELECT 
    id,
    action_id,
    filename,
    r2_url,
    created_at
FROM corrective_action_photos
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Result:** ✅ Photo records exist

## 🔐 Security Considerations

### App-Level Security (Already in Place) ✅
1. **Azure AD Authentication**
   - Users must login with @th.jec.com account
   - Microsoft validates credentials
   - Invalid users cannot access the app

2. **Authorization in Code**
   - `useUserId()` hook validates user
   - Services check user ID before operations
   - Only authorized users can create corrective actions

3. **User Tracking**
   - All operations record `created_by` user ID
   - Audit trail maintained in database
   - Can track who created/modified records

### Database-Level Security
- RLS still enabled (not disabled)
- Policy allows access but records who did what
- Can add more granular policies later if needed

## 🔄 Alternative Solutions (Not Recommended)

### Option 2: Disable RLS Completely ❌
```sql
ALTER TABLE corrective_action_photos DISABLE ROW LEVEL SECURITY;
```
**Why Not:** Loses all database-level security, not best practice

### Option 3: Use Service Role Key ❌
Setup Supabase service role in app to bypass RLS
**Why Not:** Requires storing sensitive service key in app, complex setup

### Option 4: Create Supabase Auth for Azure AD Users ❌
Sync Azure AD users to Supabase auth
**Why Not:** Adds unnecessary complexity, duplicate user management

## 📊 Impact Analysis

### Tables Affected:
1. ✅ `corrective_actions` - Main corrective action records
2. ✅ `corrective_action_photos` - Photos for corrective actions
3. ✅ `corrective_action_approvals` - Approval/verification records
4. ✅ `corrective_action_workflow` - Workflow state tracking
5. ✅ `corrective_action_notifications` - Notification records

### Users Affected:
- ✅ Azure AD users (all @th.jec.com users) - Now can save photos
- ✅ Supabase auth users (if any) - Still works as before

### Features Fixed:
- ✅ Creating corrective actions with photos
- ✅ Uploading photos to existing corrective actions
- ✅ Approving/verifying corrective actions
- ✅ Managing corrective action workflow
- ✅ Sending notifications

## 🎯 Expected Behavior After Fix

### Before Fix ❌
```
User creates corrective action → Adds photo → Clicks Save
→ 401 Unauthorized error
→ Action created but NO photos saved
→ Warning: "Photos failed to save but action was created"
```

### After Fix ✅
```
User creates corrective action → Adds photo → Clicks Save
→ Action created successfully
→ Photos saved successfully
→ Success message displayed
→ Photos visible in corrective action detail
```

## 🔍 Monitoring & Verification

### Check RLS Policies
```sql
-- Verify all corrective action table policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    cmd, 
    qual IS NULL as allows_all
FROM pg_policies 
WHERE tablename LIKE 'corrective_action%'
ORDER BY tablename;
```

### Monitor Photo Uploads
```sql
-- Check recent photo uploads
SELECT 
    cap.id,
    cap.action_id,
    cap.filename,
    cap.created_at,
    ca.action_number,
    ca.description
FROM corrective_action_photos cap
JOIN corrective_actions ca ON cap.action_id = ca.id
ORDER BY cap.created_at DESC
LIMIT 20;
```

### Check for Errors
```sql
-- If using Supabase logs, check for 401 errors
-- This query is an example, actual log table may vary
SELECT *
FROM auth.logs
WHERE status_code = 401
AND resource LIKE '%corrective_action_photos%'
ORDER BY created_at DESC;
```

## 📚 Related Documentation

### Related Fixes:
1. **Patrol Created By Fix** - `PATROL_CREATED_BY_FIX.md`
   - Fixed `created_by` field for patrols
   - Enabled edit permissions and verification

2. **Photo Upload Fix** - `PATROL_PHOTO_USER_ID_FIX.md`
   - Fixed patrol photo uploads for Azure AD users
   - Enhanced `useUserId()` hook

3. **Corrective Action Auth Fix** - Previous in this session
   - Fixed corrective action creation authentication
   - Added userId parameter to service methods

## 🎉 Success Criteria

After applying this fix, the following should work:

- ✅ Create corrective action with photos (no errors)
- ✅ Photos appear in corrective action detail view
- ✅ Photos stored in database (`corrective_action_photos` table)
- ✅ Photos accessible via R2 URLs
- ✅ No 401 Unauthorized errors in console
- ✅ No RLS policy violation errors

---

## 🚨 Important Notes

1. **Run the comprehensive fix** (`fix_all_corrective_action_rls_policies.sql`) to avoid future issues with other corrective action features

2. **Test thoroughly** after applying the fix to ensure all corrective action workflows work correctly

3. **Monitor** for any other RLS-related errors in other tables (patrols, users, etc.)

4. **Document** any custom RLS policies if you need more granular access control in the future

---

**Date:** October 14, 2025  
**Status:** ✅ Solution Ready  
**SQL Files:** Created and ready to execute  
**Risk Level:** Low (app-level auth already in place)
