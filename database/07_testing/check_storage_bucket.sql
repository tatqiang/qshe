-- ============================================
-- Check Storage Bucket Configuration
-- ============================================

-- 1. Check if 'qshe' bucket exists and is public
SELECT 
  id,
  name,
  public,
  created_at,
  updated_at
FROM storage.buckets
WHERE id = 'qshe';

-- Expected: 1 row with public = true


-- 2. Check storage policies
SELECT 
  policyname,
  cmd,
  roles,
  permissive
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
ORDER BY policyname;

-- Expected: Multiple policies including one for 'anon' INSERT


-- 3. Check if any files exist in member-applications folder
SELECT 
  name,
  bucket_id,
  owner,
  created_at,
  metadata
FROM storage.objects
WHERE bucket_id = 'qshe'
AND name LIKE 'member-applications/%'
ORDER BY created_at DESC
LIMIT 10;

-- Expected: Should show uploaded files if any exist
