-- ============================================================================
-- MEP INVENTORY SYSTEM - SUPPLIER & PRICING MANAGEMENT
-- ============================================================================
-- Purpose: Supplier information, material-supplier relationships, and pricing
-- ============================================================================

-- ============================================================================
-- SUPPLIERS
-- ============================================================================

CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    supplier_code VARCHAR(50) UNIQUE NOT NULL,
    supplier_name VARCHAR(200) NOT NULL,
    supplier_name_local VARCHAR(200),  -- Thai name
    
    -- Classification
    supplier_type VARCHAR(50),         -- 'MANUFACTURER', 'DISTRIBUTOR', 'CONTRACTOR', 'IMPORTER'
    supplier_category VARCHAR(100),    -- 'PIPES', 'ELECTRICAL', 'PUMPS', 'GENERAL'
    
    -- Contact information
    contact_person VARCHAR(100),
    contact_title VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    fax VARCHAR(50),
    website VARCHAR(200),
    
    -- Address
    address TEXT,
    address_local TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Thailand',
    
    -- Business information
    tax_id VARCHAR(50),
    business_registration_number VARCHAR(100),
    vat_registration_number VARCHAR(100),
    
    -- Banking
    bank_name VARCHAR(100),
    bank_branch VARCHAR(100),
    bank_account_number VARCHAR(100),
    bank_account_name VARCHAR(200),
    
    -- Payment terms
    payment_terms VARCHAR(100),        -- 'Net 30', 'Net 60', 'COD', '50% Advance, 50% On Delivery'
    payment_method VARCHAR(50),        -- 'Bank Transfer', 'Cheque', 'Cash', 'Credit Card'
    credit_limit DECIMAL(15,2),
    credit_days INT,
    
    -- Performance metrics
    rating DECIMAL(3,2),               -- 1.00 to 5.00
    on_time_delivery_pct DECIMAL(5,2),
    quality_rating_pct DECIMAL(5,2),
    total_orders_count INT DEFAULT 0,
    total_purchase_value DECIMAL(15,2) DEFAULT 0,
    
    -- Lead time
    standard_lead_time_days INT,
    
    -- Certifications
    iso_certification VARCHAR(200),
    other_certifications TEXT,
    
    -- Status
    is_approved BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    approved_date DATE,
    approved_by VARCHAR(100),
    inactivated_date DATE,
    inactivated_reason TEXT,
    
    -- Notes
    notes TEXT,
    internal_notes TEXT,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- ============================================================================
-- MATERIAL-SUPPLIER RELATIONSHIPS
-- ============================================================================

CREATE TABLE material_suppliers (
    id SERIAL PRIMARY KEY,
    material_id VARCHAR(50) NOT NULL,
    supplier_id INT NOT NULL,
    
    -- Supplier's identification
    supplier_material_code VARCHAR(100),
    supplier_material_name VARCHAR(200),
    supplier_brand VARCHAR(100),
    
    -- Pricing
    unit_price DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'THB',
    price_unit VARCHAR(50),            -- May differ from inventory UOM
    price_per_quantity DECIMAL(10,2) DEFAULT 1,  -- Price per X units
    
    -- Price validity
    price_valid_from DATE NOT NULL,
    price_valid_to DATE,
    price_effective_date DATE,
    
    -- Discounts
    discount_percentage DECIMAL(5,2),
    volume_discount_applicable BOOLEAN DEFAULT false,
    
    -- Order constraints
    minimum_order_quantity DECIMAL(15,3),
    order_multiple DECIMAL(15,3),      -- Must order in multiples of this
    standard_pack_quantity DECIMAL(15,3),
    
    -- Lead time
    lead_time_days INT,
    manufacturing_lead_time_days INT,
    
    -- Preferences
    is_preferred BOOLEAN DEFAULT false,
    preference_rank INT,               -- 1=first choice, 2=second, etc.
    
    -- Last order information
    last_order_date DATE,
    last_order_quantity DECIMAL(15,3),
    last_order_price DECIMAL(15,2),
    last_order_reference VARCHAR(100),
    
    -- Performance
    total_orders_count INT DEFAULT 0,
    average_delivery_time_days DECIMAL(10,2),
    quality_issues_count INT DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    discontinued_date DATE,
    replacement_material_id VARCHAR(50),
    
    -- Notes
    notes TEXT,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    FOREIGN KEY (material_id) REFERENCES materials(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (replacement_material_id) REFERENCES materials(id),
    
    UNIQUE(material_id, supplier_id)
);

-- ============================================================================
-- PRICE HISTORY
-- ============================================================================

CREATE TABLE material_price_history (
    id SERIAL PRIMARY KEY,
    material_id VARCHAR(50) NOT NULL,
    supplier_id INT,
    
    -- Price
    unit_price DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'THB',
    
    -- Effective dates
    effective_from DATE NOT NULL,
    effective_to DATE,
    
    -- Change information
    price_change_pct DECIMAL(10,2),
    price_change_reason VARCHAR(200),
    
    -- Reference
    reference_type VARCHAR(50),        -- 'QUOTATION', 'PURCHASE_ORDER', 'CONTRACT', 'MANUAL'
    reference_number VARCHAR(100),
    
    -- Audit
    recorded_by VARCHAR(100),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (material_id) REFERENCES materials(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- ============================================================================
-- VOLUME DISCOUNTS
-- ============================================================================

CREATE TABLE material_volume_discounts (
    id SERIAL PRIMARY KEY,
    material_supplier_id INT NOT NULL,
    
    -- Tier
    tier_number INT NOT NULL,
    min_quantity DECIMAL(15,3) NOT NULL,
    max_quantity DECIMAL(15,3),
    
    -- Discount
    discount_type VARCHAR(20),         -- 'PERCENTAGE', 'FIXED_AMOUNT'
    discount_value DECIMAL(15,2) NOT NULL,
    
    -- Effective dates
    valid_from DATE,
    valid_to DATE,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (material_supplier_id) REFERENCES material_suppliers(id) ON DELETE CASCADE,
    
    CHECK (min_quantity > 0),
    CHECK (max_quantity IS NULL OR max_quantity > min_quantity),
    CHECK (discount_type IN ('PERCENTAGE', 'FIXED_AMOUNT'))
);

-- ============================================================================
-- SUPPLIER CONTACTS
-- ============================================================================

CREATE TABLE supplier_contacts (
    id SERIAL PRIMARY KEY,
    supplier_id INT NOT NULL,
    
    contact_name VARCHAR(100) NOT NULL,
    contact_title VARCHAR(100),
    department VARCHAR(100),
    
    email VARCHAR(100),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    
    is_primary BOOLEAN DEFAULT false,
    contact_type VARCHAR(50),          -- 'SALES', 'TECHNICAL', 'ACCOUNTING', 'LOGISTICS'
    
    is_active BOOLEAN DEFAULT true,
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);

-- ============================================================================
-- SUPPLIER PERFORMANCE RATINGS
-- ============================================================================

CREATE TABLE supplier_performance_ratings (
    id SERIAL PRIMARY KEY,
    supplier_id INT NOT NULL,
    
    -- Rating period
    rating_period_start DATE NOT NULL,
    rating_period_end DATE NOT NULL,
    
    -- Performance metrics
    delivery_rating DECIMAL(3,2),     -- 1.00 to 5.00
    quality_rating DECIMAL(3,2),
    price_competitiveness_rating DECIMAL(3,2),
    communication_rating DECIMAL(3,2),
    overall_rating DECIMAL(3,2),
    
    -- Statistics
    total_orders INT,
    on_time_deliveries INT,
    late_deliveries INT,
    quality_issues INT,
    returns INT,
    
    -- Comments
    strengths TEXT,
    weaknesses TEXT,
    recommendations TEXT,
    
    -- Audit
    rated_by VARCHAR(100),
    rated_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);

-- ============================================================================
-- SUPPLIER DOCUMENTS
-- ============================================================================

CREATE TABLE supplier_documents (
    id SERIAL PRIMARY KEY,
    supplier_id INT NOT NULL,
    
    document_type VARCHAR(50),         -- 'CONTRACT', 'CERTIFICATE', 'QUOTATION', 'CATALOG', 'LICENSE'
    document_name VARCHAR(200) NOT NULL,
    document_number VARCHAR(100),
    
    file_url TEXT,
    file_name VARCHAR(255),
    file_size_kb INT,
    file_type VARCHAR(50),
    
    issue_date DATE,
    expiry_date DATE,
    
    description TEXT,
    
    is_active BOOLEAN DEFAULT true,
    
    uploaded_by VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Supplier indexes
CREATE INDEX idx_supp_code ON suppliers(supplier_code);
CREATE INDEX idx_supp_name ON suppliers(supplier_name);
CREATE INDEX idx_supp_type ON suppliers(supplier_type);
CREATE INDEX idx_supp_active ON suppliers(is_active);
CREATE INDEX idx_supp_approved ON suppliers(is_approved);
CREATE INDEX idx_supp_rating ON suppliers(rating DESC);

-- Material-Supplier indexes
CREATE INDEX idx_mat_supp_material ON material_suppliers(material_id);
CREATE INDEX idx_mat_supp_supplier ON material_suppliers(supplier_id);
CREATE INDEX idx_mat_supp_preferred ON material_suppliers(is_preferred) WHERE is_preferred = true;
CREATE INDEX idx_mat_supp_active ON material_suppliers(is_active) WHERE is_active = true;
CREATE INDEX idx_mat_supp_price_valid ON material_suppliers(price_valid_from, price_valid_to);

-- Price history indexes
CREATE INDEX idx_price_hist_material ON material_price_history(material_id);
CREATE INDEX idx_price_hist_supplier ON material_price_history(supplier_id);
CREATE INDEX idx_price_hist_date ON material_price_history(effective_from DESC);

-- Volume discount indexes
CREATE INDEX idx_vol_disc_supplier ON material_volume_discounts(material_supplier_id);
CREATE INDEX idx_vol_disc_active ON material_volume_discounts(is_active) WHERE is_active = true;

-- Supplier contact indexes
CREATE INDEX idx_supp_cont_supplier ON supplier_contacts(supplier_id);
CREATE INDEX idx_supp_cont_primary ON supplier_contacts(is_primary) WHERE is_primary = true;

-- Performance rating indexes
CREATE INDEX idx_perf_rating_supplier ON supplier_performance_ratings(supplier_id);
CREATE INDEX idx_perf_rating_period ON supplier_performance_ratings(rating_period_start, rating_period_end);

-- Document indexes
CREATE INDEX idx_supp_doc_supplier ON supplier_documents(supplier_id);
CREATE INDEX idx_supp_doc_type ON supplier_documents(document_type);
CREATE INDEX idx_supp_doc_expiry ON supplier_documents(expiry_date) WHERE expiry_date IS NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE suppliers IS 'Supplier/vendor master data';
COMMENT ON TABLE material_suppliers IS 'Material-supplier relationships with pricing and lead times';
COMMENT ON TABLE material_price_history IS 'Historical tracking of material prices';
COMMENT ON TABLE material_volume_discounts IS 'Volume-based discount tiers';
COMMENT ON TABLE supplier_contacts IS 'Supplier contact persons';
COMMENT ON TABLE supplier_performance_ratings IS 'Periodic supplier performance evaluations';
COMMENT ON TABLE supplier_documents IS 'Supplier-related documents and certificates';

COMMENT ON COLUMN material_suppliers.preference_rank IS '1=first choice, 2=second choice, etc.';
COMMENT ON COLUMN material_suppliers.order_multiple IS 'Material must be ordered in multiples of this quantity';
COMMENT ON COLUMN suppliers.rating IS 'Overall supplier rating from 1.00 to 5.00';
