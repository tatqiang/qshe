-- ============================================
-- Sync ALL New Fields to Existing Project Configs
-- ============================================
-- This adds any missing fields to all existing project_field_configs
-- Run this anytime you add new fields to form_templates

DO $$
DECLARE
    v_added_count INTEGER := 0;
    rec RECORD;
BEGIN
    RAISE NOTICE '🔄 Syncing new fields to existing project configurations...';

    -- Add any missing fields to all existing project configs
    INSERT INTO project_field_configs (
        project_form_config_id,
        form_field_id,
        is_visible,
        is_required,
        custom_display_order
    )
    SELECT 
        pfc.id as project_form_config_id,
        ff.id as form_field_id,
        ff.is_visible_by_default as is_visible,
        ff.is_required_by_default as is_required,
        ff.display_order as custom_display_order
    FROM project_form_configs pfc
    CROSS JOIN form_fields ff
    WHERE ff.form_template_id = pfc.form_template_id
    AND NOT EXISTS (
        SELECT 1 
        FROM project_field_configs pffield 
        WHERE pffield.project_form_config_id = pfc.id 
        AND pffield.form_field_id = ff.id
    )
    ON CONFLICT (project_form_config_id, form_field_id) DO NOTHING;

    GET DIAGNOSTICS v_added_count = ROW_COUNT;

    RAISE NOTICE '✅ Added % missing field configuration(s)', v_added_count;

    -- Show summary by template
    RAISE NOTICE '';
    RAISE NOTICE '� Summary by Form Template:';
    
    FOR rec IN (
        SELECT 
            ft.name_th as template_name,
            COUNT(DISTINCT pfc.project_id) as project_count,
            COUNT(DISTINCT pfield.form_field_id) as field_count
        FROM form_templates ft
        JOIN project_form_configs pfc ON pfc.form_template_id = ft.id
        JOIN project_field_configs pfield ON pfield.project_form_config_id = pfc.id
        GROUP BY ft.id, ft.name_th
        ORDER BY ft.name_th
    ) LOOP
        RAISE NOTICE '   📋 %: % projects × % fields', rec.template_name, rec.project_count, rec.field_count;
    END LOOP;

END $$;

-- Show new fields that were just added (including street field)
SELECT 
    p.name as project_name,
    ft.name_th as form_template,
    ff.field_key,
    ff.label_th,
    pfield.is_visible,
    pfield.custom_display_order
FROM project_field_configs pfield
JOIN project_form_configs pfc ON pfc.id = pfield.project_form_config_id
JOIN projects p ON p.id = pfc.project_id
JOIN form_templates ft ON ft.id = pfc.form_template_id
JOIN form_fields ff ON ff.id = pfield.form_field_id
WHERE ff.field_key IN ('address_street') -- Add other new fields here
ORDER BY p.name, pfield.custom_display_order;
