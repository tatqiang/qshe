-- ============================================
-- Initialize Project Form Configuration
-- ============================================
-- This script creates initial project_form_configs and project_field_configs
-- for all existing projects that have member_application_tokens

-- Step 1: Create project_form_configs for projects with tokens
INSERT INTO project_form_configs (
    project_id,
    form_template_id,
    company_id,
    is_enabled,
    allow_multiple_submissions,
    require_approval,
    created_by
)
SELECT DISTINCT
    t.project_id,
    t.form_template_id,
    t.company_id,
    true as is_enabled,
    true as allow_multiple_submissions,
    true as require_approval,
    t.created_by
FROM member_application_tokens t
WHERE t.project_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 
        FROM project_form_configs pfc 
        WHERE pfc.project_id = t.project_id 
            AND pfc.form_template_id = t.form_template_id
    )
ON CONFLICT (project_id, form_template_id) DO NOTHING;

-- Step 2: Create project_field_configs for all form fields
-- This syncs ALL fields (including newly added ones) with their default settings
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

-- Display summary
DO $$
DECLARE
    config_count INTEGER;
    field_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO config_count FROM project_form_configs;
    SELECT COUNT(*) INTO field_count FROM project_field_configs;
    
    RAISE NOTICE '✅ Project Form Configs: % records', config_count;
    RAISE NOTICE '✅ Project Field Configs: % records', field_count;
END $$;
