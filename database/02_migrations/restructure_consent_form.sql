-- ============================================
-- Restructure Member Application Form - Consent Section
-- ============================================
-- This migration:
-- 1. Moves profile_photo to end of personal_info section
-- 2. Renames "เอกสารแนบ" section to "หนังสือให้ความยินยอม"
-- 3. Adds consent text field with date and name
-- 4. Reorders document fields
-- 5. Updates signature field label from "ผู้สมัคร" to "ผู้ให้ความยินยอม"
-- 6. Removes signature section (signature stays in consent section)
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

    -- ============================================
    -- 1. Move profile_photo to end of personal_info section (display_order 99)
    -- ============================================
    UPDATE form_fields 
    SET display_order = 99
    WHERE form_template_id = v_template_id 
    AND field_key = 'profile_photo';

    RAISE NOTICE '✅ Moved profile_photo to end of personal_info section (order 99)';

    -- ============================================
    -- 2. Rename "documents" section to "consent"
    -- ============================================
    UPDATE form_fields 
    SET section = 'consent'
    WHERE form_template_id = v_template_id 
    AND section = 'documents';

    RAISE NOTICE '✅ Renamed documents section to consent';

    -- ============================================
    -- 3. Add consent_text field (display_order 400)
    -- ============================================
    SELECT id INTO v_field_id
    FROM form_fields
    WHERE form_template_id = v_template_id
    AND field_key = 'consent_text';

    IF v_field_id IS NOT NULL THEN
        RAISE NOTICE 'ℹ️  Field consent_text already exists, updating...';
        UPDATE form_fields
        SET 
            field_type = 'read_only_text',
            label_th = 'การให้ความยินยอม',
            label_en = 'Consent Declaration',
            placeholder_th = NULL,
            placeholder_en = NULL,
            help_text_th = 'ข้อความนี้จะแสดงวันที่และชื่อของท่านโดยอัตโนมัติ',
            help_text_en = 'This text will automatically display the date and your name',
            default_value = NULL,
            is_required_by_default = false,
            is_visible_by_default = true,
            validation_rules = '{}'::jsonb,
            options = jsonb_build_object(
                'content_th', 'ข้าพเจ้า {{first_name}} {{last_name}} ในฐานะเจ้าของข้อมูลส่วนบุคคลตกลงให้ความยินยอมแก่บริษัท ซิโน-ไทย เอ็นจีเนียริ่ง แอนด์ คอนสตรัคชั่น จำกัด (มหาชน) ในการเก็บรวบรวม เปิดเผย หรือใช้ข้อมูลส่วนบุคคล ข้อมูลส่วนบุคคลอ่อนไหว และข้อมูลส่วนบุคคลอื่นใดที่สามารถระบุว่าเป็นข้าพเจ้าได้ เพื่อเป็นหลักฐานในการยืนยันตัวตน เพื่อใช้ในการดำเนินกิจการ กิจกรรม และธุรกรรมของบริษัท ข้าพเจ้าทราบว่าเจ้าของข้อมูลส่วนบุคคล มีสิทธิที่จะให้ความยินยอมหรือไม่ก็ได้และมีสิทธิตามที่พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562',
                'content_en', 'I, {{first_name}} {{last_name}}, as the owner of personal data, consent to Sino-Thai Engineering and Construction Public Company Limited to collect, disclose, or use personal data, sensitive personal data, and any other personal data that can identify me as evidence of identity verification for use in the company''s operations, activities, and transactions. I acknowledge that the owner of personal data has the right to give or not give consent and has rights under the Personal Data Protection Act B.E. 2562 (2019).',
                'date_label_th', 'วันที่',
                'date_label_en', 'Date',
                'show_date', true
            ),
            section = 'consent',
            display_order = 400,
            depends_on = '{}'::jsonb
        WHERE id = v_field_id;
    ELSE
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
            'consent_text',
            'read_only_text',
            'การให้ความยินยอม',
            'Consent Declaration',
            NULL,
            NULL,
            'ข้อความนี้จะแสดงวันที่และชื่อของท่านโดยอัตโนมัติ',
            'This text will automatically display the date and your name',
            NULL,
            false,
            true,
            '{}'::jsonb,
            jsonb_build_object(
                'content_th', 'ข้าพเจ้า {{first_name}} {{last_name}} ในฐานะเจ้าของข้อมูลส่วนบุคคลตกลงให้ความยินยอมแก่บริษัท ซิโน-ไทย เอ็นจีเนียริ่ง แอนด์ คอนสตรัคชั่น จำกัด (มหาชน) ในการเก็บรวบรวม เปิดเผย หรือใช้ข้อมูลส่วนบุคคล ข้อมูลส่วนบุคคลอ่อนไหว และข้อมูลส่วนบุคคลอื่นใดที่สามารถระบุว่าเป็นข้าพเจ้าได้ เพื่อเป็นหลักฐานในการยืนยันตัวตน เพื่อใช้ในการดำเนินกิจการ กิจกรรม และธุรกรรมของบริษัท ข้าพเจ้าทราบว่าเจ้าของข้อมูลส่วนบุคคล มีสิทธิที่จะให้ความยินยอมหรือไม่ก็ได้และมีสิทธิตามที่พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562',
                'content_en', 'I, {{first_name}} {{last_name}}, as the owner of personal data, consent to Sino-Thai Engineering and Construction Public Company Limited to collect, disclose, or use personal data, sensitive personal data, and any other personal data that can identify me as evidence of identity verification for use in the company''s operations, activities, and transactions. I acknowledge that the owner of personal data has the right to give or not give consent and has rights under the Personal Data Protection Act B.E. 2562 (2019).',
                'date_label_th', 'วันที่',
                'date_label_en', 'Date',
                'show_date', true
            ),
            'consent',
            400,
            '{}'::jsonb
        );
    END IF;

    RAISE NOTICE '✅ Added consent_text field (order 400)';

    -- ============================================
    -- 4. Update display_order for document fields in consent section
    -- ============================================
    
    -- ID Card Copy (order 410)
    UPDATE form_fields 
    SET display_order = 410
    WHERE form_template_id = v_template_id 
    AND field_key = 'id_card_copy';

    -- Medical Certificate (order 420)
    UPDATE form_fields 
    SET display_order = 420
    WHERE form_template_id = v_template_id 
    AND field_key = 'medical_certificate';

    -- Other Documents (order 430)
    UPDATE form_fields 
    SET display_order = 430
    WHERE form_template_id = v_template_id 
    AND field_key = 'other_documents';

    RAISE NOTICE '✅ Updated display_order for document fields (410, 420, 430)';

    -- ============================================
    -- 5. Update signature field and move to consent section
    -- ============================================
    UPDATE form_fields 
    SET 
        label_th = 'ลายเซ็นผู้ให้ความยินยอม',
        label_en = 'Signature of Consenting Party',
        section = 'consent',
        display_order = 440
    WHERE form_template_id = v_template_id 
    AND field_key = 'applicant_signature';

    RAISE NOTICE '✅ Updated signature field label to "ผู้ให้ความยินยอม" and moved to consent section (order 440)';

    -- ============================================
    -- 6. Remove any fields in "signature" section (if exists)
    -- ============================================
    UPDATE form_fields 
    SET is_visible_by_default = false
    WHERE form_template_id = v_template_id 
    AND section = 'signature'
    AND field_key != 'applicant_signature';

    RAISE NOTICE '✅ Hidden fields in old signature section (keeping only applicant_signature in consent)';

    -- ============================================
    -- Verification: Show updated structure
    -- ============================================
    RAISE NOTICE '
============================================
📋 VERIFICATION - Member Application Form Structure
============================================
';

    -- Show the updated fields (results will be displayed separately)
    RAISE NOTICE '
============================================
✅ Migration Complete!
============================================
Expected structure:
1. Profile photo moved to end of personal_info (order 99)
2. Consent section contains:
   - consent_text (order 400) - with date and name
   - id_card_copy (order 410)
   - medical_certificate (order 420)
   - other_documents (order 430)
   - applicant_signature (order 440) - labeled as "ผู้ให้ความยินยอม"
============================================
';

END $$;

-- ============================================
-- Verification Query - Run this to see the results
-- ============================================
SELECT 
    section,
    field_key,
    label_th,
    label_en,
    display_order,
    is_visible_by_default,
    is_required_by_default
FROM form_fields
WHERE form_template_id = (SELECT id FROM form_templates WHERE code = 'MEMBER_APPLICATION')
ORDER BY display_order;
