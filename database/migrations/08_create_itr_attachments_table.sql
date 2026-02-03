-- =====================================================
-- Migration 08: ITR Attachments Table
-- Description: Store multiple attachments per ITR
-- Date: 2026-02-01
-- =====================================================

-- Create attachment_type enum
DROP TYPE IF EXISTS itr_attachment_type CASCADE;
CREATE TYPE itr_attachment_type AS ENUM (
  'drawing',
  'delivery_order',
  'photo'
);

-- Create ITR Attachments Table
DROP TABLE IF EXISTS construction_itr_attachments CASCADE;
CREATE TABLE construction_itr_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itr_id UUID NOT NULL REFERENCES construction_itrs(id) ON DELETE CASCADE,
  attachment_type itr_attachment_type NOT NULL DEFAULT 'drawing',
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER, -- in bytes
  mime_type TEXT,
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_itr_attachments_itr_id ON construction_itr_attachments(itr_id);
CREATE INDEX idx_itr_attachments_type ON construction_itr_attachments(attachment_type);
CREATE INDEX idx_itr_attachments_uploaded_by ON construction_itr_attachments(uploaded_by);

-- Enable RLS
ALTER TABLE construction_itr_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view ITR attachments for their project"
  ON construction_itr_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM construction_itrs itr
      JOIN project_members pm ON pm.project_id = itr.project_id
      WHERE itr.id = construction_itr_attachments.itr_id
        AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert ITR attachments for their project"
  ON construction_itr_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM construction_itrs itr
      JOIN project_members pm ON pm.project_id = itr.project_id
      WHERE itr.id = construction_itr_attachments.itr_id
        AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own ITR attachments"
  ON construction_itr_attachments FOR DELETE
  USING (uploaded_by = auth.uid());

-- Add updated_at trigger
CREATE TRIGGER update_construction_itr_attachments_updated_at
  BEFORE UPDATE ON construction_itr_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE construction_itr_attachments IS 'Stores multiple file attachments for ITRs (drawings, DOs, photos)';
COMMENT ON COLUMN construction_itr_attachments.attachment_type IS 'Type of attachment: drawing, delivery_order, photo';
COMMENT ON COLUMN construction_itr_attachments.file_size IS 'File size in bytes';
