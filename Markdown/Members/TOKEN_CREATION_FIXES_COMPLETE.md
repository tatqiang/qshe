# ✅ Token Creation Fixes - Complete

## 🎯 Changes Made

### 1. **Company Selection: Multi → Single** ✅

**Before:**
```typescript
// Multiple companies selection
<CompanyMultiSelect
  selectedCompanyIds={selectedCompanies}
  onSelectionChange={setSelectedCompanies}
/>
// Generated multiple tokens (one per company)
```

**After:**
```typescript
// Single company selection
<CompanySelector
  value={selectedCompany}
  onChange={(companyId) => setSelectedCompany(companyId)}
/>
// Generates one token for one company
```

**Why?** 
- Simpler UI/UX for token management
- One link = One company = Clear tracking
- Easier to manage and revoke individual tokens

---

### 2. **RLS Policy Error Fixed** ✅

**Error:**
```
401 Unauthorized
new row violates row-level security policy for table "member_application_tokens"
```

**Root Cause:** Missing or restrictive INSERT policy for `member_application_tokens` table

**Solution:** Created comprehensive RLS policies in `member_application_tokens_rls_fix.sql`

---

## 🔧 How to Fix

### Step 1: Code Changes (Already Done ✅)

The TypeScript code has been updated:
- Changed from `CompanyMultiSelect` to `CompanySelector`
- Updated state from array to single string
- Simplified token generation logic

### Step 2: Run RLS Policy Fix (DO THIS NOW)

1. **Copy SQL to clipboard:**
   ```cmd
   type c:\pwa\qshe10\qshe\database\member_application_tokens_rls_fix.sql
   ```

2. **Execute in Supabase:**
   - Go to Supabase Dashboard → SQL Editor
   - Paste the entire SQL script
   - Click **Run**
   - Verify output shows 4 policies created

3. **Refresh browser:**
   ```
   Press: Ctrl + Shift + R
   ```

---

## 📊 RLS Policies Created

| Policy Name | Role | Action | Description |
|-------------|------|--------|-------------|
| `member_application_tokens_insert_policy` | authenticated | INSERT | Allows admins to create tokens |
| `member_application_tokens_select_policy` | authenticated | SELECT | Allows admins to view tokens they created |
| `member_application_tokens_select_public_policy` | anon | SELECT | Allows public access to valid tokens |
| `member_application_tokens_update_policy` | authenticated | UPDATE | Allows updating token usage count |

---

## 🎯 Expected Behavior After Fix

### Token Creation Flow:

1. **Admin opens** `/admin/member-tokens`
2. **Clicks** "Create New Token"
3. **Sees:**
   - ✅ Blue project banner (read-only)
   - ✅ Single company dropdown
   - ✅ Expiry date input
   - ✅ Max uses input

4. **Selects:**
   - One company from dropdown
   - Set expiry (default: 30 days)
   - Set max uses (default: 999)

5. **Clicks** "Generate Token"
6. **Result:**
   - ✅ Token created successfully (no 401 error)
   - ✅ Toast notification: "Token created successfully!"
   - ✅ Form closes
   - ✅ Token appears in list

---

## 🔍 Testing Checklist

### Before RLS Fix:
- ❌ Click "Generate Token" → 401 Unauthorized error
- ❌ Console shows: "violates row-level security policy"

### After RLS Fix:
- ✅ Click "Generate Token" → Success!
- ✅ Toast message appears
- ✅ Token appears in list below
- ✅ Can copy link
- ✅ No console errors

---

## 💡 UI Changes

**Company Selection:**
```
Before: [Tag] [Tag] [Tag] (Multiple companies)
After:  [Single Dropdown ▼] (One company only)
```

**Helper Text:**
```
Before: "Select one or more companies. Each company will get their own registration link."
After:  "Select the company that will use this registration link."
```

**Button:**
```
Before: "Generate Tokens" (plural)
After:  "Generate Token" (singular)
```

---

## 🚀 Next Steps

1. **Run RLS fix SQL** (see Step 2 above)
2. **Refresh browser** (Ctrl + Shift + R)
3. **Test token creation:**
   - Select default project (if not already)
   - Click "Create New Token"
   - Select ONE company
   - Click "Generate Token"
   - ✅ Should succeed without errors

4. **Verify token list:**
   - New token appears
   - Shows project name
   - Shows company name (Thai preferred)
   - Can copy link

5. **Test public access:**
   - Copy token link
   - Open in incognito window
   - Should see member application form

---

## 📝 Files Modified

1. ✅ `src/pages/admin/MemberApplicationTokensPage.tsx`
   - Line 5: Changed import to `CompanySelector`
   - Line 38: Changed state to single company (string)
   - Lines 68-127: Updated generateToken logic (single token)
   - Line 247: Updated UI to use CompanySelector
   - Line 309: Simplified button validation

2. ✅ `database/member_application_tokens_rls_fix.sql` (NEW)
   - Complete RLS policy setup for token table

---

## ⚠️ Important Notes

**Why Single Company?**
- Clearer tracking (1 link = 1 company)
- Easier token management
- Simpler to revoke if needed
- Better for reporting and analytics

**What if multiple companies need tokens?**
- Create separate tokens for each company
- Each gets their own unique link
- Better control and monitoring

**Token Usage:**
- One token can be used by multiple people (up to `max_uses`)
- All people using the same token are linked to the same company
- Perfect for "1 link = multiple people from same company" requirement

---

## 🆘 Troubleshooting

**If RLS error persists:**

1. Verify policies exist:
   ```sql
   SELECT policyname, cmd, roles
   FROM pg_policies
   WHERE tablename = 'member_application_tokens';
   ```

2. Check user role:
   ```sql
   SELECT auth.uid(), role FROM users 
   WHERE auth_user_id = auth.uid();
   ```

3. Enable RLS (if not enabled):
   ```sql
   ALTER TABLE member_application_tokens ENABLE ROW LEVEL SECURITY;
   ```

4. Clear Supabase cache:
   - Dashboard → Settings → API → Restart PostgREST

**If company dropdown doesn't appear:**
- Check `CompanySelector` component exists in `src/components/shared/`
- Verify companies table has data
- Check browser console for errors

---

**Status:** ✅ CODE UPDATED - Need to run RLS fix SQL!
