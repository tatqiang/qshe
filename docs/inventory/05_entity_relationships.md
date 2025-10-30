# MEP INVENTORY SYSTEM - DATABASE ENTITY RELATIONSHIPS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     MEP INVENTORY SYSTEM - ER DIAGRAM                       │
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
CATEGORY HIERARCHY (3 Levels)
═══════════════════════════════════════════════════════════════════════════════

┌──────────────────────────────┐
│ material_categories_l1       │  Main Categories
│──────────────────────────────│
│ PK: id                       │  Examples:
│     title_en                 │  - pipe-01: Pipes & Accessories
│     title_th                 │  - pb-01: Plumbing Equipment
│     tags                     │  - ee-01: Electrical Equipment
│     display_order            │
│     is_active                │
└──────────────────────────────┘
            │
            │ 1:N
            ▼
┌──────────────────────────────┐
│ material_categories_l2       │  Sub-Categories
│──────────────────────────────│
│ PK: id                       │  Examples:
│ FK: parent_category_l1_id    │  - bsp-01: Black Steel Pipes (Sch 40, Grade A, ERW)
│     title_en                 │  - pb-01: Pumps
│     title_th                 │  - ee-01: Generators
│     specifications           │
│     display_order            │
└──────────────────────────────┘
            │
            │ 1:N
            ▼
┌──────────────────────────────┐
│ material_categories_l3       │  Item Types
│──────────────────────────────│
│ PK: id                       │  Examples:
│ FK: parent_category_l2_id    │  - pipe-001: Pipe
│     title_en                 │  - pipe-002: Elbow 90°
│     title_th                 │  - pipe-003: Elbow 45°
│     has_size_variants        │  - pipe-004: Equal TEE
│     size_pattern             │  - pipe-005: Reducing TEE
│     display_order            │  - pump-01: End Suction Pump
└──────────────────────────────┘
            │
            │ 1:N
            ▼

═══════════════════════════════════════════════════════════════════════════════
MATERIAL MASTER DATA
═══════════════════════════════════════════════════════════════════════════════

┌──────────────────────────────────────────────────┐
│ materials                                        │  Material Master
│──────────────────────────────────────────────────│
│ PK: id (e.g., p-a001, p-a002...)                │  Each size variant
│     material_code (SKU)                          │  is a separate record
│ FK: category_l1_id                               │
│ FK: category_l2_id                               │  Examples:
│ FK: category_l3_id                               │  - p-a001: 1/2" (15mm) Pipe
│     dimension_group  (p-a, p-b)                  │  - p-a002: 3/4" (20mm) Pipe
│     dimension_order  (1, 2, 3...)                │  - p-a003: 1" (25mm) Pipe
│     size_1, size_2                               │  - p-b001: 1x1/2" Reducing TEE
│     brand, manufacturer                          │
│     unit_of_measure                              │
│     weight, dimensions                           │
│     standard_cost, average_cost                  │
│     status, is_active                            │
└──────────────────────────────────────────────────┘
        │                                    │
        │ 1:1 (optional)                     │ 1:N
        ▼                                    ▼

┌─────────────────────────────┐    ┌─────────────────────────────┐
│ material_pipe_specs         │    │ material_extended_attributes│
│─────────────────────────────│    │─────────────────────────────│
│ PK/FK: material_id          │    │ PK: id                      │
│     material_type           │    │ FK: material_id             │
│     schedule                │    │     attribute_name          │
│     grade                   │    │     attribute_value         │
│     pressure_rating         │    │     attribute_unit          │
│     outer_diameter_mm       │    │     data_type               │
│     wall_thickness_mm       │    └─────────────────────────────┘
│     standard_compliance     │
└─────────────────────────────┘    Flexible key-value attributes
                                    for misc specs
┌─────────────────────────────┐
│ material_pump_specs         │
│─────────────────────────────│
│ PK/FK: material_id          │
│     pump_type               │
│     motor_hp, motor_kw      │
│     voltage, phase          │
│     rated_current_amp       │
│     head_pressure_m         │
│     flow_rate_lpm           │
└─────────────────────────────┘

┌─────────────────────────────┐
│ material_electrical_specs   │
│─────────────────────────────│
│ PK/FK: material_id          │
│     equipment_type          │
│     voltage, current_rating │
│     power_kva, power_kw     │
│     wire_size_sqmm          │
│     ip_rating               │
└─────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
INVENTORY TRACKING
═══════════════════════════════════════════════════════════════════════════════

┌──────────────────────────────────────┐
│ inventory_locations                  │
│──────────────────────────────────────│
│ PK: id                               │  Warehouses, Sites,
│     location_code                    │  Zones, Bins
│     location_name                    │
│     location_type                    │
│ FK: parent_location_id (self-ref)    │
│     address, contact_person          │
└──────────────────────────────────────┘
            │
            │ 1:N
            ▼
┌──────────────────────────────────────────────────┐
│ inventory_stock                                  │  Current Stock Levels
│──────────────────────────────────────────────────│
│ PK: id                                           │  One record per
│ FK: material_id                                  │  material per location
│ FK: location_id                                  │
│     quantity_on_hand                             │
│     quantity_reserved                            │
│     quantity_available (computed)                │
│     min_stock_level, reorder_point               │
│     average_unit_cost                            │
│     bin_location, zone, aisle                    │
│     last_counted_date                            │
│     UNIQUE(material_id, location_id)             │
└──────────────────────────────────────────────────┘
            │
            │ History
            ▼
┌──────────────────────────────────────────────────┐
│ inventory_transactions                           │  All Movements
│──────────────────────────────────────────────────│
│ PK: id                                           │  RECEIVE, ISSUE,
│     transaction_number                           │  TRANSFER, ADJUSTMENT
│     transaction_date                             │
│     transaction_type                             │
│ FK: material_id                                  │
│ FK: from_location_id                             │
│ FK: to_location_id                               │
│     quantity                                     │
│     unit_cost, total_cost                        │
│     reference_type, reference_id                 │
│     lot_number, serial_number                    │
│     created_by                                   │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────┐
│ inventory_reservations               │  Reserved Stock
│──────────────────────────────────────│
│ PK: id                               │  For projects, WOs
│     reservation_number               │
│ FK: material_id                      │
│ FK: location_id                      │
│     reserved_quantity                │
│     fulfilled_quantity               │
│     reference_type, reference_id     │
│     status                           │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ inventory_lots                       │  Lot/Batch Tracking
│──────────────────────────────────────│
│ PK: id                               │  For materials requiring
│     lot_number (unique)              │  lot tracking
│ FK: material_id                      │
│     manufacture_date, expiry_date    │
│     quality_status                   │
│     certificate_number               │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ inventory_serial_numbers             │  Serial Number Tracking
│──────────────────────────────────────│
│ PK: id                               │  For expensive items
│     serial_number (unique)           │  (pumps, generators)
│ FK: material_id                      │
│ FK: current_location_id              │
│     status                           │
│     assigned_to, project_id          │
│     warranty_start_date              │
└──────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
SUPPLIER & PRICING
═══════════════════════════════════════════════════════════════════════════════

┌──────────────────────────────────────┐
│ suppliers                            │  Supplier Master
│──────────────────────────────────────│
│ PK: id                               │
│     supplier_code                    │
│     supplier_name                    │
│     supplier_type                    │
│     contact_person, email, phone     │
│     address, tax_id                  │
│     payment_terms                    │
│     credit_limit                     │
│     rating, on_time_delivery_pct     │
│     is_approved, is_active           │
└──────────────────────────────────────┘
            │
            │ 1:N
            ▼
┌──────────────────────────────────────────────────┐
│ material_suppliers                               │  M:N Relationship
│──────────────────────────────────────────────────│
│ PK: id                                           │  Material ↔ Supplier
│ FK: material_id ──────────┐                      │
│ FK: supplier_id           │                      │
│     supplier_material_code│                      │
│     unit_price            │                      │
│     price_valid_from/to   │                      │
│     minimum_order_quantity│                      │
│     lead_time_days        │                      │
│     is_preferred          │                      │
│     UNIQUE(material_id,   │                      │
│            supplier_id)   │                      │
└───────────────────────────┼──────────────────────┘
                            │
                ┌───────────┘
                │
    ┌───────────┴──────────┐
    │    materials         │
    │    (from above)      │
    └──────────────────────┘

┌──────────────────────────────────────┐
│ material_price_history               │  Price Changes
│──────────────────────────────────────│
│ PK: id                               │  Historical tracking
│ FK: material_id                      │
│ FK: supplier_id                      │
│     unit_price                       │
│     effective_from, effective_to     │
│     price_change_pct                 │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ material_volume_discounts            │  Volume Pricing
│──────────────────────────────────────│
│ PK: id                               │  Discount tiers
│ FK: material_supplier_id             │
│     tier_number                      │
│     min_quantity, max_quantity       │
│     discount_type, discount_value    │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ supplier_contacts                    │  Contact Persons
│──────────────────────────────────────│
│ PK: id                               │
│ FK: supplier_id                      │
│     contact_name, email, phone       │
│     is_primary, contact_type         │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ supplier_performance_ratings         │  Supplier KPIs
│──────────────────────────────────────│
│ PK: id                               │
│ FK: supplier_id                      │
│     rating_period_start/end          │
│     delivery_rating, quality_rating  │
│     overall_rating                   │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ supplier_documents                   │  Certificates, etc.
│──────────────────────────────────────│
│ PK: id                               │
│ FK: supplier_id                      │
│     document_type, document_name     │
│     file_url, expiry_date            │
└──────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
KEY RELATIONSHIPS SUMMARY
═══════════════════════════════════════════════════════════════════════════════

1. CATEGORY HIERARCHY (Cascading 1:N):
   material_categories_l1 → material_categories_l2 → material_categories_l3 → materials

2. MATERIAL SPECIFICATIONS (1:1, optional):
   materials → material_pipe_specs
   materials → material_pump_specs
   materials → material_electrical_specs
   materials → material_valve_specs
   materials → material_hvac_specs

3. FLEXIBLE ATTRIBUTES (1:N):
   materials → material_extended_attributes

4. STOCK TRACKING (1:N):
   materials → inventory_stock (per location)
   materials → inventory_transactions (history)
   materials → inventory_reservations

5. LOT/SERIAL TRACKING (1:N):
   materials → inventory_lots
   materials → inventory_serial_numbers

6. SUPPLIER RELATIONSHIPS (M:N):
   materials ↔ material_suppliers ↔ suppliers
   material_suppliers → material_volume_discounts
   material_suppliers → material_price_history

7. SUPPLIER DETAILS (1:N):
   suppliers → supplier_contacts
   suppliers → supplier_performance_ratings
   suppliers → supplier_documents

8. LOCATION HIERARCHY (Self-referencing):
   inventory_locations → parent_location_id (self)

═══════════════════════════════════════════════════════════════════════════════
BUSINESS RULES
═══════════════════════════════════════════════════════════════════════════════

1. MATERIAL CODES:
   - Must be unique across the system
   - Auto-generated or manual entry
   - Format suggestion: [CAT]-[TYPE]-[SIZE]-[SEQ]
     Example: BSP-PIPE-050-001 (Black Steel Pipe, 50mm, sequence 001)

2. SIZE VARIANTS:
   - Each size is a SEPARATE material record
   - Grouped by dimension_group (p-a, p-b, etc.)
   - Ordered by dimension_order (1, 2, 3...)
   - Allows independent pricing, stock tracking per size

3. STOCK QUANTITIES:
   - quantity_available = quantity_on_hand - quantity_reserved
   - quantity_on_hand >= quantity_reserved (enforced by CHECK)
   - Negative quantities NOT allowed
   - Zero quantities allowed (out of stock)

4. TRANSACTIONS:
   - RECEIVE: to_location required
   - ISSUE: from_location required
   - TRANSFER: both locations required
   - Each transaction creates history record
   - Transactions update inventory_stock

5. RESERVATIONS:
   - Reduce available quantity
   - Must have sufficient available stock
   - Can be partial or full fulfillment
   - Expire after required_date

6. REORDER POINTS:
   - Alert when quantity_available <= reorder_point
   - Suggest reorder_quantity or EOQ
   - Consider lead_time_days from supplier

7. SUPPLIERS:
   - Must be approved before use
   - One preferred supplier per material (recommended)
   - Multiple suppliers allowed per material
   - Track price history for all suppliers

8. PRICING:
   - Price per material per supplier
   - Valid date ranges
   - Volume discounts supported
   - Historical price tracking

9. LOT TRACKING:
   - Optional, per material configuration
   - Required for materials with expiry dates
   - Quality status: APPROVED, HOLD, REJECTED

10. SERIAL TRACKING:
    - For high-value items (pumps, generators)
    - One serial number = one physical item
    - Track warranty, location, assignment

═══════════════════════════════════════════════════════════════════════════════
```
