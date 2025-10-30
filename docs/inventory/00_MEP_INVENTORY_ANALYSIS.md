# MEP INVENTORY SYSTEM - DEEP ANALYSIS & DATABASE DESIGN DISCUSSION

**Date:** October 29, 2025  
**Purpose:** Comprehensive analysis and database schema design for MEP (Mechanical, Electrical, Plumbing) materials inventory system

---

## 📊 UNDERSTANDING THE COMPLEXITY

### Data Structure from material_table.csv

Your CSV reveals a **HIGHLY COMPLEX hierarchical structure** specifically designed for MEP materials:

```
Category Level 1 (Cat 1)
├── Category Level 2 (Cat 2)
    ├── Category Level 3 (Cat 3)
        ├── Dimension Variant 1
        ├── Dimension Variant 2
        ├── Dimension Variant 3
        └── ...
```

### Real-World Example from Your Data:

```
pipe-01: Pipe and Accessories (L1)
  └─ bsp-01: Black Steel Pipes Sch 40, Grade A, ERW (L2)
      ├─ pipe-001: Pipe (L3)
      │   ├─ p-a001: 1/2 inch (15 mm)
      │   ├─ p-a002: 3/4 inch (20 mm)
      │   ├─ p-a003: 1 inch (25 mm)
      │   ├─ p-a004: 1-1/2 inch (32 mm)
      │   └─ p-a005: 2 inch (50 mm)
      ├─ pipe-002: Elbow 90° (L3)
      │   ├─ p-a001: 1/2 inch (15 mm)
      │   ├─ p-a002: 3/4 inch (20 mm)
      │   └─ ... (same sizes)
      ├─ pipe-003: Elbow 45° (L3)
      ├─ pipe-004: Equal TEE (L3)
      ├─ pipe-005: Reducing TEE (L3)
      │   └─ Has DIFFERENT size format: "1 x 1/2 inch" (25 x 15 mm)
      └─ pipe-006: Reducer Concentric (L3)
```

---

## 🎯 KEY COMPLEXITY FACTORS IN MEP MATERIALS

### 1. **Multi-Dimensional Size Specifications**
- **Single dimension**: Pipes (1/2 inch)
- **Two dimensions**: Reducers, Reducing TEEs (2 x 1 inch)
- **Multiple dimensions**: Complex fittings
- **Dual units**: Imperial + Metric (1/2 inch = 15 mm)

### 2. **Technical Specifications Vary by Category**
- **Pipes**: Schedule, Grade, Manufacturing method (ERW)
- **Pumps**: Type, Brand, Rated Current, Head Pressure
- **Generators**: Type, Brand, Power Rating
- **Each category has DIFFERENT attributes**

### 3. **Material Classification Challenges**
- Same size codes (p-a001, p-a002) used across different item types
- Different grouping systems (p-a001 vs p-b001)
- Tag-based search requirements

### 4. **MEP-Specific Requirements**
- **Standards compliance**: ASTM, ASME, BS, DIN standards
- **Certifications**: UL, CE, ISO certifications
- **Technical drawings**: PDF datasheets, CAD drawings
- **Compatibility**: Which items work together?
- **Substitution rules**: Alternative materials/brands

---

## 🏗️ THREE DATABASE SCHEMA APPROACHES

## APPROACH 1: EAV (Entity-Attribute-Value) Pattern
### ⚡ Best for: MAXIMUM FLEXIBILITY

```sql
materials (id, name, category_path)
material_attributes (material_id, attribute_name, attribute_value, data_type)
```

### ✅ PROS:
- **Ultimate flexibility** - add any attribute without schema changes
- Perfect for varying attributes per category
- Easy to add new material types
- No NULL columns for unused attributes

### ❌ CONS:
- **Query complexity** - requires multiple JOINs
- **Performance overhead** - harder to optimize
- **Data integrity** - harder to enforce constraints
- **Difficult reporting** - complex aggregations

### 📊 VERDICT: 
**NOT RECOMMENDED** for inventory systems - too slow for transaction processing

---

## APPROACH 2: SINGLE TABLE WITH JSON (Hybrid)
### ⚡ Best for: BALANCE of Structure + Flexibility

```sql
materials (
    id, category_l1_id, category_l2_id, category_l3_id,
    size_1, size_2,
    technical_specs JSONB,  -- PostgreSQL JSONB
    created_at, updated_at
)
```

### ✅ PROS:
- **Good query performance** for standard fields
- **Flexible technical_specs** without schema changes
- **JSONB indexing** in PostgreSQL (GIN indexes)
- Easier than EAV, more flexible than pure relational

### ❌ CONS:
- **Limited querying** within JSON (though PostgreSQL JSONB helps)
- **Data validation** requires application logic
- **Reporting challenges** on JSON fields
- Not all databases support JSONB well

### 📊 VERDICT:
**GOOD OPTION** if using PostgreSQL with complex/varying specs

---

## APPROACH 3: SPECIALIZED TABLES (Pure Relational)
### ⚡ Best for: PERFORMANCE + DATA INTEGRITY

```sql
-- Base material master
materials (id, category_l1_id, category_l2_id, category_l3_id, 
          material_code, size_1, size_2, uom, is_active)

-- Category-specific extension tables
material_pipes (material_id, schedule, grade, manufacturing_method, 
               pressure_rating, thickness)

material_pumps (material_id, pump_type, motor_hp, voltage, 
               rated_current, head_pressure, flow_rate)

material_generators (material_id, engine_type, power_kva, voltage,
                    frequency, fuel_type, fuel_consumption)

material_electrical (material_id, voltage, current_rating, 
                    ip_rating, wire_size)
```

### ✅ PROS:
- **Best query performance**
- **Strong data integrity** with proper constraints
- **Easy reporting** and aggregations
- **Type-safe** attributes per category

### ❌ CONS:
- **More tables to manage**
- **Schema changes** needed for new categories
- **Complex queries** need multiple table knowledge

### 📊 VERDICT:
**RECOMMENDED** for serious inventory systems with good performance needs

---

## 🎨 MY RECOMMENDED HYBRID APPROACH

### BEST OF BOTH WORLDS: "Smart Relational + Flexible Extensions"

```
CORE TABLES (Relational - Fast & Structured):
├── material_categories_l1, l2, l3 (hierarchy)
├── materials (master data with common fields)
├── inventory_stock (quantities, locations)
├── inventory_transactions (movements)
├── suppliers, material_suppliers

CATEGORY-SPECIFIC TABLES (for high-volume categories):
├── material_pipe_specs
├── material_pump_specs
├── material_electrical_specs

FLEXIBLE EXTENSION (for less common items):
└── material_extended_attributes (key-value for miscellaneous specs)
```

---

## 📐 DETAILED RECOMMENDED SCHEMA

### Level 1: Category Hierarchy (Standard across all approaches)

This is non-negotiable - you NEED proper hierarchy:

```sql
-- Level 1: Main Categories
material_categories_l1 (
    id VARCHAR(50) PK,
    title_en, title_th, tags,
    icon, color, display_order,
    is_active, created_at, updated_at
)

-- Level 2: Sub-Categories  
material_categories_l2 (
    id VARCHAR(50) PK,
    parent_l1_id FK,
    title_en, title_th, tags,
    specifications TEXT,  -- e.g., "Sch 40, Grade A, ERW"
    display_order, is_active
)

-- Level 3: Item Types
material_categories_l3 (
    id VARCHAR(50) PK,
    parent_l2_id FK,
    title_en, title_th, tags,
    display_order, is_active,
    has_size_variants BOOLEAN,  -- Important!
    size_pattern VARCHAR(50)    -- "single", "dual", "triple"
)
```

### Level 2: Material Master (Core Data)

```sql
materials (
    id VARCHAR(50) PK,
    material_code VARCHAR(100) UNIQUE,  -- Auto-generated or manual
    
    -- Category linkage
    category_l1_id FK,
    category_l2_id FK,
    category_l3_id FK,
    
    -- Basic information
    name_en VARCHAR(200),
    name_th VARCHAR(200),
    description TEXT,
    
    -- Size/Dimension (standardized)
    size_1 VARCHAR(100),      -- "1/2 inch" or "15 mm"
    size_2 VARCHAR(100),      -- For reducers: "1 inch"
    size_unit VARCHAR(20),    -- "inch", "mm", "cm"
    
    -- Common fields
    brand VARCHAR(100),
    manufacturer VARCHAR(200),
    model_number VARCHAR(100),
    unit_of_measure VARCHAR(50),
    
    -- Physical properties
    weight_kg DECIMAL(15,3),
    dimensions_lwh VARCHAR(100),  -- "100x50x30 mm"
    
    -- Documentation
    datasheet_url TEXT,
    drawing_url TEXT,
    photo_url TEXT,
    
    -- Pricing (basic)
    standard_cost DECIMAL(15,2),
    last_purchase_price DECIMAL(15,2),
    currency VARCHAR(10) DEFAULT 'THB',
    
    -- Status
    status VARCHAR(50),  -- 'ACTIVE', 'DISCONTINUED', 'OBSOLETE'
    is_active BOOLEAN DEFAULT true,
    
    -- Audit
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
)

-- Essential indexes
CREATE INDEX idx_mat_cat_l1 ON materials(category_l1_id);
CREATE INDEX idx_mat_cat_l2 ON materials(category_l2_id);
CREATE INDEX idx_mat_cat_l3 ON materials(category_l3_id);
CREATE INDEX idx_mat_code ON materials(material_code);
CREATE INDEX idx_mat_brand ON materials(brand);
CREATE INDEX idx_mat_size1 ON materials(size_1);
CREATE UNIQUE INDEX idx_mat_unique_combo ON materials(
    category_l3_id, size_1, size_2, brand
) WHERE is_active = true;
```

### Level 3: Category-Specific Extensions

```sql
-- For Pipes & Fittings
material_pipe_specs (
    material_id VARCHAR(50) PK FK,
    schedule VARCHAR(50),         -- "Sch 40", "Sch 80"
    grade VARCHAR(50),            -- "Grade A", "Grade B"
    manufacturing_method VARCHAR(50),  -- "ERW", "Seamless"
    material_type VARCHAR(50),    -- "Black Steel", "Galvanized", "Stainless"
    pressure_rating VARCHAR(50),  -- "150 PSI", "PN16"
    thickness_mm DECIMAL(10,3),
    outer_diameter_mm DECIMAL(10,3),
    inner_diameter_mm DECIMAL(10,3),
    standard_compliance VARCHAR(100),  -- "ASTM A53", "BS 1387"
    coating VARCHAR(100),
    created_at TIMESTAMP
)

-- For Pumps
material_pump_specs (
    material_id VARCHAR(50) PK FK,
    pump_type VARCHAR(100),       -- "Centrifugal", "End Suction", "Submersible"
    motor_hp DECIMAL(10,2),
    motor_kw DECIMAL(10,2),
    voltage VARCHAR(50),          -- "220V", "380V", "220/380V"
    phase VARCHAR(20),            -- "1-phase", "3-phase"
    frequency VARCHAR(20),        -- "50Hz", "60Hz"
    rated_current_amp DECIMAL(10,2),
    head_pressure_m DECIMAL(10,2),
    flow_rate_lpm DECIMAL(10,2),
    discharge_size VARCHAR(50),
    suction_size VARCHAR(50),
    impeller_material VARCHAR(100),
    shaft_seal_type VARCHAR(100),
    motor_efficiency VARCHAR(20),
    ip_rating VARCHAR(20),
    created_at TIMESTAMP
)

-- For Electrical Equipment
material_electrical_specs (
    material_id VARCHAR(50) PK FK,
    equipment_type VARCHAR(100),  -- "Generator", "Panel", "Cable"
    voltage VARCHAR(50),
    current_rating_amp DECIMAL(10,2),
    power_kva DECIMAL(10,2),
    power_kw DECIMAL(10,2),
    frequency_hz VARCHAR(20),
    phase VARCHAR(20),
    ip_rating VARCHAR(20),
    wire_size_sqmm DECIMAL(10,2),
    insulation_type VARCHAR(100),
    conductor_material VARCHAR(50),
    certification VARCHAR(200),   -- "UL, CE, ISO"
    created_at TIMESTAMP
)

-- For General/Misc items with varying attributes
material_extended_attributes (
    id SERIAL PK,
    material_id VARCHAR(50) FK,
    attribute_name VARCHAR(100),
    attribute_value TEXT,
    attribute_unit VARCHAR(50),
    data_type VARCHAR(20),  -- 'text', 'number', 'boolean', 'date'
    display_order INT,
    created_at TIMESTAMP,
    
    UNIQUE(material_id, attribute_name)
)
```

---

## 🔄 SIZE VARIANT HANDLING STRATEGY

This is CRITICAL for your data! Notice how you have:
- p-a001, p-a002, p-a003... (standard sizes)
- p-b001, p-b002... (reducing sizes)

### Strategy A: Dimension Groups (Your Current Approach)

```sql
-- Add to materials table:
dimension_group VARCHAR(50),  -- 'p-a', 'p-b'
dimension_order INT,          -- 1, 2, 3, 4, 5

-- This allows grouping variants together
-- Good for displaying all sizes of same item type
```

### Strategy B: Variant Parent-Child

```sql
-- materials table
parent_material_id VARCHAR(50),  -- NULL for master, ID for variants
is_master BOOLEAN,
variant_type VARCHAR(50),  -- 'SIZE', 'COLOR', 'GRADE'

-- Queries:
-- Get master: WHERE is_master = true
-- Get all variants: WHERE parent_material_id = 'pipe-001'
```

### 📊 RECOMMENDATION:
Use **Strategy A** - it matches your existing data structure and is simpler for MEP materials where sizes are predictable within each item type.

---

## 💾 INVENTORY TRACKING TABLES

```sql
-- Locations/Warehouses
inventory_locations (
    id SERIAL PK,
    location_code VARCHAR(50) UNIQUE,
    location_name VARCHAR(200),
    location_type VARCHAR(50),  -- 'WAREHOUSE', 'SITE', 'TRUCK', 'SUPPLIER'
    parent_location_id INT,     -- For sub-locations (zones, bins)
    address TEXT,
    contact_person VARCHAR(100),
    is_active BOOLEAN,
    created_at TIMESTAMP
)

-- Stock Levels (Current quantity)
inventory_stock (
    id SERIAL PK,
    material_id VARCHAR(50) FK,
    location_id INT FK,
    
    -- Quantities
    quantity_on_hand DECIMAL(15,3) DEFAULT 0,
    quantity_reserved DECIMAL(15,3) DEFAULT 0,
    quantity_available AS (quantity_on_hand - quantity_reserved) STORED,
    quantity_in_transit DECIMAL(15,3) DEFAULT 0,
    
    -- Reorder logic
    min_stock_level DECIMAL(15,3),
    max_stock_level DECIMAL(15,3),
    reorder_point DECIMAL(15,3),
    economic_order_quantity DECIMAL(15,3),
    
    -- Cost tracking
    average_unit_cost DECIMAL(15,2),
    total_value AS (quantity_on_hand * average_unit_cost) STORED,
    
    -- Tracking
    last_counted_date DATE,
    last_counted_by VARCHAR(100),
    last_movement_date TIMESTAMP,
    
    -- Bin/Zone location
    bin_location VARCHAR(100),
    zone VARCHAR(50),
    aisle VARCHAR(50),
    shelf VARCHAR(50),
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    UNIQUE(material_id, location_id)
)

-- Critical indexes
CREATE INDEX idx_stock_material ON inventory_stock(material_id);
CREATE INDEX idx_stock_location ON inventory_stock(location_id);
CREATE INDEX idx_stock_low ON inventory_stock(quantity_available) 
    WHERE quantity_available <= reorder_point AND is_active = true;
```

---

## 📝 TRANSACTION LOGGING

```sql
inventory_transactions (
    id SERIAL PK,
    transaction_number VARCHAR(100) UNIQUE,  -- Auto-generated
    transaction_date TIMESTAMP NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    -- Types: 'RECEIVE', 'ISSUE', 'TRANSFER', 'ADJUSTMENT', 
    --        'RETURN', 'SCRAP', 'INITIAL_STOCK'
    
    material_id VARCHAR(50) FK NOT NULL,
    
    -- Location movement
    from_location_id INT FK,
    to_location_id INT FK,
    
    -- Quantity
    quantity DECIMAL(15,3) NOT NULL,
    unit_of_measure VARCHAR(50),
    
    -- Cost
    unit_cost DECIMAL(15,2),
    total_cost DECIMAL(15,2),
    
    -- Reference documents
    reference_type VARCHAR(50),  -- 'PO', 'WO', 'PROJECT', 'REQUISITION'
    reference_id VARCHAR(100),
    reference_number VARCHAR(100),
    
    -- Additional info
    notes TEXT,
    reason_code VARCHAR(50),    -- For adjustments
    approved_by VARCHAR(100),
    approved_date TIMESTAMP,
    
    -- Audit
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Validation
    CHECK (
        (transaction_type IN ('RECEIVE', 'ADJUSTMENT', 'INITIAL_STOCK') AND to_location_id IS NOT NULL) OR
        (transaction_type = 'ISSUE' AND from_location_id IS NOT NULL) OR
        (transaction_type = 'TRANSFER' AND from_location_id IS NOT NULL AND to_location_id IS NOT NULL)
    )
)

CREATE INDEX idx_trans_material ON inventory_transactions(material_id);
CREATE INDEX idx_trans_date ON inventory_transactions(transaction_date DESC);
CREATE INDEX idx_trans_type ON inventory_transactions(transaction_type);
CREATE INDEX idx_trans_ref ON inventory_transactions(reference_type, reference_id);
CREATE INDEX idx_trans_from_loc ON inventory_transactions(from_location_id);
CREATE INDEX idx_trans_to_loc ON inventory_transactions(to_location_id);
```

---

## 🏢 SUPPLIER & PRICING

```sql
suppliers (
    id SERIAL PK,
    supplier_code VARCHAR(50) UNIQUE,
    supplier_name VARCHAR(200),
    supplier_type VARCHAR(50),  -- 'MANUFACTURER', 'DISTRIBUTOR', 'CONTRACTOR'
    
    -- Contact
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(50),
    website VARCHAR(200),
    
    -- Address
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Thailand',
    
    -- Business info
    tax_id VARCHAR(50),
    payment_terms VARCHAR(100),  -- "Net 30", "COD", "50% advance"
    credit_limit DECIMAL(15,2),
    
    -- Performance
    rating DECIMAL(3,2),  -- 1.00 to 5.00
    on_time_delivery_pct DECIMAL(5,2),
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)

material_suppliers (
    id SERIAL PK,
    material_id VARCHAR(50) FK,
    supplier_id INT FK,
    
    -- Supplier's identification
    supplier_material_code VARCHAR(100),
    supplier_material_name VARCHAR(200),
    
    -- Pricing
    unit_price DECIMAL(15,2),
    currency VARCHAR(10) DEFAULT 'THB',
    price_valid_from DATE,
    price_valid_to DATE,
    minimum_order_qty DECIMAL(15,3),
    
    -- Lead time
    lead_time_days INT,
    
    -- Status
    is_preferred BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Last order info
    last_order_date DATE,
    last_order_price DECIMAL(15,2),
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    UNIQUE(material_id, supplier_id)
)

CREATE INDEX idx_mat_supp_material ON material_suppliers(material_id);
CREATE INDEX idx_mat_supp_supplier ON material_suppliers(supplier_id);
CREATE INDEX idx_mat_supp_preferred ON material_suppliers(is_preferred) 
    WHERE is_preferred = true;
```

---

## 🎯 CRITICAL QUESTIONS FOR YOU

### 1. **Technology Stack**
- **Current database?** PostgreSQL, MySQL, SQL Server, Oracle?
- **ORM?** TypeORM, Prisma, Sequelize?
- This affects JSONB support, computed columns, indexing strategies

### 2. **Scale & Performance**
- **Expected material count?** 1,000? 10,000? 100,000+ items?
- **Transactions per day?** 10? 100? 1,000+?
- **Concurrent users?** 5? 50? 500?
- **Response time requirements?** <100ms? <1s? <5s?

### 3. **Business Rules**
- **Lot/Batch tracking?** Need to track material by manufacturing lot?
- **Serial numbers?** Individual item tracking (generators, pumps)?
- **Expiry dates?** Any perishable materials (chemicals, adhesives)?
- **Quality control?** Inspection required before acceptance?

### 4. **Project Integration**
- **Material allocation?** Reserve materials for specific projects?
- **BOM (Bill of Materials)?** Track what materials needed per project?
- **Work orders?** Issue materials to specific work orders?
- **Project costing?** Track material costs per project?

### 5. **Procurement Workflow**
- **Purchase requisitions?** Request → Approve → PO workflow?
- **Purchase orders?** Full PO management in same system?
- **GRN (Goods Received Note)?** Receiving inspection process?
- **Multi-approval levels?** Different approval limits?

### 6. **Physical Inventory**
- **Cycle counting?** Regular counting of portions of inventory?
- **Physical inventory?** Annual full count?
- **Barcode/QR?** Scanning for transactions?
- **Mobile app?** Field personnel need mobile access?

### 7. **Costing Method**
- **FIFO** (First In First Out)?
- **Average Cost** (Weighted average)?
- **Standard Cost** (Predetermined cost)?
- This affects transaction logging and cost calculation

### 8. **Multi-location**
- **How many locations?** 1 warehouse? Multiple sites?
- **Inter-location transfers?** Move materials between locations?
- **Consignment stock?** Materials at customer site?
- **In-transit tracking?** Materials being shipped?

### 9. **Reporting Needs**
- **Stock valuation reports?**
- **Movement history?**
- **Aging analysis?**
- **ABC analysis?** (High/Medium/Low value classification)
- **Slow-moving items?**
- **Reorder reports?**

### 10. **MEP-Specific**
- **Compatibility matrix?** Which fittings work with which pipes?
- **Substitution rules?** Alternative brands/items?
- **Standards compliance?** Track ASTM/BS/DIN standards?
- **Certifications?** Store test certificates, mill certs?
- **Technical documents?** Datasheets, CAD drawings, manuals?

---

## 🚀 IMPLEMENTATION PHASES RECOMMENDATION

### Phase 1: Core Foundation (MVP)
- Material categories (3 levels)
- Material master data
- Basic inventory stock tracking
- Simple transactions (receive, issue)
- One location only

### Phase 2: Enhanced Features
- Multi-location support
- Supplier management
- Material-supplier relationships
- Advanced search/filtering
- Basic reporting

### Phase 3: Advanced Operations
- Purchase requisitions
- Purchase orders
- GRN (Goods Received Notes)
- Reserved stock
- Transfer orders

### Phase 4: Analytics & Optimization
- Stock valuation reports
- Reorder point calculation
- ABC analysis
- Slow-moving analysis
- Supplier performance

### Phase 5: Integration
- Project allocation
- Work order integration
- Mobile app
- Barcode/QR scanning
- Document management

---

## 🎪 NEXT STEPS

**Please answer the critical questions above so I can:**

1. ✅ Finalize the optimal schema for YOUR specific needs
2. ✅ Generate complete SQL scripts with all constraints
3. ✅ Create TypeScript interfaces/types
4. ✅ Design API endpoints
5. ✅ Plan the implementation phases
6. ✅ Create sample data migration scripts

**This is a BIG module** - let's make sure we design it right from the start! 🎯
