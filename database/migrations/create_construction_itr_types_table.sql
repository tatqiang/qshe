-- Create construction_itr_types table for project-specific ITR types
-- This table stores ITR types like Installation and Test, Materials, Benchmark, Training

CREATE TABLE IF NOT EXISTS construction_itr_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item INTEGER NOT NULL,
  type_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, item)
);

-- Create index for faster queries
CREATE INDEX idx_construction_itr_types_project_id ON construction_itr_types(project_id);

-- Enable RLS
ALTER TABLE construction_itr_types ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read ITR types
CREATE POLICY "Users can view ITR types for their projects"
  ON construction_itr_types FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for authenticated users to insert ITR types
CREATE POLICY "Users can insert ITR types for their projects"
  ON construction_itr_types FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy for authenticated users to update ITR types
CREATE POLICY "Users can update ITR types for their projects"
  ON construction_itr_types FOR UPDATE
  TO authenticated
  USING (true);

-- Create policy for authenticated users to delete ITR types
CREATE POLICY "Users can delete ITR types for their projects"
  ON construction_itr_types FOR DELETE
  TO authenticated
  USING (true);

COMMENT ON TABLE construction_itr_types IS 'Project-specific ITR types (Installation and Test, Materials, Benchmark, Training)';
