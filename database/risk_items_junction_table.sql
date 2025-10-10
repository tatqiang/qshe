-- =====================================================================
-- RISK ITEMS IMPLEMENTATION - JUNCTION TABLE APPROACH
-- =====================================================================
-- This implements the same junction table solution for Risk Items:
-- 1. Risk item name changes won't affect existing patrol records
-- 2. Efficient multi-select filtering with proper indexing
-- 3. Normalized design with foreign key constraints
-- 4. Consistent with risk_categories implementation
-- =====================================================================

-- Drop existing tables if they exist (for clean installation)
DROP TABLE IF EXISTS patrol_risk_items CASCADE;
DROP TABLE IF EXISTS risk_items CASCADE;

-- =====================================================================
-- MAIN RISK ITEMS TABLE
-- =====================================================================
CREATE TABLE risk_items (
    id SERIAL PRIMARY KEY,
    
    -- Display names (internationalization ready)
    item_name VARCHAR(200) NOT NULL,
    item_name_th VARCHAR(200),
    item_name_en VARCHAR(200),
    item_code VARCHAR(30) UNIQUE,
    
    -- Visual styling
    color VARCHAR(7) NOT NULL DEFAULT '#6B7280', -- Hex color
    icon VARCHAR(10),                            -- Emoji or icon class
    background_color VARCHAR(7),                 -- Background color for badges
    
    -- Item properties
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'equipment' 
        CHECK (category IN ('equipment', 'procedure', 'environmental')),
    is_high_priority BOOLEAN NOT NULL DEFAULT false,
    requires_immediate_attention BOOLEAN NOT NULL DEFAULT false,
    escalation_level VARCHAR(20) NOT NULL DEFAULT 'none' 
        CHECK (escalation_level IN ('none', 'supervisor', 'manager', 'executive')),
    
    -- Organization
    sort_order INTEGER NOT NULL DEFAULT 0,
    item_group VARCHAR(50),                      -- Sub-grouping within categories
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- =====================================================================
-- JUNCTION TABLE - PATROL TO RISK ITEMS RELATIONSHIP
-- =====================================================================
CREATE TABLE patrol_risk_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign keys
    patrol_id UUID NOT NULL REFERENCES safety_patrols(id) ON DELETE CASCADE,
    risk_item_id INTEGER NOT NULL REFERENCES risk_items(id) ON DELETE CASCADE,
    
    -- Relationship properties
    is_primary BOOLEAN NOT NULL DEFAULT false,   -- Mark the main item
    severity_level INTEGER CHECK (severity_level >= 1 AND severity_level <= 4),
    likelihood_level INTEGER CHECK (likelihood_level >= 1 AND likelihood_level <= 4),
    risk_score INTEGER,                          -- Calculated from severity × likelihood
    notes TEXT,                                  -- Item-specific notes
    action_required TEXT,                        -- Specific action for this item
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Ensure no duplicate item per patrol
    UNIQUE(patrol_id, risk_item_id)
);

-- =====================================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================================

-- Fast item lookups
CREATE INDEX idx_risk_items_active ON risk_items(is_active) WHERE is_active = true;
CREATE INDEX idx_risk_items_category ON risk_items(category);
CREATE INDEX idx_risk_items_high_priority ON risk_items(is_high_priority) WHERE is_high_priority = true;
CREATE INDEX idx_risk_items_sort ON risk_items(category, sort_order, item_name);

-- Fast patrol filtering by items (multi-select requirement)
CREATE INDEX idx_patrol_risk_items_patrol ON patrol_risk_items(patrol_id);
CREATE INDEX idx_patrol_risk_items_item ON patrol_risk_items(risk_item_id);
CREATE INDEX idx_patrol_risk_items_primary ON patrol_risk_items(patrol_id, is_primary) WHERE is_primary = true;

-- Composite index for efficient filtering
CREATE INDEX idx_patrol_risk_items_composite ON patrol_risk_items(risk_item_id, patrol_id);

-- Risk score filtering
CREATE INDEX idx_patrol_risk_items_risk_score ON patrol_risk_items(risk_score) WHERE risk_score IS NOT NULL;

-- =====================================================================
-- RLS (ROW LEVEL SECURITY) POLICIES
-- =====================================================================

-- Enable RLS
ALTER TABLE risk_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrol_risk_items ENABLE ROW LEVEL SECURITY;

-- Risk items - read access for authenticated users
CREATE POLICY "Risk items are viewable by authenticated users" 
    ON risk_items FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Risk items - admin can manage
CREATE POLICY "Admins can manage risk items" 
    ON risk_items FOR ALL 
    USING (auth.jwt() ->> 'role' = 'admin');

-- Patrol risk items - users can view their organization's data
CREATE POLICY "Patrol risk items viewable by org members" 
    ON patrol_risk_items FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM safety_patrols p 
            WHERE p.id = patrol_risk_items.patrol_id 
            AND p.created_by = auth.uid()
        )
    );

-- Patrol risk items - users can manage their own
CREATE POLICY "Users can manage patrol risk items" 
    ON patrol_risk_items FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM safety_patrols p 
            WHERE p.id = patrol_risk_items.patrol_id 
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

-- Trigger for risk_items
CREATE TRIGGER update_risk_items_updated_at 
    BEFORE UPDATE ON risk_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-calculate risk score
CREATE OR REPLACE FUNCTION calculate_risk_score()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.severity_level IS NOT NULL AND NEW.likelihood_level IS NOT NULL THEN
        NEW.risk_score = NEW.severity_level * NEW.likelihood_level;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-calculate risk scores
CREATE TRIGGER calculate_patrol_risk_item_score 
    BEFORE INSERT OR UPDATE ON patrol_risk_items 
    FOR EACH ROW EXECUTE FUNCTION calculate_risk_score();

-- =====================================================================
-- API FUNCTIONS FOR FRONTEND
-- =====================================================================

-- Function to get all active risk items
CREATE OR REPLACE FUNCTION get_active_risk_items()
RETURNS TABLE (
    id INTEGER,
    item_name VARCHAR(200),
    item_name_th VARCHAR(200),
    item_name_en VARCHAR(200),
    item_code VARCHAR(30),
    color VARCHAR(7),
    icon VARCHAR(10),
    background_color VARCHAR(7),
    description TEXT,
    category VARCHAR(50),
    is_high_priority BOOLEAN,
    requires_immediate_attention BOOLEAN,
    escalation_level VARCHAR(20),
    sort_order INTEGER,
    item_group VARCHAR(50),
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ri.id,
        ri.item_name,
        ri.item_name_th,
        ri.item_name_en,
        ri.item_code,
        ri.color,
        ri.icon,
        ri.background_color,
        ri.description,
        ri.category,
        ri.is_high_priority,
        ri.requires_immediate_attention,
        ri.escalation_level,
        ri.sort_order,
        ri.item_group,
        ri.is_active,
        ri.created_at,
        ri.updated_at
    FROM risk_items ri
    WHERE ri.is_active = true
    ORDER BY ri.category, ri.sort_order, ri.item_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get risk items by category
CREATE OR REPLACE FUNCTION get_risk_items_by_category(p_category VARCHAR(50))
RETURNS TABLE (
    id INTEGER,
    item_name VARCHAR(200),
    item_name_th VARCHAR(200),
    item_name_en VARCHAR(200),
    item_code VARCHAR(30),
    color VARCHAR(7),
    icon VARCHAR(10),
    is_high_priority BOOLEAN,
    sort_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ri.id,
        ri.item_name,
        ri.item_name_th,
        ri.item_name_en,
        ri.item_code,
        ri.color,
        ri.icon,
        ri.is_high_priority,
        ri.sort_order
    FROM risk_items ri
    WHERE ri.is_active = true 
    AND ri.category = p_category
    ORDER BY ri.sort_order, ri.item_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get patrols with their risk items (for display)
CREATE OR REPLACE FUNCTION get_patrols_with_risk_items()
RETURNS TABLE (
    patrol_id UUID,
    patrol_title VARCHAR(200),
    patrol_description TEXT,
    risk_score INTEGER,
    status VARCHAR(20),
    location_main_area_id INTEGER,
    location_sub_area_1_id INTEGER,
    location_sub_area_2_id INTEGER,
    risk_item_ids INTEGER[],
    risk_items JSONB,
    primary_risk_item JSONB,
    high_priority_items_count INTEGER,
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
        -- Array of item IDs for easy filtering
        ARRAY(
            SELECT pri.risk_item_id 
            FROM patrol_risk_items pri 
            WHERE pri.patrol_id = sp.id
            ORDER BY pri.is_primary DESC, pri.risk_score DESC NULLS LAST, pri.created_at
        ) as risk_item_ids,
        -- Full item objects as JSON
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', ri.id,
                    'itemName', ri.item_name,
                    'itemNameTh', ri.item_name_th,
                    'itemNameEn', ri.item_name_en,
                    'itemCode', ri.item_code,
                    'category', ri.category,
                    'color', ri.color,
                    'icon', ri.icon,
                    'backgroundColor', ri.background_color,
                    'isHighPriority', ri.is_high_priority,
                    'requiresImmediateAttention', ri.requires_immediate_attention,
                    'escalationLevel', ri.escalation_level,
                    'itemGroup', ri.item_group,
                    'isPrimary', pri.is_primary,
                    'severityLevel', pri.severity_level,
                    'likelihoodLevel', pri.likelihood_level,
                    'riskScore', pri.risk_score,
                    'notes', pri.notes,
                    'actionRequired', pri.action_required
                ) ORDER BY pri.is_primary DESC, pri.risk_score DESC NULLS LAST, pri.created_at
            ) FILTER (WHERE ri.id IS NOT NULL),
            '[]'::jsonb
        ) as risk_items,
        -- Primary item as separate field
        (
            SELECT jsonb_build_object(
                'id', ri.id,
                'itemName', ri.item_name,
                'itemNameTh', ri.item_name_th,
                'category', ri.category,
                'color', ri.color,
                'icon', ri.icon,
                'isHighPriority', ri.is_high_priority,
                'riskScore', pri.risk_score
            )
            FROM patrol_risk_items pri
            JOIN risk_items ri ON ri.id = pri.risk_item_id
            WHERE pri.patrol_id = sp.id AND pri.is_primary = true
            LIMIT 1
        ) as primary_risk_item,
        -- Count of high priority items
        (
            SELECT COUNT(*)::INTEGER
            FROM patrol_risk_items pri
            JOIN risk_items ri ON ri.id = pri.risk_item_id
            WHERE pri.patrol_id = sp.id AND ri.is_high_priority = true
        ) as high_priority_items_count,
        sp.created_at
    FROM safety_patrols sp
    LEFT JOIN patrol_risk_items pri ON pri.patrol_id = sp.id
    LEFT JOIN risk_items ri ON ri.id = pri.risk_item_id
    GROUP BY sp.id, sp.title, sp.description, sp.risk_score, sp.status, 
             sp.location_main_area_id, sp.location_sub_area_1_id, sp.location_sub_area_2_id, sp.created_at
    ORDER BY sp.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to filter patrols by risk items (multi-select requirement)
CREATE OR REPLACE FUNCTION get_patrols_by_risk_items(item_ids INTEGER[])
RETURNS TABLE (
    patrol_id UUID,
    patrol_title VARCHAR(200),
    risk_score INTEGER,
    status VARCHAR(20),
    risk_item_ids INTEGER[],
    risk_items JSONB,
    high_priority_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        sp.id as patrol_id,
        sp.title as patrol_title,
        sp.risk_score,
        sp.status,
        -- Array of item IDs
        ARRAY(
            SELECT pri.risk_item_id 
            FROM patrol_risk_items pri 
            WHERE pri.patrol_id = sp.id
        ) as risk_item_ids,
        -- Item details as JSON
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', ri.id,
                        'itemName', ri.item_name,
                        'category', ri.category,
                        'color', ri.color,
                        'icon', ri.icon,
                        'isPrimary', pri.is_primary,
                        'riskScore', pri.risk_score
                    )
                )
                FROM patrol_risk_items pri
                JOIN risk_items ri ON ri.id = pri.risk_item_id
                WHERE pri.patrol_id = sp.id
            ),
            '[]'::jsonb
        ) as risk_items,
        -- Count of high priority items
        (
            SELECT COUNT(*)::INTEGER
            FROM patrol_risk_items pri
            JOIN risk_items ri ON ri.id = pri.risk_item_id
            WHERE pri.patrol_id = sp.id AND ri.is_high_priority = true
        ) as high_priority_count,
        sp.created_at
    FROM safety_patrols sp
    WHERE EXISTS (
        SELECT 1 
        FROM patrol_risk_items pri 
        WHERE pri.patrol_id = sp.id 
        AND pri.risk_item_id = ANY(item_ids)
    )
    ORDER BY sp.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add risk items to a patrol
CREATE OR REPLACE FUNCTION add_risk_items_to_patrol(
    p_patrol_id UUID,
    p_item_ids INTEGER[],
    p_primary_item_id INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    item_id INTEGER;
BEGIN
    -- Delete existing items for this patrol
    DELETE FROM patrol_risk_items WHERE patrol_id = p_patrol_id;
    
    -- Add new items
    FOREACH item_id IN ARRAY p_item_ids
    LOOP
        INSERT INTO patrol_risk_items (patrol_id, risk_item_id, is_primary, created_by)
        VALUES (
            p_patrol_id, 
            item_id, 
            (item_id = p_primary_item_id),
            auth.uid()
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update risk assessment for specific item in patrol
CREATE OR REPLACE FUNCTION update_patrol_risk_item_assessment(
    p_patrol_id UUID,
    p_risk_item_id INTEGER,
    p_severity_level INTEGER,
    p_likelihood_level INTEGER,
    p_notes TEXT DEFAULT NULL,
    p_action_required TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE patrol_risk_items 
    SET 
        severity_level = p_severity_level,
        likelihood_level = p_likelihood_level,
        notes = p_notes,
        action_required = p_action_required
        -- risk_score will be auto-calculated by trigger
    WHERE patrol_id = p_patrol_id 
    AND risk_item_id = p_risk_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- SAMPLE DATA
-- =====================================================================

-- Insert sample risk items across different categories
INSERT INTO risk_items (
    item_name, item_name_th, item_name_en, item_code,
    color, icon, category, is_high_priority, requires_immediate_attention, 
    escalation_level, sort_order, item_group
) VALUES 

-- EQUIPMENT Category
('Scaffolding Safety', 'ความปลอดภัยนั่งร้าน', 'Scaffolding Safety', 'SCAFFOLD', '#3B82F6', '🏗️', 'equipment', true, false, 'supervisor', 1, 'Height Work'),
('Ladder Condition', 'สภาพบันได', 'Ladder Condition', 'LADDER', '#6366F1', '🪜', 'equipment', true, false, 'supervisor', 2, 'Height Work'),
('Fall Protection', 'อุปกรณ์ป้องกันการตก', 'Fall Protection', 'FALL_PROT', '#8B5CF6', '🦺', 'equipment', true, true, 'manager', 3, 'Height Work'),

('Electrical Panel', 'ตู้ไฟฟ้า', 'Electrical Panel', 'ELEC_PANEL', '#EAB308', '⚡', 'equipment', true, true, 'executive', 4, 'Electrical'),
('Power Tools', 'เครื่องมือไฟฟ้า', 'Power Tools', 'POWER_TOOL', '#F59E0B', '🔌', 'equipment', true, false, 'supervisor', 5, 'Electrical'),
('Grounding System', 'ระบบสายดิน', 'Grounding System', 'GROUND', '#D97706', '🔗', 'equipment', true, true, 'manager', 6, 'Electrical'),

('Heavy Machinery', 'เครื่องจักรหนัก', 'Heavy Machinery', 'HEAVY_MACH', '#DC2626', '🚜', 'equipment', true, false, 'manager', 7, 'Machinery'),
('Lifting Equipment', 'อุปกรณ์ยกของ', 'Lifting Equipment', 'LIFTING', '#B91C1C', '🏗️', 'equipment', true, false, 'supervisor', 8, 'Machinery'),
('Vehicle Safety', 'ความปลอดภัยรถยนต์', 'Vehicle Safety', 'VEHICLE', '#991B1B', '🚗', 'equipment', false, false, 'supervisor', 9, 'Machinery'),

-- PROCEDURE Category
('Hot Work Permit', 'ใบอนุญาตงานร้อน', 'Hot Work Permit', 'HOT_PERMIT', '#EA580C', '🔥', 'procedure', true, true, 'manager', 10, 'Permits'),
('Confined Space Entry', 'การเข้าพื้นที่จำกัด', 'Confined Space Entry', 'CONF_SPACE', '#7C2D12', '🚪', 'procedure', true, true, 'executive', 11, 'Permits'),
('Lock Out Tag Out', 'ระบบล็อคป้ายเตือน', 'Lock Out Tag Out', 'LOTO', '#C2410C', '🔒', 'procedure', true, false, 'supervisor', 12, 'Permits'),

('Manual Handling', 'การยกของด้วยมือ', 'Manual Handling', 'MANUAL', '#059669', '📦', 'procedure', false, false, 'supervisor', 13, 'Work Methods'),
('Work at Height', 'การทำงานที่ความสูง', 'Work at Height', 'HEIGHT', '#047857', '⬆️', 'procedure', true, false, 'manager', 14, 'Work Methods'),
('Chemical Handling', 'การจัดการสารเคมี', 'Chemical Handling', 'CHEMICAL', '##9333EA', '🧪', 'procedure', true, true, 'manager', 15, 'Work Methods'),

-- ENVIRONMENTAL Category
('Noise Levels', 'ระดับเสียง', 'Noise Levels', 'NOISE', '#6366F1', '🔊', 'environmental', false, false, 'supervisor', 16, 'Exposure'),
('Air Quality', 'คุณภาพอากาศ', 'Air Quality', 'AIR_QUAL', '#10B981', '💨', 'environmental', false, false, 'supervisor', 17, 'Exposure'),
('Temperature Exposure', 'การสัมผัสอุณหภูมิ', 'Temperature Exposure', 'TEMP_EXP', '#F59E0B', '🌡️', 'environmental', false, false, 'none', 18, 'Exposure'),

('Housekeeping', 'การจัดเก็บความสะอาด', 'Housekeeping', 'HOUSEKEEP', '#84CC16', '🧹', 'environmental', false, false, 'none', 19, 'Workplace'),
('Emergency Exits', 'ทางออกฉุกเฉิน', 'Emergency Exits', 'EMERG_EXIT', '#22C55E', '🚪', 'environmental', true, false, 'supervisor', 20, 'Workplace'),
('Lighting Adequacy', 'ความเพียงพอของแสง', 'Lighting Adequacy', 'LIGHTING', '#FDE047', '💡', 'environmental', false, false, 'none', 21, 'Workplace');

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON risk_items TO authenticated;
GRANT ALL ON patrol_risk_items TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE risk_items_id_seq TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE risk_items IS 'Master table for safety risk items. Name changes here do not affect existing patrol records.';
COMMENT ON TABLE patrol_risk_items IS 'Junction table linking patrols to risk items. Enables multi-select filtering and risk assessment per item.';
COMMENT ON FUNCTION get_patrols_by_risk_items(INTEGER[]) IS 'Efficiently filter patrols by multiple risk items using array overlap.';
COMMENT ON FUNCTION update_patrol_risk_item_assessment(UUID, INTEGER, INTEGER, INTEGER, TEXT, TEXT) IS 'Update risk assessment for specific item within a patrol.';

COMMIT;
