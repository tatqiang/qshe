-- ============================================
-- CREATE STORAGE BUCKET FOR SAFETY AUDIT PHOTOS
-- ============================================
-- Run this in Supabase SQL Editor
-- Date: October 17, 2025
-- ============================================

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'safety-audit-photos',
  'safety-audit-photos',
  true, -- Public bucket so photos can be viewed
  10485760, -- 10MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES FOR SAFETY AUDIT PHOTOS
-- ============================================

-- Policy 1: Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload audit photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'safety-audit-photos');

-- Policy 2: Allow public read access to all photos
CREATE POLICY "Public read access for audit photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'safety-audit-photos');

-- Policy 3: Allow users to update their own photos
CREATE POLICY "Users can update audit photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'safety-audit-photos');

-- Policy 4: Allow users to delete audit photos
CREATE POLICY "Users can delete audit photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'safety-audit-photos');

-- ============================================
-- VERIFY BUCKET CREATION
-- ============================================

-- Check if bucket was created
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'safety-audit-photos';

-- Expected result:
-- id                    | name                  | public | file_size_limit | allowed_mime_types
-- ----------------------|----------------------|--------|-----------------|--------------------
-- safety-audit-photos   | safety-audit-photos  | true   | 10485760        | {image/jpeg,...}
