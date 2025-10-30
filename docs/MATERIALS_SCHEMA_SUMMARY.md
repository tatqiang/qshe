# Materials System - Database Schema Summary

## 📊 Schema Overview

The materials system uses a **flexible 4-table master data + 1 transaction table** design that replaces rigid hierarchical categorization with a multi-column template approach.

## 🗂️ Table Structure

### 1. **material_groups** (Master Data)
**Purpose**: Top-level categorization
```sql
CREATE TABLE material_groups (
    id SERIAL PRIMARY KEY,
    group_code VARCHAR(50) UNIQUE NOT NULL,     -- 'GRP-PIPE-FIT'
    group_name VARCHAR(200) NOT NULL,           -- 'Pipes & Fittings'
    group_name_th VARCHAR(200),                 -- 'ท่อและข้อต่อ'
    description TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Sample Data**: Pipes & Fittings, Valves, Conduits, Cable Tray

---

### 2. **material_templates** (Master Data)
**Purpose**: Flexible 5-column classification templates
```sql
CREATE TABLE material_templates (
    id SERIAL PRIMARY KEY,
    material_group_id INT REFERENCES material_groups(id),
    
    -- 🔥 KEY INNOVATION: 5 flexible title columns (no rigid hierarchy)
    title_1 VARCHAR(200),                       -- 'Black Steel'
    title_2 VARCHAR(200),                       -- 'ERW'
    title_3 VARCHAR(200),                       -- 'Sch 40, Grade A'
    title_4 VARCHAR(200),                       -- 'Pipe' or 'Elbow 90°'
    title_5 VARCHAR(200),                       -- Optional extra
    
    dimension_group_id INT NULL,                -- Links to dimension_groups
    technical_spec_template JSONB,              -- Additional specs
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Template Preview**: "Black Steel | ERW | Sch 40, Grade A | Pipe"

---

### 3. **dimension_groups** (Master Data)
**Purpose**: Groups of related dimensions/sizes
```sql
CREATE TABLE dimension_groups (
    id SERIAL PRIMARY KEY,
    group_code VARCHAR(50) UNIQUE NOT NULL,     -- 'DIM-NOMINAL-PIPE'
    group_name VARCHAR(200) NOT NULL,           -- 'Nominal Pipe'
    group_name_th VARCHAR(200),                 -- 'ท่อมาตรฐาน'
    description TEXT,
    display_format VARCHAR(50) DEFAULT 'table', -- 'table', 'dropdown', 'list'
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Sample Data**: Nominal Pipe, Copper Pipe, Plastic Pipe, Wire Way

---

### 4. **dimensions** (Master Data)
**Purpose**: Individual size specifications with filtering
```sql
CREATE TABLE dimensions (
    id SERIAL PRIMARY KEY,
    dimension_group_id INT REFERENCES dimension_groups(id),
    
    -- 🔥 KEY INNOVATION: Multi-part dimensions
    size_1 VARCHAR(100) NOT NULL,               -- '1/2 inch'
    size_2 VARCHAR(100),                        -- '15 mm'
    size_3 VARCHAR(100),                        -- Optional third part
    
    -- 🔥 KEY INNOVATION: Type filtering for UI
    dimension_type VARCHAR(50) DEFAULT 'common', -- 'common' or 'custom'
    
    display_order INT DEFAULT 0,
    description TEXT,
    remark TEXT,                                 -- For custom dimensions
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Sample Dimension**: "1/2 inch / 15 mm" (common), "Custom 13.5mm" (custom)

---

### 5. **materials** (Transaction Data)
**Purpose**: Actual inventory items (template + dimension combination)
```sql
CREATE TABLE materials (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('MAT-' || to_char(NOW(), 'YYYYMMDD-HH24MISS-MS')),
    material_code VARCHAR(100) UNIQUE NOT NULL,
    
    -- Links to master data
    material_template_id INT REFERENCES material_templates(id),
    material_group_id INT REFERENCES material_groups(id),
    dimension_id INT REFERENCES dimensions(id),
    
    -- 🔥 AUTO-GENERATED: Full description
    material_description TEXT NOT NULL,         -- "Black Steel | ERW | Sch 40, Grade A | Pipe | 1/2 inch / 15 mm"
    material_description_th TEXT,
    
    -- 🔥 QSHE INTEGRATION: Links to existing tables
    company_id UUID REFERENCES companies(id),   -- NULL = JEC, otherwise customer
    project_id UUID REFERENCES projects(id),    -- NULL = stock, otherwise project-specific
    
    -- Inventory management
    unit_of_measure VARCHAR(50) DEFAULT 'PCS',
    min_stock_level DECIMAL(10,2) DEFAULT 0,
    max_stock_level DECIMAL(10,2),
    reorder_point DECIMAL(10,2),
    standard_cost DECIMAL(15,2) DEFAULT 0,
    
    -- Identification
    barcode VARCHAR(100) UNIQUE,
    qr_code TEXT,
    
    -- 🔥 TRACKING OPTIONS: User-configurable
    requires_lot_tracking BOOLEAN DEFAULT false,
    requires_serial_tracking BOOLEAN DEFAULT false,
    requires_expiry_tracking BOOLEAN DEFAULT false,
    shelf_life_days INT,
    
    -- Media
    primary_picture_url VARCHAR(500),
    
    -- Audit
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔗 Relationships

```
material_groups (1) ←→ (N) material_templates
                              ↓
                         dimension_groups (1) ←→ (N) dimensions
                              ↓                        ↓
companies (1) ←→ (N) materials ←→ (1) material_templates
projects (1)  ←→ (N)     ↑
                         ↓
                    dimensions (1)
```

## 🛠️ Helper Functions

### 1. **get_dimensions_for_template(template_id)**
**Purpose**: Get all dimensions linked to a specific template
```sql
SELECT get_dimensions_for_template(1); 
-- Returns all Nominal Pipe dimensions for Black Steel Pipe template
```

### 2. **generate_material_description(template_id, dimension_id)**
**Purpose**: Auto-generate full material description
```sql
SELECT generate_material_description(1, 1);
-- Returns: "Black Steel | ERW | Sch 40, Grade A | Pipe | 1/2 inch / 15 mm"
```

## 🎯 Key Innovations

### ✅ **Flexible Classification**
- **Old**: Fixed L1 → L2 → L3 hierarchy
- **New**: 5 flexible columns (title_1 to title_5)
- **Benefit**: Can represent any material structure

### ✅ **Dimension Type Filtering**
- **Common**: Standard sizes (1/2", 3/4", 1", 2")
- **Custom**: Special order sizes (custom lengths, non-standard)
- **UI Benefit**: Users can filter dimensions by type

### ✅ **Auto-Generated Descriptions**
- **Template**: "Black Steel | ERW | Sch 40, Grade A | Pipe"
- **+ Dimension**: " | 1/2 inch / 15 mm"
- **Result**: Full searchable description

### ✅ **QSHE Integration**
- **Companies**: Links to existing QSHE companies table
- **Projects**: Links to existing QSHE projects table
- **Users**: Uses QSHE authentication for created_by

### ✅ **Bulk Creation**
- Select 1 template + multiple dimensions
- Creates multiple materials in one operation
- Example: Select "Black Steel Pipe" + 5 sizes = 5 materials created

## 📊 Sample Data

### Material Groups (4):
1. **GRP-PIPE-FIT**: Pipes & Fittings
2. **GRP-VALVE**: Valves and Accessories  
3. **GRP-CONDUIT**: Conduits and Accessories
4. **GRP-CABLE-TRAY**: Cable Tray / Wire Way / Ladder

### Material Templates (12 - Black Steel):
- **Pipes**: Black Steel | ERW | Sch 40, Grade A | Pipe
- **Fittings**: Black Steel | ERW | Sch 40, Grade A | Elbow 45°/90°, TEE, Reducer
- **Both Grade A and Grade B variants**

### Dimension Groups (4):
1. **DIM-NOMINAL-PIPE**: Nominal Pipe (1/2" - 6")
2. **DIM-COPPER-PIPE**: Copper Pipe  
3. **DIM-PLASTIC-PIPE**: Plastic Pipe (OD)
4. **DIM-WIRE-WAY**: Wire Way

### Dimensions (10 - Nominal Pipe):
- 1/2 inch / 15 mm (common)
- 3/4 inch / 20 mm (common)
- 1 inch / 25 mm (common)
- ... up to 6 inch / 150 mm (common)

## 📍 File Locations

- **Schema**: `database/01_schema/10_materials_system.sql`
- **Types**: `src/types/materialSystem.ts`
- **API**: `src/lib/api/materialSystem.ts`
- **Documentation**: `docs/MATERIALS_INTEGRATION.md`

## 🚀 Usage Example

1. **Select Group**: "Pipes & Fittings"
2. **Select Template**: "Black Steel | ERW | Sch 40, Grade A | Pipe"
3. **Select Dimensions**: [1/2", 3/4", 1", 2"] (4 selected)
4. **Create Materials**: 4 materials created automatically:
   - Black Steel | ERW | Sch 40, Grade A | Pipe | 1/2 inch / 15 mm
   - Black Steel | ERW | Sch 40, Grade A | Pipe | 3/4 inch / 20 mm
   - Black Steel | ERW | Sch 40, Grade A | Pipe | 1 inch / 25 mm
   - Black Steel | ERW | Sch 40, Grade A | Pipe | 2 inch / 50 mm

This replaces the rigid hierarchy with flexible, bulk-creatable material classification! 🎉