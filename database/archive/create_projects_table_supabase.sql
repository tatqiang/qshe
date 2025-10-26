-- Create projects table in Supabase with exactly 7 fields
-- Run this in Supabase SQL editor after adding fields to users table

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id SERIAL PRIMARY KEY,
  project_code VARCHAR(50) NOT NULL UNIQUE,
  project_name VARCHAR(255) NOT NULL,
  project_description TEXT,
  project_start DATE,
  project_end DATE,
  project_status VARCHAR(20) NOT NULL DEFAULT 'active'
    CONSTRAINT projects_status_check 
    CHECK (project_status IN ('active', 'completed', 'on_hold', 'extended', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_code ON projects(project_code);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(project_status);
CREATE INDEX IF NOT EXISTS idx_projects_dates ON projects(project_start, project_end);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
-- (You can make this more restrictive later)
CREATE POLICY "Enable all operations for authenticated users" ON public.projects
  FOR ALL USING (true);

-- Grant permissions to authenticated users
GRANT ALL ON public.projects TO authenticated;
GRANT ALL ON public.projects TO anon;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON public.projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verify table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND table_schema = 'public'
ORDER BY ordinal_position;