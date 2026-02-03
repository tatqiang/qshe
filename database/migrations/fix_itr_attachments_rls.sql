-- =====================================================
-- Fix: ITR Attachments RLS Policy
-- Description: Update RLS policy to allow authenticated users
-- Date: 2026-02-01
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view ITR attachments for their project" ON construction_itr_attachments;
DROP POLICY IF EXISTS "Users can insert ITR attachments for their project" ON construction_itr_attachments;
DROP POLICY IF EXISTS "Users can delete their own ITR attachments" ON construction_itr_attachments;

-- Create more permissive policies for authenticated users
CREATE POLICY "Authenticated users can view ITR attachments"
  ON construction_itr_attachments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert ITR attachments"
  ON construction_itr_attachments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own ITR attachments"
  ON construction_itr_attachments FOR UPDATE
  USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own ITR attachments"
  ON construction_itr_attachments FOR DELETE
  USING (uploaded_by = auth.uid());

-- Add comment
COMMENT ON TABLE construction_itr_attachments IS 'Updated RLS policies to allow authenticated users to manage attachments';
