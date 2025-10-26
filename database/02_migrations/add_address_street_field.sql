-- ============================================
-- Add "street/road" field to member application form
-- ============================================

DO $$
DECLARE
    v_template_id UUID;
    v_field_id UUID;
BEGIN
    -- Get the member application template ID
    SELECT id INTO v_template_id 
    FROM form_templates 
    WHERE code = 'MEMBER_APPLICATION';

    IF v_template_id IS NULL THEN
        RAISE EXCEPTION 'Member application template not found';
    END IF;

    -- Check if field already exists
    SELECT id INTO v_field_id
    FROM form_fields
    WHERE form_template_id = v_template_id
    AND field_key = 'address_street';

    IF v_field_id IS NOT NULL THEN
        RAISE NOTICE 'ℹ️  Field address_street already exists';
    ELSE
        -- Insert new field with display_order 105 (between house_number=100 and moo=110)
        INSERT INTO form_fields (
            form_template_id,
            field_key,
            field_type,
            label_th,
            label_en,
            placeholder_th,
            placeholder_en,
            help_text_th,
            help_text_en,
            default_value,
            is_required_by_default,
            is_visible_by_default,
            validation_rules,
            options,
            section,
            display_order,
            depends_on
        ) VALUES (
            v_template_id,
            'address_street',
            'text',
            'ถนน',
            'Street/Road',
            'ระบุชื่อถนน',
            'Enter street name',
            NULL,
            NULL,
            NULL,
            false, -- not required
            true,  -- visible
            '{"maxLength": 100}'::jsonb,
            '[]'::jsonb,
            'address', -- FIXED: Changed from 'personal_info' to 'address'
            105, -- after address_house_number (100), before address_moo (110)
            '{}'::jsonb
        );

        RAISE NOTICE '✅ Added address_street field successfully';
    END IF;

    -- Update display_order to make room for the new field
    -- Shift existing address fields if needed
    UPDATE form_fields 
    SET display_order = 100
    WHERE form_template_id = v_template_id 
    AND field_key = 'address_house_number';

    UPDATE form_fields 
    SET display_order = 105
    WHERE form_template_id = v_template_id 
    AND field_key = 'address_street';

    UPDATE form_fields 
    SET display_order = 110
    WHERE form_template_id = v_template_id 
    AND field_key = 'address_moo';

    UPDATE form_fields 
    SET display_order = 115
    WHERE form_template_id = v_template_id 
    AND field_key = 'address_soi';

    UPDATE form_fields 
    SET display_order = 120
    WHERE form_template_id = v_template_id 
    AND field_key = 'address_tambon';

    UPDATE form_fields 
    SET display_order = 125
    WHERE form_template_id = v_template_id 
    AND field_key = 'address_amphoe';

    UPDATE form_fields 
    SET display_order = 130
    WHERE form_template_id = v_template_id 
    AND field_key = 'address_province';

    RAISE NOTICE '✅ Updated display_order for address fields';

END $$;

-- Verify the new field and order
SELECT 
    field_key,
    label_th,
    display_order,
    is_visible_by_default,
    is_required_by_default
FROM form_fields
WHERE form_template_id = (SELECT id FROM form_templates WHERE code = 'MEMBER_APPLICATION')
AND field_key LIKE 'address_%'
ORDER BY display_order;
