-- ============================================
-- FIX MEMBER APPLICATION FORM - BOOLEAN FIELDS
-- ============================================
-- Change radio options from "yes"/"no" strings to true/false booleans
-- This makes checkbox logic simpler and more consistent

DO $$
DECLARE
    template_id UUID;
BEGIN
    -- Get Member Application template ID
    SELECT id INTO template_id 
    FROM form_templates 
    WHERE code = 'MEMBER_APPLICATION';
    
    IF template_id IS NULL THEN
        RAISE EXCEPTION 'Member Application template not found';
    END IF;
    
    -- ============================================
    -- 1. CONSTRUCTION EXPERIENCE
    -- ============================================
    UPDATE form_fields
    SET options = '[
        {"value": false, "label_th": "ไม่เคย", "label_en": "No"},
        {"value": true, "label_th": "เคย", "label_en": "Yes"}
    ]'::jsonb
    WHERE form_template_id = template_id
    AND field_key = 'has_construction_experience';
    
    -- Update depends_on for years field
    UPDATE form_fields
    SET depends_on = '{"field": "has_construction_experience", "value": true}'::jsonb
    WHERE form_template_id = template_id
    AND field_key = 'construction_experience_years';
    
    -- ============================================
    -- 2. ACROPHOBIA (FEAR OF HEIGHTS)
    -- ============================================
    UPDATE form_fields
    SET options = '[
        {"value": false, "label_th": "ไม่เป็น", "label_en": "No"},
        {"value": true, "label_th": "เป็น", "label_en": "Yes"}
    ]'::jsonb
    WHERE form_template_id = template_id
    AND field_key = 'has_acrophobia';
    
    -- ============================================
    -- 3. CHRONIC DISEASE
    -- ============================================
    UPDATE form_fields
    SET options = '[
        {"value": false, "label_th": "ไม่เป็น", "label_en": "No"},
        {"value": true, "label_th": "เป็น", "label_en": "Yes"}
    ]'::jsonb
    WHERE form_template_id = template_id
    AND field_key = 'has_chronic_disease';
    
    -- Update depends_on for details field
    UPDATE form_fields
    SET depends_on = '{"field": "has_chronic_disease", "value": true}'::jsonb
    WHERE form_template_id = template_id
    AND field_key IN ('chronic_disease_details', 'chronic_disease_detail');
    
    -- ============================================
    -- 4. COLOR BLINDNESS
    -- ============================================
    UPDATE form_fields
    SET options = '[
        {"value": false, "label_th": "ไม่เป็น", "label_en": "No"},
        {"value": true, "label_th": "เป็น", "label_en": "Yes"}
    ]'::jsonb
    WHERE form_template_id = template_id
    AND field_key IN ('has_color_blindness', 'is_color_blind');
    
    -- ============================================
    -- 5. EPILEPSY
    -- ============================================
    UPDATE form_fields
    SET options = '[
        {"value": false, "label_th": "ไม่เป็น", "label_en": "No"},
        {"value": true, "label_th": "เป็น", "label_en": "Yes"}
    ]'::jsonb
    WHERE form_template_id = template_id
    AND field_key = 'has_epilepsy';
    
    RAISE NOTICE 'Successfully updated all boolean fields to use true/false values';
    
END $$;

-- ============================================
-- VERIFY CHANGES
-- ============================================
SELECT 
    field_key,
    field_type,
    options
FROM form_fields ff
JOIN form_templates ft ON ff.form_template_id = ft.id
WHERE ft.code = 'MEMBER_APPLICATION'
AND field_key IN (
    'has_construction_experience',
    'has_acrophobia', 
    'has_chronic_disease',
    'has_color_blindness',
    'is_color_blind',
    'has_epilepsy'
)
ORDER BY display_order;
