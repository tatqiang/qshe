-- ============================================
-- MEMBER APPLICATION FORM - SEED DATA
-- ============================================
-- This script populates the form_templates and form_fields tables
-- with the Member Application form based on JobApply.txt

-- ============================================
-- 1. INSERT FORM TEMPLATE
-- ============================================

INSERT INTO form_templates (
    code,
    name_th,
    name_en,
    description,
    category,
    icon,
    is_active,
    version
) VALUES (
    'MEMBER_APPLICATION',
    'แบบฟอร์มขึ้นทะเบียนบุคลากร',
    'Member Application Form',
    'แบบฟอร์มสำหรับเก็บข้อมูลบุคลากรทุกระดับ ทั้งพนักงานและผู้รับเหมา',
    'personnel',
    'UserPlus',
    true,
    1
) ON CONFLICT (code) DO UPDATE SET
    name_th = EXCLUDED.name_th,
    name_en = EXCLUDED.name_en,
    updated_at = now();

-- Get the form template ID for reference
DO $$
DECLARE
    template_id UUID;
BEGIN
    SELECT id INTO template_id FROM form_templates WHERE code = 'MEMBER_APPLICATION';
    
    -- ============================================
    -- 2. INSERT FORM FIELDS - SECTION: PERSONAL INFO
    -- ============================================
    
    -- First Name
    INSERT INTO form_fields (
        form_template_id, field_key, field_type,
        label_th, label_en, placeholder_th, placeholder_en,
        is_required_by_default, is_visible_by_default,
        validation_rules, section, display_order
    ) VALUES (
        template_id, 'first_name', 'text',
        'ชื่อ', 'First Name', 'กรอกชื่อ', 'Enter first name',
        true, true,
        '{"minLength": 1, "maxLength": 100}',
        'personal_info', 10
    ) ON CONFLICT (form_template_id, field_key) DO UPDATE SET
        label_th = EXCLUDED.label_th,
        updated_at = now();
    
    -- Last Name
    INSERT INTO form_fields (
        form_template_id, field_key, field_type,
        label_th, label_en, placeholder_th, placeholder_en,
        is_required_by_default, is_visible_by_default,
        validation_rules, section, display_order
    ) VALUES (
        template_id, 'last_name', 'text',
        'นามสกุล', 'Last Name', 'กรอกนามสกุล', 'Enter last name',
        true, true,
        '{"minLength": 1, "maxLength": 100}',
        'personal_info', 20
    ) ON CONFLICT (form_template_id, field_key) DO UPDATE SET
        label_th = EXCLUDED.label_th,
        updated_at = now();
    
    -- Phone Number
    INSERT INTO form_fields (
        form_template_id, field_key, field_type,
        label_th, label_en, placeholder_th, placeholder_en,
        is_required_by_default, is_visible_by_default,
        validation_rules, section, display_order
    ) VALUES (
        template_id, 'phone', 'text',
        'เบอร์โทร', 'Phone Number', '0812345678', '0812345678',
        true, true,
        '{"pattern": "^[0-9]{9,10}$", "minLength": 9, "maxLength": 10}',
        'personal_info', 30
    ) ON CONFLICT (form_template_id, field_key) DO UPDATE SET
        label_th = EXCLUDED.label_th,
        updated_at = now();
    
    -- ============================================
    -- SECTION: ADDRESS
    -- ============================================
    
    -- House Number
    INSERT INTO form_fields (
        form_template_id, field_key, field_type,
        label_th, label_en, placeholder_th,
        is_required_by_default, is_visible_by_default,
        section, display_order
    ) VALUES (
        template_id, 'address_house_number', 'text',
        'เลขที่', 'House Number', '123',
        true, true,
        'address', 40
    ) ON CONFLICT (form_template_id, field_key) DO UPDATE SET updated_at = now();
    
    -- Moo (Village)
    INSERT INTO form_fields (
        form_template_id, field_key, field_type,
        label_th, label_en, placeholder_th,
        is_required_by_default, is_visible_by_default,
        section, display_order
    ) VALUES (
        template_id, 'address_moo', 'text',
        'หมู่', 'Moo', '1',
        false, true,
        'address', 50
    ) ON CONFLICT (form_template_id, field_key) DO UPDATE SET updated_at = now();
    
    -- Soi
    INSERT INTO form_fields (
        form_template_id, field_key, field_type,
        label_th, label_en, placeholder_th,
        is_required_by_default, is_visible_by_default,
        section, display_order
    ) VALUES (
        template_id, 'address_soi', 'text',
        'ซอย', 'Soi', 'ลาดพร้าว',
        false, true,
        'address', 60
    ) ON CONFLICT (form_template_id, field_key) DO UPDATE SET updated_at = now();
    
    -- Sub-district (Tambon)
    INSERT INTO form_fields (
        form_template_id, field_key, field_type,
        label_th, label_en, placeholder_th,
        is_required_by_default, is_visible_by_default,
        section, display_order
    ) VALUES (
        template_id, 'address_tambon', 'text',
        'ตำบล', 'Sub-district', 'บางกะปิ',
        true, true,
        'address', 70
    ) ON CONFLICT (form_template_id, field_key) DO UPDATE SET updated_at = now();
    
    -- District (Amphoe)
    INSERT INTO form_fields (
        form_template_id, field_key, field_type,
        label_th, label_en, placeholder_th,
        is_required_by_default, is_visible_by_default,
        section, display_order
    ) VALUES (
        template_id, 'address_amphoe', 'text',
        'อำเภอ', 'District', 'ห้วยขวาง',
        true, true,
        'address', 80
    ) ON CONFLICT (form_template_id, field_key) DO UPDATE SET updated_at = now();
    
    -- Province (Changwat)
    INSERT INTO form_fields (
        form_template_id, field_key, field_type,
        label_th, label_en, placeholder_th,
        is_required_by_default, is_visible_by_default,
        section, display_order
    ) VALUES (
        template_id, 'address_province', 'text',
        'จังหวัด', 'Province', 'กรุงเทพมหานคร',
        true, true,
        'address', 90
    ) ON CONFLICT (form_template_id, field_key) DO UPDATE SET updated_at = now();
    
    -- ============================================
    -- SECTION: PERSONAL INFO (CONTINUED)
    -- ============================================
    
    -- Birth Date
    INSERT INTO form_fields (
        form_template_id, field_key, field_type,
        label_th, label_en,
        is_required_by_default, is_visible_by_default,
        help_text_th,
        section, display_order
    ) VALUES (
        template_id, 'birth_date', 'date',
        'เกิดวันที่', 'Birth Date',
        true, true,
        'อายุจะคำนวณอัตโนมัติ',
        'personal_info', 100
    ) ON CONFLICT (form_template_id, field_key) DO UPDATE SET updated_at = now();
    
    -- Age (calculated)
    INSERT INTO form_fields (
        form_template_id, field_key, field_type,
        label_th, label_en,
        is_required_by_default, is_visible_by_default,
        help_text_th,
        section, display_order
    ) VALUES (
        template_id, 'age', 'number',
        'อายุ (ปี)', 'Age (years)',
        true, true,
        'คำนวณจากวันเกิด',
        'personal_info', 110
    ) ON CONFLICT (form_template_id, field_key) DO UPDATE SET updated_at = now();
    
    -- Education Level
    INSERT INTO form_fields (
        form_template_id, field_key, field_type,
        label_th, label_en,
        is_required_by_default, is_visible_by_default,
        options, section, display_order
    ) VALUES (
        template_id, 'education_level', 'select',
        'วุฒิการศึกษา', 'Education Level',
        true, true,
        '[
            {"value": "elementary", "label_th": "ประถมศึกษา", "label_en": "Elementary"},
            {"value": "secondary", "label_th": "มัธยมศึกษา", "label_en": "Secondary"},
            {"value": "vocational", "label_th": "ปวช./ปวส.", "label_en": "Vocational"},
            {"value": "bachelor", "label_th": "ปริญญาตรี", "label_en": "Bachelor"},
            {"value": "master", "label_th": "ปริญญาโท", "label_en": "Master"},
            {"value": "doctorate", "label_th": "ปริญญาเอก", "label_en": "Doctorate"}
        ]',
        'personal_info', 120
    ) ON CONFLICT (form_template_id, field_key) DO UPDATE SET updated_at = now();
    
    -- Nationality
    INSERT INTO form_fields (
        form_template_id, field_key, field_type,
        label_th, label_en, placeholder_th,
        is_required_by_default, is_visible_by_default,
        default_value, section, display_order
    ) VALUES (
        template_id, 'nationality', 'text',
        'สัญชาติ', 'Nationality', 'ไทย',
        true, true,
        'ไทย',
        'personal_info', 130
    ) ON CONFLICT (form_template_id, field_key) DO UPDATE SET updated_at = now();
    
    -- Religion
    INSERT INTO form_fields (
        form_template_id, field_key, field_type,
        label_th, label_en,
        is_required_by_default, is_visible_by_default,
        options, section, display_order
    ) VALUES (
        template_id, 'religion', 'select',
        'ศาสนา', 'Religion',
        true, true,
        '[
            {"value": "buddhist", "label_th": "พุทธ", "label_en": "Buddhist"},
            {"value": "islam", "label_th": "อิสลาม", "label_en": "Islam"},
            {"value": "christian", "label_th": "คริสต์", "label_en": "Christian"},
            {"value": "hindu", "label_th": "ฮินดู", "label_en": "Hindu"},
            {"value": "other", "label_th": "อื่นๆ", "label_en": "Other"}
        ]',
        'personal_info', 140
    ) ON CONFLICT (form_template_id, field_key) DO UPDATE SET updated_at = now();
    
    -- ID Card Number
    INSERT INTO form_fields (
        form_template_id, field_key, field_type,
        label_th, label_en, placeholder_th,
        is_required_by_default, is_visible_by_default,
        validation_rules,
        section, display_order
    ) VALUES (
        template_id, 'id_card_number', 'text',
        'เลขที่บัตรประชาชน หรือหนังสือเดินทาง', 'ID Card or Passport Number', '1234567890123',
        true, true,
        '{"pattern": "^[0-9]{13}$", "minLength": 13, "maxLength": 13}',
        'personal_info', 150
    ) ON CONFLICT (form_template_id, field_key) DO UPDATE SET updated_at = now();
    
    -- Position Applied For
    INSERT INTO form_fields (
        form_template_id, field_key, field_type,
        label_th, label_en, placeholder_th,
        is_required_by_default, is_visible_by_default,
        section, display_order
    ) VALUES (
        template_id, 'position_applied', 'text',
        'สมัครเข้าทำงานในตำแหน่ง', 'Position Applied For', 'ช่างเชื่อม',
        true, true,
        'personal_info', 160
    ) ON CONFLICT (form_template_id, field_key) DO UPDATE SET updated_at = now();
    
    -- Profile Photo (moved to end of personal_info section)
    INSERT INTO form_fields (
        form_template_id, field_key, field_type,
        label_th, label_en,
        is_required_by_default, is_visible_by_default,
        help_text_th, help_text_en,
        validation_rules,
        section, display_order
    ) VALUES (
        template_id, 'profile_photo', 'file',
        'รูปถ่าย', 'Profile Photo',
        true, true,
        'อัปโหลดรูปถ่าย jpg หรือ png (ขนาดไม่เกิน 3 MB) สามารถย่อและแสดง thumbnail',
        'Upload jpg or png (max 3 MB), collapsible with thumbnail',
        '{"accept": ["image/jpeg", "image/png"], "maxSize": 3145728, "thumbnail": true}',
        'personal_info', 170
    ) ON CONFLICT (form_template_id, field_key) DO UPDATE SET updated_at = now();
    
    -- ============================================
    -- SECTION: WORK HISTORY & HEALTH
    -- ============================================
    
    -- Construction Experience
    INSERT INTO form_fields (
        form_template_id, field_key, field_type,
        label_th, label_en,
        is_required_by_default, is_visible_by_default,
        options, section, display_order
    ) VALUES (
        template_id, 'has_construction_experience', 'radio',
        'ท่านมีประสบการณ์ในการทำงานก่อสร้างหรือไม่', 'Do you have construction experience?',
        true, true,
        '[
            {"value": "no", "label_th": "ไม่เคย", "label_en": "No"},
            {"value": "yes", "label_th": "เคย", "label_en": "Yes"}
        ]',
        'work_history', 200
    ) ON CONFLICT (form_template_id, field_key) DO UPDATE SET updated_at = now();
    
    -- Years of Experience (conditional)
    INSERT INTO form_fields (
        form_template_id, field_key, field_type,
        label_th, label_en, placeholder_th,
        is_required_by_default, is_visible_by_default,
        validation_rules, depends_on,
        section, display_order
    ) VALUES (
        template_id, 'construction_experience_years', 'number',
        'เป็นเวลา (ปี)', 'Years of Experience', '5',
        false, true,
        '{"min": 0, "max": 50}',
        '{"field": "has_construction_experience", "value": "yes"}',
        'work_history', 210
    ) ON CONFLICT (form_template_id, field_key) DO UPDATE SET updated_at = now();
    
    -- Fear of Heights
    INSERT INTO form_fields (
        form_template_id, field_key, field_type,
        label_th, label_en,
        is_required_by_default, is_visible_by_default,
        help_text_th,
        options, section, display_order
    ) VALUES (
        template_id, 'has_acrophobia', 'radio',
        'ท่านเป็นโรคกลัวความสูงหรือมีอาการ เช่น ใจสัน หน้ามืด มือเท้าเย็น อ่อนแรง หรือไม่', 
        'Do you have acrophobia (fear of heights)?',
        true, true,
        'เช่น ใจสัน หน้ามืด มือเท้าเย็น อ่อนแรง',
        '[
            {"value": "no", "label_th": "ไม่เป็น", "label_en": "No"},
            {"value": "yes", "label_th": "เป็น", "label_en": "Yes"}
        ]',
        'health', 300
    ) ON CONFLICT (form_template_id, field_key) DO UPDATE SET updated_at = now();
    
    -- Chronic Disease
    INSERT INTO form_fields (
        form_template_id, field_key, field_type,
        label_th, label_en,
        is_required_by_default, is_visible_by_default,
        options, section, display_order
    ) VALUES (
        template_id, 'has_chronic_disease', 'radio',
        'ท่านมีโรคประจำตัวหรือไม่', 'Do you have any chronic diseases?',
        true, true,
        '[
            {"value": "no", "label_th": "ไม่เป็น", "label_en": "No"},
            {"value": "yes", "label_th": "เป็น", "label_en": "Yes"}
        ]',
        'health', 310
    ) ON CONFLICT (form_template_id, field_key) DO UPDATE SET updated_at = now();
    
    -- Chronic Disease Details (conditional)
    INSERT INTO form_fields (
        form_template_id, field_key, field_type,
        label_th, label_en, placeholder_th,
        is_required_by_default, is_visible_by_default,
        depends_on, section, display_order
    ) VALUES (
        template_id, 'chronic_disease_details', 'textarea',
        'ระบุโรคประจำตัว', 'Specify chronic disease', 'โปรดระบุ...',
        false, true,
        '{"field": "has_chronic_disease", "value": "yes"}',
        'health', 320
    ) ON CONFLICT (form_template_id, field_key) DO UPDATE SET updated_at = now();
    
    -- Color Blindness
    INSERT INTO form_fields (
        form_template_id, field_key, field_type,
        label_th, label_en,
        is_required_by_default, is_visible_by_default,
        options, section, display_order
    ) VALUES (
        template_id, 'has_color_blindness', 'radio',
        'ท่านตาบอดสีหรือไม่', 'Are you color blind?',
        true, true,
        '[
            {"value": "no", "label_th": "ไม่เป็น", "label_en": "No"},
            {"value": "yes", "label_th": "เป็น", "label_en": "Yes"}
        ]',
        'health', 330
    ) ON CONFLICT (form_template_id, field_key) DO UPDATE SET updated_at = now();
    
    -- Epilepsy
    INSERT INTO form_fields (
        form_template_id, field_key, field_type,
        label_th, label_en,
        is_required_by_default, is_visible_by_default,
        options, section, display_order
    ) VALUES (
        template_id, 'has_epilepsy', 'radio',
        'ท่านเป็นโรคลมชักหรือไม่', 'Do you have epilepsy?',
        true, true,
        '[
            {"value": "no", "label_th": "ไม่เป็น", "label_en": "No"},
            {"value": "yes", "label_th": "เป็น", "label_en": "Yes"}
        ]',
        'health', 340
    ) ON CONFLICT (form_template_id, field_key) DO UPDATE SET updated_at = now();
    
    -- Other Health Issues
    INSERT INTO form_fields (
        form_template_id, field_key, field_type,
        label_th, label_en, placeholder_th,
        is_required_by_default, is_visible_by_default,
        section, display_order
    ) VALUES (
        template_id, 'other_health_issues', 'textarea',
        'อื่นๆ (โรคอื่นๆ หรือข้อมูลเพิ่มเติม)', 'Other health issues or additional information', 'ระบุข้อมูลเพิ่มเติม...',
        false, true,
        'health', 350
    ) ON CONFLICT (form_template_id, field_key) DO UPDATE SET updated_at = now();
    
    -- ============================================
    -- SECTION: CONSENT (หนังสือให้ความยินยอม)
    -- ============================================
    
    -- Consent Text (showing date and interpolated name)
    INSERT INTO form_fields (
        form_template_id, field_key, field_type,
        label_th, label_en,
        is_required_by_default, is_visible_by_default,
        help_text_th, help_text_en,
        validation_rules,
        section, display_order
    ) VALUES (
        template_id, 'consent_text', 'info',
        'การให้ความยินยอม', 'Consent Declaration',
        false, true,
        'ข้าพเจ้า {first_name} {last_name} ในฐานะเจ้าของข้อมูลส่วนบุคคลตกลงให้ความยินยอมแก่บริษัท ซิโน-ไทย เอ็นจีเนียริ่ง แอนด์ คอนสตรัคชั่น จำกัด (มหาชน) ในการเก็บรวบรวม เปิดเผย หรือใช้ข้อมูลส่วนบุคคล ข้อมูลส่วนบุคคลอ่อนไหว และข้อมูลส่วนบุคคลอื่นใดที่สามารถระบุว่าเป็นข้าพเจ้าได้ เพื่อเป็นหลักฐานในการยืนยันตัวตน เพื่อใช้ในการดำเนินกิจการ กิจกรรม และธุรกรรมของบริษัท ข้าพเจ้าทราบว่าเจ้าของข้อมูลส่วนบุคคล มีสิทธิที่จะให้ความยินยอมหรือไม่ก็ได้และมีสิทธิตามที่พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562',
        'I, {first_name} {last_name}, as the owner of personal data, agree to give consent to Sino-Thai Engineering and Construction Public Company Limited to collect, disclose or use personal data, sensitive personal data and any other personal data that can identify me as evidence of identity verification, for use in the company''s operations, activities and transactions. I acknowledge that the owner of personal data has the right to give consent or not and has the rights under the Personal Data Protection Act B.E. 2562',
        '{"type": "consent_text", "showDate": true, "interpolate": ["first_name", "last_name"]}',
        'consent', 400
    ) ON CONFLICT (form_template_id, field_key) DO UPDATE SET updated_at = now();
    
    -- ID Card Document
    INSERT INTO form_fields (
        form_template_id, field_key, field_type,
        label_th, label_en,
        is_required_by_default, is_visible_by_default,
        help_text_th, help_text_en,
        validation_rules,
        section, display_order
    ) VALUES (
        template_id, 'document_id_card', 'file',
        'สำเนาบัตรประชาชน (จำเป็น)', 'Copy of ID Card (Required)',
        true, true,
        'อัปโหลดไฟล์ jpg, png หรือ pdf (ขนาดไม่เกิน 5 MB)',
        'Upload jpg, png or pdf file (max 5 MB)',
        '{"accept": ["image/jpeg", "image/png", "application/pdf"], "maxSize": 5242880}',
        'consent', 410
    ) ON CONFLICT (form_template_id, field_key) DO UPDATE SET updated_at = now();
    
    -- Medical Certificate / Health History
    INSERT INTO form_fields (
        form_template_id, field_key, field_type,
        label_th, label_en,
        is_required_by_default, is_visible_by_default,
        help_text_th, help_text_en,
        validation_rules,
        section, display_order
    ) VALUES (
        template_id, 'document_medical_certificate', 'file',
        'ใบรับรองแพทย์ / ประวัติทางด้านสุขภาพ (จำเป็น)', 'Medical Certificate / Health History (Required)',
        true, true,
        'อัปโหลดไฟล์ jpg, png หรือ pdf (ขนาดไม่เกิน 5 MB)',
        'Upload jpg, png or pdf file (max 5 MB)',
        '{"accept": ["image/jpeg", "image/png", "application/pdf"], "maxSize": 5242880}',
        'consent', 420
    ) ON CONFLICT (form_template_id, field_key) DO UPDATE SET updated_at = now();
    
    -- Other Documents (Optional)
    INSERT INTO form_fields (
        form_template_id, field_key, field_type,
        label_th, label_en,
        is_required_by_default, is_visible_by_default,
        help_text_th, help_text_en,
        validation_rules,
        section, display_order
    ) VALUES (
        template_id, 'document_other', 'file',
        'เอกสารแนบอื่นๆ', 'Other Documents',
        false, true,
        'อัปโหลดเอกสารอื่นๆ (ถ้ามี) เช่น สำเนาทะเบียนบ้าน ใบอนุญาตขับขี่ สำเนาโฉนดที่ดิน ฯลฯ (ขนาดไม่เกิน 5 MB)',
        'Upload other documents (if any) such as house registration, driving license, land title deed, etc. (max 5 MB)',
        '{"accept": ["image/jpeg", "image/png", "application/pdf"], "maxSize": 5242880, "multiple": true}',
        'consent', 430
    ) ON CONFLICT (form_template_id, field_key) DO UPDATE SET updated_at = now();
    
    -- Consent Giver Signature (renamed from applicant)
    INSERT INTO form_fields (
        form_template_id, field_key, field_type,
        label_th, label_en,
        is_required_by_default, is_visible_by_default,
        help_text_th, help_text_en,
        section, display_order
    ) VALUES (
        template_id, 'applicant_signature', 'signature',
        'ลายเซ็นผู้ให้ความยินยอม', 'Consent Giver Signature',
        true, true,
        'กรุณาวาดลายเซ็นในกล่องเพื่อยืนยันความยินยอม',
        'Please sign in the box to confirm consent',
        'consent', 500
    ) ON CONFLICT (form_template_id, field_key) DO UPDATE SET updated_at = now();
    
    RAISE NOTICE '✅ Member Application Form Template Created!';
    RAISE NOTICE '📝 Total Fields: 28';
    RAISE NOTICE '   - Personal Info: 10 fields (includes profile photo at end)';
    RAISE NOTICE '   - Address: 6 fields';
    RAISE NOTICE '   - Work History: 2 fields';
    RAISE NOTICE '   - Health: 6 fields';
    RAISE NOTICE '   - Consent: 5 fields (consent text + 3 docs + signature)';
    RAISE NOTICE '';
    RAISE NOTICE '📄 Consent Section (หนังสือให้ความยินยอม):';
    RAISE NOTICE '   1. Consent text with name interpolation';
    RAISE NOTICE '   2. ID Card (required)';
    RAISE NOTICE '   3. Medical Certificate (required)';
    RAISE NOTICE '   4. Other documents (optional)';
    RAISE NOTICE '   5. Signature (ผู้ให้ความยินยอม)';
END $$;
