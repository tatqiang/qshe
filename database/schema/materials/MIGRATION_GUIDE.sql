-- MIGRATION GUIDE: From materials table to material_inventory
-- This file documents the migration strategy from the old schema to the new multi-store inventory system

/*
OLD SCHEMA CONCEPT:
- materials table = Both master catalog AND inventory (mixed concern)
- Materials could be added directly from UI
- No store/location tracking
- No proper receive process

NEW SCHEMA CONCEPT:
- material_templates = Master catalog (what CAN be ordered/used)
- material_inventory = Actual physical stock in stores
- stores = Physical locations per project
- material_receives = ONLY way to add inventory (proper control)
- material_transactions = Complete audit trail

MIGRATION STEPS:

1. CREATE NEW TABLES (in order):
   a. stores
   b. material_inventory
   c. material_receives
   d. material_receive_items
   e. material_transactions

2. CREATE DEFAULT STORE FOR EACH PROJECT:
   INSERT INTO stores (store_code, store_name, project_id, company_id, is_main_store, is_active)
   SELECT 
     CONCAT(p.project_code, '-MAIN'),
     CONCAT(p.name, ' - Main Store'),
     p.id,
     pc.company_id,
     true,
     true
   FROM projects p
   LEFT JOIN project_companies pc ON pc.project_id = p.id
   WHERE p.is_active = true;

3. MIGRATE EXISTING MATERIALS TO INVENTORY:
   -- Only migrate materials that have actual usage/stock
   -- Create a historical receive record
   INSERT INTO material_receives (receive_number, store_id, project_id, company_id, receive_date, status, remarks)
   SELECT 
     CONCAT('RCV-MIGRATION-', m.project_id),
     s.id, -- main store
     m.project_id,
     m.company_id,
     COALESCE(m.created_at::date, CURRENT_DATE),
     'accepted',
     'Migrated from old materials table - Opening Balance'
   FROM materials m
   JOIN stores s ON s.project_id = m.project_id AND s.is_main_store = true
   GROUP BY m.project_id, m.company_id, s.id;

   -- Create inventory records
   INSERT INTO material_inventory (
     material_template_id, store_id, project_id, company_id, dimension_id,
     material_description, material_description_th, technical_specs,
     unit_of_measure, current_quantity, min_stock_level, max_stock_level,
     reorder_point, average_cost, barcode, qr_code, primary_picture_url,
     requires_lot_tracking, requires_serial_tracking, requires_expiry_tracking,
     shelf_life_days, is_active, created_by, created_at
   )
   SELECT 
     m.material_template_id,
     s.id, -- main store for project
     m.project_id,
     m.company_id,
     m.dimension_id,
     m.material_description,
     m.material_description_th,
     m.technical_specs,
     m.unit_of_measure,
     0, -- Start with zero, will be set via opening balance receive
     m.min_stock_level,
     m.max_stock_level,
     m.reorder_point,
     m.standard_cost,
     m.barcode,
     m.qr_code,
     m.primary_picture_url,
     m.requires_lot_tracking,
     m.requires_serial_tracking,
     m.requires_expiry_tracking,
     m.shelf_life_days,
     m.is_active,
     m.created_by,
     m.created_at
   FROM materials m
   JOIN stores s ON s.project_id = m.project_id AND s.is_main_store = true
   WHERE m.material_template_id IS NOT NULL;

4. RENAME OLD TABLE (for safety):
   ALTER TABLE materials RENAME TO materials_deprecated_backup;
   
5. UPDATE APPLICATION CODE:
   - Remove "Add Materials" button from MaterialsView
   - Update all references from 'materials' to 'material_inventory'
   - Implement Material Receive workflow
   - Update all queries to use new schema

6. AFTER VERIFICATION (few weeks):
   - Drop materials_deprecated_backup table
*/

-- TRIGGER: Auto-create transaction record when inventory quantity changes
CREATE OR REPLACE FUNCTION create_material_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create transaction if quantity actually changed
  IF (TG_OP = 'UPDATE' AND OLD.current_quantity != NEW.current_quantity) THEN
    INSERT INTO material_transactions (
      material_inventory_id,
      store_id,
      project_id,
      transaction_type,
      quantity_change,
      quantity_before,
      quantity_after,
      unit_cost,
      remarks,
      performed_by
    ) VALUES (
      NEW.id,
      NEW.store_id,
      NEW.project_id,
      'adjustment',
      NEW.current_quantity - OLD.current_quantity,
      OLD.current_quantity,
      NEW.current_quantity,
      NEW.average_cost,
      'Auto-generated from inventory update',
      NEW.updated_by
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
-- CREATE TRIGGER trg_material_inventory_transaction
-- AFTER UPDATE ON material_inventory
-- FOR EACH ROW
-- WHEN (OLD.current_quantity IS DISTINCT FROM NEW.current_quantity)
-- EXECUTE FUNCTION create_material_transaction();

comment on function create_material_transaction() is 'Auto-creates transaction records when inventory quantities change';
