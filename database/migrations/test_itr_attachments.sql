-- =====================================================
-- Test Script: Check ITR Attachments Setup
-- Description: Verify table, RLS policies, and data
-- Date: 2026-02-02
-- =====================================================

-- Check if table exists
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'construction_itr_attachments';

-- Check RLS status
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'construction_itr_attachments';

-- List all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'construction_itr_attachments'
ORDER BY policyname;

-- Count total attachments
SELECT 
  COUNT(*) as total_attachments
FROM construction_itr_attachments;

-- Count by attachment type
SELECT 
  attachment_type,
  COUNT(*) as count
FROM construction_itr_attachments
GROUP BY attachment_type
ORDER BY attachment_type;

-- Sample attachments data
SELECT 
  id,
  itr_id,
  attachment_type,
  file_name,
  file_size,
  uploaded_at
FROM construction_itr_attachments
ORDER BY uploaded_at DESC
LIMIT 10;

-- Check ITRs that have attachments
SELECT 
  i.id,
  i.itr_no,
  i.itr_title,
  COUNT(a.id) as attachment_count
FROM construction_itrs i
LEFT JOIN construction_itr_attachments a ON a.itr_id = i.id
GROUP BY i.id, i.itr_no, i.itr_title
HAVING COUNT(a.id) > 0
ORDER BY COUNT(a.id) DESC
LIMIT 10;

-- Test query that frontend uses (should match what authenticated user would see)
-- Replace <your-test-itr-id> with an actual ITR ID from your database
SELECT 
  a.*
FROM construction_itr_attachments a
WHERE a.itr_id = (
  SELECT id FROM construction_itrs LIMIT 1
)
ORDER BY a.uploaded_at DESC;
