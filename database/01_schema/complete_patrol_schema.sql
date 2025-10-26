-- Complete Safety Patrol System Database Schema
-- This creates all tables needed for a full-featured patrol system
-- Run this in Supabase SQL Editor

-- =============================================================================
-- 1. PROJECTS AND AREAS SCHEMA
-- =============================================================================

-- Ensure projects table has project_code column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'project_code') THEN
        ALTER TABLE projects ADD COLUMN project_code VARCHAR(50) UNIQUE;
        CREATE INDEX IF NOT EXISTS idx_projects_project_code ON projects(project_code);
    END IF;
END $$;

-- Sample projects (insert only if not exists)
INSERT INTO projects (project_code, name, description, status)
VALUES 
    ('AIC', 'Downtown Office Complex', 'Construction of 25-story office building with underground parking', 'active'),
    ('RM1', 'Highway Bridge Construction', 'Construction of 2.5km bridge spanning the Chao Phraya River', 'active'),
    ('MEGA', 'Mega Shopping Mall Project', 'Development of large-scale retail complex with entertainment facilities', 'active'),
    ('GG-U001', 'Underground Utility Tunnel', 'Construction of underground utility corridor for city infrastructure', 'active')
ON CONFLICT (project_code) DO NOTHING;

-- Areas table with hierarchical structure
CREATE TABLE IF NOT EXISTS areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    parent_area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
    area_type VARCHAR(20) CHECK (area_type IN ('main', 'sub1', 'sub2')) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_areas_project_id ON areas(project_id);
CREATE INDEX IF NOT EXISTS idx_areas_parent_area_id ON areas(parent_area_id);
CREATE INDEX IF NOT EXISTS idx_areas_type ON areas(area_type);

-- =============================================================================
-- 2. RISK MANAGEMENT SCHEMA
-- =============================================================================

-- Risk categories
CREATE TABLE IF NOT EXISTS risk_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color_code VARCHAR(7), -- HEX color code
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk items within categories
CREATE TABLE IF NOT EXISTS risk_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES risk_categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    default_severity INTEGER CHECK (default_severity IN (1,2,3,4)) DEFAULT 2,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risk_items_category_id ON risk_items(category_id);

-- =============================================================================
-- 3. ENHANCED PATROLS SCHEMA
-- =============================================================================

-- Add missing columns to patrols table
DO $$ 
BEGIN 
    -- Add project_code column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patrols' AND column_name = 'project_code') THEN
        ALTER TABLE patrols ADD COLUMN project_code VARCHAR(50);
    END IF;
    
    -- Add description column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patrols' AND column_name = 'description') THEN
        ALTER TABLE patrols ADD COLUMN description TEXT;
    END IF;
    
    -- Add patrol_type column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patrols' AND column_name = 'patrol_type') THEN
        ALTER TABLE patrols ADD COLUMN patrol_type VARCHAR(50) CHECK (patrol_type IN ('scheduled', 'random', 'incident_followup')) DEFAULT 'scheduled';
    END IF;
    
    -- Add location column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patrols' AND column_name = 'location') THEN
        ALTER TABLE patrols ADD COLUMN location TEXT;
    END IF;
    
    -- Add risk assessment columns if not exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patrols' AND column_name = 'likelihood') THEN
        ALTER TABLE patrols ADD COLUMN likelihood INTEGER CHECK (likelihood IN (1,2,3,4));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patrols' AND column_name = 'severity') THEN
        ALTER TABLE patrols ADD COLUMN severity INTEGER CHECK (severity IN (1,2,3,4));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patrols' AND column_name = 'immediate_hazard') THEN
        ALTER TABLE patrols ADD COLUMN immediate_hazard BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patrols' AND column_name = 'work_stopped') THEN
        ALTER TABLE patrols ADD COLUMN work_stopped BOOLEAN DEFAULT false;
    END IF;
    
    -- Add other useful columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patrols' AND column_name = 'workers_present') THEN
        ALTER TABLE patrols ADD COLUMN workers_present INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patrols' AND column_name = 'legal_requirement') THEN
        ALTER TABLE patrols ADD COLUMN legal_requirement BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patrols' AND column_name = 'regulation_reference') THEN
        ALTER TABLE patrols ADD COLUMN regulation_reference TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patrols' AND column_name = 'witnesses') THEN
        ALTER TABLE patrols ADD COLUMN witnesses JSONB;
    END IF;
END $$;

-- =============================================================================
-- 4. JUNCTION TABLES
-- =============================================================================

-- Patrol-Area relationships (many-to-many)
CREATE TABLE IF NOT EXISTS patrol_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patrol_id UUID REFERENCES patrols(id) ON DELETE CASCADE,
    area_id UUID REFERENCES areas(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(patrol_id, area_id)
);

CREATE INDEX IF NOT EXISTS idx_patrol_areas_patrol_id ON patrol_areas(patrol_id);
CREATE INDEX IF NOT EXISTS idx_patrol_areas_area_id ON patrol_areas(area_id);

-- Patrol-Risk Category relationships (many-to-many)
CREATE TABLE IF NOT EXISTS patrol_risk_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patrol_id UUID REFERENCES patrols(id) ON DELETE CASCADE,
    risk_category_id UUID REFERENCES risk_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(patrol_id, risk_category_id)
);

-- Patrol-Risk Item assessments (many-to-many with assessment data)
CREATE TABLE IF NOT EXISTS patrol_risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patrol_id UUID REFERENCES patrols(id) ON DELETE CASCADE,
    risk_item_id UUID REFERENCES risk_items(id) ON DELETE CASCADE,
    area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
    likelihood INTEGER CHECK (likelihood IN (1,2,3,4)) NOT NULL,
    severity INTEGER CHECK (severity IN (1,2,3,4)) NOT NULL,
    risk_score INTEGER GENERATED ALWAYS AS (likelihood * severity) STORED,
    notes TEXT,
    immediate_hazard BOOLEAN DEFAULT false,
    work_stopped BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patrol_risk_assessments_patrol_id ON patrol_risk_assessments(patrol_id);
CREATE INDEX IF NOT EXISTS idx_patrol_risk_assessments_risk_item_id ON patrol_risk_assessments(risk_item_id);
CREATE INDEX IF NOT EXISTS idx_patrol_risk_assessments_area_id ON patrol_risk_assessments(area_id);

-- =============================================================================
-- 5. PHOTO STORAGE WITH R2 INTEGRATION
-- =============================================================================

-- Photos table with R2 bucket integration
CREATE TABLE IF NOT EXISTS patrol_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patrol_id UUID REFERENCES patrols(id) ON DELETE CASCADE,
    area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
    risk_assessment_id UUID REFERENCES patrol_risk_assessments(id) ON DELETE SET NULL,
    
    -- R2 Storage information
    r2_bucket VARCHAR(255) NOT NULL DEFAULT 'qshe',
    r2_key TEXT NOT NULL, -- The key/path in R2 bucket
    r2_url TEXT NOT NULL, -- Full public URL to access the image
    
    -- File metadata
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    -- Photo information
    caption TEXT,
    photo_type VARCHAR(20) CHECK (photo_type IN ('before', 'during', 'after', 'issue', 'evidence', 'general')) DEFAULT 'general',
    
    -- Location in form/workflow
    form_section VARCHAR(50), -- Which part of the form this photo was taken
    sequence_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_patrol_photos_patrol_id ON patrol_photos(patrol_id);
CREATE INDEX IF NOT EXISTS idx_patrol_photos_area_id ON patrol_photos(area_id);
CREATE INDEX IF NOT EXISTS idx_patrol_photos_type ON patrol_photos(photo_type);

-- =============================================================================
-- 6. SAMPLE DATA FOR TESTING
-- =============================================================================

-- Insert sample risk categories
INSERT INTO risk_categories (name, description, color_code, sort_order)
VALUES 
    ('PPE Compliance', 'Personal Protective Equipment related risks', '#FF6B6B', 1),
    ('Fall Hazards', 'Risks related to working at height and fall protection', '#4ECDC4', 2),
    ('Electrical Safety', 'Electrical hazards and safety measures', '#45B7D1', 3),
    ('Fire Safety', 'Fire prevention and safety protocols', '#F7DC6F', 4),
    ('Chemical Handling', 'Chemical storage and handling safety', '#BB8FCE', 5),
    ('Equipment Safety', 'Machinery and equipment safety', '#85C1E9', 6)
ON CONFLICT DO NOTHING;

-- Insert sample risk items for each category
WITH category_mapping AS (
    SELECT id, name FROM risk_categories
)
INSERT INTO risk_items (category_id, name, description, default_severity, sort_order)
SELECT 
    cm.id,
    ri.name,
    ri.description,
    ri.default_severity,
    ri.sort_order
FROM category_mapping cm
CROSS JOIN (VALUES
    ('PPE Compliance', 'Hard hat not worn', 'Worker not wearing required hard hat', 3, 1),
    ('PPE Compliance', 'Safety vest missing', 'High-visibility vest not worn in required areas', 2, 2),
    ('PPE Compliance', 'Safety boots not worn', 'Inappropriate footwear for construction site', 2, 3),
    
    ('Fall Hazards', 'Unguarded edge', 'Working area has unprotected edges above 2m', 4, 1),
    ('Fall Hazards', 'Ladder unsafe', 'Ladder not properly secured or damaged', 3, 2),
    ('Fall Hazards', 'Harness not used', 'Fall protection harness not worn when required', 4, 3),
    
    ('Electrical Safety', 'Exposed wiring', 'Electrical wiring not properly protected', 4, 1),
    ('Electrical Safety', 'Wet electrical equipment', 'Electrical equipment exposed to moisture', 4, 2),
    ('Electrical Safety', 'Overloaded circuits', 'Too many devices connected to single circuit', 3, 3)
) AS ri(category_name, name, description, default_severity, sort_order)
WHERE cm.name = ri.category_name
ON CONFLICT DO NOTHING;

-- Insert sample areas for each project
WITH project_mapping AS (
    SELECT id, project_code, name FROM projects WHERE project_code IN ('AIC', 'RM1', 'MEGA', 'GG-U001')
)
INSERT INTO areas (project_id, name, area_type, description)
SELECT 
    pm.id,
    area_data.name,
    area_data.area_type,
    area_data.description
FROM project_mapping pm
CROSS JOIN (VALUES
    ('Building Foundation', 'main', 'Foundation and basement construction area'),
    ('Structure Framework', 'main', 'Main structural framework construction'),
    ('Mechanical Systems', 'main', 'HVAC and mechanical installations'),
    ('Electrical Systems', 'main', 'Electrical installations and wiring'),
    ('Exterior Work', 'main', 'External facade and landscaping work')
) AS area_data(name, area_type, description)
ON CONFLICT DO NOTHING;

-- Add sub-areas for main areas
WITH main_areas AS (
    SELECT id, name, project_id FROM areas WHERE area_type = 'main'
)
INSERT INTO areas (project_id, parent_area_id, name, area_type, description)
SELECT 
    ma.project_id,
    ma.id,
    sub_area.name,
    'sub1'::VARCHAR,
    sub_area.description
FROM main_areas ma
CROSS JOIN (VALUES
    ('North Section', 'Northern section of the area'),
    ('South Section', 'Southern section of the area'),
    ('East Section', 'Eastern section of the area'),
    ('West Section', 'Western section of the area')
) AS sub_area(name, description)
WHERE ma.name = 'Building Foundation' -- Only add to foundation for testing
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 7. UTILITY FUNCTIONS
-- =============================================================================

-- Function to get project with areas
CREATE OR REPLACE FUNCTION get_project_with_areas(p_project_code VARCHAR)
RETURNS TABLE (
    project_id UUID,
    project_name TEXT,
    area_id UUID,
    area_name TEXT,
    area_type TEXT,
    parent_area_id UUID
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as project_id,
        p.name as project_name,
        a.id as area_id,
        a.name as area_name,
        a.area_type,
        a.parent_area_id
    FROM projects p
    LEFT JOIN areas a ON p.id = a.project_id
    WHERE p.project_code = p_project_code
      AND p.status = 'active'
      AND (a.is_active = true OR a.id IS NULL)
    ORDER BY a.area_type, a.name;
END;
$$;

-- Function to get risk categories with items
CREATE OR REPLACE FUNCTION get_risk_categories_with_items()
RETURNS TABLE (
    category_id UUID,
    category_name TEXT,
    category_description TEXT,
    category_color TEXT,
    item_id UUID,
    item_name TEXT,
    item_description TEXT,
    default_severity INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rc.id as category_id,
        rc.name as category_name,
        rc.description as category_description,
        rc.color_code as category_color,
        ri.id as item_id,
        ri.name as item_name,
        ri.description as item_description,
        ri.default_severity
    FROM risk_categories rc
    LEFT JOIN risk_items ri ON rc.id = ri.category_id
    WHERE rc.is_active = true
      AND (ri.is_active = true OR ri.id IS NULL)
    ORDER BY rc.sort_order, ri.sort_order;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_project_with_areas(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_with_areas(VARCHAR) TO anon;
GRANT EXECUTE ON FUNCTION get_risk_categories_with_items() TO authenticated;
GRANT EXECUTE ON FUNCTION get_risk_categories_with_items() TO anon;

-- =============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrol_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrol_risk_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrol_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrol_photos ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (adjust based on your auth requirements)
CREATE POLICY "Allow all operations for authenticated users" ON areas FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow read for anonymous users" ON areas FOR SELECT TO anon USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON risk_categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow read for anonymous users" ON risk_categories FOR SELECT TO anon USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON risk_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow read for anonymous users" ON risk_items FOR SELECT TO anon USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON patrol_areas FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow read for anonymous users" ON patrol_areas FOR SELECT TO anon USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON patrol_risk_categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON patrol_risk_assessments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON patrol_photos FOR ALL TO authenticated USING (true);

-- =============================================================================
-- SETUP COMPLETE
-- =============================================================================

-- Summary of what was created:
SELECT 'Database schema setup completed successfully!' as status;
SELECT 'Tables created: areas, risk_categories, risk_items, patrol_areas, patrol_risk_categories, patrol_risk_assessments, patrol_photos' as tables_created;
SELECT 'Sample data inserted for testing' as sample_data;
SELECT 'RLS policies configured' as security;
