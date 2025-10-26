-- ============================================
-- PROJECT FIELD CONFIGS
-- Per-project customization of form fields
-- ============================================

CREATE TABLE IF NOT EXISTS public.project_field_configs (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    project_form_config_id UUID NOT NULL,
    form_field_id UUID NOT NULL,
    
    -- Override default settings
    is_visible BOOLEAN NULL, -- NULL = use default from form_fields
    is_required BOOLEAN NULL, -- NULL = use default from form_fields
    
    -- Custom labels (optional overrides)
    custom_label_th TEXT NULL,
    custom_label_en TEXT NULL,
    custom_help_text_th TEXT NULL,
    custom_help_text_en TEXT NULL,
    
    -- Custom validation and options (optional overrides)
    custom_validation_rules JSONB NULL,
    custom_options JSONB NULL,
    custom_display_order INTEGER NULL,
    
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
    
    CONSTRAINT project_field_configs_pkey PRIMARY KEY (id),
    CONSTRAINT project_field_configs_config_field_key UNIQUE (project_form_config_id, form_field_id),
    CONSTRAINT project_field_configs_project_form_config_fkey 
        FOREIGN KEY (project_form_config_id) 
        REFERENCES project_form_configs(id) 
        ON DELETE CASCADE,
    CONSTRAINT project_field_configs_form_field_fkey 
        FOREIGN KEY (form_field_id) 
        REFERENCES form_fields(id) 
        ON DELETE CASCADE
) TABLESPACE pg_default;

COMMENT ON TABLE public.project_field_configs IS 
'Per-project customization of form fields (visibility, required, labels, validation, etc.)';

COMMENT ON COLUMN public.project_field_configs.is_visible IS 
'NULL = use form_fields.is_visible_by_default, true/false = override';

COMMENT ON COLUMN public.project_field_configs.is_required IS 
'NULL = use form_fields.is_required_by_default, true/false = override';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_field_configs_form 
    ON public.project_field_configs USING btree (project_form_config_id) 
    TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_project_field_configs_field 
    ON public.project_field_configs USING btree (form_field_id) 
    TABLESPACE pg_default;

-- Trigger for updated_at
CREATE TRIGGER trigger_project_field_configs_updated_at 
    BEFORE UPDATE ON project_field_configs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at();
