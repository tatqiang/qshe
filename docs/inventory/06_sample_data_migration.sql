-- ============================================================================
-- MEP INVENTORY SYSTEM - SAMPLE DATA MIGRATION
-- ============================================================================
-- Purpose: Convert material_table.csv data into normalized database structure
-- This script shows how to import your existing CSV data
-- ============================================================================

-- ============================================================================
-- STEP 1: INSERT CATEGORY LEVEL 1 (Main Categories)
-- ============================================================================

INSERT INTO material_categories_l1 (id, title_en, title_th, tags, display_order, is_active)
VALUES 
('pipe-01', 'Pipe and Accessories', 'ท่อ และอุปกรณ์ประกอบท่อ', 'pipe, fitting', 1, true),
('pb-01', 'Plumbing Equipments', 'อุปกรณ์ ระบบสุขาภิบาล', 'plumbing', 2, true),
('ee-01', 'Electrical Equipments', 'อุปกรณ์ ระบบไฟฟ้า', 'electrical', 3, true);

-- ============================================================================
-- STEP 2: INSERT CATEGORY LEVEL 2 (Sub-Categories)
-- ============================================================================

INSERT INTO material_categories_l2 (id, parent_category_l1_id, title_en, title_th, tags, specifications, display_order, is_active)
VALUES 
('bsp-01', 'pipe-01', 'Black Steel Pipes (Sch 40, Grade A, ERW)', 'ท่อเหล็กดำ (Sch 40, Grade A, ERW)', 'BSP, SCH40, ERW', 'Schedule 40, Grade A, Electric Resistance Welded', 1, true),
('pb-01', 'pb-01', 'Pump', 'ปั๊ม (เครื่องสูบน้ำ)', 'pump', NULL, 1, true),
('ee-01', 'ee-01', 'Generator', 'เครื่องปั่นไฟฟ้า', 'generator', NULL, 1, true);

-- ============================================================================
-- STEP 3: INSERT CATEGORY LEVEL 3 (Item Types)
-- ============================================================================

INSERT INTO material_categories_l3 (id, parent_category_l2_id, title_en, title_th, tags, has_size_variants, size_pattern, display_order, is_active)
VALUES 
-- Pipes and Fittings under bsp-01
('pipe-001', 'bsp-01', 'Pipe', 'ท่อ', 'pipe', true, 'SINGLE', 1, true),
('pipe-002', 'bsp-01', 'Elbow 90', 'ข้อโค้ง 90', 'elbow, 90 degree', true, 'SINGLE', 2, true),
('pipe-003', 'bsp-01', 'Elbow 45', 'ข้อโค้ง 45', 'elbow, 45 degree', true, 'SINGLE', 3, true),
('pipe-004', 'bsp-01', 'Equal TEE', 'ทีเท่า', 'tee, equal', true, 'SINGLE', 4, true),
('pipe-005', 'bsp-01', 'Reducing TEE', 'ทีลด', 'tee, reducing', true, 'DUAL', 5, true),
('pipe-006', 'bsp-01', 'Reducer, Concentric', 'ข้อลดตรง', 'reducer, concentric', true, 'DUAL', 6, true),
('pipe-007', 'bsp-01', 'Reducer, Eccentric', 'ข้อลดข้างเดียว', 'reducer, eccentric', true, 'DUAL', 7, true),

-- Pumps under pb-01
('pump-01', 'pb-01', 'End Suction Pump', 'ปั๊มดูดปลายข้าง', 'pump, end suction', false, NULL, 1, true),

-- Generators under ee-01
('ee-001', 'ee-01', 'Diesel Engine Generator', 'เครื่องปั่นไฟดีเซล', 'generator, diesel', false, NULL, 1, true);

-- ============================================================================
-- STEP 4: INSERT MATERIALS (Size Variants)
-- ============================================================================

-- Pipe (pipe-001) - Standard sizes with p-a dimension group
INSERT INTO materials (
    id, material_code, category_l1_id, category_l2_id, category_l3_id,
    name_en, dimension_group, dimension_order, size_1, size_2, size_unit,
    unit_of_measure, is_active, created_at
) VALUES 
('p-a001', 'BSP-PIPE-015', 'pipe-01', 'bsp-01', 'pipe-001', 
    'Black Steel Pipe 1/2"', 'p-a', 1, '1/2 inch', '15 mm', 'inch', 'M', true, CURRENT_TIMESTAMP),
('p-a002', 'BSP-PIPE-020', 'pipe-01', 'bsp-01', 'pipe-001', 
    'Black Steel Pipe 3/4"', 'p-a', 2, '3/4 inch', '20 mm', 'inch', 'M', true, CURRENT_TIMESTAMP),
('p-a003', 'BSP-PIPE-025', 'pipe-01', 'bsp-01', 'pipe-001', 
    'Black Steel Pipe 1"', 'p-a', 3, '1 inch', '25 mm', 'inch', 'M', true, CURRENT_TIMESTAMP),
('p-a004', 'BSP-PIPE-032', 'pipe-01', 'bsp-01', 'pipe-001', 
    'Black Steel Pipe 1-1/2"', 'p-a', 4, '1-1/2 inch', '32 mm', 'inch', 'M', true, CURRENT_TIMESTAMP),
('p-a005', 'BSP-PIPE-050', 'pipe-01', 'bsp-01', 'pipe-001', 
    'Black Steel Pipe 2"', 'p-a', 5, '2 inch', '50 mm', 'inch', 'M', true, CURRENT_TIMESTAMP);

-- Elbow 90 (pipe-002) - Same sizes, reusing p-a IDs but different material codes
INSERT INTO materials (
    id, material_code, category_l1_id, category_l2_id, category_l3_id,
    name_en, dimension_group, dimension_order, size_1, size_2, size_unit,
    unit_of_measure, is_active, created_at
) VALUES 
('elb90-a001', 'BSP-ELB90-015', 'pipe-01', 'bsp-01', 'pipe-002', 
    'Black Steel Elbow 90° 1/2"', 'p-a', 1, '1/2 inch', '15 mm', 'inch', 'EA', true, CURRENT_TIMESTAMP),
('elb90-a002', 'BSP-ELB90-020', 'pipe-01', 'bsp-01', 'pipe-002', 
    'Black Steel Elbow 90° 3/4"', 'p-a', 2, '3/4 inch', '20 mm', 'inch', 'EA', true, CURRENT_TIMESTAMP),
('elb90-a003', 'BSP-ELB90-025', 'pipe-01', 'bsp-01', 'pipe-002', 
    'Black Steel Elbow 90° 1"', 'p-a', 3, '1 inch', '25 mm', 'inch', 'EA', true, CURRENT_TIMESTAMP),
('elb90-a004', 'BSP-ELB90-032', 'pipe-01', 'bsp-01', 'pipe-002', 
    'Black Steel Elbow 90° 1-1/2"', 'p-a', 4, '1-1/2 inch', '32 mm', 'inch', 'EA', true, CURRENT_TIMESTAMP),
('elb90-a005', 'BSP-ELB90-050', 'pipe-01', 'bsp-01', 'pipe-002', 
    'Black Steel Elbow 90° 2"', 'p-a', 5, '2 inch', '50 mm', 'inch', 'EA', true, CURRENT_TIMESTAMP);

-- Reducing TEE (pipe-005) - Different dimension group (p-b) for reducing sizes
INSERT INTO materials (
    id, material_code, category_l1_id, category_l2_id, category_l3_id,
    name_en, dimension_group, dimension_order, size_1, size_2, size_unit,
    unit_of_measure, is_active, created_at
) VALUES 
('p-b001', 'BSP-RTEE-025x015', 'pipe-01', 'bsp-01', 'pipe-005', 
    'Black Steel Reducing TEE 1" x 1/2"', 'p-b', 1, '1 x 1/2 inch', '25 x 15 mm', 'inch', 'EA', true, CURRENT_TIMESTAMP),
('p-b002', 'BSP-RTEE-050x025', 'pipe-01', 'bsp-01', 'pipe-005', 
    'Black Steel Reducing TEE 2" x 1"', 'p-b', 2, '2 x 1 inch', '50 x 25 mm', 'inch', 'EA', true, CURRENT_TIMESTAMP),
('p-b003', 'BSP-RTEE-050x032', 'pipe-01', 'bsp-01', 'pipe-005', 
    'Black Steel Reducing TEE 2" x 1-1/2"', 'p-b', 3, '2 x 1-1/2 inch', '50 x 32 mm', 'inch', 'EA', true, CURRENT_TIMESTAMP),
('p-b004', 'BSP-RTEE-075x025', 'pipe-01', 'bsp-01', 'pipe-005', 
    'Black Steel Reducing TEE 3" x 1"', 'p-b', 4, '3 x 1 inch', '75 x 25 mm', 'inch', 'EA', true, CURRENT_TIMESTAMP),
('p-b005', 'BSP-RTEE-075x050', 'pipe-01', 'bsp-01', 'pipe-005', 
    'Black Steel Reducing TEE 3" x 2"', 'p-b', 5, '3 x 2 inch', '75 x 50 mm', 'inch', 'EA', true, CURRENT_TIMESTAMP),
('p-b006', 'BSP-RTEE-075x065', 'pipe-01', 'bsp-01', 'pipe-005', 
    'Black Steel Reducing TEE 3" x 2-1/2"', 'p-b', 6, '3 x 2-1/2 inch', '75 mm x 65 mm', 'inch', 'EA', true, CURRENT_TIMESTAMP);

-- Reducer Concentric (pipe-006) - Same p-b dimension group
INSERT INTO materials (
    id, material_code, category_l1_id, category_l2_id, category_l3_id,
    name_en, dimension_group, dimension_order, size_1, size_2, size_unit,
    unit_of_measure, is_active, created_at
) VALUES 
('red-b001', 'BSP-REDC-025x015', 'pipe-01', 'bsp-01', 'pipe-006', 
    'Black Steel Reducer Concentric 1" x 1/2"', 'p-b', 1, '1 x 1/2 inch', '25 x 15 mm', 'inch', 'EA', true, CURRENT_TIMESTAMP),
('red-b002', 'BSP-REDC-050x025', 'pipe-01', 'bsp-01', 'pipe-006', 
    'Black Steel Reducer Concentric 2" x 1"', 'p-b', 2, '2 x 1 inch', '50 x 25 mm', 'inch', 'EA', true, CURRENT_TIMESTAMP),
('red-b003', 'BSP-REDC-050x032', 'pipe-01', 'bsp-01', 'pipe-006', 
    'Black Steel Reducer Concentric 2" x 1-1/2"', 'p-b', 3, '2 x 1-1/2 inch', '50 x 32 mm', 'inch', 'EA', true, CURRENT_TIMESTAMP),
('red-b004', 'BSP-REDC-075x025', 'pipe-01', 'bsp-01', 'pipe-006', 
    'Black Steel Reducer Concentric 3" x 1"', 'p-b', 4, '3 x 1 inch', '75 x 25 mm', 'inch', 'EA', true, CURRENT_TIMESTAMP),
('red-b005', 'BSP-REDC-075x050', 'pipe-01', 'bsp-01', 'pipe-006', 
    'Black Steel Reducer Concentric 3" x 2"', 'p-b', 5, '3 x 2 inch', '75 x 50 mm', 'inch', 'EA', true, CURRENT_TIMESTAMP),
('red-b006', 'BSP-REDC-075x065', 'pipe-01', 'bsp-01', 'pipe-006', 
    'Black Steel Reducer Concentric 3" x 2-1/2"', 'p-b', 6, '3 x 2-1/2 inch', '75 mm x 65 mm', 'inch', 'EA', true, CURRENT_TIMESTAMP);

-- Pump - End Suction Pump (no size variants)
INSERT INTO materials (
    id, material_code, category_l1_id, category_l2_id, category_l3_id,
    name_en, brand, unit_of_measure, is_active, created_at
) VALUES 
('pump-paco-001', 'PUMP-ENDSUC-PACO-001', 'pb-01', 'pb-01', 'pump-01', 
    'End Suction Pump', 'PACO', 'EA', true, CURRENT_TIMESTAMP);

-- Generator - Diesel Engine Generator
INSERT INTO materials (
    id, material_code, category_l1_id, category_l2_id, category_l3_id,
    name_en, brand, unit_of_measure, is_active, created_at
) VALUES 
('gen-cat-001', 'GEN-DIESEL-CAT-001', 'ee-01', 'ee-01', 'ee-001', 
    'Diesel Engine Generator', 'CAT', 'EA', true, CURRENT_TIMESTAMP);

-- ============================================================================
-- STEP 5: INSERT PIPE SPECIFICATIONS
-- ============================================================================

-- Specifications for all pipe materials
INSERT INTO material_pipe_specs (
    material_id, material_type, material_grade, manufacturing_method,
    schedule, standard_compliance
)
SELECT 
    id,
    'Black Steel',
    'Grade A',
    'ERW',
    'Sch 40',
    'ASTM A53'
FROM materials
WHERE category_l3_id IN ('pipe-001', 'pipe-002', 'pipe-003', 'pipe-004', 'pipe-005', 'pipe-006', 'pipe-007');

-- ============================================================================
-- STEP 6: INSERT PUMP SPECIFICATIONS
-- ============================================================================

INSERT INTO material_pump_specs (
    material_id, pump_type, brand, rated_current_amp, head_pressure_m
) VALUES 
('pump-paco-001', 'End Suction', 'PACO', NULL, NULL);

-- Note: Add more detailed specs as you get the information

-- ============================================================================
-- STEP 7: INSERT ELECTRICAL SPECIFICATIONS
-- ============================================================================

INSERT INTO material_electrical_specs (
    material_id, equipment_type, brand
) VALUES 
('gen-cat-001', 'Diesel Engine Generator', 'CAT');

-- Note: Add more detailed specs (power rating, voltage, etc.) as available

-- ============================================================================
-- STEP 8: CREATE DEFAULT LOCATION
-- ============================================================================

INSERT INTO inventory_locations (
    location_code, location_name, location_type, is_active
) VALUES 
('WH-MAIN', 'Main Warehouse', 'WAREHOUSE', true),
('SITE-01', 'Project Site 01', 'PROJECT_SITE', true);

-- ============================================================================
-- STEP 9: INITIALIZE STOCK (Optional - if you have existing inventory)
-- ============================================================================

-- Initialize with zero stock for all materials at main warehouse
INSERT INTO inventory_stock (
    material_id, location_id, quantity_on_hand, quantity_reserved,
    min_stock_level, reorder_point
)
SELECT 
    m.id,
    (SELECT id FROM inventory_locations WHERE location_code = 'WH-MAIN'),
    0,  -- Starting with zero
    0,
    10, -- Default min stock
    20  -- Default reorder point
FROM materials m;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check category hierarchy
SELECT 
    l1.title_en AS category_l1,
    l2.title_en AS category_l2,
    l3.title_en AS category_l3,
    COUNT(m.id) AS material_count
FROM material_categories_l1 l1
LEFT JOIN material_categories_l2 l2 ON l2.parent_category_l1_id = l1.id
LEFT JOIN material_categories_l3 l3 ON l3.parent_category_l2_id = l2.id
LEFT JOIN materials m ON m.category_l3_id = l3.id
GROUP BY l1.id, l1.title_en, l2.id, l2.title_en, l3.id, l3.title_en
ORDER BY l1.display_order, l2.display_order, l3.display_order;

-- Check materials with size variants
SELECT 
    l3.title_en AS item_type,
    m.dimension_group,
    m.dimension_order,
    m.material_code,
    m.size_1,
    m.size_2
FROM materials m
JOIN material_categories_l3 l3 ON l3.id = m.category_l3_id
WHERE m.dimension_group IS NOT NULL
ORDER BY l3.title_en, m.dimension_group, m.dimension_order;

-- Check material specs
SELECT 
    m.material_code,
    m.name_en,
    ps.material_type,
    ps.schedule,
    ps.grade,
    ps.manufacturing_method
FROM materials m
JOIN material_pipe_specs ps ON ps.material_id = m.id
LIMIT 10;

-- ============================================================================
-- NOTES FOR CSV IMPORT
-- ============================================================================
-- 
-- If importing from CSV directly (PostgreSQL):
-- 
-- COPY temp_csv_data FROM 'c:\pwa\qshe10\qshe\docs\inventory\material_table.csv' 
-- WITH (FORMAT CSV, HEADER true, DELIMITER ',');
-- 
-- Then process temp_csv_data to insert into normalized tables
-- 
-- ============================================================================
