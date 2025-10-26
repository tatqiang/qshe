# 🎯 QUICK FIX - Token Creation (401 Error)

## ⚡ What to Do RIGHT NOW

### Step 1: Run RLS Fix SQL (CRITICAL)

```cmd
REM Copy SQL to clipboard
type c:\pwa\qshe10\qshe\database\member_application_tokens_rls_fix.sql
```

1. **Open Supabase Dashboard** → SQL Editor
2. **Paste the entire SQL** (from clipboard)
3. **Click "Run"**
4. **Verify output** shows 4 policies created

### Step 2: Refresh Browser

```
Press: Ctrl + Shift + R
```

### Step 3: Test Token Creation

1. Go to `/admin/member-tokens`
2. Click "Create New Token"
3. Select **ONE company** (single dropdown now)
4. Click "Generate Token"
5. ✅ Should succeed without 401 error!

---

## ✅ What Was Fixed

### 1. Company Selection
- **Before:** Multi-select (multiple companies)
- **After:** Single select (one company per token)
- **Why:** Simpler management, clearer tracking

### 2. RLS Policy
- **Before:** 401 Unauthorized error
- **After:** Token creation succeeds
- **Fix:** Added proper INSERT policy for authenticated users

---

## 🎯 Expected Result

**After running RLS fix:**
- ✅ No 401 error
- ✅ Token created successfully
- ✅ Toast notification appears
- ✅ Token appears in list
- ✅ Can copy link

---

## 📋 Checklist

- [ ] Run `member_application_tokens_rls_fix.sql` in Supabase
- [ ] Refresh browser (Ctrl + Shift + R)
- [ ] Test creating token with single company
- [ ] Verify token appears in list
- [ ] Copy link and test in incognito window

---

## 🆘 If Still Error

1. **Verify policies exist:**
   ```sql
   SELECT policyname FROM pg_policies 
   WHERE tablename = 'member_application_tokens';
   ```
   Should show 4 policies.

2. **Check RLS is enabled:**
   ```sql
   SELECT relname, relrowsecurity 
   FROM pg_class 
   WHERE relname = 'member_application_tokens';
   ```
   Should show `relrowsecurity = true`.

3. **Restart PostgREST:**
   - Supabase Dashboard → Settings → API → Restart PostgREST

---

**Files:**
- ✅ `TOKEN_CREATION_FIXES_COMPLETE.md` - Full documentation
- ✅ `database/member_application_tokens_rls_fix.sql` - RLS fix SQL
- ✅ `MemberApplicationTokensPage.tsx` - Updated code (already done)

**Status:** CODE READY - Just run the SQL!
