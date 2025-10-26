-- Hierarchical Areas Schema for QSHE System
-- This schema provides proper nesting of areas within projects

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS area_hierarchies CASCADE;
DROP TABLE IF EXISTS project_areas CASCADE;

-- Create the main project_areas table with hierarchical structure
CREATE TABLE project_areas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Area identification
    area_name VARCHAR(255) NOT NULL,
    area_code VARCHAR(50), -- Optional area code/identifier
    area_type VARCHAR(50) DEFAULT 'general', -- 'building', 'floor', 'room', 'zone', 'outdoor', 'general'
    
    -- Hierarchical structure using parent-child relationship
    parent_area_id UUID REFERENCES project_areas(id) ON DELETE CASCADE,
    area_level INTEGER NOT NULL DEFAULT 1, -- 1=main, 2=sub1, 3=sub2, 4=specific
    area_path TEXT, -- Generated path like "Building A > Floor 2 > Room 205"
    
    -- Area details
    description TEXT,
    area_size DECIMAL(10,2), -- Square meters
    capacity INTEGER, -- Maximum occupancy
    
    -- Location coordinates (optional)
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    floor_plan_x INTEGER, -- X coordinate on floor plan
    floor_plan_y INTEGER, -- Y coordinate on floor plan
    
    -- Status and metadata
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'under_construction'
    is_hazardous BOOLEAN DEFAULT FALSE,
    requires_permit BOOLEAN DEFAULT FALSE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    -- Constraints
    UNIQUE(project_id, area_name, parent_area_id), -- Prevent duplicate names at same level
    CHECK (area_level >= 1 AND area_level <= 4),
    CHECK (area_level = 1 OR parent_area_id IS NOT NULL) -- Level 1 has no parent, others must have parent
);

-- Create indexes for performance
CREATE INDEX idx_project_areas_project_id ON project_areas(project_id);
CREATE INDEX idx_project_areas_parent_id ON project_areas(parent_area_id);
CREATE INDEX idx_project_areas_level ON project_areas(area_level);
CREATE INDEX idx_project_areas_path ON project_areas USING gin(to_tsvector('english', area_path));
CREATE INDEX idx_project_areas_name ON project_areas USING gin(to_tsvector('english', area_name));

-- Create a materialized view for easier querying of the hierarchy
CREATE MATERIALIZED VIEW area_hierarchies AS
WITH RECURSIVE area_tree AS (
    -- Base case: root areas (level 1)
    SELECT 
        id,
        project_id,
        area_name,
        area_code,
        area_type,
        parent_area_id,
        area_level,
        area_name as main_area,
        NULL::VARCHAR as sub_area_1,
        NULL::VARCHAR as sub_area_2,
        NULL::VARCHAR as specific_location,
        area_name as full_path,
        ARRAY[id] as path_ids,
        status,
        created_at
    FROM project_areas 
    WHERE area_level = 1
    
    UNION ALL
    
    -- Recursive case: child areas
    SELECT 
        pa.id,
        pa.project_id,
        pa.area_name,
        pa.area_code,
        pa.area_type,
        pa.parent_area_id,
        pa.area_level,
        at.main_area,
        CASE 
            WHEN pa.area_level = 2 THEN pa.area_name 
            ELSE at.sub_area_1 
        END as sub_area_1,
        CASE 
            WHEN pa.area_level = 3 THEN pa.area_name 
            ELSE at.sub_area_2 
        END as sub_area_2,
        CASE 
            WHEN pa.area_level = 4 THEN pa.area_name 
            ELSE at.specific_location 
        END as specific_location,
        at.full_path || ' > ' || pa.area_name as full_path,
        at.path_ids || pa.id as path_ids,
        pa.status,
        pa.created_at
    FROM project_areas pa
    JOIN area_tree at ON pa.parent_area_id = at.id
)
SELECT * FROM area_tree;

-- Create index on the materialized view
CREATE INDEX idx_area_hierarchies_project_id ON area_hierarchies(project_id);
CREATE INDEX idx_area_hierarchies_main_area ON area_hierarchies(main_area);
CREATE INDEX idx_area_hierarchies_full_path ON area_hierarchies USING gin(to_tsvector('english', full_path));

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_area_hierarchies()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY area_hierarchies;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to refresh the view when project_areas changes
CREATE TRIGGER trigger_refresh_area_hierarchies
    AFTER INSERT OR UPDATE OR DELETE ON project_areas
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_area_hierarchies();

-- Function to update area_path when hierarchy changes
CREATE OR REPLACE FUNCTION update_area_path()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the path for the current record and all its descendants
    WITH RECURSIVE path_update AS (
        -- Start with the changed record
        SELECT 
            NEW.id,
            CASE 
                WHEN NEW.parent_area_id IS NULL THEN NEW.area_name
                ELSE (
                    SELECT pa.area_path || ' > ' || NEW.area_name 
                    FROM project_areas pa 
                    WHERE pa.id = NEW.parent_area_id
                )
            END as new_path
        
        UNION ALL
        
        -- Include all descendants
        SELECT 
            pa.id,
            pu.new_path || ' > ' || pa.area_name
        FROM project_areas pa
        JOIN path_update pu ON pa.parent_area_id = pu.id
    )
    UPDATE project_areas 
    SET 
        area_path = path_update.new_path,
        updated_at = NOW()
    FROM path_update 
    WHERE project_areas.id = path_update.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update paths when hierarchy changes
CREATE TRIGGER trigger_update_area_path
    AFTER INSERT OR UPDATE OF parent_area_id, area_name ON project_areas
    FOR EACH ROW
    EXECUTE FUNCTION update_area_path();

-- Insert sample data for testing
INSERT INTO project_areas (project_id, area_name, area_level, area_type, created_by) VALUES
-- Main areas (level 1)
('00000000-0000-0000-0000-000000000001', 'Building A', 1, 'building', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000001', 'Building B', 1, 'building', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000001', 'Outdoor Areas', 1, 'outdoor', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000001', 'Warehouse', 1, 'building', '00000000-0000-0000-0000-000000000001');

-- Sub areas level 1 (level 2)
INSERT INTO project_areas (project_id, area_name, area_level, area_type, parent_area_id, created_by) 
SELECT 
    project_id,
    sub_area,
    2,
    'floor',
    id,
    created_by
FROM project_areas pa
CROSS JOIN (VALUES 
    ('Floor 1'), ('Floor 2'), ('Floor 3')
) AS floors(sub_area)
WHERE pa.area_name IN ('Building A', 'Building B') AND pa.area_level = 1;

-- Sub areas level 2 (level 3) - Rooms
INSERT INTO project_areas (project_id, area_name, area_level, area_type, parent_area_id, created_by)
SELECT 
    pa.project_id,
    room_name,
    3,
    'room',
    pa.id,
    pa.created_by
FROM project_areas pa
CROSS JOIN (VALUES 
    ('Room 101'), ('Room 102'), ('Room 103'), 
    ('Room 201'), ('Room 202'), ('Room 203'),
    ('Conference Room A'), ('Conference Room B')
) AS rooms(room_name)
WHERE pa.area_name LIKE 'Floor%' AND pa.area_level = 2;

-- Specific locations (level 4)
INSERT INTO project_areas (project_id, area_name, area_level, area_type, parent_area_id, created_by)
SELECT 
    pa.project_id,
    location_name,
    4,
    'zone',
    pa.id,
    pa.created_by
FROM project_areas pa
CROSS JOIN (VALUES 
    ('North Corner'), ('South Corner'), ('Center Area'), ('Near Window')
) AS locations(location_name)
WHERE pa.area_name LIKE 'Room%' AND pa.area_level = 3
LIMIT 20; -- Limit to avoid too many records

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW area_hierarchies;

-- Create a function to search areas with autocomplete
CREATE OR REPLACE FUNCTION search_project_areas(
    p_project_id UUID,
    p_query TEXT DEFAULT '',
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    area_name VARCHAR,
    area_level INTEGER,
    main_area VARCHAR,
    sub_area_1 VARCHAR,
    sub_area_2 VARCHAR,
    specific_location VARCHAR,
    full_path TEXT,
    area_type VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ah.id,
        ah.area_name,
        ah.area_level,
        ah.main_area,
        ah.sub_area_1,
        ah.sub_area_2,
        ah.specific_location,
        ah.full_path,
        ah.area_type
    FROM area_hierarchies ah
    WHERE ah.project_id = p_project_id
    AND ah.status = 'active'
    AND (
        p_query = '' 
        OR ah.full_path ILIKE '%' || p_query || '%'
        OR ah.area_name ILIKE '%' || p_query || '%'
    )
    ORDER BY 
        ah.area_level,
        LENGTH(ah.area_name),
        ah.area_name
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create function to get area suggestions for dropdown
CREATE OR REPLACE FUNCTION get_area_suggestions(
    p_project_id UUID,
    p_main_area TEXT DEFAULT '',
    p_sub_area_1 TEXT DEFAULT '',
    p_level INTEGER DEFAULT 1
)
RETURNS TABLE (
    area_name VARCHAR,
    full_path TEXT,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    CASE 
        WHEN p_level = 1 THEN
            -- Get main areas
            SELECT DISTINCT 
                ah.main_area as area_name,
                ah.main_area as full_path,
                COUNT(*) as count
            FROM area_hierarchies ah
            WHERE ah.project_id = p_project_id
            AND ah.status = 'active'
            AND (p_main_area = '' OR ah.main_area ILIKE '%' || p_main_area || '%')
            GROUP BY ah.main_area
            ORDER BY ah.main_area
            
        WHEN p_level = 2 THEN
            -- Get sub area 1 options for given main area
            SELECT DISTINCT 
                ah.sub_area_1 as area_name,
                ah.main_area || ' > ' || ah.sub_area_1 as full_path,
                COUNT(*) as count
            FROM area_hierarchies ah
            WHERE ah.project_id = p_project_id
            AND ah.status = 'active'
            AND ah.main_area = p_main_area
            AND ah.sub_area_1 IS NOT NULL
            AND (p_sub_area_1 = '' OR ah.sub_area_1 ILIKE '%' || p_sub_area_1 || '%')
            GROUP BY ah.main_area, ah.sub_area_1
            ORDER BY ah.sub_area_1
            
        WHEN p_level = 3 THEN
            -- Get sub area 2 options for given main area and sub area 1
            SELECT DISTINCT 
                ah.sub_area_2 as area_name,
                ah.main_area || ' > ' || ah.sub_area_1 || ' > ' || ah.sub_area_2 as full_path,
                COUNT(*) as count
            FROM area_hierarchies ah
            WHERE ah.project_id = p_project_id
            AND ah.status = 'active'
            AND ah.main_area = p_main_area
            AND ah.sub_area_1 = p_sub_area_1
            AND ah.sub_area_2 IS NOT NULL
            GROUP BY ah.main_area, ah.sub_area_1, ah.sub_area_2
            ORDER BY ah.sub_area_2
            
        ELSE
            -- Get specific locations for given hierarchy
            SELECT DISTINCT 
                ah.specific_location as area_name,
                ah.full_path,
                COUNT(*) as count
            FROM area_hierarchies ah
            WHERE ah.project_id = p_project_id
            AND ah.status = 'active'
            AND ah.main_area = p_main_area
            AND ah.sub_area_1 = COALESCE(p_sub_area_1, ah.sub_area_1)
            AND ah.specific_location IS NOT NULL
            GROUP BY ah.main_area, ah.sub_area_1, ah.sub_area_2, ah.specific_location, ah.full_path
            ORDER BY ah.specific_location
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions (adjust user as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON project_areas TO qshe_user;
-- GRANT SELECT ON area_hierarchies TO qshe_user;
-- GRANT EXECUTE ON FUNCTION search_project_areas TO qshe_user;
-- GRANT EXECUTE ON FUNCTION get_area_suggestions TO qshe_user;

-- Example queries for testing:
/*
-- Search all areas in a project
SELECT * FROM search_project_areas('00000000-0000-0000-0000-000000000001');

-- Search for "room" in project
SELECT * FROM search_project_areas('00000000-0000-0000-0000-000000000001', 'room');

-- Get main area suggestions
SELECT * FROM get_area_suggestions('00000000-0000-0000-0000-000000000001', '', '', 1);

-- Get sub area 1 suggestions for "Building A"
SELECT * FROM get_area_suggestions('00000000-0000-0000-0000-000000000001', 'Building A', '', 2);

-- Get sub area 2 suggestions for "Building A > Floor 1"
SELECT * FROM get_area_suggestions('00000000-0000-0000-0000-000000000001', 'Building A', 'Floor 1', 3);
*/
