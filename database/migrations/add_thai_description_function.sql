-- ============================================
-- Add Thai Material Description Function
-- ============================================
-- This function generates material descriptions in Thai
-- from title_th_1 through title_th_5 and dimension sizes

CREATE OR REPLACE FUNCTION generate_material_description_th(
    p_template_id INT,
    p_dimension_id INT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_description TEXT := '';
    v_template RECORD;
    v_dimension RECORD;
BEGIN
    -- Get template Thai titles
    SELECT title_1_th, title_2_th, title_3_th, title_4_th, title_5_th
    INTO v_template
    FROM material_templates
    WHERE id = p_template_id;
    
    -- Concatenate non-null Thai titles with space separator
    v_description := TRIM(CONCAT_WS(' ', 
        NULLIF(v_template.title_1_th, ''),
        NULLIF(v_template.title_2_th, ''),
        NULLIF(v_template.title_3_th, ''),
        NULLIF(v_template.title_4_th, ''),
        NULLIF(v_template.title_5_th, '')
    ));
    
    -- Add dimension if provided
    IF p_dimension_id IS NOT NULL THEN
        SELECT size_1, size_2, size_3
        INTO v_dimension
        FROM dimensions
        WHERE id = p_dimension_id;
        
        IF v_dimension.size_1 IS NOT NULL THEN
            -- Add dimension sizes with space separator
            IF v_description != '' THEN
                v_description := v_description || ' ';
            END IF;
            v_description := v_description || 
                TRIM(CONCAT_WS(' / ', 
                    v_dimension.size_1,
                    NULLIF(v_dimension.size_2, ''),
                    NULLIF(v_dimension.size_3, '')
                ));
        END IF;
    END IF;
    
    RETURN v_description;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Update existing English function to use spaces
-- ============================================
-- Modify the existing function to use space separator instead of pipes

CREATE OR REPLACE FUNCTION generate_material_description(
    p_template_id INT,
    p_dimension_id INT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_description TEXT := '';
    v_template RECORD;
    v_dimension RECORD;
BEGIN
    -- Get template
    SELECT title_1, title_2, title_3, title_4, title_5
    INTO v_template
    FROM material_templates
    WHERE id = p_template_id;
    
    -- Concatenate non-null titles with space separator
    v_description := TRIM(CONCAT_WS(' ', 
        NULLIF(v_template.title_1, ''),
        NULLIF(v_template.title_2, ''),
        NULLIF(v_template.title_3, ''),
        NULLIF(v_template.title_4, ''),
        NULLIF(v_template.title_5, '')
    ));
    
    -- Add dimension if provided
    IF p_dimension_id IS NOT NULL THEN
        SELECT size_1, size_2, size_3
        INTO v_dimension
        FROM dimensions
        WHERE id = p_dimension_id;
        
        IF v_dimension.size_1 IS NOT NULL THEN
            -- Add dimension sizes with space separator
            IF v_description != '' THEN
                v_description := v_description || ' ';
            END IF;
            v_description := v_description || 
                TRIM(CONCAT_WS(' / ', 
                    v_dimension.size_1,
                    NULLIF(v_dimension.size_2, ''),
                    NULLIF(v_dimension.size_3, '')
                ));
        END IF;
    END IF;
    
    RETURN v_description;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Test the functions
-- ============================================
-- Uncomment to test:
-- SELECT generate_material_description(1, NULL) AS english_desc;
-- SELECT generate_material_description_th(1, NULL) AS thai_desc;
