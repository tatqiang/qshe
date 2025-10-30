# QUICK REFERENCE - MEP INVENTORY DATABASE

## 📊 TABLE COUNT: 23 CORE TABLES

### CATEGORY HIERARCHY (3 tables)
```
material_categories_l1  → Main categories (Pipes, Electrical, Plumbing)
material_categories_l2  → Sub-categories (Black Steel Pipes Sch 40)
material_categories_l3  → Item types (Pipe, Elbow, TEE)
```

### MATERIAL MASTER (1 + 6 tables)
```
materials                      → Main material master
material_pipe_specs            → Pipe specifications
material_pump_specs            → Pump specifications
material_electrical_specs      → Electrical specifications
material_valve_specs           → Valve specifications
material_hvac_specs            → HVAC specifications
material_extended_attributes   → Flexible attributes
```

### INVENTORY TRACKING (6 tables)
```
inventory_locations      → Warehouses, sites, zones, bins
inventory_stock          → Current stock levels per location
inventory_transactions   → All movements (receive, issue, transfer)
inventory_lots           → Lot/batch tracking
inventory_serial_numbers → Serial number tracking
inventory_reservations   → Reserved stock for projects
```

### SUPPLIER & PRICING (7 tables)
```
suppliers                        → Supplier master data
material_suppliers               → Material ↔ Supplier (M:N)
material_price_history           → Price changes over time
material_volume_discounts        → Volume pricing tiers
supplier_contacts                → Supplier contact persons
supplier_performance_ratings     → Supplier KPIs
supplier_documents               → Certificates, contracts
```

---

## 🔑 KEY DESIGN PATTERNS

### 1. SIZE VARIANTS
```sql
-- Each size is a SEPARATE material record
materials:
  id: 'p-a001', size_1: '1/2 inch', size_2: '15 mm', dimension_group: 'p-a', dimension_order: 1
  id: 'p-a002', size_1: '3/4 inch', size_2: '20 mm', dimension_group: 'p-a', dimension_order: 2
  id: 'p-a003', size_1: '1 inch', size_2: '25 mm', dimension_group: 'p-a', dimension_order: 3
```

### 2. STOCK AVAILABILITY (Computed Column)
```sql
inventory_stock:
  quantity_on_hand: 100
  quantity_reserved: 30
  quantity_available: 70  ← COMPUTED (100 - 30)
```

### 3. TRANSACTION TYPES
```sql
'RECEIVE'    → Goods received from supplier
'ISSUE'      → Materials issued to project/work order
'TRANSFER'   → Move between locations
'ADJUSTMENT' → Stock count corrections
'RETURN'     → Return from project
'SCRAP'      → Write-off damaged materials
```

### 4. CATEGORY-SPECIFIC SPECS (1:1 Optional)
```sql
materials (id='p-a001')
  ↓
material_pipe_specs (material_id='p-a001')
  schedule: 'Sch 40'
  grade: 'Grade A'
  pressure_rating: 'PN16'
```

---

## 📈 COMMON QUERIES

### Get Material with Full Category Path
```sql
SELECT 
    m.material_code,
    m.name_en,
    l1.title_en AS main_category,
    l2.title_en AS sub_category,
    l3.title_en AS item_type,
    m.size_1,
    m.brand
FROM materials m
JOIN material_categories_l1 l1 ON l1.id = m.category_l1_id
JOIN material_categories_l2 l2 ON l2.id = m.category_l2_id
JOIN material_categories_l3 l3 ON l3.id = m.category_l3_id
WHERE m.is_active = true;
```

### Get Stock Levels with Low Stock Alert
```sql
SELECT 
    m.material_code,
    m.name_en,
    loc.location_name,
    s.quantity_on_hand,
    s.quantity_reserved,
    s.quantity_available,
    s.reorder_point,
    CASE 
        WHEN s.quantity_available <= s.reorder_point THEN 'REORDER NOW'
        WHEN s.quantity_available <= s.min_stock_level THEN 'LOW STOCK'
        ELSE 'OK'
    END AS status
FROM inventory_stock s
JOIN materials m ON m.id = s.material_id
JOIN inventory_locations loc ON loc.id = s.location_id
WHERE s.is_below_reorder = true
ORDER BY s.quantity_available;
```

### Get All Size Variants of an Item Type
```sql
SELECT 
    m.material_code,
    m.dimension_order,
    m.size_1,
    m.size_2,
    s.quantity_available,
    ms.unit_price,
    sup.supplier_name
FROM materials m
LEFT JOIN inventory_stock s ON s.material_id = m.id
LEFT JOIN material_suppliers ms ON ms.material_id = m.id AND ms.is_preferred = true
LEFT JOIN suppliers sup ON sup.id = ms.supplier_id
WHERE m.category_l3_id = 'pipe-001'  -- Pipe
  AND m.is_active = true
ORDER BY m.dimension_group, m.dimension_order;
```

### Transaction History for a Material
```sql
SELECT 
    t.transaction_date,
    t.transaction_type,
    t.quantity,
    t.unit_cost,
    from_loc.location_name AS from_location,
    to_loc.location_name AS to_location,
    t.reference_type,
    t.reference_number,
    t.created_by
FROM inventory_transactions t
LEFT JOIN inventory_locations from_loc ON from_loc.id = t.from_location_id
LEFT JOIN inventory_locations to_loc ON to_loc.id = t.to_location_id
WHERE t.material_id = 'p-a001'
ORDER BY t.transaction_date DESC;
```

### Materials Needing Reorder with Preferred Supplier
```sql
SELECT 
    m.material_code,
    m.name_en,
    s.quantity_available,
    s.reorder_point,
    s.reorder_quantity,
    sup.supplier_name,
    ms.unit_price,
    ms.lead_time_days,
    (s.reorder_quantity * ms.unit_price) AS order_value
FROM inventory_stock s
JOIN materials m ON m.id = s.material_id
JOIN material_suppliers ms ON ms.material_id = m.id AND ms.is_preferred = true
JOIN suppliers sup ON sup.id = ms.supplier_id
WHERE s.is_below_reorder = true
  AND m.is_active = true
  AND ms.is_active = true
ORDER BY order_value DESC;
```

---

## 🎯 INDEXES FOR PERFORMANCE

### Most Important Indexes
```sql
-- Material lookups
CREATE INDEX idx_mat_code ON materials(material_code);
CREATE INDEX idx_mat_cat_l3 ON materials(category_l3_id);
CREATE INDEX idx_mat_active ON materials(is_active) WHERE is_active = true;

-- Stock queries
CREATE INDEX idx_stock_material ON inventory_stock(material_id);
CREATE INDEX idx_stock_location ON inventory_stock(location_id);
CREATE INDEX idx_stock_low ON inventory_stock(is_below_reorder) WHERE is_below_reorder = true;

-- Transactions
CREATE INDEX idx_trans_material ON inventory_transactions(material_id);
CREATE INDEX idx_trans_date ON inventory_transactions(transaction_date DESC);
CREATE INDEX idx_trans_ref ON inventory_transactions(reference_type, reference_id);

-- Suppliers
CREATE INDEX idx_mat_supp_material ON material_suppliers(material_id);
CREATE INDEX idx_mat_supp_preferred ON material_suppliers(is_preferred) WHERE is_preferred = true;
```

---

## 🔒 DATA INTEGRITY CONSTRAINTS

### Foreign Keys
```sql
materials → category_l1_id → material_categories_l1(id)
materials → category_l2_id → material_categories_l2(id)
materials → category_l3_id → material_categories_l3(id)

inventory_stock → material_id → materials(id)
inventory_stock → location_id → inventory_locations(id)

material_suppliers → material_id → materials(id)
material_suppliers → supplier_id → suppliers(id)
```

### Check Constraints
```sql
-- Stock quantities must be non-negative
CHECK (quantity_on_hand >= 0)
CHECK (quantity_reserved >= 0)
CHECK (quantity_reserved <= quantity_on_hand)

-- Transaction quantities cannot be zero
CHECK (quantity != 0)

-- Transaction types validation
CHECK (transaction_type IN ('RECEIVE', 'ISSUE', 'TRANSFER', 'ADJUSTMENT', ...))
```

### Unique Constraints
```sql
UNIQUE(material_id, location_id)        -- One stock record per material per location
UNIQUE(material_id, supplier_id)        -- One relationship record per material-supplier pair
UNIQUE(material_code)                   -- Material codes must be unique
UNIQUE(supplier_code)                   -- Supplier codes must be unique
```

---

## 📱 API ENDPOINT SUGGESTIONS

### Materials
```
GET    /api/materials                    → List all materials (with filters)
GET    /api/materials/:id                → Get material details
POST   /api/materials                    → Create new material
PUT    /api/materials/:id                → Update material
DELETE /api/materials/:id                → Soft delete (set is_active=false)

GET    /api/materials/:id/variants       → Get all size variants
GET    /api/materials/:id/stock          → Get stock levels across locations
GET    /api/materials/:id/transactions   → Get transaction history
GET    /api/materials/:id/suppliers      → Get suppliers for material
```

### Inventory
```
GET    /api/inventory/stock              → Current stock levels
POST   /api/inventory/receive            → Receive materials
POST   /api/inventory/issue              → Issue materials
POST   /api/inventory/transfer           → Transfer between locations
POST   /api/inventory/adjustment         → Stock adjustment

GET    /api/inventory/low-stock          → Materials below reorder point
GET    /api/inventory/transactions       → Transaction history
```

### Categories
```
GET    /api/categories                   → Full category tree
GET    /api/categories/l1                → Level 1 categories
GET    /api/categories/l2/:parentId      → Level 2 under parent
GET    /api/categories/l3/:parentId      → Level 3 under parent
```

### Suppliers
```
GET    /api/suppliers                    → List suppliers
GET    /api/suppliers/:id                → Supplier details
POST   /api/suppliers                    → Create supplier
PUT    /api/suppliers/:id                → Update supplier

GET    /api/suppliers/:id/materials      → Materials from supplier
GET    /api/suppliers/:id/pricing        → Price list
```

---

## 🎨 UI COMPONENT STRUCTURE SUGGESTIONS

```
src/
  features/
    inventory/
      components/
        MaterialCatalog/
          MaterialCatalogGrid.tsx
          MaterialCatalogList.tsx
          MaterialCatalogFilters.tsx
          CategoryBreadcrumb.tsx
        
        MaterialDetails/
          MaterialDetailsCard.tsx
          MaterialSpecsTab.tsx
          MaterialStockTab.tsx
          MaterialSuppliersTab.tsx
          MaterialTransactionsTab.tsx
        
        StockManagement/
          StockLevelsDashboard.tsx
          ReceiveMaterialsForm.tsx
          IssueMaterialsForm.tsx
          TransferMaterialsForm.tsx
          AdjustStockForm.tsx
        
        LowStockAlerts/
          LowStockTable.tsx
          ReorderRecommendations.tsx
        
        Reports/
          StockValuationReport.tsx
          MovementAnalysisReport.tsx
          ABCAnalysisReport.tsx
      
      services/
        materialService.ts
        inventoryService.ts
        supplierService.ts
      
      types/
        material.types.ts
        inventory.types.ts
        supplier.types.ts
```

---

## 💾 BACKUP STRATEGY

```sql
-- Daily: Transaction tables (fast-changing data)
inventory_transactions
inventory_stock

-- Weekly: Material and supplier data
materials
material_suppliers
suppliers

-- Monthly: Full database backup
-- All tables
```

---

## ⚡ PERFORMANCE TIPS

1. **Use pagination** for material lists (50-100 records per page)
2. **Index foreign keys** (already in schema)
3. **Use computed columns** for frequently calculated values
4. **Denormalize** for reporting (create views)
5. **Archive old transactions** after 2-3 years
6. **Use connection pooling** (50-100 connections for PostgreSQL)
7. **Cache category tree** (changes infrequently)
8. **Batch inserts** for bulk operations

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Create database and user
- [ ] Run schema scripts in order (01, 02, 03, 04)
- [ ] Verify all tables created
- [ ] Load sample data (06_sample_data_migration.sql)
- [ ] Test queries
- [ ] Set up backup schedule
- [ ] Configure monitoring
- [ ] Load production data
- [ ] Performance test with realistic data volume
- [ ] Security audit
- [ ] Go live!

---

**Need more details on any section? Just ask!** 🎯
