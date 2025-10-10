-- =====================================================================
-- RISK CATEGORIES IMPLEMENTATION - JUNCTION TABLE APPROACH
-- =====================================================================
-- This implements the recommended junction table solution for your requirements:
-- 1. Category name changes won't affect existing patrol records
-- 2. Efficient multi-select filtering with proper indexing
-- 3. Normalized design with foreign key constraints
-- =====================================================================

-- Drop existing tables if they exist (for clean installation)
DROP TABLE IF EXISTS patrol_risk_categories CASCADE;
DROP TABLE IF EXISTS risk_categories CASCADE;

-- =====================================================================
-- MAIN RISK CATEGORIES TABLE
-- =====================================================================
CREATE TABLE risk_categories (
    id SERIAL PRIMARY KEY,
    
    -- Display names (internationalization ready)
    category_name VARCHAR(100) NOT NULL,
    category_name_th VARCHAR(100),
    category_name_en VARCHAR(100),
    category_code VARCHAR(20) UNIQUE,
    
    -- Visual styling
    color VARCHAR(7) NOT NULL DEFAULT '#6B7280', -- Hex color
    icon VARCHAR(10),                            -- Emoji or icon class
    background_color VARCHAR(7),                 -- Background color for badges
    
    -- Category properties
    description TEXT,
    is_high_risk BOOLEAN NOT NULL DEFAULT false,
    requires_immediate_action BOOLEAN NOT NULL DEFAULT false,
    escalation_level VARCHAR(20) NOT NULL DEFAULT 'none' 
        CHECK (escalation_level IN ('none', 'supervisor', 'manager', 'executive')),
    
    -- Organization
    sort_order INTEGER NOT NULL DEFAULT 0,
    category_group VARCHAR(50),                  -- 'Equipment', 'Procedure', 'Environmental'
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- =====================================================================
-- JUNCTION TABLE - PATROL TO RISK CATEGORIES RELATIONSHIP
-- =====================================================================
CREATE TABLE patrol_risk_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign keys
    patrol_id UUID NOT NULL REFERENCES safety_patrols(id) ON DELETE CASCADE,
    risk_category_id INTEGER NOT NULL REFERENCES risk_categories(id) ON DELETE CASCADE,
    
    -- Relationship properties
    is_primary BOOLEAN NOT NULL DEFAULT false,   -- Mark the main category
    severity_level INTEGER CHECK (severity_level >= 1 AND severity_level <= 4),
    notes TEXT,                                  -- Category-specific notes
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Ensure no duplicate category per patrol
    UNIQUE(patrol_id, risk_category_id)
);

-- =====================================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================================

-- Fast category lookups
CREATE INDEX idx_risk_categories_active ON risk_categories(is_active) WHERE is_active = true;
CREATE INDEX idx_risk_categories_group ON risk_categories(category_group) WHERE category_group IS NOT NULL;
CREATE INDEX idx_risk_categories_high_risk ON risk_categories(is_high_risk) WHERE is_high_risk = true;
CREATE INDEX idx_risk_categories_sort ON risk_categories(sort_order, category_name);

-- Fast patrol filtering by categories (your multi-select requirement)
CREATE INDEX idx_patrol_risk_categories_patrol ON patrol_risk_categories(patrol_id);
CREATE INDEX idx_patrol_risk_categories_category ON patrol_risk_categories(risk_category_id);
CREATE INDEX idx_patrol_risk_categories_primary ON patrol_risk_categories(patrol_id, is_primary) WHERE is_primary = true;

-- Composite index for efficient filtering
CREATE INDEX idx_patrol_risk_categories_composite ON patrol_risk_categories(risk_category_id, patrol_id);

-- =====================================================================
-- RLS (ROW LEVEL SECURITY) POLICIES
-- =====================================================================

-- Enable RLS
ALTER TABLE risk_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrol_risk_categories ENABLE ROW LEVEL SECURITY;

-- Risk categories - read access for authenticated users
CREATE POLICY "Risk categories are viewable by authenticated users" 
    ON risk_categories FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Risk categories - admin can manage
CREATE POLICY "Admins can manage risk categories" 
    ON risk_categories FOR ALL 
    USING (auth.jwt() ->> 'role' = 'admin');

-- Patrol risk categories - users can view their organization's data
CREATE POLICY "Patrol risk categories viewable by org members" 
    ON patrol_risk_categories FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM safety_patrols p 
            WHERE p.id = patrol_risk_categories.patrol_id 
            AND p.created_by = auth.uid()
        )
    );

-- Patrol risk categories - users can manage their own
CREATE POLICY "Users can manage patrol risk categories" 
    ON patrol_risk_categories FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM safety_patrols p 
            WHERE p.id = patrol_risk_categories.patrol_id 
            AND p.created_by = auth.uid()
        )
    );

-- =====================================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for risk_categories
CREATE TRIGGER update_risk_categories_updated_at 
    BEFORE UPDATE ON risk_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- API FUNCTIONS FOR FRONTEND
-- =====================================================================

-- Function to get all active risk categories
CREATE OR REPLACE FUNCTION get_active_risk_categories()
RETURNS TABLE (
    id INTEGER,
    category_name VARCHAR(100),
    category_name_th VARCHAR(100),
    category_name_en VARCHAR(100),
    category_code VARCHAR(20),
    color VARCHAR(7),
    icon VARCHAR(10),
    background_color VARCHAR(7),
    description TEXT,
    is_high_risk BOOLEAN,
    requires_immediate_action BOOLEAN,
    escalation_level VARCHAR(20),
    sort_order INTEGER,
    category_group VARCHAR(50),
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rc.id,
        rc.category_name,
        rc.category_name_th,
        rc.category_name_en,
        rc.category_code,
        rc.color,
        rc.icon,
        rc.background_color,
        rc.description,
        rc.is_high_risk,
        rc.requires_immediate_action,
        rc.escalation_level,
        rc.sort_order,
        rc.category_group,
        rc.is_active,
        rc.created_at,
        rc.updated_at
    FROM risk_categories rc
    WHERE rc.is_active = true
    ORDER BY rc.sort_order, rc.category_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get patrols with their risk categories (for display)
CREATE OR REPLACE FUNCTION get_patrols_with_risk_categories()
RETURNS TABLE (
    patrol_id UUID,
    patrol_title VARCHAR(200),
    patrol_description TEXT,
    risk_score INTEGER,
    status VARCHAR(20),
    location_main_area_id INTEGER,
    location_sub_area_1_id INTEGER,
    location_sub_area_2_id INTEGER,
    risk_category_ids INTEGER[],
    risk_categories JSONB,
    primary_risk_category JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.id as patrol_id,
        sp.title as patrol_title,
        sp.description as patrol_description,
        sp.risk_score,
        sp.status,
        sp.location_main_area_id,
        sp.location_sub_area_1_id,
        sp.location_sub_area_2_id,
        -- Array of category IDs for easy filtering
        ARRAY(
            SELECT prc.risk_category_id 
            FROM patrol_risk_categories prc 
            WHERE prc.patrol_id = sp.id
            ORDER BY prc.is_primary DESC, prc.created_at
        ) as risk_category_ids,
        -- Full category objects as JSON
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', rc.id,
                    'categoryName', rc.category_name,
                    'categoryNameTh', rc.category_name_th,
                    'categoryNameEn', rc.category_name_en,
                    'categoryCode', rc.category_code,
                    'color', rc.color,
                    'icon', rc.icon,
                    'backgroundColor', rc.background_color,
                    'isHighRisk', rc.is_high_risk,
                    'requiresImmediateAction', rc.requires_immediate_action,
                    'escalationLevel', rc.escalation_level,
                    'categoryGroup', rc.category_group,
                    'isPrimary', prc.is_primary,
                    'severityLevel', prc.severity_level,
                    'notes', prc.notes
                ) ORDER BY prc.is_primary DESC, prc.created_at
            ) FILTER (WHERE rc.id IS NOT NULL),
            '[]'::jsonb
        ) as risk_categories,
        -- Primary category as separate field
        (
            SELECT jsonb_build_object(
                'id', rc.id,
                'categoryName', rc.category_name,
                'categoryNameTh', rc.category_name_th,
                'color', rc.color,
                'icon', rc.icon,
                'isHighRisk', rc.is_high_risk
            )
            FROM patrol_risk_categories prc
            JOIN risk_categories rc ON rc.id = prc.risk_category_id
            WHERE prc.patrol_id = sp.id AND prc.is_primary = true
            LIMIT 1
        ) as primary_risk_category,
        sp.created_at
    FROM safety_patrols sp
    LEFT JOIN patrol_risk_categories prc ON prc.patrol_id = sp.id
    LEFT JOIN risk_categories rc ON rc.id = prc.risk_category_id
    GROUP BY sp.id, sp.title, sp.description, sp.risk_score, sp.status, 
             sp.location_main_area_id, sp.location_sub_area_1_id, sp.location_sub_area_2_id, sp.created_at
    ORDER BY sp.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to filter patrols by risk categories (your multi-select requirement)
CREATE OR REPLACE FUNCTION get_patrols_by_risk_categories(category_ids INTEGER[])
RETURNS TABLE (
    patrol_id UUID,
    patrol_title VARCHAR(200),
    risk_score INTEGER,
    status VARCHAR(20),
    risk_category_ids INTEGER[],
    risk_categories JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        sp.id as patrol_id,
        sp.title as patrol_title,
        sp.risk_score,
        sp.status,
        -- Array of category IDs
        ARRAY(
            SELECT prc.risk_category_id 
            FROM patrol_risk_categories prc 
            WHERE prc.patrol_id = sp.id
        ) as risk_category_ids,
        -- Category details as JSON
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', rc.id,
                        'categoryName', rc.category_name,
                        'color', rc.color,
                        'icon', rc.icon,
                        'isPrimary', prc.is_primary
                    )
                )
                FROM patrol_risk_categories prc
                JOIN risk_categories rc ON rc.id = prc.risk_category_id
                WHERE prc.patrol_id = sp.id
            ),
            '[]'::jsonb
        ) as risk_categories,
        sp.created_at
    FROM safety_patrols sp
    WHERE EXISTS (
        SELECT 1 
        FROM patrol_risk_categories prc 
        WHERE prc.patrol_id = sp.id 
        AND prc.risk_category_id = ANY(category_ids)
    )
    ORDER BY sp.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add risk categories to a patrol
CREATE OR REPLACE FUNCTION add_risk_categories_to_patrol(
    p_patrol_id UUID,
    p_category_ids INTEGER[],
    p_primary_category_id INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    category_id INTEGER;
BEGIN
    -- Delete existing categories for this patrol
    DELETE FROM patrol_risk_categories WHERE patrol_id = p_patrol_id;
    
    -- Add new categories
    FOREACH category_id IN ARRAY p_category_ids
    LOOP
        INSERT INTO patrol_risk_categories (patrol_id, risk_category_id, is_primary, created_by)
        VALUES (
            p_patrol_id, 
            category_id, 
            (category_id = p_primary_category_id),
            auth.uid()
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- SAMPLE DATA
-- =====================================================================

-- Insert sample risk categories
INSERT INTO risk_categories (
    category_name, category_name_th, category_name_en, category_code,
    color, icon, is_high_risk, requires_immediate_action, escalation_level,
    sort_order, category_group
) VALUES 
-- Equipment-related risks
('High Work', 'งานที่ความสูง', 'High Work', 'HW', '#3B82F6', '🏗️', true, false, 'manager', 1, 'Equipment'),
('Electricity', 'ไฟฟ้า', 'Electricity', 'ELEC', '#EAB308', '⚡', true, true, 'executive', 2, 'Equipment'),
('Heavy Machinery', 'เครื่องจักรหนัก', 'Heavy Machinery', 'MACH', '#DC2626', '🚜', true, false, 'supervisor', 3, 'Equipment'),
('Chemical Handling', 'การจัดการสารเคมี', 'Chemical Handling', 'CHEM', '#9333EA', '🧪', true, true, 'manager', 4, 'Equipment'),

-- Procedural risks
('Lifting & Moving', 'การยกและขนย้าย', 'Lifting & Moving', 'LIFT', '#059669', '📦', false, false, 'supervisor', 5, 'Procedure'),
('Hot Work', 'งานร้อน', 'Hot Work', 'HOT', '#EA580C', '🔥', true, false, 'manager', 6, 'Procedure'),
('Confined Space', 'พื้นที่จำกัด', 'Confined Space', 'CONF', '#7C2D12', '🚪', true, true, 'executive', 7, 'Procedure'),

-- Environmental risks
('Noise Exposure', 'เสียงดัง', 'Noise Exposure', 'NOISE', '#6366F1', '🔊', false, false, 'none', 8, 'Environmental'),
('Air Quality', 'คุณภาพอากาศ', 'Air Quality', 'AIR', '#10B981', '💨', false, false, 'supervisor', 9, 'Environmental'),
('Temperature', 'อุณหภูมิ', 'Temperature', 'TEMP', '#F59E0B', '🌡️', false, false, 'none', 10, 'Environmental');

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON risk_categories TO authenticated;
GRANT ALL ON patrol_risk_categories TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE risk_categories_id_seq TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE risk_categories IS 'Master table for safety risk categories. Name changes here do not affect existing patrol records.';
COMMENT ON TABLE patrol_risk_categories IS 'Junction table linking patrols to risk categories. Enables multi-select filtering.';
COMMENT ON FUNCTION get_patrols_by_risk_categories(INTEGER[]) IS 'Efficiently filter patrols by multiple risk categories using array overlap.';

COMMIT;
