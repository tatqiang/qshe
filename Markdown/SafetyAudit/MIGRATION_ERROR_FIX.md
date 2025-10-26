# Migration Error Fix - Applied

## Error Encountered
```
ERROR: 2BP01: cannot drop column category_id of table safety_audits 
because other objects depend on it
DETAIL: view safety_audit_summary depends on column category_id of table safety_audits
HINT: Use DROP ... CASCADE to drop the dependent objects too.
```

## Fix Applied

### Step 1: Drop Dependent Views First (NEW)
```sql
-- Drop views that depend on columns we're about to remove
DROP VIEW IF EXISTS public.safety_audit_summary CASCADE;
DROP VIEW IF EXISTS public.v_safety_audit_summary CASCADE;
```

### Step 2: Then Drop Columns with CASCADE
```sql
-- Drop category_id and revision_id from safety_audits (moved to JSONB)
ALTER TABLE public.safety_audits 
  DROP COLUMN IF EXISTS category_id CASCADE,
  DROP COLUMN IF EXISTS revision_id CASCADE;
```

## What Changed

1. ✅ Added explicit view drops at the beginning
2. ✅ Added CASCADE to column drops as safety net
3. ✅ Views will be recreated later in the script (Step 10)
4. ✅ Renumbered all steps for clarity

## Migration Now Ready

The updated migration script will:
1. Drop old views first
2. Drop columns without errors
3. Add new columns
4. Recreate views with new structure
5. Load all data from your documentation

## Run Again

You can now run the migration again:
1. Open: https://supabase.com/dashboard/project/wbzzvchjdqtzxwwquogl/sql
2. Copy updated: `database/migrations/safety_audit_schema_v3_multi_category.sql`
3. Paste and click **Run**
4. Should complete successfully! ✅

## After Success

Run verification:
```bash
node verify_migration_v3.js
```

Expected output:
```
✅ Categories: 7 (A-G)
✅ Revisions: 4
✅ Active Requirements: 17
✅ ALL VERIFICATION CHECKS PASSED!
```
