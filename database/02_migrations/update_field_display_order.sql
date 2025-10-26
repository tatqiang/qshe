-- Update display_order for member application form fields
-- This determines the order fields appear in the form

UPDATE form_fields SET display_order = 10 WHERE field_key = 'first_name';
UPDATE form_fields SET display_order = 20 WHERE field_key = 'last_name';
UPDATE form_fields SET display_order = 30 WHERE field_key = 'phone';
UPDATE form_fields SET display_order = 40 WHERE field_key = 'email';

-- Address fields
UPDATE form_fields SET display_order = 100 WHERE field_key = 'address_house_number';
UPDATE form_fields SET display_order = 110 WHERE field_key = 'address_moo';
UPDATE form_fields SET display_order = 120 WHERE field_key = 'address_soi';
UPDATE form_fields SET display_order = 130 WHERE field_key = 'address_tambon';
UPDATE form_fields SET display_order = 140 WHERE field_key = 'address_amphoe';
UPDATE form_fields SET display_order = 150 WHERE field_key = 'address_province';

-- Birth info
UPDATE form_fields SET display_order = 200 WHERE field_key = 'birth_date';
UPDATE form_fields SET display_order = 210 WHERE field_key = 'age';
UPDATE form_fields SET display_order = 220 WHERE field_key = 'education_level';
UPDATE form_fields SET display_order = 230 WHERE field_key = 'nationality';
UPDATE form_fields SET display_order = 240 WHERE field_key = 'religion';

-- ID
UPDATE form_fields SET display_order = 300 WHERE field_key = 'id_card_number';
UPDATE form_fields SET display_order = 310 WHERE field_key = 'passport_number';

-- Position
UPDATE form_fields SET display_order = 400 WHERE field_key = 'position_applied';

-- Work history and health
UPDATE form_fields SET display_order = 500 WHERE field_key = 'has_construction_experience';
UPDATE form_fields SET display_order = 510 WHERE field_key = 'construction_experience_years';
UPDATE form_fields SET display_order = 520 WHERE field_key = 'has_acrophobia';
UPDATE form_fields SET display_order = 530 WHERE field_key = 'has_chronic_disease';
UPDATE form_fields SET display_order = 540 WHERE field_key = 'chronic_disease_detail';
UPDATE form_fields SET display_order = 550 WHERE field_key = 'has_color_blindness';
UPDATE form_fields SET display_order = 555 WHERE field_key = 'is_color_blind';
UPDATE form_fields SET display_order = 560 WHERE field_key = 'has_epilepsy';
UPDATE form_fields SET display_order = 570 WHERE field_key = 'other_health_conditions';

-- Documents
UPDATE form_fields SET display_order = 800 WHERE field_key = 'document_id_card';
UPDATE form_fields SET display_order = 810 WHERE field_key = 'document_medical_certificate';

-- Signatures
UPDATE form_fields SET display_order = 900 WHERE field_key = 'applicant_signature';
UPDATE form_fields SET display_order = 910 WHERE field_key = 'signature_applicant';
UPDATE form_fields SET display_order = 920 WHERE field_key = 'supervisor_signature';
UPDATE form_fields SET display_order = 930 WHERE field_key = 'signature_supervisor';
UPDATE form_fields SET display_order = 940 WHERE field_key = 'supervisor_name';

-- Verify the changes
SELECT field_key, label_th, display_order, section
FROM form_fields
WHERE form_template_id = (SELECT id FROM form_templates WHERE code = 'MEMBER_APPLICATION')
ORDER BY display_order;
