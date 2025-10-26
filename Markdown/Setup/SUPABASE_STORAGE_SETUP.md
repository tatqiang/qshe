# Supabase Storage Setup Guide

## Issue
Error: `StorageApiError: Bucket not found`

The code is trying to upload files to Supabase Storage bucket named `qshe`, but this bucket doesn't exist yet.

## Solution: Create the `qshe` Bucket in Supabase Storage

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project: https://supabase.com/dashboard/project/wbzzvchjdqtzxwwquogl
2. Click on **Storage** in the left sidebar

### Step 2: Create New Bucket
1. Click the **"New bucket"** button (top right)
2. Enter bucket details:
   - **Name**: `qshe`
   - **Public bucket**: ✅ **YES** (check this box)
   - **File size limit**: Leave default or set to 50 MB
   - **Allowed MIME types**: Leave empty (allow all types)

3. Click **"Create bucket"**

### Step 3: Verify Bucket Creation
Run this SQL query in Supabase SQL Editor:

```sql
SELECT 
  id,
  name,
  public,
  created_at
FROM storage.buckets
WHERE id = 'qshe';
```

**Expected Result**: 1 row showing `qshe` bucket with `public = true`

### Step 4: Verify RLS Policies
The RLS policies are already created from `fix_storage_rls_policies.sql`. Verify them:

```sql
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
ORDER BY policyname;
```

**Expected**: 5 policies including "Allow anon uploads to member-applications"

### Step 5: Test Upload
1. Go to member registration form
2. Fill out form and upload files
3. Files should now upload successfully! ✅

### Step 6: View Uploaded Files
In Supabase Dashboard > Storage > qshe bucket, you should see:
```
qshe/
  └── member-applications/
      └── bd4023ae-faae-45b4-95d3-d448cc23e5a8/
          ├── 1760800117163_document_profile_photo.jpg
          ├── 1760800118747_document_id_card.pdf
          └── 1760800119501_document_medical_certificate.pdf
```

---

## Alternative: Use Cloudflare R2 Instead

If you prefer to upload directly to Cloudflare R2 (not Supabase Storage), we need to:

1. Install AWS SDK: `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
2. Create backend API endpoint for generating pre-signed URLs
3. Update `uploadFile()` function in `MemberFormPage.tsx`
4. Add Cloudflare R2 credentials to environment variables

**This is more complex and requires backend changes.**

---

## Recommendation

✅ **Create the `qshe` bucket in Supabase Storage** (Option 1)

This is the quickest solution and requires no code changes. The RLS policies are already configured and ready to use.
