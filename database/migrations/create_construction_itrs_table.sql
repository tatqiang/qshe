-- Create construction_itrs table for Inspection and Test Requests
-- This table stores ITR records linked to construction tasks

CREATE TABLE IF NOT EXISTS construction_itrs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES construction_tasks(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- ITR identification
  itr_no VARCHAR(50),
  itr_title TEXT NOT NULL,
  
  -- Foreign keys to project-specific tables
  system_id UUID REFERENCES construction_systems(id) ON DELETE SET NULL,
  itr_type_id UUID REFERENCES construction_itr_types(id) ON DELETE SET NULL,
  
  -- ITP reference (from Google Sheet)
  itp_no VARCHAR(100),
  itp_doc_no VARCHAR(100),
  itp_title TEXT,
  
  -- Location information (from task but editable)
  main_area_id UUID REFERENCES main_areas(id) ON DELETE SET NULL,
  sub_area_1_id UUID REFERENCES sub_areas_1(id) ON DELETE SET NULL,
  location_detail TEXT,
  
  -- Timestamps and user tracking
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  request_date TIMESTAMP WITH TIME ZONE,
  requested_by UUID,
  
  -- Drawing information
  drawing_no VARCHAR(100),
  drawing_file_url TEXT,
  
  -- Material reference (from Google Sheet)
  material_no VARCHAR(100),
  material_doc_no VARCHAR(100),
  material_title TEXT,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'draft', -- draft, submitted, approved, rejected
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_construction_itrs_task_id ON construction_itrs(task_id);
CREATE INDEX idx_construction_itrs_project_id ON construction_itrs(project_id);
CREATE INDEX idx_construction_itrs_system_id ON construction_itrs(system_id);
CREATE INDEX idx_construction_itrs_itr_type_id ON construction_itrs(itr_type_id);
CREATE INDEX idx_construction_itrs_status ON construction_itrs(status);
CREATE INDEX idx_construction_itrs_created_by ON construction_itrs(created_by);

-- Enable RLS
ALTER TABLE construction_itrs ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read ITRs
CREATE POLICY "Users can view ITRs for their projects"
  ON construction_itrs FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for authenticated users to insert ITRs
CREATE POLICY "Users can insert ITRs for their projects"
  ON construction_itrs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy for authenticated users to update ITRs
CREATE POLICY "Users can update ITRs for their projects"
  ON construction_itrs FOR UPDATE
  TO authenticated
  USING (true);

-- Create policy for authenticated users to delete ITRs
CREATE POLICY "Users can delete ITRs for their projects"
  ON construction_itrs FOR DELETE
  TO authenticated
  USING (true);

COMMENT ON TABLE construction_itrs IS 'Inspection and Test Requests (ITR) for construction tasks';
COMMENT ON COLUMN construction_itrs.status IS 'ITR status: draft, submitted, approved, rejected';
