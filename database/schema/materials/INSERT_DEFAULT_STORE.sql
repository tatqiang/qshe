-- Insert a default Main Store for "Under Test" project
-- Project ID: 5863ee50-89e0-437f-9f1e-507ad568b900

INSERT INTO stores (
  store_code,
  store_name,
  store_name_th,
  project_id,
  store_type,
  location_address,
  is_main_store,
  is_active
) VALUES (
  'MAIN-STORE',
  'Main Store',
  'คลังหลัก',
  '5863ee50-89e0-437f-9f1e-507ad568b900',
  'warehouse',
  'Project Site',
  true,
  true
)
ON CONFLICT (project_id, store_code) 
DO UPDATE SET
  store_name = EXCLUDED.store_name,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Verify the store was created
SELECT 
  id,
  store_code,
  store_name,
  project_id,
  is_main_store,
  is_active,
  created_at
FROM stores
WHERE project_id = '5863ee50-89e0-437f-9f1e-507ad568b900';
