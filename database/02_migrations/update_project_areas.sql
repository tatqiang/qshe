-- Update punch list database schema
-- 1. Rename punch_list_areas to project_areas
-- 2. Add indexes for better search performance
-- 3. Create punch_list table (QC focused, not safety patrol)

-- Create project_areas table (renamed from punch_list_areas)
-- Added sub_area_1 and sub_area_2 for hierarchical area structure
CREATE TABLE IF NOT EXISTS project_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  area_code varchar(50) NOT NULL,
  area_name varchar(255) NOT NULL,
  sub_area_1_code varchar(50),      -- Optional sub area (e.g., room number)
  sub_area_1_name varchar(255),     -- Optional sub area name
  sub_area_2_code varchar(50),      -- Optional deeper sub area
  sub_area_2_name varchar(255),     -- Optional deeper sub area name
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES users(id),
  UNIQUE(project_id, area_code, COALESCE(sub_area_1_code, ''), COALESCE(sub_area_2_code, '')), -- Prevent duplicates including sub areas
  UNIQUE(project_id, area_name, COALESCE(sub_area_1_name, ''), COALESCE(sub_area_2_name, ''))  -- Prevent duplicate names including sub areas
);

-- Add indexes for fast searching (including sub areas)
CREATE INDEX IF NOT EXISTS idx_project_areas_project_id ON project_areas(project_id);
CREATE INDEX IF NOT EXISTS idx_project_areas_name_search ON project_areas USING gin(to_tsvector('english', area_name || ' ' || COALESCE(sub_area_1_name, '') || ' ' || COALESCE(sub_area_2_name, '')));
CREATE INDEX IF NOT EXISTS idx_project_areas_code_search ON project_areas USING gin(to_tsvector('english', area_code || ' ' || COALESCE(sub_area_1_code, '') || ' ' || COALESCE(sub_area_2_code, '')));

-- Create punch_list table for Quality Control defects (separate from safety patrol)
-- Added issued_by to track who reported the defect
CREATE TABLE IF NOT EXISTS punch_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  area_id uuid REFERENCES project_areas(id),
  punch_list_number varchar(50) UNIQUE, -- Auto-generated punch list number
  title varchar(255) NOT NULL,
  description text,
  location varchar(255),
  severity varchar(20) DEFAULT 'medium' CHECK (severity IN ('high', 'medium', 'low')),
  status varchar(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  assignee_id uuid REFERENCES users(id),
  issued_by uuid REFERENCES users(id) NOT NULL, -- Who reported/issued this defect (must be logged in user)
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  closed_at timestamp with time zone,
  closed_by uuid REFERENCES users(id),
  correction_note text,
  correction_completed_at timestamp with time zone
);

-- Create punch_list_photos table for evidence documentation
CREATE TABLE IF NOT EXISTS punch_list_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  punch_list_id uuid REFERENCES punch_list(id) ON DELETE CASCADE,
  photo_type varchar(20) DEFAULT 'issue' CHECK (photo_type IN ('issue', 'correction')),
  file_name varchar(255) NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  original_name varchar(255),
  annotations jsonb, -- For photo markup/annotations
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES users(id)
);

-- Add indexes for punch list queries
CREATE INDEX IF NOT EXISTS idx_punch_list_project_id ON punch_list(project_id);
CREATE INDEX IF NOT EXISTS idx_punch_list_area_id ON punch_list(area_id);
CREATE INDEX IF NOT EXISTS idx_punch_list_status ON punch_list(status);
CREATE INDEX IF NOT EXISTS idx_punch_list_assignee ON punch_list(assignee_id);
CREATE INDEX IF NOT EXISTS idx_punch_list_number ON punch_list(punch_list_number);
CREATE INDEX IF NOT EXISTS idx_punch_list_photos_punch_list_id ON punch_list_photos(punch_list_id);

-- Add RLS policies for project_areas
ALTER TABLE project_areas ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view areas for projects they're members of
CREATE POLICY "Users can view project areas for their projects" ON project_areas
  FOR SELECT USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can create areas for projects they're members of
CREATE POLICY "Users can create areas for their projects" ON project_areas
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update areas for projects they're members of
CREATE POLICY "Users can update areas for their projects" ON project_areas
  FOR UPDATE USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- Add RLS policies for punch_list
ALTER TABLE punch_list ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view punch list items for their projects
CREATE POLICY "Users can view punch list for their projects" ON punch_list
  FOR SELECT USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can create punch list items for their projects
CREATE POLICY "Users can create punch list for their projects" ON punch_list
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update punch list items for their projects
CREATE POLICY "Users can update punch list for their projects" ON punch_list
  FOR UPDATE USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- Add RLS policies for punch_list_photos
ALTER TABLE punch_list_photos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view photos for punch list items in their projects
CREATE POLICY "Users can view punch list photos for their projects" ON punch_list_photos
  FOR SELECT USING (
    punch_list_id IN (
      SELECT id FROM punch_list WHERE project_id IN (
        SELECT project_id FROM project_members WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Users can create photos for punch list items in their projects
CREATE POLICY "Users can create punch list photos for their projects" ON punch_list_photos
  FOR INSERT WITH CHECK (
    punch_list_id IN (
      SELECT id FROM punch_list WHERE project_id IN (
        SELECT project_id FROM project_members WHERE user_id = auth.uid()
      )
    )
  );

-- Function to auto-generate punch list numbers
CREATE OR REPLACE FUNCTION generate_punch_list_number(project_id_param uuid)
RETURNS text AS $$
DECLARE
  project_code text;
  sequence_num integer;
  punch_list_number text;
BEGIN
  -- Get project code or use 'PL' as default
  SELECT COALESCE(UPPER(LEFT(name, 2)), 'PL') INTO project_code
  FROM projects WHERE id = project_id_param;
  
  -- Get next sequence number for this project
  SELECT COALESCE(MAX(CAST(SUBSTRING(punch_list_number FROM '[0-9]+$') AS integer)), 0) + 1
  INTO sequence_num
  FROM punch_list 
  WHERE project_id = project_id_param
  AND punch_list_number ~ (project_code || '-[0-9]+$');
  
  -- Format: PROJECT_CODE-001, PROJECT_CODE-002, etc.
  punch_list_number := project_code || '-' || LPAD(sequence_num::text, 3, '0');
  
  RETURN punch_list_number;
END;
$$ LANGUAGE plpgsql;
