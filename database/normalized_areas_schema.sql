-- Normalized Hierarchical Areas Schema for QSHE System
-- Based on proper database normalization principles
-- Structure: Main Areas -> Sub Areas 1 -> Sub Areas 2

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS sub_areas_2 CASCADE;
DROP TABLE IF EXISTS sub_areas_1 CASCADE;
DROP TABLE IF EXISTS main_areas CASCADE;

-- 1. Main Areas Table
-- Stores main areas linked to projects
CREATE TABLE main_areas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Main area details
    main_area_name VARCHAR(255) NOT NULL,
    area_code VARCHAR(50), -- Optional area code/identifier
    description TEXT,
    
    -- Area type and properties
    area_type VARCHAR(50) DEFAULT 'building', -- 'building', 'outdoor', 'warehouse', 'facility'
    area_size DECIMAL(10,2), -- Square meters
    is_hazardous BOOLEAN DEFAULT FALSE,
    requires_permit BOOLEAN DEFAULT FALSE,
    
    -- Location coordinates (optional)
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    
    -- Status and metadata
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'under_construction'
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    -- Constraints
    UNIQUE(project_id, main_area_name), -- Prevent duplicate main area names in same project
    CHECK (LENGTH(main_area_name) >= 1)
);

-- 2. Sub Areas 1 Table  
-- Stores first level sub-areas linked to main areas
CREATE TABLE sub_areas_1 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    main_area_id UUID NOT NULL REFERENCES main_areas(id) ON DELETE CASCADE,
    
    -- Sub area 1 details
    sub_area1_name VARCHAR(255) NOT NULL,
    sub_area1_code VARCHAR(50), -- Optional code like 'F1', 'ZONE-A'
    description TEXT,
    
    -- Area properties
    area_type VARCHAR(50) DEFAULT 'floor', -- 'floor', 'zone', 'section', 'wing'
    area_size DECIMAL(10,2), -- Square meters
    capacity INTEGER, -- Maximum occupancy
    
    -- Floor plan coordinates (if applicable)
    floor_plan_x INTEGER,
    floor_plan_y INTEGER,
    floor_number INTEGER, -- For multi-story buildings
    
    -- Status and metadata
    status VARCHAR(20) DEFAULT 'active',
    is_hazardous BOOLEAN DEFAULT FALSE,
    requires_permit BOOLEAN DEFAULT FALSE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    -- Constraints
    UNIQUE(main_area_id, sub_area1_name), -- Prevent duplicate sub area 1 names in same main area
    CHECK (LENGTH(sub_area1_name) >= 1)
);

-- 3. Sub Areas 2 Table
-- Stores second level sub-areas linked to sub areas 1
CREATE TABLE sub_areas_2 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sub_area1_id UUID NOT NULL REFERENCES sub_areas_1(id) ON DELETE CASCADE,
    
    -- Sub area 2 details
    sub_area2_name VARCHAR(255) NOT NULL,
    sub_area2_code VARCHAR(50), -- Optional code like 'R101', 'WS-1'
    description TEXT,
    
    -- Area properties
    area_type VARCHAR(50) DEFAULT 'room', -- 'room', 'office', 'workstation', 'storage'
    area_size DECIMAL(10,2), -- Square meters
    capacity INTEGER, -- Maximum occupancy
    
    -- Room/area specific details
    room_number VARCHAR(50),
    equipment_installed TEXT[], -- Array of equipment names
    safety_equipment TEXT[], -- Array of safety equipment
    
    -- Status and metadata
    status VARCHAR(20) DEFAULT 'active',
    is_hazardous BOOLEAN DEFAULT FALSE,
    requires_permit BOOLEAN DEFAULT FALSE,
    access_level VARCHAR(20) DEFAULT 'general', -- 'public', 'general', 'restricted', 'confidential'
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    -- Constraints
    UNIQUE(sub_area1_id, sub_area2_name), -- Prevent duplicate sub area 2 names in same sub area 1
    CHECK (LENGTH(sub_area2_name) >= 1)
);

-- Create indexes for optimal performance
-- Main Areas indexes
CREATE INDEX IF NOT EXISTS idx_main_areas_project_id ON main_areas(project_id);
CREATE INDEX IF NOT EXISTS idx_main_areas_name ON main_areas USING gin(to_tsvector('english', main_area_name));
CREATE INDEX IF NOT EXISTS idx_main_areas_status ON main_areas(status);
CREATE INDEX IF NOT EXISTS idx_main_areas_type ON main_areas(area_type);

-- Sub Areas 1 indexes
CREATE INDEX IF NOT EXISTS idx_sub_areas_1_main_area_id ON sub_areas_1(main_area_id);
CREATE INDEX IF NOT EXISTS idx_sub_areas_1_name ON sub_areas_1 USING gin(to_tsvector('english', sub_area1_name));
CREATE INDEX IF NOT EXISTS idx_sub_areas_1_status ON sub_areas_1(status);
CREATE INDEX IF NOT EXISTS idx_sub_areas_1_floor ON sub_areas_1(floor_number);

-- Sub Areas 2 indexes
CREATE INDEX IF NOT EXISTS idx_sub_areas_2_sub_area1_id ON sub_areas_2(sub_area1_id);
CREATE INDEX IF NOT EXISTS idx_sub_areas_2_name ON sub_areas_2 USING gin(to_tsvector('english', sub_area2_name));
CREATE INDEX IF NOT EXISTS idx_sub_areas_2_status ON sub_areas_2(status);
CREATE INDEX IF NOT EXISTS idx_sub_areas_2_room_number ON sub_areas_2(room_number);

-- Create a view for easy hierarchy queries
CREATE VIEW area_hierarchy_view AS
SELECT 
    ma.id as main_area_id,
    ma.project_id,
    ma.main_area_name,
    ma.area_code as main_area_code,
    ma.area_type as main_area_type,
    
    sa1.id as sub_area1_id,
    sa1.sub_area1_name,
    sa1.sub_area1_code,
    sa1.area_type as sub_area1_type,
    sa1.floor_number,
    
    sa2.id as sub_area2_id,
    sa2.sub_area2_name,
    sa2.sub_area2_code,
    sa2.area_type as sub_area2_type,
    sa2.room_number,
    
    -- Full hierarchy path
    ma.main_area_name as full_path_level1,
    CASE 
        WHEN sa1.sub_area1_name IS NOT NULL THEN 
            ma.main_area_name || ' > ' || sa1.sub_area1_name
        ELSE ma.main_area_name
    END as full_path_level2,
    CASE 
        WHEN sa2.sub_area2_name IS NOT NULL THEN 
            ma.main_area_name || ' > ' || sa1.sub_area1_name || ' > ' || sa2.sub_area2_name
        WHEN sa1.sub_area1_name IS NOT NULL THEN 
            ma.main_area_name || ' > ' || sa1.sub_area1_name
        ELSE ma.main_area_name
    END as full_path,
    
    -- Status information
    ma.status as main_area_status,
    sa1.status as sub_area1_status,
    sa2.status as sub_area2_status,
    
    -- Timestamps
    GREATEST(ma.created_at, sa1.created_at, sa2.created_at) as latest_created_at,
    GREATEST(ma.updated_at, sa1.updated_at, sa2.updated_at) as latest_updated_at
    
FROM main_areas ma
LEFT JOIN sub_areas_1 sa1 ON ma.id = sa1.main_area_id
LEFT JOIN sub_areas_2 sa2 ON sa1.id = sa2.sub_area1_id
WHERE ma.status = 'active'
AND (sa1.status IS NULL OR sa1.status = 'active')
AND (sa2.status IS NULL OR sa2.status = 'active');

-- API Functions for frontend integration

-- 1. Get main areas for a project
CREATE OR REPLACE FUNCTION get_main_areas(p_project_id UUID)
RETURNS TABLE (
    id UUID,
    main_area_name VARCHAR,
    area_code VARCHAR,
    area_type VARCHAR,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ma.id,
        ma.main_area_name,
        ma.area_code,
        ma.area_type,
        ma.description
    FROM main_areas ma
    WHERE ma.project_id = p_project_id
    AND ma.status = 'active'
    ORDER BY ma.main_area_name;
END;
$$ LANGUAGE plpgsql;

-- 2. Get sub areas 1 for a main area
CREATE OR REPLACE FUNCTION get_sub_areas_1(p_main_area_id UUID)
RETURNS TABLE (
    id UUID,
    sub_area1_name VARCHAR,
    sub_area1_code VARCHAR,
    area_type VARCHAR,
    floor_number INTEGER,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sa1.id,
        sa1.sub_area1_name,
        sa1.sub_area1_code,
        sa1.area_type,
        sa1.floor_number,
        sa1.description
    FROM sub_areas_1 sa1
    WHERE sa1.main_area_id = p_main_area_id
    AND sa1.status = 'active'
    ORDER BY sa1.floor_number NULLS LAST, sa1.sub_area1_name;
END;
$$ LANGUAGE plpgsql;

-- 3. Get sub areas 2 for a sub area 1
CREATE OR REPLACE FUNCTION get_sub_areas_2(p_sub_area1_id UUID)
RETURNS TABLE (
    id UUID,
    sub_area2_name VARCHAR,
    sub_area2_code VARCHAR,
    area_type VARCHAR,
    room_number VARCHAR,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sa2.id,
        sa2.sub_area2_name,
        sa2.sub_area2_code,
        sa2.area_type,
        sa2.room_number,
        sa2.description
    FROM sub_areas_2 sa2
    WHERE sa2.sub_area1_id = p_sub_area1_id
    AND sa2.status = 'active'
    ORDER BY sa2.room_number NULLS LAST, sa2.sub_area2_name;
END;
$$ LANGUAGE plpgsql;

-- 4. Search areas across all levels
CREATE OR REPLACE FUNCTION search_areas_hierarchy(
    p_project_id UUID,
    p_search_term TEXT DEFAULT '',
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    main_area_id UUID,
    main_area_name VARCHAR,
    sub_area1_id UUID,
    sub_area1_name VARCHAR,
    sub_area2_id UUID,
    sub_area2_name VARCHAR,
    full_path TEXT,
    area_level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ahv.main_area_id,
        ahv.main_area_name,
        ahv.sub_area1_id,
        ahv.sub_area1_name,
        ahv.sub_area2_id,
        ahv.sub_area2_name,
        ahv.full_path,
        CASE 
            WHEN ahv.sub_area2_id IS NOT NULL THEN 3
            WHEN ahv.sub_area1_id IS NOT NULL THEN 2
            ELSE 1
        END as area_level
    FROM area_hierarchy_view ahv
    WHERE ahv.project_id = p_project_id
    AND (
        p_search_term = '' 
        OR ahv.full_path ILIKE '%' || p_search_term || '%'
        OR ahv.main_area_name ILIKE '%' || p_search_term || '%'
        OR ahv.sub_area1_name ILIKE '%' || p_search_term || '%'
        OR ahv.sub_area2_name ILIKE '%' || p_search_term || '%'
    )
    ORDER BY 
        LENGTH(ahv.full_path),
        ahv.main_area_name,
        ahv.sub_area1_name NULLS LAST,
        ahv.sub_area2_name NULLS LAST
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 5. Create or find area (for autocomplete functionality)
CREATE OR REPLACE FUNCTION create_or_find_area(
    p_project_id UUID,
    p_main_area_name VARCHAR,
    p_sub_area1_name VARCHAR DEFAULT NULL,
    p_sub_area2_name VARCHAR DEFAULT NULL,
    p_created_by UUID DEFAULT NULL
)
RETURNS TABLE (
    main_area_id UUID,
    sub_area1_id UUID,
    sub_area2_id UUID,
    full_path TEXT,
    was_created BOOLEAN
) AS $$
DECLARE
    v_main_area_id UUID;
    v_sub_area1_id UUID;
    v_sub_area2_id UUID;
    v_was_created BOOLEAN := FALSE;
BEGIN
    -- Find or create main area
    SELECT id INTO v_main_area_id
    FROM main_areas 
    WHERE project_id = p_project_id 
    AND main_area_name = p_main_area_name;
    
    IF v_main_area_id IS NULL THEN
        INSERT INTO main_areas (project_id, main_area_name, created_by)
        VALUES (p_project_id, p_main_area_name, p_created_by)
        RETURNING id INTO v_main_area_id;
        v_was_created := TRUE;
    END IF;
    
    -- Handle sub area 1 if provided
    IF p_sub_area1_name IS NOT NULL THEN
        SELECT id INTO v_sub_area1_id
        FROM sub_areas_1 
        WHERE main_area_id = v_main_area_id 
        AND sub_area1_name = p_sub_area1_name;
        
        IF v_sub_area1_id IS NULL THEN
            INSERT INTO sub_areas_1 (main_area_id, sub_area1_name, created_by)
            VALUES (v_main_area_id, p_sub_area1_name, p_created_by)
            RETURNING id INTO v_sub_area1_id;
            v_was_created := TRUE;
        END IF;
        
        -- Handle sub area 2 if provided
        IF p_sub_area2_name IS NOT NULL THEN
            SELECT id INTO v_sub_area2_id
            FROM sub_areas_2 
            WHERE sub_area1_id = v_sub_area1_id 
            AND sub_area2_name = p_sub_area2_name;
            
            IF v_sub_area2_id IS NULL THEN
                INSERT INTO sub_areas_2 (sub_area1_id, sub_area2_name, created_by)
                VALUES (v_sub_area1_id, p_sub_area2_name, p_created_by)
                RETURNING id INTO v_sub_area2_id;
                v_was_created := TRUE;
            END IF;
        END IF;
    END IF;
    
    -- Return the result
    RETURN QUERY
    SELECT 
        v_main_area_id,
        v_sub_area1_id,
        v_sub_area2_id,
        CASE 
            WHEN p_sub_area2_name IS NOT NULL THEN 
                p_main_area_name || ' > ' || p_sub_area1_name || ' > ' || p_sub_area2_name
            WHEN p_sub_area1_name IS NOT NULL THEN 
                p_main_area_name || ' > ' || p_sub_area1_name
            ELSE p_main_area_name
        END,
        v_was_created;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for testing (using real project ID from your database)
INSERT INTO main_areas (project_id, main_area_name, area_code, area_type, created_by) VALUES
('4e8bdada-960e-4cde-a94c-ccfa94a133d7', 'Building A', 'BA', 'building', '29a51712-ca8a-494e-bdcd-73ee7cb666bc'),
('4e8bdada-960e-4cde-a94c-ccfa94a133d7', 'Building B', 'BB', 'building', '29a51712-ca8a-494e-bdcd-73ee7cb666bc'),
('4e8bdada-960e-4cde-a94c-ccfa94a133d7', 'Warehouse', 'WH', 'warehouse', '29a51712-ca8a-494e-bdcd-73ee7cb666bc'),
('4e8bdada-960e-4cde-a94c-ccfa94a133d7', 'Outdoor Areas', 'OD', 'outdoor', '29a51712-ca8a-494e-bdcd-73ee7cb666bc');

-- Insert sub areas 1 (floors, zones)
INSERT INTO sub_areas_1 (main_area_id, sub_area1_name, sub_area1_code, area_type, floor_number, created_by)
SELECT 
    ma.id,
    floor_name,
    floor_code,
    'floor',
    floor_num,
    ma.created_by
FROM main_areas ma
CROSS JOIN (VALUES 
    ('Floor 1', 'F1', 1),
    ('Floor 2', 'F2', 2),
    ('Floor 3', 'F3', 3)
) AS floors(floor_name, floor_code, floor_num)
WHERE ma.main_area_name IN ('Building A', 'Building B');

-- Insert sub areas 2 (rooms)
INSERT INTO sub_areas_2 (sub_area1_id, sub_area2_name, sub_area2_code, area_type, room_number, created_by)
SELECT 
    sa1.id,
    room_name,
    room_code,
    'room',
    room_num,
    sa1.created_by
FROM sub_areas_1 sa1
JOIN main_areas ma ON sa1.main_area_id = ma.id
CROSS JOIN (VALUES 
    ('Room 101', 'R101', '101'),
    ('Room 102', 'R102', '102'),
    ('Room 103', 'R103', '103'),
    ('Conference Room A', 'CRA', 'CR-A'),
    ('Conference Room B', 'CRB', 'CR-B')
) AS rooms(room_name, room_code, room_num)
WHERE sa1.sub_area1_name = 'Floor 1'
LIMIT 10; -- Limit to avoid too many test records

-- Example usage queries:
/*
-- Get all main areas for a project
SELECT * FROM get_main_areas('4e8bdada-960e-4cde-a94c-ccfa94a133d7');

-- Get sub areas 1 for Building A
SELECT * FROM get_sub_areas_1(
    (SELECT id FROM main_areas WHERE main_area_name = 'Building A' LIMIT 1)
);

-- Search for "room" across all areas
SELECT * FROM search_areas_hierarchy('4e8bdada-960e-4cde-a94c-ccfa94a133d7', 'room');

-- Create or find a complete hierarchy
SELECT * FROM create_or_find_area(
    '4e8bdada-960e-4cde-a94c-ccfa94a133d7',
    'Building C',
    'Floor 1',
    'Room 205',
    '29a51712-ca8a-494e-bdcd-73ee7cb666bc'
);

-- View the complete hierarchy
SELECT * FROM area_hierarchy_view 
WHERE project_id = '4e8bdada-960e-4cde-a94c-ccfa94a133d7'
ORDER BY full_path;
*/
