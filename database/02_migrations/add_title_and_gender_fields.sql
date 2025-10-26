-- ============================================
-- Add Title (คำนำหน้าชื่อ) and Gender (เพศ) fields to member application form
-- ============================================
-- This script adds two new fields to the personal_info section:
-- 1. title_name - คำนำหน้าชื่อ (นาย/นาง/นางสาว)
-- 2. gender - เพศ (ชาย/หญิง)

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

    RAISE NOTICE '📋 Adding title_name and gender fields to personal_info section...';

    -- ============================================
    -- 1. Add Title Name field (คำนำหน้าชื่อ)
    -- ============================================
    
    -- Check if title_name field already exists
    SELECT id INTO v_field_id
    FROM form_fields
    WHERE form_template_id = v_template_id
    AND field_key = 'title_name';

    IF v_field_id IS NOT NULL THEN
        RAISE NOTICE 'ℹ️  Field title_name already exists, updating...';
        
        UPDATE form_fields
        SET 
            field_type = 'select',
            label_th = 'คำนำหน้าชื่อ',
            label_en = 'Title',
            placeholder_th = 'เลือกคำนำหน้าชื่อ',
            placeholder_en = 'Select title',
            help_text_th = NULL,
            help_text_en = NULL,
            default_value = NULL,
            is_required_by_default = true,
            is_visible_by_default = true,
            validation_rules = '{}'::jsonb,
            options = '[
                {"value": "นาย", "label_th": "นาย", "label_en": "Mr."},
                {"value": "นาง", "label_th": "นาง", "label_en": "Mrs."},
                {"value": "นางสาว", "label_th": "นางสาว", "label_en": "Miss"}
            ]'::jsonb,
            section = 'personal_info',
            display_order = 1,
            depends_on = '{}'::jsonb,
            updated_at = now()
        WHERE id = v_field_id;
        
        RAISE NOTICE '✅ Updated title_name field';
    ELSE
        -- Insert new title_name field
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
            'title_name',
            'select',
            'คำนำหน้าชื่อ',
            'Title',
            'เลือกคำนำหน้าชื่อ',
            'Select title',
            NULL,
            NULL,
            NULL,
            true,  -- required
            true,  -- visible
            '{}'::jsonb,
            '[
                {"value": "นาย", "label_th": "นาย", "label_en": "Mr."},
                {"value": "นาง", "label_th": "นาง", "label_en": "Mrs."},
                {"value": "นางสาว", "label_th": "นางสาว", "label_en": "Miss"}
            ]'::jsonb,
            'personal_info',
            1,  -- Display first in personal_info section
            '{}'::jsonb
        );

        RAISE NOTICE '✅ Added title_name field successfully';
    END IF;

    -- ============================================
    -- 2. Add Gender field (เพศ)
    -- ============================================
    
    -- Check if gender field already exists
    SELECT id INTO v_field_id
    FROM form_fields
    WHERE form_template_id = v_template_id
    AND field_key = 'gender';

    IF v_field_id IS NOT NULL THEN
        RAISE NOTICE 'ℹ️  Field gender already exists, updating...';
        
        UPDATE form_fields
        SET 
            field_type = 'select',
            label_th = 'เพศ',
            label_en = 'Gender',
            placeholder_th = 'เลือกเพศ',
            placeholder_en = 'Select gender',
            help_text_th = NULL,
            help_text_en = NULL,
            default_value = NULL,
            is_required_by_default = true,
            is_visible_by_default = true,
            validation_rules = '{}'::jsonb,
            options = '[
                {"value": "ชาย", "label_th": "ชาย", "label_en": "Male"},
                {"value": "หญิง", "label_th": "หญิง", "label_en": "Female"}
            ]'::jsonb,
            section = 'personal_info',
            display_order = 35,
            depends_on = '{}'::jsonb,
            updated_at = now()
        WHERE id = v_field_id;
        
        RAISE NOTICE '✅ Updated gender field';
    ELSE
        -- Insert new gender field
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
            'gender',
            'select',
            'เพศ',
            'Gender',
            'เลือกเพศ',
            'Select gender',
            NULL,
            NULL,
            NULL,
            true,  -- required
            true,  -- visible
            '{}'::jsonb,
            '[
                {"value": "ชาย", "label_th": "ชาย", "label_en": "Male"},
                {"value": "หญิง", "label_th": "หญิง", "label_en": "Female"}
            ]'::jsonb,
            'personal_info',
            35,  -- After phone (30), before next field
            '{}'::jsonb
        );

        RAISE NOTICE '✅ Added gender field successfully';
    END IF;

    -- ============================================
    -- 3. Update display_order for existing fields
    -- ============================================
    
    RAISE NOTICE '📊 Updating display order for personal_info fields...';

    -- Reorder fields in personal_info section:
    -- 1. title_name (คำนำหน้าชื่อ)
    -- 10. first_name (ชื่อ)
    -- 20. last_name (นามสกุล)
    -- 30. phone (เบอร์โทร)
    -- 35. gender (เพศ)
    -- 40. birth_date (เกิดวันที่) - if exists
    -- 50. age (อายุ) - if exists
    
    UPDATE form_fields 
    SET display_order = 1
    WHERE form_template_id = v_template_id 
    AND field_key = 'title_name';

    UPDATE form_fields 
    SET display_order = 10
    WHERE form_template_id = v_template_id 
    AND field_key = 'first_name';

    UPDATE form_fields 
    SET display_order = 20
    WHERE form_template_id = v_template_id 
    AND field_key = 'last_name';

    UPDATE form_fields 
    SET display_order = 30
    WHERE form_template_id = v_template_id 
    AND field_key = 'phone';

    UPDATE form_fields 
    SET display_order = 35
    WHERE form_template_id = v_template_id 
    AND field_key = 'gender';

    -- Update birth_date if exists
    UPDATE form_fields 
    SET display_order = 40
    WHERE form_template_id = v_template_id 
    AND field_key = 'birth_date'
    AND EXISTS (
        SELECT 1 FROM form_fields 
        WHERE form_template_id = v_template_id 
        AND field_key = 'birth_date'
    );

    -- Update age if exists
    UPDATE form_fields 
    SET display_order = 50
    WHERE form_template_id = v_template_id 
    AND field_key = 'age'
    AND EXISTS (
        SELECT 1 FROM form_fields 
        WHERE form_template_id = v_template_id 
        AND field_key = 'age'
    );

    RAISE NOTICE '✅ Updated display_order for personal_info fields';

END $$;

-- ============================================
-- 4. Verify the new fields
-- ============================================

SELECT 
    field_key,
    label_th,
    field_type,
    display_order,
    is_visible_by_default,
    is_required_by_default,
    options
FROM form_fields
WHERE form_template_id = (SELECT id FROM form_templates WHERE code = 'MEMBER_APPLICATION')
AND section = 'personal_info'
ORDER BY display_order;
