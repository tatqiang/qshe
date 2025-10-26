-- ============================================
-- Quick Fix: Update consent_text field with correct placeholders
-- Run this in Supabase SQL Editor
-- ============================================

UPDATE form_fields
SET options = jsonb_build_object(
    'content_th', 'ข้าพเจ้า {{first_name}} {{last_name}} ในฐานะเจ้าของข้อมูลส่วนบุคคลตกลงให้ความยินยอมแก่บริษัท ซิโน-ไทย เอ็นจีเนียริ่ง แอนด์ คอนสตรัคชั่น จำกัด (มหาชน) ในการเก็บรวบรวม เปิดเผย หรือใช้ข้อมูลส่วนบุคคล ข้อมูลส่วนบุคคลอ่อนไหว และข้อมูลส่วนบุคคลอื่นใดที่สามารถระบุว่าเป็นข้าพเจ้าได้ เพื่อเป็นหลักฐานในการยืนยันตัวตน เพื่อใช้ในการดำเนินกิจการ กิจกรรม และธุรกรรมของบริษัท ข้าพเจ้าทราบว่าเจ้าของข้อมูลส่วนบุคคล มีสิทธิที่จะให้ความยินยอมหรือไม่ก็ได้และมีสิทธิตามที่พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562',
    'content_en', 'I, {{first_name}} {{last_name}}, as the owner of personal data, consent to Sino-Thai Engineering and Construction Public Company Limited to collect, disclose, or use personal data, sensitive personal data, and any other personal data that can identify me as evidence of identity verification for use in the company''s operations, activities, and transactions. I acknowledge that the owner of personal data has the right to give or not give consent and has rights under the Personal Data Protection Act B.E. 2562 (2019).',
    'date_label_th', 'วันที่',
    'date_label_en', 'Date',
    'show_date', true
)
WHERE field_key = 'consent_text'
AND form_template_id = (SELECT id FROM form_templates WHERE code = 'MEMBER_APPLICATION');

-- Verify the update
SELECT 
    field_key,
    label_th,
    field_type,
    options->'content_th' as content_th
FROM form_fields
WHERE field_key = 'consent_text'
AND form_template_id = (SELECT id FROM form_templates WHERE code = 'MEMBER_APPLICATION');

-- Success message
SELECT '✅ Consent text field updated with correct placeholders: {{first_name}} {{last_name}}' as status;
