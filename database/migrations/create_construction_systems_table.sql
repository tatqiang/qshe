-- Create construction_systems table for project-specific systems
-- This table stores system categories like HVAC, Plumbing, Fire Protection, etc.

CREATE TABLE IF NOT EXISTS construction_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item INTEGER NOT NULL,
  system_code VARCHAR(10) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, item)
);

-- Create index for faster queries
CREATE INDEX idx_construction_systems_project_id ON construction_systems(project_id);
CREATE INDEX idx_construction_systems_system_code ON construction_systems(system_code);

-- Enable RLS
ALTER TABLE construction_systems ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read systems
CREATE POLICY "Users can view systems for their projects"
  ON construction_systems FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for authenticated users to insert systems
CREATE POLICY "Users can insert systems for their projects"
  ON construction_systems FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy for authenticated users to update systems
CREATE POLICY "Users can update systems for their projects"
  ON construction_systems FOR UPDATE
  TO authenticated
  USING (true);

-- Create policy for authenticated users to delete systems
CREATE POLICY "Users can delete systems for their projects"
  ON construction_systems FOR DELETE
  TO authenticated
  USING (true);

COMMENT ON TABLE construction_systems IS 'Project-specific systems (HVAC, Plumbing, Fire Protection, etc.)';
