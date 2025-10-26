-- ============================================
-- Add custom_display_order to project_field_configs (if not exists)
-- ============================================

-- Check if column exists and add if needed
DO $$
BEGIN
    -- Add custom_display_order column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'project_field_configs' 
        AND column_name = 'custom_display_order'
    ) THEN
        ALTER TABLE public.project_field_configs
        ADD COLUMN custom_display_order INTEGER NULL;
        
        RAISE NOTICE '✅ Added custom_display_order column to project_field_configs';
    ELSE
        RAISE NOTICE 'ℹ️  custom_display_order column already exists';
    END IF;
END $$;

-- Add index for custom_display_order if not exists
CREATE INDEX IF NOT EXISTS idx_project_field_configs_order 
    ON public.project_field_configs USING btree (project_form_config_id, custom_display_order) 
    TABLESPACE pg_default;

-- Add comment
COMMENT ON COLUMN public.project_field_configs.custom_display_order IS 
'NULL = use form_fields.display_order, integer = custom order for this project (10, 20, 30...)';

-- Verify
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'project_field_configs'
    AND column_name IN ('custom_display_order', 'is_visible', 'is_required')
ORDER BY ordinal_position;
