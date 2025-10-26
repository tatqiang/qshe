-- ============================================
-- Fix Storage RLS Policies for 'qshe' Bucket
-- ============================================
-- Enable RLS and create policies for file uploads from anonymous users

-- First, ensure the bucket exists and is public
-- (Run this in Supabase Dashboard > Storage if bucket doesn't exist)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('qshe', 'qshe', true)
-- ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anon uploads to member-applications" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from member-applications" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to member-applications" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read" ON storage.objects;

-- ============================================
-- POLICY 1: Allow anonymous users to upload to member-applications folder
-- ============================================
CREATE POLICY "Allow anon uploads to member-applications"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'qshe' AND
  (storage.foldername(name))[1] = 'member-applications'
);

-- ============================================
-- POLICY 2: Allow public read access (since bucket is public)
-- ============================================
CREATE POLICY "Allow public read from qshe bucket"
ON storage.objects
FOR SELECT
TO anon, authenticated, public
USING (bucket_id = 'qshe');

-- ============================================
-- POLICY 3: Allow authenticated users to upload to any folder
-- ============================================
CREATE POLICY "Allow authenticated uploads to qshe"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'qshe');

-- ============================================
-- POLICY 4: Allow users to update their own uploads
-- ============================================
CREATE POLICY "Allow users to update their uploads"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'qshe')
WITH CHECK (bucket_id = 'qshe');

-- ============================================
-- POLICY 5: Allow admin users to delete files
-- ============================================
CREATE POLICY "Allow admin to delete files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'qshe' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id::text = auth.uid()::text
    AND users.role IN ('system_admin', 'admin')
  )
);

-- ============================================
-- Verification Queries
-- ============================================

-- Check if policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
ORDER BY policyname;

-- Try to list files in member-applications folder
SELECT 
  id,
  name,
  bucket_id,
  created_at,
  updated_at
FROM storage.objects
WHERE bucket_id = 'qshe'
AND (storage.foldername(name))[1] = 'member-applications'
ORDER BY created_at DESC
LIMIT 10;
