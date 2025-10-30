-- ============================================================================
-- MEP INVENTORY SYSTEM - INVENTORY TRACKING TABLES
-- ============================================================================
-- Purpose: Stock levels, locations, transactions, and movement tracking
-- ============================================================================

-- ============================================================================
-- INVENTORY LOCATIONS
-- ============================================================================

CREATE TABLE inventory_locations (
    id SERIAL PRIMARY KEY,
    location_code VARCHAR(50) UNIQUE NOT NULL,
    location_name VARCHAR(200) NOT NULL,
    
    -- Hierarchy (for warehouses with zones/aisles/bins)
    parent_location_id INT,
    location_level VARCHAR(50),       -- 'SITE', 'WAREHOUSE', 'ZONE', 'AISLE', 'BIN'
    location_type VARCHAR(50),        -- 'WAREHOUSE', 'PROJECT_SITE', 'SUPPLIER', 'CUSTOMER', 'TRUCK', 'SCRAP'
    
    -- Address
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Thailand',
    gps_latitude DECIMAL(10,8),
    gps_longitude DECIMAL(11,8),
    
    -- Contact
    contact_person VARCHAR(100),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(100),
    
    -- Properties
    storage_capacity_m3 DECIMAL(15,3),
    max_weight_capacity_kg DECIMAL(15,2),
    has_climate_control BOOLEAN DEFAULT false,
    has_security BOOLEAN DEFAULT false,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    FOREIGN KEY (parent_location_id) REFERENCES inventory_locations(id)
);

-- ============================================================================
-- INVENTORY STOCK LEVELS
-- ============================================================================

CREATE TABLE inventory_stock (
    id SERIAL PRIMARY KEY,
    material_id VARCHAR(50) NOT NULL,
    location_id INT NOT NULL,
    
    -- Quantities
    quantity_on_hand DECIMAL(15,3) DEFAULT 0 NOT NULL,
    quantity_reserved DECIMAL(15,3) DEFAULT 0 NOT NULL,
    quantity_available DECIMAL(15,3) GENERATED ALWAYS AS 
        (quantity_on_hand - quantity_reserved) STORED,
    quantity_in_transit DECIMAL(15,3) DEFAULT 0,
    quantity_on_order DECIMAL(15,3) DEFAULT 0,
    
    -- Reorder management
    min_stock_level DECIMAL(15,3),
    max_stock_level DECIMAL(15,3),
    reorder_point DECIMAL(15,3),
    reorder_quantity DECIMAL(15,3),
    safety_stock DECIMAL(15,3),
    economic_order_quantity DECIMAL(15,3),
    
    -- Cost tracking
    average_unit_cost DECIMAL(15,2),
    last_cost DECIMAL(15,2),
    standard_cost DECIMAL(15,2),
    total_value DECIMAL(15,2) GENERATED ALWAYS AS 
        (quantity_on_hand * COALESCE(average_unit_cost, 0)) STORED,
    
    -- Physical location details
    bin_location VARCHAR(100),
    zone VARCHAR(50),
    aisle VARCHAR(50),
    shelf VARCHAR(50),
    level VARCHAR(50),
    
    -- Stock management
    abc_classification VARCHAR(10),    -- 'A', 'B', 'C' (value-based)
    last_counted_date DATE,
    last_counted_quantity DECIMAL(15,3),
    last_counted_by VARCHAR(100),
    cycle_count_frequency_days INT,
    next_count_date DATE,
    
    -- Movement tracking
    last_receipt_date TIMESTAMP,
    last_issue_date TIMESTAMP,
    last_movement_date TIMESTAMP,
    
    -- Aging
    oldest_stock_date DATE,
    average_age_days INT,
    
    -- Alerts
    is_below_min BOOLEAN GENERATED ALWAYS AS 
        (quantity_available < COALESCE(min_stock_level, 0)) STORED,
    is_below_reorder BOOLEAN GENERATED ALWAYS AS 
        (quantity_available <= COALESCE(reorder_point, 0)) STORED,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (material_id) REFERENCES materials(id),
    FOREIGN KEY (location_id) REFERENCES inventory_locations(id),
    
    UNIQUE(material_id, location_id),
    
    CHECK (quantity_on_hand >= 0),
    CHECK (quantity_reserved >= 0),
    CHECK (quantity_reserved <= quantity_on_hand)
);

-- ============================================================================
-- INVENTORY TRANSACTIONS
-- ============================================================================

CREATE TABLE inventory_transactions (
    id SERIAL PRIMARY KEY,
    transaction_number VARCHAR(100) UNIQUE NOT NULL,
    transaction_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    transaction_type VARCHAR(50) NOT NULL,
    -- Types: 'RECEIVE', 'ISSUE', 'TRANSFER', 'ADJUSTMENT', 'RETURN', 
    --        'SCRAP', 'INITIAL_STOCK', 'CYCLE_COUNT'
    
    -- Material
    material_id VARCHAR(50) NOT NULL,
    material_code VARCHAR(100),        -- Denormalized for reporting
    material_description VARCHAR(500), -- Denormalized for reporting
    
    -- Location movement
    from_location_id INT,
    from_location_name VARCHAR(200),   -- Denormalized
    to_location_id INT,
    to_location_name VARCHAR(200),     -- Denormalized
    
    -- Quantity
    quantity DECIMAL(15,3) NOT NULL,
    unit_of_measure VARCHAR(50) NOT NULL,
    
    -- Cost
    unit_cost DECIMAL(15,2),
    total_cost DECIMAL(15,2),
    currency VARCHAR(10) DEFAULT 'THB',
    
    -- Reference documents
    reference_type VARCHAR(50),        -- 'PO', 'WO', 'PROJECT', 'REQUISITION', 'SALES_ORDER'
    reference_id VARCHAR(100),
    reference_number VARCHAR(100),
    reference_line_number INT,
    
    -- Lot/Serial tracking
    lot_number VARCHAR(100),
    serial_number VARCHAR(100),
    manufacture_date DATE,
    expiry_date DATE,
    
    -- Additional information
    reason_code VARCHAR(50),           -- For adjustments
    notes TEXT,
    attachment_url TEXT,
    
    -- Approval workflow
    requires_approval BOOLEAN DEFAULT false,
    approved_by VARCHAR(100),
    approved_date TIMESTAMP,
    approval_status VARCHAR(50),       -- 'PENDING', 'APPROVED', 'REJECTED'
    rejection_reason TEXT,
    
    -- Posted status
    is_posted BOOLEAN DEFAULT true,
    posted_by VARCHAR(100),
    posted_date TIMESTAMP,
    
    -- Audit
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (material_id) REFERENCES materials(id),
    FOREIGN KEY (from_location_id) REFERENCES inventory_locations(id),
    FOREIGN KEY (to_location_id) REFERENCES inventory_locations(id),
    
    CHECK (quantity != 0),
    CHECK (transaction_type IN (
        'RECEIVE', 'ISSUE', 'TRANSFER', 'ADJUSTMENT', 'RETURN', 
        'SCRAP', 'INITIAL_STOCK', 'CYCLE_COUNT', 'WRITE_OFF'
    )),
    CHECK (
        (transaction_type IN ('RECEIVE', 'ADJUSTMENT', 'INITIAL_STOCK') AND to_location_id IS NOT NULL) OR
        (transaction_type IN ('ISSUE', 'SCRAP', 'WRITE_OFF') AND from_location_id IS NOT NULL) OR
        (transaction_type = 'TRANSFER' AND from_location_id IS NOT NULL AND to_location_id IS NOT NULL)
    )
);

-- ============================================================================
-- LOT/BATCH TRACKING
-- ============================================================================

CREATE TABLE inventory_lots (
    id SERIAL PRIMARY KEY,
    lot_number VARCHAR(100) UNIQUE NOT NULL,
    material_id VARCHAR(50) NOT NULL,
    
    -- Lot information
    manufacture_date DATE,
    expiry_date DATE,
    received_date DATE,
    
    -- Supplier information
    supplier_id INT,
    supplier_lot_number VARCHAR(100),
    
    -- Quality
    quality_status VARCHAR(50),        -- 'APPROVED', 'HOLD', 'REJECTED', 'QUARANTINE'
    inspection_date DATE,
    inspector_name VARCHAR(100),
    
    -- Certificates
    certificate_number VARCHAR(100),
    certificate_url TEXT,
    
    -- Quantities
    original_quantity DECIMAL(15,3),
    remaining_quantity DECIMAL(15,3),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (material_id) REFERENCES materials(id)
);

-- ============================================================================
-- SERIAL NUMBER TRACKING
-- ============================================================================

CREATE TABLE inventory_serial_numbers (
    id SERIAL PRIMARY KEY,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    material_id VARCHAR(50) NOT NULL,
    
    -- Location
    current_location_id INT,
    
    -- Status
    status VARCHAR(50),                -- 'IN_STOCK', 'ISSUED', 'IN_USE', 'RETURNED', 'SCRAPPED', 'SOLD'
    
    -- Lot association
    lot_number VARCHAR(100),
    
    -- Dates
    manufacture_date DATE,
    received_date DATE,
    warranty_start_date DATE,
    warranty_end_date DATE,
    
    -- Assignment
    assigned_to VARCHAR(100),
    assigned_date DATE,
    project_id VARCHAR(100),
    
    -- Supplier
    supplier_id INT,
    supplier_serial_number VARCHAR(100),
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (material_id) REFERENCES materials(id),
    FOREIGN KEY (current_location_id) REFERENCES inventory_locations(id)
);

-- ============================================================================
-- STOCK RESERVATIONS
-- ============================================================================

CREATE TABLE inventory_reservations (
    id SERIAL PRIMARY KEY,
    reservation_number VARCHAR(100) UNIQUE NOT NULL,
    reservation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    material_id VARCHAR(50) NOT NULL,
    location_id INT NOT NULL,
    
    reserved_quantity DECIMAL(15,3) NOT NULL,
    fulfilled_quantity DECIMAL(15,3) DEFAULT 0,
    remaining_quantity DECIMAL(15,3) GENERATED ALWAYS AS 
        (reserved_quantity - fulfilled_quantity) STORED,
    
    -- Reference
    reference_type VARCHAR(50),        -- 'PROJECT', 'WORK_ORDER', 'SALES_ORDER'
    reference_id VARCHAR(100),
    reference_number VARCHAR(100),
    
    -- Dates
    required_date DATE,
    expiry_date DATE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'ACTIVE', -- 'ACTIVE', 'FULFILLED', 'PARTIALLY_FULFILLED', 'CANCELLED', 'EXPIRED'
    
    -- Audit
    reserved_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (material_id) REFERENCES materials(id),
    FOREIGN KEY (location_id) REFERENCES inventory_locations(id),
    
    CHECK (reserved_quantity > 0),
    CHECK (fulfilled_quantity >= 0),
    CHECK (fulfilled_quantity <= reserved_quantity)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Location indexes
CREATE INDEX idx_loc_code ON inventory_locations(location_code);
CREATE INDEX idx_loc_type ON inventory_locations(location_type);
CREATE INDEX idx_loc_active ON inventory_locations(is_active);
CREATE INDEX idx_loc_parent ON inventory_locations(parent_location_id);

-- Stock indexes
CREATE INDEX idx_stock_material ON inventory_stock(material_id);
CREATE INDEX idx_stock_location ON inventory_stock(location_id);
CREATE INDEX idx_stock_available ON inventory_stock(quantity_available);
CREATE INDEX idx_stock_low_stock ON inventory_stock(is_below_reorder) WHERE is_below_reorder = true;
CREATE INDEX idx_stock_abc ON inventory_stock(abc_classification);
CREATE INDEX idx_stock_next_count ON inventory_stock(next_count_date) WHERE next_count_date IS NOT NULL;

-- Transaction indexes
CREATE INDEX idx_trans_material ON inventory_transactions(material_id);
CREATE INDEX idx_trans_date ON inventory_transactions(transaction_date DESC);
CREATE INDEX idx_trans_type ON inventory_transactions(transaction_type);
CREATE INDEX idx_trans_from_loc ON inventory_transactions(from_location_id);
CREATE INDEX idx_trans_to_loc ON inventory_transactions(to_location_id);
CREATE INDEX idx_trans_ref ON inventory_transactions(reference_type, reference_id);
CREATE INDEX idx_trans_number ON inventory_transactions(transaction_number);
CREATE INDEX idx_trans_lot ON inventory_transactions(lot_number) WHERE lot_number IS NOT NULL;
CREATE INDEX idx_trans_serial ON inventory_transactions(serial_number) WHERE serial_number IS NOT NULL;
CREATE INDEX idx_trans_posted ON inventory_transactions(is_posted);

-- Lot indexes
CREATE INDEX idx_lot_material ON inventory_lots(material_id);
CREATE INDEX idx_lot_expiry ON inventory_lots(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_lot_status ON inventory_lots(quality_status);

-- Serial number indexes
CREATE INDEX idx_serial_material ON inventory_serial_numbers(material_id);
CREATE INDEX idx_serial_location ON inventory_serial_numbers(current_location_id);
CREATE INDEX idx_serial_status ON inventory_serial_numbers(status);
CREATE INDEX idx_serial_lot ON inventory_serial_numbers(lot_number) WHERE lot_number IS NOT NULL;

-- Reservation indexes
CREATE INDEX idx_resv_material ON inventory_reservations(material_id);
CREATE INDEX idx_resv_location ON inventory_reservations(location_id);
CREATE INDEX idx_resv_status ON inventory_reservations(status);
CREATE INDEX idx_resv_ref ON inventory_reservations(reference_type, reference_id);
CREATE INDEX idx_resv_required_date ON inventory_reservations(required_date);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE inventory_locations IS 'Warehouse locations, zones, bins, and project sites';
COMMENT ON TABLE inventory_stock IS 'Current stock levels by material and location';
COMMENT ON TABLE inventory_transactions IS 'All inventory movements and adjustments';
COMMENT ON TABLE inventory_lots IS 'Lot/batch tracking for materials';
COMMENT ON TABLE inventory_serial_numbers IS 'Individual item tracking by serial number';
COMMENT ON TABLE inventory_reservations IS 'Stock reservations for projects, work orders, etc.';

COMMENT ON COLUMN inventory_stock.quantity_available IS 'Computed: quantity_on_hand - quantity_reserved';
COMMENT ON COLUMN inventory_stock.is_below_reorder IS 'Computed: quantity_available <= reorder_point';
COMMENT ON COLUMN inventory_stock.abc_classification IS 'A=High value, B=Medium value, C=Low value';
