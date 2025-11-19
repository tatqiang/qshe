-- Create RLS policies for all material system tables
-- Same pattern as stores - using USING (true) for Azure AD authentication

-- 1. MATERIAL_CODES
DROP POLICY IF EXISTS "Allow SELECT on material_codes" ON material_codes;
DROP POLICY IF EXISTS "Allow INSERT on material_codes" ON material_codes;
DROP POLICY IF EXISTS "Allow UPDATE on material_codes" ON material_codes;
DROP POLICY IF EXISTS "Allow DELETE on material_codes" ON material_codes;

CREATE POLICY "Allow SELECT on material_codes"
  ON material_codes FOR SELECT USING (true);

CREATE POLICY "Allow INSERT on material_codes"
  ON material_codes FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow UPDATE on material_codes"
  ON material_codes FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow DELETE on material_codes"
  ON material_codes FOR DELETE USING (true);

-- 2. MATERIAL_INVENTORY
DROP POLICY IF EXISTS "Allow SELECT on material_inventory" ON material_inventory;
DROP POLICY IF EXISTS "Allow INSERT on material_inventory" ON material_inventory;
DROP POLICY IF EXISTS "Allow UPDATE on material_inventory" ON material_inventory;
DROP POLICY IF EXISTS "Allow DELETE on material_inventory" ON material_inventory;

CREATE POLICY "Allow SELECT on material_inventory"
  ON material_inventory FOR SELECT USING (true);

CREATE POLICY "Allow INSERT on material_inventory"
  ON material_inventory FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow UPDATE on material_inventory"
  ON material_inventory FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow DELETE on material_inventory"
  ON material_inventory FOR DELETE USING (true);

-- 3. MATERIAL_RECEIVES
DROP POLICY IF EXISTS "Allow SELECT on material_receives" ON material_receives;
DROP POLICY IF EXISTS "Allow INSERT on material_receives" ON material_receives;
DROP POLICY IF EXISTS "Allow UPDATE on material_receives" ON material_receives;
DROP POLICY IF EXISTS "Allow DELETE on material_receives" ON material_receives;

CREATE POLICY "Allow SELECT on material_receives"
  ON material_receives FOR SELECT USING (true);

CREATE POLICY "Allow INSERT on material_receives"
  ON material_receives FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow UPDATE on material_receives"
  ON material_receives FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow DELETE on material_receives"
  ON material_receives FOR DELETE USING (true);

-- 4. MATERIAL_RECEIVE_ITEMS
DROP POLICY IF EXISTS "Allow SELECT on material_receive_items" ON material_receive_items;
DROP POLICY IF EXISTS "Allow INSERT on material_receive_items" ON material_receive_items;
DROP POLICY IF EXISTS "Allow UPDATE on material_receive_items" ON material_receive_items;
DROP POLICY IF EXISTS "Allow DELETE on material_receive_items" ON material_receive_items;

CREATE POLICY "Allow SELECT on material_receive_items"
  ON material_receive_items FOR SELECT USING (true);

CREATE POLICY "Allow INSERT on material_receive_items"
  ON material_receive_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow UPDATE on material_receive_items"
  ON material_receive_items FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow DELETE on material_receive_items"
  ON material_receive_items FOR DELETE USING (true);

-- 5. MATERIAL_RECEIVE_AREAS
DROP POLICY IF EXISTS "Allow SELECT on material_receive_areas" ON material_receive_areas;
DROP POLICY IF EXISTS "Allow INSERT on material_receive_areas" ON material_receive_areas;
DROP POLICY IF EXISTS "Allow UPDATE on material_receive_areas" ON material_receive_areas;
DROP POLICY IF EXISTS "Allow DELETE on material_receive_areas" ON material_receive_areas;

CREATE POLICY "Allow SELECT on material_receive_areas"
  ON material_receive_areas FOR SELECT USING (true);

CREATE POLICY "Allow INSERT on material_receive_areas"
  ON material_receive_areas FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow UPDATE on material_receive_areas"
  ON material_receive_areas FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow DELETE on material_receive_areas"
  ON material_receive_areas FOR DELETE USING (true);

-- 6. MATERIAL_TRANSACTIONS
DROP POLICY IF EXISTS "Allow SELECT on material_transactions" ON material_transactions;
DROP POLICY IF EXISTS "Allow INSERT on material_transactions" ON material_transactions;
DROP POLICY IF EXISTS "Allow UPDATE on material_transactions" ON material_transactions;
DROP POLICY IF EXISTS "Allow DELETE on material_transactions" ON material_transactions;

CREATE POLICY "Allow SELECT on material_transactions"
  ON material_transactions FOR SELECT USING (true);

CREATE POLICY "Allow INSERT on material_transactions"
  ON material_transactions FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow UPDATE on material_transactions"
  ON material_transactions FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow DELETE on material_transactions"
  ON material_transactions FOR DELETE USING (true);

-- Verify all policies created
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN (
  'stores',
  'material_codes',
  'material_inventory',
  'material_receives',
  'material_receive_items',
  'material_receive_areas',
  'material_transactions'
)
GROUP BY tablename
ORDER BY tablename;
