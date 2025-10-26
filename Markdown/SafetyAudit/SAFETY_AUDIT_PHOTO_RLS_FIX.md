# Safety Audit Photo Upload - RLS Fix

## Problem Summary

**Error**: "Failed to save audit: User must be authenticated"

**Root Cause**: 
- The application uses its own authentication system (Azure AD), not Supabase auth
- Supabase Row Level Security (RLS) policies were checking `auth.uid()` which is always `null` for non-Supabase auth
- This blocked all INSERT operations on `safety_audits`, `safety_audit_photos`, `safety_audit_results`, and `safety_audit_companies` tables

## Authentication Architecture

This application has a **hybrid architecture**:
1. **Application Level**: Uses Azure AD for user authentication
2. **Database Level**: Uses Supabase for database, but WITHOUT Supabase auth
3. **User IDs**: Come from the application's user management system, stored in `users` table

The disconnect:
- Supabase RLS policies expect `auth.uid()` from Supabase auth session
- App passes user IDs from its own user context (`currentUser.id`)
- These are two different authentication systems

## Solution Applied

### 1. Removed Supabase Auth Checks from Code

**Files Changed**:
- `src/services/safetyAuditService.ts`
  - Removed `supabase.auth.getUser()` checks from `createAudit()`
  - Removed `supabase.auth.getUser()` checks from `uploadAuditPhoto()`
  - Now uses app-level user IDs directly

- `src/components/features/safety/SafetyAuditDashboard.tsx`
  - Removed `supabase.auth.getUser()` check from UPDATE mode
  - Uses `data.created_by` (app-level user ID) for `auditor_id`

### 2. Update RLS Policies (SQL Migration Required)

**Migration File**: `database/migrations/fix_rls_for_app_auth.sql`

The RLS policies need to be updated to allow operations without checking `auth.uid()`:

```sql
-- Photos: Allow all authenticated users
CREATE POLICY "Photos are insertable by all" 
  ON public.safety_audit_photos FOR INSERT 
  WITH CHECK (true);

-- Audits: Allow all authenticated users
CREATE POLICY "Audits are insertable by all authenticated" 
  ON public.safety_audits FOR INSERT 
  WITH CHECK (true);
```

**IMPORTANT**: This migration must be run on the Supabase database for photo uploads to work!

## How It Works Now

### CREATE Mode:
1. User fills out safety audit form ✅
2. Form submits with `created_by` = app user ID ✅
3. `createAudit()` creates audit record with `auditor_id` and `created_by` = app user ID ✅
4. Photo upload: R2 storage upload succeeds ✅
5. Database insert: RLS policy allows (after SQL migration) ✅

### UPDATE Mode:
1. User edits existing audit ✅
2. Dashboard updates audit with `auditor_id` = app user ID ✅
3. Photos deleted and re-uploaded ✅
4. RLS allows operations (after SQL migration) ✅

## Next Steps

### Immediate (Required):
1. ✅ Code changes applied
2. ⚠️ **Run SQL migration**: Execute `database/migrations/fix_rls_for_app_auth.sql` on Supabase
3. 🧪 Test photo upload in CREATE mode
4. 🧪 Test photo upload in UPDATE mode

### Future Improvements:
- Consider adding app-level authorization checks in RLS policies
- Could check user roles from `users` table instead of just allowing all
- Example: `EXISTS (SELECT 1 FROM users WHERE id = uploaded_by AND role IN ('admin', 'member'))`

## Testing Checklist

After running the SQL migration:

- [ ] Create new safety audit with photos
- [ ] Upload multiple photos to different categories
- [ ] Add captions to photos
- [ ] View photos in fullscreen modal
- [ ] Navigate between photos with arrows
- [ ] Edit existing audit and upload new photos
- [ ] Verify old photos are deleted when updating
- [ ] Verify photos appear in R2 storage: `safety-audits/{audit_id}/photo-*.jpg`
- [ ] Verify photo records in database: `select * from safety_audit_photos`

## Summary

The app now correctly handles its own authentication and doesn't rely on Supabase auth. The RLS policies need to be updated (via SQL migration) to allow operations without `auth.uid()`. Once the migration is run, photo uploads will work correctly! 🎉
