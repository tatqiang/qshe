-- ============================================================================
-- MEP INVENTORY SYSTEM - CORE SCHEMA
-- ============================================================================
-- Database: PostgreSQL (recommended) or MySQL
-- Purpose: Material categories, master data, and basic structure
-- Date: October 29, 2025
-- ============================================================================

-- ============================================================================
-- PART 1: CATEGORY HIERARCHY (3 LEVELS)
-- ============================================================================

-- Level 1: Main Categories (Pipes, Plumbing, Electrical, etc.)
CREATE TABLE material_categories_l1 (
    id VARCHAR(50) PRIMARY KEY,
    title_en VARCHAR(200) NOT NULL,
    title_th VARCHAR(200),
    tags TEXT,
    description TEXT,
    
    -- UI/Display
    icon VARCHAR(100),
    color VARCHAR(20),
    display_order INT DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Level 2: Sub-Categories (Black Steel Pipes, Pumps, Generators)
CREATE TABLE material_categories_l2 (
    id VARCHAR(50) PRIMARY KEY,
    parent_category_l1_id VARCHAR(50) NOT NULL,
    title_en VARCHAR(200) NOT NULL,
    title_th VARCHAR(200),
    tags TEXT,
    description TEXT,
    specifications TEXT,  -- e.g., "Sch 40, Grade A, ERW"
    
    -- UI/Display
    display_order INT DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    FOREIGN KEY (parent_category_l1_id) 
        REFERENCES material_categories_l1(id) 
        ON DELETE RESTRICT
);

-- Level 3: Item Types (Pipe, Elbow 90, Elbow 45, TEE, etc.)
CREATE TABLE material_categories_l3 (
    id VARCHAR(50) PRIMARY KEY,
    parent_category_l2_id VARCHAR(50) NOT NULL,
    title_en VARCHAR(200) NOT NULL,
    title_th VARCHAR(200),
    tags TEXT,
    description TEXT,
    
    -- Size variant configuration
    has_size_variants BOOLEAN DEFAULT false,
    size_pattern VARCHAR(50),  -- 'SINGLE', 'DUAL', 'TRIPLE', 'CUSTOM'
    size_label_1 VARCHAR(100),  -- e.g., "Diameter", "Size"
    size_label_2 VARCHAR(100),  -- e.g., "Outlet Size" for reducers
    
    -- UI/Display
    display_order INT DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    FOREIGN KEY (parent_category_l2_id) 
        REFERENCES material_categories_l2(id) 
        ON DELETE RESTRICT
);

-- ============================================================================
-- PART 2: MATERIAL MASTER DATA
-- ============================================================================

CREATE TABLE materials (
    id VARCHAR(50) PRIMARY KEY,
    material_code VARCHAR(100) UNIQUE NOT NULL,  -- Unique SKU/Part Number
    
    -- Category hierarchy
    category_l1_id VARCHAR(50) NOT NULL,
    category_l2_id VARCHAR(50) NOT NULL,
    category_l3_id VARCHAR(50) NOT NULL,
    
    -- Basic information
    name_en VARCHAR(200),
    name_th VARCHAR(200),
    short_description VARCHAR(500),
    full_description TEXT,
    
    -- Size/Dimension information
    dimension_group VARCHAR(50),  -- 'p-a', 'p-b' for grouping variants
    dimension_order INT,          -- Order within dimension group
    size_1 VARCHAR(100),          -- Primary size: "1/2 inch", "15 mm"
    size_2 VARCHAR(100),          -- Secondary size (for reducers, etc.)
    size_unit VARCHAR(20),        -- 'inch', 'mm', 'cm', 'm'
    
    -- Manufacturer/Brand
    brand VARCHAR(100),
    manufacturer VARCHAR(200),
    manufacturer_code VARCHAR(100),
    model_number VARCHAR(100),
    
    -- Unit of measure
    unit_of_measure VARCHAR(50) NOT NULL,  -- 'EA', 'PCS', 'M', 'FT', 'KG', 'L'
    alternate_uom VARCHAR(50),
    conversion_factor DECIMAL(15,4),  -- For alternate UOM conversion
    
    -- Physical properties
    weight_kg DECIMAL(15,3),
    length_mm DECIMAL(15,2),
    width_mm DECIMAL(15,2),
    height_mm DECIMAL(15,2),
    volume_m3 DECIMAL(15,6),
    
    -- Packaging
    package_quantity INT DEFAULT 1,
    package_type VARCHAR(50),
    
    -- Documentation
    datasheet_url TEXT,
    drawing_url TEXT,
    manual_url TEXT,
    photo_url TEXT,
    photo_thumbnail_url TEXT,
    
    -- Pricing (basic)
    standard_cost DECIMAL(15,2),
    last_purchase_price DECIMAL(15,2),
    last_purchase_date DATE,
    average_cost DECIMAL(15,2),
    list_price DECIMAL(15,2),
    currency VARCHAR(10) DEFAULT 'THB',
    
    -- Inventory control
    is_stockable BOOLEAN DEFAULT true,
    track_serial_numbers BOOLEAN DEFAULT false,
    track_lot_numbers BOOLEAN DEFAULT false,
    shelf_life_days INT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'ACTIVE',  -- 'ACTIVE', 'INACTIVE', 'DISCONTINUED', 'OBSOLETE'
    is_active BOOLEAN DEFAULT true,
    obsolete_date DATE,
    replacement_material_id VARCHAR(50),
    
    -- Search optimization
    search_keywords TEXT,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    -- Constraints
    FOREIGN KEY (category_l1_id) REFERENCES material_categories_l1(id),
    FOREIGN KEY (category_l2_id) REFERENCES material_categories_l2(id),
    FOREIGN KEY (category_l3_id) REFERENCES material_categories_l3(id),
    FOREIGN KEY (replacement_material_id) REFERENCES materials(id),
    
    CHECK (status IN ('ACTIVE', 'INACTIVE', 'DISCONTINUED', 'OBSOLETE'))
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Category indexes
CREATE INDEX idx_cat_l1_title ON material_categories_l1(title_en);
CREATE INDEX idx_cat_l1_active ON material_categories_l1(is_active);

CREATE INDEX idx_cat_l2_parent ON material_categories_l2(parent_category_l1_id);
CREATE INDEX idx_cat_l2_title ON material_categories_l2(title_en);
CREATE INDEX idx_cat_l2_active ON material_categories_l2(is_active);

CREATE INDEX idx_cat_l3_parent ON material_categories_l3(parent_category_l2_id);
CREATE INDEX idx_cat_l3_title ON material_categories_l3(title_en);
CREATE INDEX idx_cat_l3_active ON material_categories_l3(is_active);

-- Material indexes
CREATE INDEX idx_mat_cat_l1 ON materials(category_l1_id);
CREATE INDEX idx_mat_cat_l2 ON materials(category_l2_id);
CREATE INDEX idx_mat_cat_l3 ON materials(category_l3_id);
CREATE INDEX idx_mat_code ON materials(material_code);
CREATE INDEX idx_mat_brand ON materials(brand);
CREATE INDEX idx_mat_manufacturer ON materials(manufacturer);
CREATE INDEX idx_mat_size1 ON materials(size_1);
CREATE INDEX idx_mat_status ON materials(status);
CREATE INDEX idx_mat_active ON materials(is_active) WHERE is_active = true;
CREATE INDEX idx_mat_dim_group ON materials(dimension_group, dimension_order);

-- Full text search index (PostgreSQL)
-- CREATE INDEX idx_mat_search ON materials USING GIN(to_tsvector('english', 
--     COALESCE(name_en, '') || ' ' || 
--     COALESCE(short_description, '') || ' ' || 
--     COALESCE(search_keywords, '')
-- ));

-- Unique constraint: prevent duplicate materials
CREATE UNIQUE INDEX idx_mat_unique_variant ON materials(
    category_l3_id, 
    COALESCE(size_1, ''), 
    COALESCE(size_2, ''), 
    COALESCE(brand, ''),
    COALESCE(model_number, '')
) WHERE is_active = true AND status = 'ACTIVE';

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE material_categories_l1 IS 'Level 1: Main material categories (Pipes, Electrical, Plumbing, etc.)';
COMMENT ON TABLE material_categories_l2 IS 'Level 2: Sub-categories with specifications (Black Steel Pipes Sch 40, etc.)';
COMMENT ON TABLE material_categories_l3 IS 'Level 3: Specific item types (Pipe, Elbow 90, TEE, etc.)';
COMMENT ON TABLE materials IS 'Material master data - core inventory items';

COMMENT ON COLUMN materials.dimension_group IS 'Group code for size variants (p-a, p-b, etc.)';
COMMENT ON COLUMN materials.dimension_order IS 'Order within dimension group for sorting';
COMMENT ON COLUMN materials.size_1 IS 'Primary dimension (e.g., 1/2 inch, 15 mm)';
COMMENT ON COLUMN materials.size_2 IS 'Secondary dimension for reducers, transitions';
COMMENT ON COLUMN materials.track_serial_numbers IS 'Track individual items by serial number';
COMMENT ON COLUMN materials.track_lot_numbers IS 'Track by manufacturing lot/batch';
COMMENT ON COLUMN materials.shelf_life_days IS 'Days before material expires (chemicals, adhesives)';
