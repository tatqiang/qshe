-- =====================================================
-- ITR Workflow Status Management
-- =====================================================

-- Create enum for status codes (fixed workflow logic)
DO $$ BEGIN
    CREATE TYPE itr_status_code AS ENUM (
        'draft',
        'internal_requested',
        'confirm_requested',
        'in_review',
        'approved',
        'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create table for status labels (editable display text)
CREATE TABLE IF NOT EXISTS itr_status_definitions (
  code itr_status_code PRIMARY KEY,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(20), -- for UI badge colors
  icon VARCHAR(50), -- for UI icons
  sort_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  can_edit BOOLEAN DEFAULT true, -- whether status can be manually set
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default status definitions
INSERT INTO itr_status_definitions (code, display_name, description, color, icon, sort_order, can_edit) VALUES
('draft', 'Draft', 'ITR is being planned and prepared', '#6b7280', '📝', 1, true),
('internal_requested', 'Internal Requested', 'ITR has been internally requested to QA/QC team', '#3b82f6', '📤', 2, true),
('confirm_requested', 'Confirm Requested', 'QA/QC has confirmed and assigned ITR No', '#8b5cf6', '✅', 3, true),
('in_review', 'In Review', 'ITR is being reviewed/inspected', '#f59e0b', '🔍', 4, true),
('approved', 'Approved', 'ITR has been approved', '#10b981', '✓', 5, true),
('rejected', 'Rejected', 'ITR has been rejected', '#ef4444', '✗', 6, true)
ON CONFLICT (code) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon,
  updated_at = NOW();

-- Create index
CREATE INDEX IF NOT EXISTS idx_itr_status_definitions_sort ON itr_status_definitions(sort_order);

COMMENT ON TABLE itr_status_definitions IS 'Defines ITR status codes with editable display labels';
COMMENT ON COLUMN itr_status_definitions.code IS 'Fixed status code used in application logic';
COMMENT ON COLUMN itr_status_definitions.display_name IS 'Editable display label shown to users';
COMMENT ON COLUMN itr_status_definitions.can_edit IS 'Whether users can manually set this status';
