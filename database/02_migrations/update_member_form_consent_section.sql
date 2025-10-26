-- ============================================
-- Update Member Application Form - Consent Section
-- ============================================
-- This script reorganizes the form to have a consent section on page 2:
-- 1. Move profile photo to end of personal_info section
-- 2. Rename "documents" section to "consent" (หนังสือให้ความยินยอม)
-- 3. Add consent text field
-- 4. Keep ID card and medical certificate
-- 5. Add "other documents" field
-- 6. Update signature field text and remove signatures section

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

    RAISE NOTICE '🔄 Starting form restructure...';

    -- ============================================
    -- 1. MOVE PROFILE PHOTO TO END OF PERSONAL_INFO SECTION
    -- ============================================
    
    -- First, check if profile_photo field exists in personal_info section
    SELECT id INTO v_field_id
    FROM form_fields
    WHERE form_template_id = v_template_id
    AND field_key = 'profile_photo'
    AND section = 'personal_info';

    IF v_field_id IS NULL THEN
        -- If it doesn't exist, create it
        INSERT INTO form_fields (
            form_template_id,
            field_key,
            field_type,
            label_th,
            label_en,
            is_required_by_default,
            is_visible_by_default,
            help_text_th,
            help_text_en,
            validation_rules,
            section,
            display_order
        ) VALUES (
            v_template_id,
            'profile_photo',
            'file',
            'รูปถ่าย',
            'Profile Photo',
            true,
            true,
            'อัปโหลดรูปถ่ายหน้าตรง jpg หรือ png (ขนาดไม่เกิน 3 MB)',
            'Upload front-facing photo jpg or png (max 3 MB)',
            '{"accept": ["image/jpeg", "image/png"], "maxSize": 3145728, "thumbnail": true}'::jsonb,
            'personal_info',
            170 -- After position_applied (160)
        );
        RAISE NOTICE '✅ Created profile_photo in personal_info section';
    ELSE
        -- Update existing field
        UPDATE form_fields
        SET 
            section = 'personal_info',
            display_order = 170,
            field_type = 'file',
            validation_rules = '{"accept": ["image/jpeg", "image/png"], "maxSize": 3145728, "thumbnail": true}'::jsonb,
            help_text_th = 'อัปโหลดรูปถ่าย jpg หรือ png (ขนาดไม่เกิน 3 MB) สามารถย่อและแสดง thumbnail',
            help_text_en = 'Upload jpg or png (max 3 MB), collapsible with thumbnail'
        WHERE id = v_field_id;
        RAISE NOTICE '✅ Moved profile_photo to personal_info section (display_order: 170)';
    END IF;

    -- Remove old document_profile_photo if exists
    DELETE FROM form_fields
    WHERE form_template_id = v_template_id
    AND field_key = 'document_profile_photo';

    -- ============================================
    -- 2. ADD CONSENT TEXT FIELD (FIRST IN CONSENT SECTION)
    -- ============================================
    
    SELECT id INTO v_field_id
    FROM form_fields
    WHERE form_template_id = v_template_id
    AND field_key = 'consent_text';

    IF v_field_id IS NULL THEN
        INSERT INTO form_fields (
            form_template_id,
            field_key,
            field_type,
            label_th,
            label_en,
            is_required_by_default,
            is_visible_by_default,
            help_text_th,
            help_text_en,
            validation_rules,
            section,
            display_order
        ) VALUES (
            v_template_id,
            'consent_text',
            'info',
            'การให้ความยินยอม',
            'Consent Declaration',
            false,
            true,
            'ข้าพเจ้า {first_name} {last_name} ในฐานะเจ้าของข้อมูลส่วนบุคคลตกลงให้ความยินยอมแก่บริษัท ซิโน-ไทย เอ็นจีเนียริ่ง แอนด์ คอนสตรัคชั่น จำกัด (มหาชน) ในการเก็บรวบรวม เปิดเผย หรือใช้ข้อมูลส่วนบุคคล ข้อมูลส่วนบุคคลอ่อนไหว และข้อมูลส่วนบุคคลอื่นใดที่สามารถระบุว่าเป็นข้าพเจ้าได้ เพื่อเป็นหลักฐานในการยืนยันตัวตน เพื่อใช้ในการดำเนินกิจการ กิจกรรม และธุรกรรมของบริษัท ข้าพเจ้าทราบว่าเจ้าของข้อมูลส่วนบุคคล มีสิทธิที่จะให้ความยินยอมหรือไม่ก็ได้และมีสิทธิตามที่พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562',
            'I, {first_name} {last_name}, as the owner of personal data, agree to give consent to Sino-Thai Engineering and Construction Public Company Limited to collect, disclose or use personal data, sensitive personal data and any other personal data that can identify me as evidence of identity verification, for use in the company''s operations, activities and transactions. I acknowledge that the owner of personal data has the right to give consent or not and has the rights under the Personal Data Protection Act B.E. 2562',
            '{"type": "consent_text", "showDate": true, "interpolate": ["first_name", "last_name"]}'::jsonb,
            'consent',
            400
        );
        RAISE NOTICE '✅ Added consent_text field';
    END IF;

    -- ============================================
    -- 3. UPDATE ID CARD DOCUMENT
    -- ============================================
    
    UPDATE form_fields
    SET 
        section = 'consent',
        display_order = 410,
        label_th = 'สำเนาบัตรประชาชน (จำเป็น)',
        label_en = 'Copy of ID Card (Required)',
        help_text_th = 'อัปโหลดไฟล์ jpg, png หรือ pdf (ขนาดไม่เกิน 5 MB)',
        help_text_en = 'Upload jpg, png or pdf file (max 5 MB)'
    WHERE form_template_id = v_template_id
    AND field_key = 'document_id_card';

    RAISE NOTICE '✅ Updated document_id_card in consent section';

    -- ============================================
    -- 4. UPDATE MEDICAL CERTIFICATE
    -- ============================================
    
    UPDATE form_fields
    SET 
        section = 'consent',
        display_order = 420,
        label_th = 'ใบรับรองแพทย์ / ประวัติทางด้านสุขภาพ (จำเป็น)',
        label_en = 'Medical Certificate / Health History (Required)',
        help_text_th = 'อัปโหลดไฟล์ jpg, png หรือ pdf (ขนาดไม่เกิน 5 MB)',
        help_text_en = 'Upload jpg, png or pdf file (max 5 MB)'
    WHERE form_template_id = v_template_id
    AND field_key = 'document_medical_certificate';

    RAISE NOTICE '✅ Updated document_medical_certificate in consent section';

    -- ============================================
    -- 5. ADD OTHER DOCUMENTS FIELD
    -- ============================================
    
    SELECT id INTO v_field_id
    FROM form_fields
    WHERE form_template_id = v_template_id
    AND field_key = 'document_other';

    IF v_field_id IS NULL THEN
        INSERT INTO form_fields (
            form_template_id,
            field_key,
            field_type,
            label_th,
            label_en,
            is_required_by_default,
            is_visible_by_default,
            help_text_th,
            help_text_en,
            validation_rules,
            section,
            display_order
        ) VALUES (
            v_template_id,
            'document_other',
            'file',
            'เอกสารแนบอื่นๆ',
            'Other Documents',
            false,
            true,
            'อัปโหลดเอกสารอื่นๆ (ถ้าม ี) เช่น สำเนาทะเบียนบ้าน ใบอนุญาตขับขี่ ฯลฯ (ขนาดไม่เกิน 5 MB)',
            'Upload other documents (if any) such as house registration, driving license, etc. (max 5 MB)',
            '{"accept": ["image/jpeg", "image/png", "application/pdf"], "maxSize": 5242880, "multiple": true}'::jsonb,
            'consent',
            430
        );
        RAISE NOTICE '✅ Added document_other field';
    END IF;

    -- ============================================
    -- 6. UPDATE SIGNATURE FIELD
    -- ============================================
    
    -- Update applicant signature to be in consent section with new label
    UPDATE form_fields
    SET 
        section = 'consent',
        display_order = 500,
        label_th = 'ลายเซ็นผู้ให้ความยินยอม',
        label_en = 'Consent Giver Signature',
        help_text_th = 'กรุณาวาดลายเซ็นในกล่องเพื่อยืนยันความยินยอม',
        help_text_en = 'Please sign in the box to confirm consent'
    WHERE form_template_id = v_template_id
    AND field_key = 'applicant_signature';

    RAISE NOTICE '✅ Updated applicant_signature to consent section';

    -- Remove supervisor signature (not needed in this form)
    DELETE FROM form_fields
    WHERE form_template_id = v_template_id
    AND field_key = 'supervisor_signature';

    RAISE NOTICE '✅ Removed supervisor_signature field';

    -- ============================================
    -- SUMMARY
    -- ============================================
    
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '✅ Form restructure complete!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Changes made:';
    RAISE NOTICE '   1. ✓ Moved profile_photo to end of personal_info section (order: 170)';
    RAISE NOTICE '   2. ✓ Added consent_text with interpolated name and date';
    RAISE NOTICE '   3. ✓ Renamed documents → consent section';
    RAISE NOTICE '   4. ✓ Updated ID card field (order: 410)';
    RAISE NOTICE '   5. ✓ Updated medical certificate field (order: 420)';
    RAISE NOTICE '   6. ✓ Added other documents field (order: 430)';
    RAISE NOTICE '   7. ✓ Updated signature label to "ผู้ให้ความยินยอม" (order: 500)';
    RAISE NOTICE '   8. ✓ Removed supervisor signature';
    RAISE NOTICE '';
    RAISE NOTICE '📄 Section: หนังสือให้ความยินยอม (Consent)';
    RAISE NOTICE '   - consent_text (400)';
    RAISE NOTICE '   - document_id_card (410)';
    RAISE NOTICE '   - document_medical_certificate (420)';
    RAISE NOTICE '   - document_other (430)';
    RAISE NOTICE '   - applicant_signature (500)';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Show personal_info section fields (should include profile_photo at end)
SELECT 
    field_key,
    label_th,
    field_type,
    display_order,
    is_required_by_default,
    section
FROM form_fields
WHERE form_template_id = (SELECT id FROM form_templates WHERE code = 'MEMBER_APPLICATION')
AND section = 'personal_info'
ORDER BY display_order;

-- Show consent section fields (renamed from documents)
SELECT 
    field_key,
    label_th,
    field_type,
    display_order,
    is_required_by_default,
    section
FROM form_fields
WHERE form_template_id = (SELECT id FROM form_templates WHERE code = 'MEMBER_APPLICATION')
AND section = 'consent'
ORDER BY display_order;

-- Show all sections and field counts
SELECT 
    section,
    COUNT(*) as field_count,
    MIN(display_order) as first_order,
    MAX(display_order) as last_order
FROM form_fields
WHERE form_template_id = (SELECT id FROM form_templates WHERE code = 'MEMBER_APPLICATION')
GROUP BY section
ORDER BY MIN(display_order);
