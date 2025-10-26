-- ============================================
-- Fix NULL is_visible values in project_field_configs
-- ============================================
-- This updates NULL values to match the field defaults

DO $$
DECLARE
    v_updated_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🔧 Fixing NULL is_visible and is_required values...';

    -- Update NULL is_visible to field default
    UPDATE project_field_configs pfc
    SET 
        is_visible = ff.is_visible_by_default,
        is_required = COALESCE(pfc.is_required, ff.is_required_by_default)
    FROM form_fields ff
    WHERE pfc.form_field_id = ff.id
    AND pfc.is_visible IS NULL;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    RAISE NOTICE '✅ Updated % field configurations with NULL values', v_updated_count;

END $$;

-- Verify the fix
SELECT 
    p.name as project_name,
    ff.field_key,
    ff.label_th,
    pfc.is_visible,
    pfc.is_required,
    ff.is_visible_by_default as default_visible,
    ff.is_required_by_default as default_required
FROM project_field_configs pfc
JOIN project_form_configs config ON config.id = pfc.project_form_config_id
JOIN projects p ON p.id = config.project_id
JOIN form_fields ff ON ff.id = pfc.form_field_id
WHERE ff.field_key = 'address_street'
ORDER BY p.name;
