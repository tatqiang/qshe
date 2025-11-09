-- Fix storage bucket policies for 'qshe' bucket
-- This allows all users to upload, view, and delete files

-- First, check if policies exist and drop them
DROP POLICY IF EXISTS "Allow all to upload to qshe bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow all to view qshe bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow all to delete from qshe bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow all to update qshe bucket" ON storage.objects;

-- Create permissive policies for the 'qshe' bucket
-- Allow anyone to upload files
CREATE POLICY "Allow all to upload to qshe bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'qshe');

-- Allow anyone to view files
CREATE POLICY "Allow all to view qshe bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'qshe');

-- Allow anyone to update files
CREATE POLICY "Allow all to update qshe bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'qshe')
WITH CHECK (bucket_id = 'qshe');

-- Allow anyone to delete files
CREATE POLICY "Allow all to delete from qshe bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'qshe');

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
