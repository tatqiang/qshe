-- Supabase SQL script to create projects table
-- Run this in Supabase SQL editor

-- Create projects table with exactly 7 fields
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  project_code VARCHAR(50) NOT NULL UNIQUE,
  project_name VARCHAR(255) NOT NULL,
  project_description TEXT,
  project_start DATE,
  project_end DATE,
  project_status VARCHAR(20) NOT NULL DEFAULT 'active'
    CONSTRAINT projects_status_check 
    CHECK (project_status IN ('active', 'completed', 'on_hold', 'extended', 'cancelled'))
);

-- Create indexes for better performance
CREATE INDEX projects_code_idx ON projects(project_code);
CREATE INDEX projects_status_idx ON projects(project_status);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Enable all operations for authenticated users" ON projects
  FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON projects TO authenticated;
GRANT ALL ON projects TO anon;

-- Verify table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;