-- Safety Patrol CRUD Functions for Real Supabase Integration
-- Execute this in Supabase SQL Editor

-- Function to create a new safety patrol with all relationships
CREATE OR REPLACE FUNCTION create_safety_patrol(
    p_title TEXT,
    p_description TEXT,
    p_patrol_type TEXT DEFAULT 'scheduled',
    p_project_code VARCHAR(50),
    p_location TEXT,
    p_likelihood INTEGER,
    p_severity INTEGER,
    p_immediate_hazard BOOLEAN DEFAULT FALSE,
    p_work_stopped BOOLEAN DEFAULT FALSE,
    p_workers_present INTEGER DEFAULT 0,
    p_inspector_id UUID,
    p_witnesses TEXT[] DEFAULT '{}',
    p_regulation_reference TEXT DEFAULT NULL,
    p_legal_requirement BOOLEAN DEFAULT FALSE,
    p_risk_category_ids INTEGER[] DEFAULT '{}',
    p_risk_item_ids INTEGER[] DEFAULT '{}'
)
RETURNS TABLE (
    patrol_id UUID,
    patrol_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_patrol_id UUID;
    v_patrol_number VARCHAR(50);
    v_project_id UUID;
    v_category_id INTEGER;
    v_item_id INTEGER;
BEGIN
    -- Get project ID from project_code
    SELECT id INTO v_project_id 
    FROM projects 
    WHERE project_code = p_project_code AND status = 'active';
    
    IF v_project_id IS NULL THEN
        RAISE EXCEPTION 'Project with code % not found or not active', p_project_code;
    END IF;
    
    -- Generate patrol number (format: SP-YYYY-NNN)
    SELECT 'SP-' || EXTRACT(YEAR FROM NOW()) || '-' || 
           LPAD((COALESCE(MAX(CAST(SUBSTRING(patrol_number FROM '\d+$') AS INTEGER)), 0) + 1)::TEXT, 3, '0')
    INTO v_patrol_number
    FROM patrols 
    WHERE patrol_number LIKE 'SP-' || EXTRACT(YEAR FROM NOW()) || '-%';
    
    -- Insert main patrol record
    INSERT INTO patrols (
        title,
        date,
        status,
        project_id,
        created_by,
        created_at,
        updated_at,
        project_code
    ) VALUES (
        p_title,
        NOW()::DATE,
        'draft',
        v_project_id,
        p_inspector_id,
        NOW(),
        NOW(),
        p_project_code
    ) RETURNING id INTO v_patrol_id;
    
    -- For now, we'll use the basic patrols table
    -- In future, we can extend this to use the full safety_patrols schema
    
    RETURN QUERY
    SELECT 
        v_patrol_id,
        v_patrol_id::TEXT, -- Using ID as patrol number for now
        NOW();
        
END;
$$;

-- Function to get safety patrols for a project
CREATE OR REPLACE FUNCTION get_safety_patrols(p_project_code VARCHAR(50) DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    title TEXT,
    date DATE,
    status TEXT,
    project_code VARCHAR(50),
    project_name TEXT,
    created_by UUID,
    creator_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.date,
        p.status::TEXT,
        p.project_code,
        proj.name as project_name,
        p.created_by,
        COALESCE(u.first_name || ' ' || u.last_name, u.email) as creator_name,
        p.created_at,
        p.updated_at
    FROM patrols p
    LEFT JOIN projects proj ON p.project_id = proj.id
    LEFT JOIN users u ON p.created_by = u.id
    WHERE (p_project_code IS NULL OR p.project_code = p_project_code)
    ORDER BY p.created_at DESC;
END;
$$;

-- Function to update safety patrol
CREATE OR REPLACE FUNCTION update_safety_patrol(
    p_patrol_id UUID,
    p_title TEXT,
    p_status TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE patrols 
    SET 
        title = p_title,
        status = COALESCE(p_status, status),
        updated_at = NOW()
    WHERE id = p_patrol_id;
    
    RETURN FOUND;
END;
$$;

-- Function to delete safety patrol
CREATE OR REPLACE FUNCTION delete_safety_patrol(p_patrol_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM patrols WHERE id = p_patrol_id;
    RETURN FOUND;
END;
$$;

-- Function to get single patrol details
CREATE OR REPLACE FUNCTION get_patrol_details(p_patrol_id UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    date DATE,
    status TEXT,
    project_code VARCHAR(50),
    project_name TEXT,
    created_by UUID,
    creator_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.date,
        p.status::TEXT,
        p.project_code,
        proj.name as project_name,
        p.created_by,
        COALESCE(u.first_name || ' ' || u.last_name, u.email) as creator_name,
        p.created_at,
        p.updated_at
    FROM patrols p
    LEFT JOIN projects proj ON p.project_id = proj.id
    LEFT JOIN users u ON p.created_by = u.id
    WHERE p.id = p_patrol_id;
END;
$$;

-- Grant permissions for all functions
GRANT EXECUTE ON FUNCTION create_safety_patrol TO authenticated;
GRANT EXECUTE ON FUNCTION get_safety_patrols TO authenticated;
GRANT EXECUTE ON FUNCTION update_safety_patrol TO authenticated;
GRANT EXECUTE ON FUNCTION delete_safety_patrol TO authenticated;
GRANT EXECUTE ON FUNCTION get_patrol_details TO authenticated;

-- Grant permissions to anon for read operations
GRANT EXECUTE ON FUNCTION get_safety_patrols TO anon;
GRANT EXECUTE ON FUNCTION get_patrol_details TO anon;

-- Test the functions
SELECT 'Safety patrol functions created successfully' as result;
