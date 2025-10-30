-- ============================================
-- MATERIALS MANAGEMENT SYSTEM FOR QSHE PWA
-- Add materials tables to existing QSHE database
-- ============================================

-- ============================================
-- TABLE 1: MATERIAL GROUPS
-- High-level grouping (Pipes & Fittings, Valves, Cables, etc.)
-- ============================================

CREATE TABLE IF NOT EXISTS material_groups (
    id SERIAL PRIMARY KEY,
    group_code VARCHAR(50) UNIQUE NOT NULL,
    group_name VARCHAR(200) NOT NULL,
    group_name_th VARCHAR(200),
    description TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_material_groups_code ON material_groups(group_code);
CREATE INDEX IF NOT EXISTS idx_material_groups_active ON material_groups(is_active);
CREATE INDEX IF NOT EXISTS idx_material_groups_sort ON material_groups(sort_order);

-- ============================================
-- TABLE 2: MATERIAL TEMPLATES
-- Template for material descriptions (5 flexible columns)
-- ============================================

CREATE TABLE IF NOT EXISTS material_templates (
    id SERIAL PRIMARY KEY,
    material_group_id INT REFERENCES material_groups(id) ON DELETE CASCADE,
    
    -- 5 flexible title columns (all nullable for flexibility)
    title_1 VARCHAR(200),
    title_2 VARCHAR(200),
    title_3 VARCHAR(200),
    title_4 VARCHAR(200),
    title_5 VARCHAR(200),
    
    -- Link to dimension group (NULL = no dimensions)
    dimension_group_id INT NULL,
    
    -- Technical specs template (optional JSONB for additional fields)
    technical_spec_template JSONB,
    
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_material_templates_group ON material_templates(material_group_id);
CREATE INDEX IF NOT EXISTS idx_material_templates_dimension ON material_templates(dimension_group_id);
CREATE INDEX IF NOT EXISTS idx_material_templates_active ON material_templates(is_active);

-- ============================================
-- TABLE 3: DIMENSION GROUPS
-- Groups of related dimensions (Nominal Pipe, Copper Pipe, Wire Way, etc.)
-- ============================================

CREATE TABLE IF NOT EXISTS dimension_groups (
    id SERIAL PRIMARY KEY,
    group_code VARCHAR(50) UNIQUE NOT NULL,
    group_name VARCHAR(200) NOT NULL,
    group_name_th VARCHAR(200),
    description TEXT,
    display_format VARCHAR(50) DEFAULT 'table',  -- 'table', 'dropdown', 'list'
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dimension_groups_code ON dimension_groups(group_code);
CREATE INDEX IF NOT EXISTS idx_dimension_groups_active ON dimension_groups(is_active);

-- ============================================
-- TABLE 4: DIMENSIONS
-- Individual dimension values with type filtering
-- ============================================

CREATE TABLE IF NOT EXISTS dimensions (
    id SERIAL PRIMARY KEY,
    dimension_group_id INT REFERENCES dimension_groups(id) ON DELETE CASCADE,
    
    -- Dimension values
    size_1 VARCHAR(100) NOT NULL,
    size_2 VARCHAR(100),
    size_3 VARCHAR(100),
    
    -- Type filter for dropdown (common = standard sizes, custom = special order)
    dimension_type VARCHAR(50) DEFAULT 'common',
    
    -- Display
    display_order INT DEFAULT 0,
    description TEXT,
    remark TEXT,  -- For custom dimensions
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dimensions_group ON dimensions(dimension_group_id);
CREATE INDEX IF NOT EXISTS idx_dimensions_type ON dimensions(dimension_type);
CREATE INDEX IF NOT EXISTS idx_dimensions_active ON dimensions(is_active);
CREATE INDEX IF NOT EXISTS idx_dimensions_order ON dimensions(display_order);

-- Add FK constraint now that dimension_groups exists
ALTER TABLE material_templates 
    DROP CONSTRAINT IF EXISTS fk_material_templates_dimension_group;

ALTER TABLE material_templates 
    ADD CONSTRAINT fk_material_templates_dimension_group 
    FOREIGN KEY (dimension_group_id) REFERENCES dimension_groups(id) ON DELETE SET NULL;

-- ============================================
-- TABLE 5: MATERIALS (Final Inventory Items)
-- Actual inventory items created from templates + dimensions
-- ============================================

CREATE TABLE IF NOT EXISTS materials (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('MAT-' || to_char(NOW(), 'YYYYMMDD-HH24MISS-MS')),
    material_code VARCHAR(100) UNIQUE NOT NULL,
    
    -- Link to template and group
    material_template_id INT REFERENCES material_templates(id) ON DELETE SET NULL,
    material_group_id INT REFERENCES material_groups(id) ON DELETE SET NULL,
    
    -- Selected dimension (if applicable)
    dimension_id INT REFERENCES dimensions(id) ON DELETE SET NULL,
    
    -- Full material description (auto-generated or manually entered)
    material_description TEXT NOT NULL,
    material_description_th TEXT,
    
    -- Technical specifications (JSONB for flexibility)
    technical_specs JSONB,
    
    -- Company and Project tracking (link to existing QSHE tables)
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    
    -- Inventory management
    unit_of_measure VARCHAR(50) DEFAULT 'PCS',
    min_stock_level DECIMAL(10,2) DEFAULT 0,
    max_stock_level DECIMAL(10,2),
    reorder_point DECIMAL(10,2),
    standard_cost DECIMAL(15,2) DEFAULT 0,
    
    -- Barcode (will be generated later from id or material_code)
    barcode VARCHAR(100) UNIQUE,
    qr_code TEXT,
    
    -- Tracking requirements
    requires_lot_tracking BOOLEAN DEFAULT false,
    requires_serial_tracking BOOLEAN DEFAULT false,
    requires_expiry_tracking BOOLEAN DEFAULT false,
    shelf_life_days INT,
    
    -- Media
    primary_picture_url VARCHAR(500),
    
    -- Status and audit
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_materials_template ON materials(material_template_id);
CREATE INDEX IF NOT EXISTS idx_materials_group ON materials(material_group_id);
CREATE INDEX IF NOT EXISTS idx_materials_dimension ON materials(dimension_id);
CREATE INDEX IF NOT EXISTS idx_materials_company ON materials(company_id);
CREATE INDEX IF NOT EXISTS idx_materials_project ON materials(project_id);
CREATE INDEX IF NOT EXISTS idx_materials_code ON materials(material_code);
CREATE INDEX IF NOT EXISTS idx_materials_barcode ON materials(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_materials_active ON materials(is_active);
CREATE INDEX IF NOT EXISTS idx_materials_description ON materials USING gin(to_tsvector('english', material_description));

-- ============================================
-- HELPER FUNCTION: Get Dimensions for Template
-- ============================================

CREATE OR REPLACE FUNCTION get_dimensions_for_template(p_template_id INT)
RETURNS TABLE (
    id INT,
    dimension_group_id INT,
    dimension_group_name VARCHAR,
    dimension_type VARCHAR,
    size_1 VARCHAR,
    size_2 VARCHAR,
    size_3 VARCHAR,
    display_order INT,
    description TEXT,
    remark TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        dg.id as dimension_group_id,
        dg.group_name as dimension_group_name,
        d.dimension_type,
        d.size_1,
        d.size_2,
        d.size_3,
        d.display_order,
        d.description,
        d.remark
    FROM material_templates mt
    JOIN dimension_groups dg ON dg.id = mt.dimension_group_id
    JOIN dimensions d ON d.dimension_group_id = dg.id
    WHERE mt.id = p_template_id
      AND mt.is_active = true
      AND dg.is_active = true
      AND d.is_active = true
    ORDER BY d.display_order, d.id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- HELPER FUNCTION: Generate Material Description
-- Concatenates template titles + dimension
-- ============================================

CREATE OR REPLACE FUNCTION generate_material_description(
    p_template_id INT,
    p_dimension_id INT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_description TEXT := '';
    v_template RECORD;
    v_dimension RECORD;
BEGIN
    -- Get template
    SELECT title_1, title_2, title_3, title_4, title_5
    INTO v_template
    FROM material_templates
    WHERE id = p_template_id;
    
    -- Concatenate non-null titles
    v_description := TRIM(CONCAT_WS(' | ', 
        NULLIF(v_template.title_1, ''),
        NULLIF(v_template.title_2, ''),
        NULLIF(v_template.title_3, ''),
        NULLIF(v_template.title_4, ''),
        NULLIF(v_template.title_5, '')
    ));
    
    -- Add dimension if provided
    IF p_dimension_id IS NOT NULL THEN
        SELECT size_1, size_2, size_3
        INTO v_dimension
        FROM dimensions
        WHERE id = p_dimension_id;
        
        IF v_dimension.size_1 IS NOT NULL THEN
            v_description := v_description || ' | ' || 
                TRIM(CONCAT_WS(' / ', 
                    v_dimension.size_1,
                    NULLIF(v_dimension.size_2, ''),
                    NULLIF(v_dimension.size_3, '')
                ));
        END IF;
    END IF;
    
    RETURN v_description;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA: Material Groups
-- ============================================

INSERT INTO material_groups (group_code, group_name, group_name_th, sort_order) VALUES
('GRP-PIPE-FIT', 'Pipes & Fittings', 'ท่อและข้อต่อ', 1),
('GRP-VALVE', 'Valves and Accessories', 'วาล์วและอุปกรณ์เสริม', 2),
('GRP-CONDUIT', 'Conduits and Accessories', 'ท่อร้อยสายและอุปกรณ์', 3),
('GRP-CABLE-TRAY', 'Cable Tray / Wire Way / Ladder', 'รางเคเบิล / ทางเดินสาย', 4)
ON CONFLICT (group_code) DO NOTHING;

-- ============================================
-- SAMPLE DATA: Dimension Groups
-- ============================================

INSERT INTO dimension_groups (group_code, group_name, group_name_th, display_format, sort_order) VALUES
('DIM-NOMINAL-PIPE', 'Nominal Pipe', 'ท่อมาตรฐาน', 'table', 1),
('DIM-COPPER-PIPE', 'Copper Pipe', 'ท่อทองแดง', 'table', 2),
('DIM-PLASTIC-PIPE', 'Plastic Pipe (OD)', 'ท่อพลาสติก (OD)', 'table', 3),
('DIM-WIRE-WAY', 'Wire Way', 'ทางเดินสาย', 'table', 4)
ON CONFLICT (group_code) DO NOTHING;

-- ============================================
-- SAMPLE DATA: Dimensions - Nominal Pipe
-- ============================================

INSERT INTO dimensions (dimension_group_id, size_1, size_2, dimension_type, display_order) 
SELECT 
    dg.id,
    size_data.size_1,
    size_data.size_2,
    size_data.dimension_type,
    size_data.display_order
FROM dimension_groups dg
CROSS JOIN (VALUES
    ('1/2 inch', '15 mm', 'common', 1),
    ('3/4 inch', '20 mm', 'common', 2),
    ('1 inch', '25 mm', 'common', 3),
    ('1-1/4 inch', '32 mm', 'common', 4),
    ('1-1/2 inch', '40 mm', 'common', 5),
    ('2 inch', '50 mm', 'common', 6),
    ('2-1/2 inch', '65 mm', 'common', 7),
    ('3 inch', '80 mm', 'common', 8),
    ('4 inch', '100 mm', 'common', 9),
    ('6 inch', '150 mm', 'common', 10)
) AS size_data(size_1, size_2, dimension_type, display_order)
WHERE dg.group_code = 'DIM-NOMINAL-PIPE'
ON CONFLICT DO NOTHING;

-- ============================================
-- SAMPLE DATA: Material Templates - Black Steel Pipes
-- ============================================

INSERT INTO material_templates (material_group_id, title_1, title_2, title_3, title_4, dimension_group_id, sort_order)
SELECT 
    mg.id,
    template_data.title_1,
    template_data.title_2,
    template_data.title_3,
    template_data.title_4,
    dg.id,
    template_data.sort_order
FROM material_groups mg
CROSS JOIN dimension_groups dg
CROSS JOIN (VALUES
    ('Black Steel', 'ERW', 'Sch 40, Grade A', 'Pipe', 1),
    ('Black Steel', 'ERW', 'Sch 40, Grade A', 'Elbow 45°', 2),
    ('Black Steel', 'ERW', 'Sch 40, Grade A', 'Elbow 90°', 3),
    ('Black Steel', 'ERW', 'Sch 40, Grade A', 'Equal TEE', 4),
    ('Black Steel', 'ERW', 'Sch 40, Grade A', 'Reducing TEE', 5),
    ('Black Steel', 'ERW', 'Sch 40, Grade A', 'Reducer, Concentric', 6),
    ('Black Steel', 'ERW', 'Sch 40, Grade B', 'Pipe', 7),
    ('Black Steel', 'ERW', 'Sch 40, Grade B', 'Elbow 45°', 8),
    ('Black Steel', 'ERW', 'Sch 40, Grade B', 'Elbow 90°', 9),
    ('Black Steel', 'ERW', 'Sch 40, Grade B', 'Equal TEE', 10),
    ('Black Steel', 'ERW', 'Sch 40, Grade B', 'Reducing TEE', 11),
    ('Black Steel', 'ERW', 'Sch 40, Grade B', 'Reducer, Concentric', 12)
) AS template_data(title_1, title_2, title_3, title_4, sort_order)
WHERE mg.group_code = 'GRP-PIPE-FIT'
  AND dg.group_code = 'DIM-NOMINAL-PIPE'
ON CONFLICT DO NOTHING;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✓ Materials Management System Added to QSHE!';
    RAISE NOTICE '  ==========================================';
    RAISE NOTICE '  TABLES CREATED:';
    RAISE NOTICE '  • material_groups (4 sample groups)';
    RAISE NOTICE '  • material_templates (12 sample templates)';
    RAISE NOTICE '  • dimension_groups (4 sample groups)';
    RAISE NOTICE '  • dimensions (10 nominal pipe sizes)';
    RAISE NOTICE '  • materials (empty - ready for use)';
    RAISE NOTICE '';
    RAISE NOTICE '  HELPER FUNCTIONS:';
    RAISE NOTICE '  • get_dimensions_for_template(template_id)';
    RAISE NOTICE '  • generate_material_description(template_id, dimension_id)';
    RAISE NOTICE '';
    RAISE NOTICE '  INTEGRATION:';
    RAISE NOTICE '  • Links to existing companies table';
    RAISE NOTICE '  • Links to existing projects table';
    RAISE NOTICE '  • Ready to use with QSHE PWA';
    RAISE NOTICE '';
    RAISE NOTICE '  Next: Add Materials menu to QSHE PWA navigation';
    RAISE NOTICE '  ==========================================';
END $$;
