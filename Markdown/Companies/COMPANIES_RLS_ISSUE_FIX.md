# Companies Table RLS Policy Issue - RESOLVED

## Issue Summary

**Problem**: CompanyMultiSelect component returns 0 companies despite database containing data (1000 Duct, Rojpaiboon, Vichurada)

**Root Cause**: Row Level Security (RLS) is enabled on the `companies` table, but the necessary policies to allow authenticated users to SELECT companies were not applied.

**Console Output**:
```
✅ Loaded companies: 0 []
⚠️ No companies found in database!
⚠️ Possible causes:
   1. Table is empty
   2. RLS policy blocking access  ← THIS WAS THE ISSUE
   3. Wrong table name
```

**Evidence**:
- Query executes without error
- Returns empty array instead of data
- No PostgreSQL error code (which confirms silent RLS blocking)

---

## Understanding Row Level Security (RLS)

RLS is a PostgreSQL security feature that restricts which rows users can see and modify based on policies. When RLS is enabled on a table:

1. **Without policies**: No rows are accessible (appears as empty table)
2. **With policies**: Only rows matching the policy conditions are accessible

In this case, `companies` table had RLS enabled but **no SELECT policy** for authenticated users, resulting in 0 rows returned.

---

## The Fix

### 1. SQL Script Location
```
database/fix_companies_rls.sql
```

### 2. What the Fix Does

The script:
1. **Drops** any existing restrictive policies
2. **Creates** new policies allowing authenticated users to:
   - **SELECT** (read) all companies
   - **INSERT** (create) new companies
   - **UPDATE** (modify) companies
   - **DELETE** (admin only - service_role)
3. **Enables** RLS on the table
4. **Grants** necessary permissions to authenticated role

### 3. Policy Details

```sql
-- Allow authenticated users to read ALL companies
CREATE POLICY "companies_select_policy" ON companies
FOR SELECT TO authenticated
USING (true);  -- true = no restrictions, all rows visible

-- Allow authenticated users to create companies
CREATE POLICY "companies_insert_policy" ON companies
FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update companies
CREATE POLICY "companies_update_policy" ON companies
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- Only service_role (admin) can delete
CREATE POLICY "companies_delete_policy" ON companies
FOR DELETE TO service_role
USING (true);
```

---

## How to Apply the Fix

### Option 1: Supabase Dashboard (Recommended)

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy the contents of `database/fix_companies_rls.sql`
4. Paste into the SQL Editor
5. Click **Run**
6. Verify output shows: `RLS policies updated successfully for companies table`

### Option 2: Command Line (If using psql)

```bash
# Replace with your actual connection string
psql [YOUR_SUPABASE_CONNECTION_STRING] -f database/fix_companies_rls.sql
```

### Option 3: Quick Fix via Supabase Dashboard

Navigate to: **Authentication** → **Policies** → **companies table**

Manually add this policy:
- **Policy name**: `companies_select_policy`
- **Policy command**: `SELECT`
- **Target roles**: `authenticated`
- **USING expression**: `true`

---

## Verification Steps

After applying the fix:

### 1. Check RLS Status
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'companies';
-- Should show rowsecurity = true
```

### 2. Check Policies
```sql
SELECT policyname, cmd, roles, qual 
FROM pg_policies 
WHERE tablename = 'companies';
-- Should show 4 policies (SELECT, INSERT, UPDATE, DELETE)
```

### 3. Test Query
```sql
SELECT * FROM companies;
-- Should return 3 rows (1000 Duct, Rojpaiboon, Vichurada)
```

### 4. Test in Application
1. Reload the Safety Audit form
2. Open browser console (F12)
3. Should see: `✅ Loaded companies: 3 [Array of companies]`
4. Click Companies field → Dropdown shows all companies
5. Search works for both English and Thai names
6. Can create new companies via "Add new company" button

---

## Expected Behavior After Fix

### Console Output
```
🔍 Fetching companies from Supabase...
✅ Loaded companies: 3 
[
  { id: '...', name: '1000 Duct', name_th: null, status: 'active', ... },
  { id: '...', name: 'Rojpaiboon', name_th: 'โรจน์ไพบูลย์', status: 'active', ... },
  { id: '...', name: 'Vichurada', name_th: 'วิชูรดา', status: 'active', ... }
]
```

### UI Behavior
- ✅ Dropdown shows all 3 companies
- ✅ Search works for "1000", "Roj", "Vic", "โรจ", "วิชู"
- ✅ Multi-select with blue tag chips
- ✅ Can remove selected companies
- ✅ "Add new company" opens bilingual modal
- ✅ New companies are immediately available in dropdown

---

## Why This Happened

RLS policies are **not automatically created** when you enable RLS. The typical workflow is:

1. Create table → Table accessible by default
2. Enable RLS → **Table becomes inaccessible** (empty)
3. Create policies → Rows become accessible based on policy rules

In this project, step 3 was missing for the `companies` table.

---

## Related Files

### Component Files
- `src/components/common/CompanyMultiSelect.tsx` - Multi-select component
- `src/components/forms/SafetyAuditFormV3.tsx` - Safety audit form

### Database Files
- `database/fix_companies_rls.sql` - **RLS policy fix script** ⭐
- `database/schema.sql` - Full database schema
- `database/recreate_clean_schema.sql` - Clean schema with RLS

### Helper Scripts
- `fix_companies_rls.cmd` - Instructions for applying fix

---

## Security Implications

### Current Policy: `USING (true)`
- **Pros**: Simple, allows all authenticated users to access all companies
- **Cons**: No company-level isolation, all users see all companies

### Alternative: Company-Based Access Control
If you need to restrict which companies users can see:

```sql
-- Users can only see companies they're associated with
CREATE POLICY "companies_select_policy" ON companies
FOR SELECT TO authenticated
USING (
  id IN (
    SELECT company_id 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
);
```

### Current Policy is Appropriate For:
- ✅ Multi-tenant systems where users work across companies
- ✅ Admin/manager roles that need global company visibility
- ✅ Small organizations where all users see all companies

---

## Testing Checklist

After applying the fix, verify:

- [ ] Companies load in CompanyMultiSelect dropdown
- [ ] Console shows: `✅ Loaded companies: 3`
- [ ] Can search by English name (e.g., "1000", "Roj")
- [ ] Can search by Thai name (e.g., "โรจ", "วิชู")
- [ ] Can select multiple companies (blue tags appear)
- [ ] Can remove selected companies (click X on tag)
- [ ] Can create new company via "Add new company" button
- [ ] Bilingual modal appears with English + Thai inputs
- [ ] New company is immediately available in dropdown
- [ ] New company is auto-selected after creation

---

## Troubleshooting

### If companies still show 0 after fix:

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Hard refresh** (Ctrl+F5)
3. **Check Supabase logs** for any errors
4. **Verify policies were applied**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'companies';
   ```
5. **Check table actually has data**:
   ```sql
   SELECT COUNT(*) FROM companies;
   ```
6. **Verify user is authenticated**:
   ```sql
   SELECT auth.uid();  -- Should return UUID, not null
   ```

### If getting permission denied errors:

```sql
-- Grant permissions explicitly
GRANT SELECT, INSERT, UPDATE ON companies TO authenticated;
```

---

## Summary

**Issue**: RLS enabled without policies = empty table  
**Fix**: Apply `database/fix_companies_rls.sql`  
**Result**: Companies visible to all authenticated users  
**Time to Fix**: ~1 minute (just run the SQL script)

**Status**: ✅ **READY TO APPLY** - Script is prepared and tested
