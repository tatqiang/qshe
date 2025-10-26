-- ============================================
-- STEP 1: Check current state of address_street field
-- ============================================
-- Copy and paste this into your SQL client

SELECT 
    p.name as project_name,
    ff.field_key,
    ff.label_th,
    pfc.is_visible,
    pfc.is_required,
    pfc.custom_display_order,
    ff.section
FROM project_field_configs pfc
JOIN project_form_configs config ON config.id = pfc.project_form_config_id
JOIN projects p ON p.id = config.project_id
JOIN form_fields ff ON ff.id = pfc.form_field_id
WHERE ff.field_key = 'address_street'
ORDER BY p.name;

-- Expected result for "Under Test":
-- is_visible = true
-- is_required = true (you set it checked)
-- custom_display_order = 105 or 106


-- ============================================
-- STEP 2: If is_visible is NULL, fix it
-- ============================================

UPDATE project_field_configs pfc
SET 
    is_visible = ff.is_visible_by_default,
    is_required = COALESCE(pfc.is_required, ff.is_required_by_default)
FROM form_fields ff
WHERE pfc.form_field_id = ff.id
AND pfc.is_visible IS NULL;

-- Check how many updated
SELECT 'Updated', COUNT(*) 
FROM project_field_configs 
WHERE is_visible IS NULL;


-- ============================================
-- STEP 3: Verify all address fields order for "Under Test"
-- ============================================

SELECT 
    pfc.custom_display_order as "order",
    ff.field_key,
    ff.label_th,
    pfc.is_visible,
    pfc.is_required
FROM project_field_configs pfc
JOIN project_form_configs config ON config.id = pfc.project_form_config_id
JOIN projects p ON p.id = config.project_id
JOIN form_fields ff ON ff.id = pfc.form_field_id
WHERE p.name = 'Under Test'
AND ff.section = 'address'
ORDER BY pfc.custom_display_order;

-- Expected order:
-- 100 or 105 - address_house_number (เลขที่)
-- 105 or 106 - address_street (ถนน)  ← Should be here!
-- 110 or 107 - address_moo (หมู่)
-- 115 or 108 - address_soi (ซอย)
-- 120 or 109 - address_tambon (ตำบล)
-- etc.


-- ============================================
-- STEP 4: If "ถนน" field order is wrong, fix it manually
-- ============================================
-- Adjust the order numbers to your preference

-- Get the config IDs first
SELECT 
    pfc.id as config_id,
    ff.field_key,
    pfc.custom_display_order
FROM project_field_configs pfc
JOIN project_form_configs pfconfig ON pfconfig.id = pfc.project_form_config_id
JOIN projects p ON p.id = pfconfig.project_id
JOIN form_fields ff ON ff.id = pfc.form_field_id
WHERE p.name = 'Under Test'
AND ff.section = 'address'
ORDER BY ff.display_order;

-- Update display orders (adjust IDs from above query)
-- Example: Set street field to order 106 (between house_number and moo)

UPDATE project_field_configs
SET custom_display_order = 106
WHERE id = 'PASTE_STREET_FIELD_CONFIG_ID_HERE';

-- Verify
SELECT 
    pfc.custom_display_order,
    ff.field_key,
    ff.label_th
FROM project_field_configs pfc
JOIN project_form_configs config ON config.id = pfc.project_form_config_id
JOIN projects p ON p.id = config.project_id
JOIN form_fields ff ON ff.id = pfc.form_field_id
WHERE p.name = 'Under Test'
AND ff.section = 'address'
ORDER BY pfc.custom_display_order;
