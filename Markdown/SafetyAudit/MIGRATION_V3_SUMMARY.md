# Safety Audit - Schema v3 Migration Summary

## What Changed?

### Previous Design (v2) - WRONG ❌
- One audit record = ONE category only
- Each category needed a separate audit form
- User had to fill 7 forms to audit all categories A-G

### New Design (v3) - CORRECT ✅
- **ONE audit form covers ALL categories (A-G)**
- **Category tabs** allow switching between requirement sets
- Much more efficient and user-friendly

## Database Changes

### 1. `safety_audits` Table
**Removed:**
- ❌ `category_id` - No longer tied to single category
- ❌ `revision_id` - Moved to JSON

**Added:**
- ✅ `audit_criteria_rev JSONB` - Tracks revision per category: `{"sfs21sw": 0, "e2r532d": 1}`
- ✅ `category_scores JSONB` - Per-category score summary

### 2. `safety_audit_results` Table
**Added:**
- ✅ `category_id UUID` - To filter results by category (for tabs)
- ✅ Index: `idx_safety_audit_results_category`
- ✅ Composite index: `idx_safety_audit_results_audit_category`

### 3. `safety_audit_photos` Table
**Added:**
- ✅ `category_id UUID` - Photos organized per category
- ✅ Index: `idx_safety_audit_photos_category`
- ✅ Composite index: `idx_safety_audit_photos_audit_category`

### 4. New Helper Objects
**Views:**
- ✅ `v_active_audit_requirements` - Get all active requirements by category
- ✅ `v_audit_summary` - Audit summary with statistics

**Functions:**
- ✅ `calculate_category_score(audit_id, category_id)` - Calculate weighted scores
- ✅ `update_audit_category_scores()` - Trigger function for auto-calculation

**Sample Data:**
- ✅ Requirements for Category A (4 items)
- ✅ Requirements for Category B (5 items)
- ✅ Requirements for Category C (7 items)

## How to Run Migration

### Option 1: Supabase Dashboard (RECOMMENDED)
1. Open: https://supabase.com/dashboard/project/wbzzvchjdqtzxwwquogl/sql
2. Copy SQL from: `database/migrations/safety_audit_schema_v3_multi_category.sql`
3. Paste into SQL Editor
4. Click "Run" button
5. Check for success messages

### Option 2: Command Line (Advanced)
```bash
psql -h db.wbzzvchjdqtzxwwquogl.supabase.co \
     -U postgres \
     -d postgres \
     -f database/migrations/safety_audit_schema_v3_multi_category.sql
```

## What Happens During Migration?

1. ✅ Drops old indexes and constraints
2. ✅ Removes `category_id` and `revision_id` columns from `safety_audits`
3. ✅ Adds new JSONB columns for flexible tracking
4. ✅ Adds `category_id` to `safety_audit_results` and `safety_audit_photos`
5. ✅ Creates helper views and functions
6. ✅ Creates automatic score calculation triggers
7. ✅ Inserts sample requirements for categories A, B, C

## Post-Migration Verification

Run these queries to verify success:

```sql
-- Check audit_criteria_rev column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'safety_audits' 
  AND column_name = 'audit_criteria_rev';

-- Check category_id in results table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'safety_audit_results' 
  AND column_name = 'category_id';

-- Check active requirements view
SELECT category_code, COUNT(*) AS requirement_count
FROM v_active_audit_requirements
GROUP BY category_code
ORDER BY category_code;

-- Expected output:
-- A: 4 requirements
-- B: 5 requirements
-- C: 7 requirements
```

## Data Migration Notes

⚠️ **Important:** If you have existing audit data from v2:
- Old audits with `category_id` will become orphaned
- Consider backing up before migration
- Or run a data migration script to convert old format to new

**Backup Command:**
```sql
-- Create backup of existing audits
CREATE TABLE safety_audits_backup AS SELECT * FROM safety_audits;
CREATE TABLE safety_audit_results_backup AS SELECT * FROM safety_audit_results;
```

## Next Steps After Migration

1. ✅ Run migration SQL (via Dashboard or psql)
2. ✅ Verify tables updated correctly
3. ✅ Update TypeScript types to match new schema
4. ✅ Update `safetyAuditService.ts` methods
5. ✅ Rebuild `SafetyAuditForm.tsx` with category tabs
6. ✅ Test with sample data

## Rollback Plan (If Needed)

If something goes wrong:
```sql
-- Restore from backup
DROP TABLE safety_audits;
DROP TABLE safety_audit_results;

ALTER TABLE safety_audits_backup RENAME TO safety_audits;
ALTER TABLE safety_audit_results_backup RENAME TO safety_audit_results;
```

## Benefits of v3 Design

1. ✅ **User Experience**: One form instead of 7 separate forms
2. ✅ **Data Integrity**: Tracks revision per category for historical accuracy
3. ✅ **Flexibility**: Easy to add/remove categories
4. ✅ **Performance**: Efficient queries with proper indexes
5. ✅ **Automatic Calculations**: Triggers handle score updates
6. ✅ **Reporting**: Can filter by category, date, project, etc.

## Questions?

- See `docs/SafetyAudit/MULTI_CATEGORY_DESIGN.md` for full technical details
- See migration file: `database/migrations/safety_audit_schema_v3_multi_category.sql`
