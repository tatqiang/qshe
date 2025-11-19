-- Material Inventory System - Complete Deployment Script
-- Execute this script in order to create all tables and setup the multi-store inventory system
-- Database: PostgreSQL (Supabase)
-- Date: 2025-11-14

-- ============================================================================
-- STEP 1: CREATE STORES TABLE
-- ============================================================================
-- Physical storage locations within projects
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  store_code TEXT NOT NULL,
  store_name TEXT NOT NULL,
  store_name_th TEXT,
  project_id UUID NOT NULL,
  company_id UUID,
  store_type TEXT DEFAULT 'warehouse',
  location_address TEXT,
  store_manager_id UUID,
  contact_phone TEXT,
  is_main_store BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT stores_pkey PRIMARY KEY (id),
  CONSTRAINT stores_store_code_key UNIQUE (store_code),
  CONSTRAINT stores_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  CONSTRAINT stores_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_stores_project ON public.stores (project_id);
CREATE INDEX IF NOT EXISTS idx_stores_company ON public.stores (company_id);
CREATE INDEX IF NOT EXISTS idx_stores_code ON public.stores (store_code);
CREATE INDEX IF NOT EXISTS idx_stores_active ON public.stores (is_active);
CREATE INDEX IF NOT EXISTS idx_stores_type ON public.stores (store_type);

COMMENT ON TABLE public.stores IS 'Physical storage locations (warehouses, site stores) within projects';

-- ============================================================================
-- STEP 2: CREATE MATERIAL CODES TABLE
-- ============================================================================
-- User-defined material codes per project
CREATE TABLE IF NOT EXISTS public.material_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  material_code TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT material_codes_pkey PRIMARY KEY (id),
  CONSTRAINT material_codes_project_code_key UNIQUE (project_id, material_code),
  CONSTRAINT material_codes_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_material_codes_project ON public.material_codes (project_id);
CREATE INDEX IF NOT EXISTS idx_material_codes_code ON public.material_codes (material_code);
CREATE INDEX IF NOT EXISTS idx_material_codes_active ON public.material_codes (is_active);

COMMENT ON TABLE public.material_codes IS 'User-defined material codes per project';

-- ============================================================================
-- STEP 3: RENAME/UPDATE MATERIALS TABLE TO MATERIAL_INVENTORY
-- ============================================================================
-- Check if old 'materials' table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'materials') THEN
    -- Backup old table
    ALTER TABLE public.materials RENAME TO materials_backup_20251114;
    RAISE NOTICE 'Old materials table renamed to materials_backup_20251114';
  END IF;
END $$;

-- Create new material_inventory table
CREATE TABLE IF NOT EXISTS public.material_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  inventory_code TEXT NOT NULL DEFAULT ('INV-' || to_char(NOW(), 'YYYYMMDD-HH24MISS-MS')),
  material_template_id INTEGER NOT NULL,
  material_code_id UUID,
  store_id UUID NOT NULL,
  project_id UUID NOT NULL,
  company_id UUID,
  dimension_id INTEGER,
  
  material_description TEXT NOT NULL,
  material_description_th TEXT,
  specific_detail TEXT,
  technical_specs JSONB,
  
  unit_of_measure TEXT DEFAULT 'PCS',
  current_quantity NUMERIC(15, 3) DEFAULT 0,
  reserved_quantity NUMERIC(15, 3) DEFAULT 0,
  available_quantity NUMERIC(15, 3) GENERATED ALWAYS AS (current_quantity - reserved_quantity) STORED,
  
  min_stock_level NUMERIC(10, 2) DEFAULT 0,
  max_stock_level NUMERIC(10, 2),
  reorder_point NUMERIC(10, 2),
  
  average_cost NUMERIC(15, 2) DEFAULT 0,
  last_purchase_cost NUMERIC(15, 2),
  
  requires_lot_tracking BOOLEAN DEFAULT FALSE,
  requires_serial_tracking BOOLEAN DEFAULT FALSE,
  requires_expiry_tracking BOOLEAN DEFAULT FALSE,
  shelf_life_days INTEGER,
  
  barcode TEXT,
  qr_code TEXT,
  primary_picture_url TEXT,
  
  bin_location TEXT,
  rack_location TEXT,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT material_inventory_pkey PRIMARY KEY (id),
  CONSTRAINT material_inventory_code_key UNIQUE (inventory_code),
  CONSTRAINT material_inventory_barcode_key UNIQUE (barcode),
  -- Note: No unique constraint - same template can have multiple variants (different codes, details, units)
  CONSTRAINT material_inventory_material_template_id_fkey FOREIGN KEY (material_template_id) REFERENCES material_templates (id) ON DELETE RESTRICT,
  CONSTRAINT material_inventory_material_code_id_fkey FOREIGN KEY (material_code_id) REFERENCES material_codes (id) ON DELETE SET NULL,
  CONSTRAINT material_inventory_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE RESTRICT,
  CONSTRAINT material_inventory_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  CONSTRAINT material_inventory_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE SET NULL,
  CONSTRAINT material_inventory_dimension_id_fkey FOREIGN KEY (dimension_id) REFERENCES dimensions (id) ON DELETE SET NULL,
  CONSTRAINT material_inventory_quantities_check CHECK (current_quantity >= 0 AND reserved_quantity >= 0)
);

CREATE INDEX IF NOT EXISTS idx_material_inventory_template ON public.material_inventory (material_template_id);
CREATE INDEX IF NOT EXISTS idx_material_inventory_material_code ON public.material_inventory (material_code_id);
CREATE INDEX IF NOT EXISTS idx_material_inventory_store ON public.material_inventory (store_id);
CREATE INDEX IF NOT EXISTS idx_material_inventory_project ON public.material_inventory (project_id);
CREATE INDEX IF NOT EXISTS idx_material_inventory_company ON public.material_inventory (company_id);
CREATE INDEX IF NOT EXISTS idx_material_inventory_dimension ON public.material_inventory (dimension_id);
CREATE INDEX IF NOT EXISTS idx_material_inventory_barcode ON public.material_inventory (barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_material_inventory_active ON public.material_inventory (is_active);
CREATE INDEX IF NOT EXISTS idx_material_inventory_description ON public.material_inventory USING gin (to_tsvector('english', material_description));

COMMENT ON TABLE public.material_inventory IS 'Physical materials in stores - can only be added via Material Receive process';

-- ============================================================================
-- STEP 4: CREATE MATERIAL RECEIVES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.material_receives (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  receive_number TEXT NOT NULL DEFAULT ('RCV-' || to_char(NOW(), 'YYYYMMDD-HH24MISS')),
  store_id UUID NOT NULL,
  project_id UUID NOT NULL,
  company_id UUID,
  
  purchase_order_id UUID,
  supplier_id UUID,
  supplier_invoice_number TEXT,
  delivery_note_number TEXT,
  
  receive_date DATE NOT NULL DEFAULT CURRENT_DATE,
  invoice_date DATE,
  
  status TEXT NOT NULL DEFAULT 'prepared',
  
  prepared_by UUID,
  prepared_at TIMESTAMPTZ,
  prepared_photos JSONB,
  
  received_by UUID,
  received_at TIMESTAMPTZ,
  received_completed_at TIMESTAMPTZ,
  received_photos JSONB,
  received_notes TEXT,
  
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_photos JSONB,
  acknowledged_notes TEXT,
  
  delivery_order_attachments JSONB,
  purchase_order_attachments JSONB,
  other_attachments JSONB,
  
  remarks TEXT,
  rejection_reason TEXT,
  
  is_locked BOOLEAN DEFAULT FALSE,
  
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT material_receives_pkey PRIMARY KEY (id),
  CONSTRAINT material_receives_number_key UNIQUE (receive_number),
  CONSTRAINT material_receives_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE RESTRICT,
  CONSTRAINT material_receives_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  CONSTRAINT material_receives_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_material_receives_store ON public.material_receives (store_id);
CREATE INDEX IF NOT EXISTS idx_material_receives_project ON public.material_receives (project_id);
CREATE INDEX IF NOT EXISTS idx_material_receives_status ON public.material_receives (status);
CREATE INDEX IF NOT EXISTS idx_material_receives_date ON public.material_receives (receive_date);
CREATE INDEX IF NOT EXISTS idx_material_receives_number ON public.material_receives (receive_number);

COMMENT ON TABLE public.material_receives IS '3-Step Material Receive Process: Prepare → Receive Check → Acknowledge';

-- ============================================================================
-- STEP 5: CREATE MATERIAL RECEIVE ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.material_receive_items (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  material_receive_id UUID NOT NULL,
  line_number INTEGER NOT NULL,
  
  material_template_id INTEGER NOT NULL,
  material_code_id UUID,
  dimension_id INTEGER,
  material_description TEXT NOT NULL,
  specific_detail TEXT,
  
  unit_of_measure TEXT NOT NULL DEFAULT 'PCS',
  unit_of_measure_th TEXT,
  ordered_quantity NUMERIC(15, 3),
  
  prepared_quantity NUMERIC(15, 3) NOT NULL,
  received_quantity NUMERIC(15, 3),
  rejected_quantity NUMERIC(15, 3) DEFAULT 0,
  accepted_quantity NUMERIC(15, 3) GENERATED ALWAYS AS (received_quantity - COALESCE(rejected_quantity, 0)) STORED,
  
  unit_price NUMERIC(15, 2),
  total_price NUMERIC(15, 2) GENERATED ALWAYS AS ((COALESCE(received_quantity, prepared_quantity) - COALESCE(rejected_quantity, 0)) * COALESCE(unit_price, 0)) STORED,
  
  lot_number TEXT,
  serial_numbers JSONB,
  manufacture_date DATE,
  expiry_date DATE,
  
  inspection_status TEXT DEFAULT 'pending',
  inspection_notes TEXT,
  
  bin_location TEXT,
  rack_location TEXT,
  
  remark TEXT,
  
  material_inventory_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT material_receive_items_pkey PRIMARY KEY (id),
  CONSTRAINT material_receive_items_receive_line_key UNIQUE (material_receive_id, line_number),
  CONSTRAINT material_receive_items_receive_id_fkey FOREIGN KEY (material_receive_id) REFERENCES material_receives (id) ON DELETE CASCADE,
  CONSTRAINT material_receive_items_template_id_fkey FOREIGN KEY (material_template_id) REFERENCES material_templates (id) ON DELETE RESTRICT,
  CONSTRAINT material_receive_items_material_code_id_fkey FOREIGN KEY (material_code_id) REFERENCES material_codes (id) ON DELETE SET NULL,
  CONSTRAINT material_receive_items_dimension_id_fkey FOREIGN KEY (dimension_id) REFERENCES dimensions (id) ON DELETE SET NULL,
  CONSTRAINT material_receive_items_inventory_id_fkey FOREIGN KEY (material_inventory_id) REFERENCES material_inventory (id) ON DELETE SET NULL,
  CONSTRAINT material_receive_items_quantities_check CHECK (prepared_quantity > 0 AND COALESCE(rejected_quantity, 0) >= 0)
);

CREATE INDEX IF NOT EXISTS idx_material_receive_items_receive ON public.material_receive_items (material_receive_id);
CREATE INDEX IF NOT EXISTS idx_material_receive_items_template ON public.material_receive_items (material_template_id);
CREATE INDEX IF NOT EXISTS idx_material_receive_items_material_code ON public.material_receive_items (material_code_id);
CREATE INDEX IF NOT EXISTS idx_material_receive_items_dimension ON public.material_receive_items (dimension_id);
CREATE INDEX IF NOT EXISTS idx_material_receive_items_inventory ON public.material_receive_items (material_inventory_id);
CREATE INDEX IF NOT EXISTS idx_material_receive_items_lot ON public.material_receive_items (lot_number) WHERE lot_number IS NOT NULL;

COMMENT ON TABLE public.material_receive_items IS 'Line items for material receives - 3-step process';

-- ============================================================================
-- STEP 6: CREATE MATERIAL TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.material_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  transaction_number TEXT NOT NULL DEFAULT ('TXN-' || to_char(NOW(), 'YYYYMMDD-HH24MISS-MS')),
  material_inventory_id UUID NOT NULL,
  store_id UUID NOT NULL,
  project_id UUID NOT NULL,
  
  transaction_type TEXT NOT NULL,
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  quantity_change NUMERIC(15, 3) NOT NULL,
  quantity_before NUMERIC(15, 3) NOT NULL,
  quantity_after NUMERIC(15, 3) NOT NULL,
  
  unit_cost NUMERIC(15, 2),
  total_cost NUMERIC(15, 2) GENERATED ALWAYS AS (ABS(quantity_change) * unit_cost) STORED,
  
  reference_type TEXT,
  reference_id UUID,
  reference_number TEXT,
  
  lot_number TEXT,
  serial_number TEXT,
  
  from_store_id UUID,
  to_store_id UUID,
  
  performed_by TEXT,
  approved_by TEXT,
  
  remarks TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT material_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT material_transactions_number_key UNIQUE (transaction_number),
  CONSTRAINT material_transactions_inventory_id_fkey FOREIGN KEY (material_inventory_id) REFERENCES material_inventory (id) ON DELETE RESTRICT,
  CONSTRAINT material_transactions_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE RESTRICT,
  CONSTRAINT material_transactions_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  CONSTRAINT material_transactions_from_store_fkey FOREIGN KEY (from_store_id) REFERENCES stores (id) ON DELETE RESTRICT,
  CONSTRAINT material_transactions_to_store_fkey FOREIGN KEY (to_store_id) REFERENCES stores (id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_material_transactions_inventory ON public.material_transactions (material_inventory_id);
CREATE INDEX IF NOT EXISTS idx_material_transactions_store ON public.material_transactions (store_id);
CREATE INDEX IF NOT EXISTS idx_material_transactions_project ON public.material_transactions (project_id);
CREATE INDEX IF NOT EXISTS idx_material_transactions_type ON public.material_transactions (transaction_type);
CREATE INDEX IF NOT EXISTS idx_material_transactions_date ON public.material_transactions (transaction_date);
CREATE INDEX IF NOT EXISTS idx_material_transactions_reference ON public.material_transactions (reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_material_transactions_lot ON public.material_transactions (lot_number) WHERE lot_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_material_transactions_serial ON public.material_transactions (serial_number) WHERE serial_number IS NOT NULL;

COMMENT ON TABLE public.material_transactions IS 'Complete audit trail of all inventory movements';

-- ============================================================================
-- STEP 7: CREATE MATERIAL RECEIVE AREAS TABLE
-- ============================================================================
-- Support multiple area locations per material receive (like patrol records)
CREATE TABLE IF NOT EXISTS public.material_receive_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  material_receive_id UUID NOT NULL,
  
  -- Area hierarchy (same as patrol area inputs)
  main_area_id UUID, -- FK to main_areas
  sub_area_1_id UUID, -- FK to sub_areas_1
  sub_area_2_id UUID, -- FK to sub_areas_2
  specific_location TEXT, -- e.g., "North wall, near column A1"
  
  -- Metadata
  display_order INTEGER DEFAULT 1, -- For sorting multiple areas
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT material_receive_areas_pkey PRIMARY KEY (id),
  CONSTRAINT material_receive_areas_receive_id_fkey FOREIGN KEY (material_receive_id) REFERENCES material_receives (id) ON DELETE CASCADE,
  CONSTRAINT material_receive_areas_main_area_id_fkey FOREIGN KEY (main_area_id) REFERENCES main_areas (id) ON DELETE SET NULL,
  CONSTRAINT material_receive_areas_sub_area_1_id_fkey FOREIGN KEY (sub_area_1_id) REFERENCES sub_areas_1 (id) ON DELETE SET NULL,
  CONSTRAINT material_receive_areas_sub_area_2_id_fkey FOREIGN KEY (sub_area_2_id) REFERENCES sub_areas_2 (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_material_receive_areas_receive ON public.material_receive_areas (material_receive_id);
CREATE INDEX IF NOT EXISTS idx_material_receive_areas_main_area ON public.material_receive_areas (main_area_id);
CREATE INDEX IF NOT EXISTS idx_material_receive_areas_sub_area_1 ON public.material_receive_areas (sub_area_1_id);
CREATE INDEX IF NOT EXISTS idx_material_receive_areas_sub_area_2 ON public.material_receive_areas (sub_area_2_id);
CREATE INDEX IF NOT EXISTS idx_material_receive_areas_order ON public.material_receive_areas (material_receive_id, display_order);

COMMENT ON TABLE public.material_receive_areas IS 'Material receive area locations - supports multiple areas per receive (like patrol area inputs)';
COMMENT ON COLUMN public.material_receive_areas.main_area_id IS 'Main Area (e.g., Building A, Yard 2)';
COMMENT ON COLUMN public.material_receive_areas.sub_area_1_id IS 'Sub Area 1 (e.g., Floor 2, Office Wing) - requires Main Area';
COMMENT ON COLUMN public.material_receive_areas.sub_area_2_id IS 'Sub Area 2 (e.g., Room 201, Workstation A) - requires Sub Area 1';
COMMENT ON COLUMN public.material_receive_areas.specific_location IS 'Specific location detail (e.g., North wall, near column A1)';
COMMENT ON COLUMN public.material_receive_areas.display_order IS 'Display order for multiple areas in the list';

-- ============================================================================
-- STEP 8: CREATE DEFAULT STORES FOR EXISTING PROJECTS
-- ============================================================================
-- Create a main store for each project that doesn't have one
INSERT INTO public.stores (store_code, store_name, store_name_th, project_id, is_main_store, is_active, created_by)
SELECT 
  p.project_code || '-MAIN',
  p.name || ' - Main Store',
  p.name || ' - คลังหลัก',
  p.id,
  TRUE,
  TRUE,
  'system_migration'
FROM projects p
WHERE NOT EXISTS (
    SELECT 1 FROM stores s WHERE s.project_id = p.id AND s.is_main_store = TRUE
  )
ON CONFLICT (store_code) DO NOTHING;

-- ============================================================================
-- STEP 8: GRANT PERMISSIONS (Adjust based on your RLS setup)
-- ============================================================================
-- Enable RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_receives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_receive_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_receive_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_transactions ENABLE ROW LEVEL SECURITY;

-- Grant permissions (adjust based on your app's service role)
-- GRANT ALL ON public.stores TO authenticated;
-- GRANT ALL ON public.material_codes TO authenticated;
-- GRANT ALL ON public.material_inventory TO authenticated;
-- GRANT ALL ON public.material_receives TO authenticated;
-- GRANT ALL ON public.material_receive_items TO authenticated;
-- GRANT ALL ON public.material_transactions TO authenticated;

-- ============================================================================
-- DEPLOYMENT COMPLETE
-- ============================================================================
-- Summary:
-- ✅ Created stores table
-- ✅ Created material_codes table
-- ✅ Created/Updated material_inventory table (renamed from materials)
-- ✅ Created material_receives table
-- ✅ Created material_receive_items table
-- ✅ Created material_receive_areas table (multi-area support)
-- ✅ Created material_transactions table
-- ✅ Created default main stores for existing projects
-- ✅ Enabled Row Level Security
-- 
-- Next Steps:
-- 1. Configure RLS policies based on your security requirements
-- 2. Update application code to use new table names and workflow
-- 3. Test the 3-step receive workflow
-- 4. Migrate any remaining data from materials_backup_20251114 if needed
-- ============================================================================
