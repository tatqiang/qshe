-- ============================================================================
-- SAFETY AUDIT MODULE - DATABASE SCHEMA
-- ============================================================================
-- Professional database design for multi-revision audit system
-- Supports multiple audit categories with versioned requirements
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. AUDIT CATEGORIES TABLE
-- ============================================================================
-- Defines audit categories (A, B, C, D, E, F, G) with descriptions

CREATE TABLE IF NOT EXISTS public.safety_audit_categories (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'sfs21sw', 'e2r532d', 'ddsd12a'
    category_code VARCHAR(10) NOT NULL UNIQUE, -- e.g., 'A', 'B', 'C'
    category_name_en VARCHAR(200) NOT NULL,
    category_name_th VARCHAR(200) NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

-- Insert default audit categories
INSERT INTO public.safety_audit_categories (id, category_code, category_name_en, category_name_th, display_order) VALUES
    ('sfs21sw', 'A', 'Worker Readiness', 'ความพร้อมของผู้ปฏิบัติงาน', 1),
    ('e2r532d', 'B', 'Tools & Equipment', 'Tools & Equipment', 2),
    ('ddsd12a', 'C', 'Hot Work', 'Hot Work', 3),
    ('12we3dw', 'D', 'High Work', 'High Work', 4),
    ('1eq1dsd', 'E', 'LOTO', 'LOTO', 5),
    ('q1d22df', 'F', 'Confined Space', 'Confined Space', 6),
    ('dasdfds', 'G', 'Crane Lifting', 'Crane Lifting', 7)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. AUDIT REQUIREMENTS TABLE (MASTER DATA)
-- ============================================================================
-- Stores all audit requirements with revision control
-- Each category can have multiple revisions

CREATE TABLE IF NOT EXISTS public.safety_audit_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id VARCHAR(50) NOT NULL REFERENCES public.safety_audit_categories(id) ON DELETE CASCADE,
    revision INTEGER NOT NULL DEFAULT 0, -- Revision number (0, 1, 2, ...)
    item_number INTEGER NOT NULL, -- Item sequence within category (1, 2, 3, ...)
    
    -- Requirement details (Thai language)
    item_name VARCHAR(500) NOT NULL, -- e.g., 'บัตรอนุญาตทำงาน'
    description TEXT NOT NULL, -- e.g., 'ติดบัตรอนุญาตถูกต้อง'
    criteria TEXT, -- Detailed criteria for auditing
    weight INTEGER NOT NULL DEFAULT 1, -- Weight for scoring (1-5)
    
    -- Metadata
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    superseded_date DATE, -- When this revision was replaced
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    
    -- Unique constraint: One item number per category/revision
    CONSTRAINT unique_category_rev_item UNIQUE (category_id, revision, item_number)
);

-- Create index for fast querying by category and latest revision
CREATE INDEX idx_audit_req_category_rev ON public.safety_audit_requirements(category_id, revision DESC, is_active);
CREATE INDEX idx_audit_req_effective_date ON public.safety_audit_requirements(effective_date DESC);

-- Insert sample requirements (from your data)
INSERT INTO public.safety_audit_requirements (category_id, revision, item_number, item_name, description, weight) VALUES
    -- Category A (sfs21sw) - Worker Readiness - Rev 0
    ('sfs21sw', 0, 1, 'บัตรอนุญาตทำงาน', 'ติดบัตรอนุญาตถูกต้อง', 1),
    ('sfs21sw', 0, 2, 'หมวกนิรภัย พร้อมสายรัดคาง', 'สวมหมวกนิรภัย พร้อมรายรัดคางได้ถูกต้อง', 2),
    ('sfs21sw', 0, 3, 'รองเท้านิรภัย', 'สวมรองเท้านิรภัยที่ได้มาตรฐาน', 2),
    ('sfs21sw', 0, 4, 'ความเหมาะสมของ PPE อื่นๆ', 'ตรวจสอบ PPE Matrix ตามลักษณะงาน', 3),
    
    -- Category B (e2r532d) - Tools & Equipment - Rev 0
    ('e2r532d', 0, 1, 'สติ๊กเกอร์อนุญาต การใช้เครื่องมือ อุปกรณ์', 'ตรวจอนุญาตได้ถูกต้องตามระยะเวลา', 1),
    ('e2r532d', 0, 2, 'เซฟตี้การ์ด เช่น ครอบใบตัด', 'มีเซฟตี้ครอบส่วนที่เคลื่อนไหว อันตรายของเครื่องมือ', 2),
    ('e2r532d', 0, 3, 'สภาพเพาเวอร์ปลั๊ก และสายไฟฟ้า', 'อยู่ในสภาพที่ปลอดภัย', 2),
    ('e2r532d', 0, 4, 'สวิตช์เปิด-ปิด', 'สามารถใช้งานได้เป็นปกติ', 2),
    ('e2r532d', 0, 5, 'การตรวจสอบทางกายภาพ', 'อยู่ในสภาพที่ปลอดภัย', 2),
    
    -- Category B (e2r532d) - Rev 1 (Updated requirements)
    ('e2r532d', 1, 1, 'สติ๊กเกอร์อนุญาต การใช้เครื่องมือ อุปกรณ์', 'ตรวจอนุญาตได้ถูกต้องตามระยะเวลา', 1),
    ('e2r532d', 1, 2, 'เซฟตี้การ์ด เช่น ครอบใบตัด', 'มีเซฟตี้ครอบส่วนที่เคลื่อนไหว อันตรายของเครื่องมือ', 2),
    ('e2r532d', 1, 3, 'สภาพเพาเวอร์ปลั๊ก และสายไฟฟ้า', 'อยู่ในสภาพที่ปลอดภัย', 2),
    ('e2r532d', 1, 4, 'สวิตช์เปิด-ปิด', 'สามารถใช้งานได้เป็นปกติ', 2),
    ('e2r532d', 1, 5, 'การตรวจสอบทางกายภาพ', 'อยู่ในสภาพที่ปลอดภัย', 2),
    ('e2r532d', 1, 6, 'กล่องต่อสายไฟฟ้าชั่วคราว', 'ต้องใช้กล่องต่อสายแบบมี เบรกเกอร์ เท่านั้น', 3),
    
    -- Category C (ddsd12a) - Hot Work - Rev 0
    ('ddsd12a', 0, 1, 'Hot Work Permit', 'ตรวจอนุญาตได้ถูกต้องตามลักษณะสภาพงานจริง', 3),
    ('ddsd12a', 0, 2, 'กั้นเขตพื้น และติดป้ายเตือนอันตราย', 'จัดเก็บวัสดุติดไฟ/ไวไฟให้ห่างจากพื้นที่ทำงานในอย่างน้อย 10 เมตร', 3),
    ('ddsd12a', 0, 3, 'การป้องกันสะเก็ดไฟ', 'ใช้ผ้าใบกันไฟ ถาด เซฟตี้การ์ด ตามความเหมาะสม', 3),
    ('ddsd12a', 0, 4, 'Tag ตรวจเครื่องตัดแก๊ส', 'ตรวจอนุญาตได้ถูกต้องตามลักษณะสภาพงานจริง', 3),
    ('ddsd12a', 0, 5, 'วาล์วกันย้อน และ Flash back', '4 จุด', 3),
    ('ddsd12a', 0, 6, 'ถังดับเพลิง', 'อย่างน้อย ประเภท 20B - 1 ถัง', 3),
    ('ddsd12a', 0, 7, 'ผู้เฝ้าระวังเหตุเพลิงไหม้', 'สามารถระบุผู้เฝ้าระวังที่ควบคุมเหตุการณ์ได้', 3)
ON CONFLICT (category_id, revision, item_number) DO NOTHING;

-- ============================================================================
-- 3. SAFETY AUDITS TABLE (TRANSACTION DATA)
-- ============================================================================
-- Stores each audit session with general information

CREATE TABLE IF NOT EXISTS public.safety_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_number VARCHAR(50) UNIQUE NOT NULL, -- Auto-generated (e.g., 'AUD-2025-0001')
    
    -- General Information (matching your safety_audit table.md)
    project_id UUID REFERENCES public.projects(id),
    main_area_id UUID REFERENCES public.main_areas(id),
    sub_area1_id UUID REFERENCES public.sub_areas_1(id),
    sub_area2_id UUID REFERENCES public.sub_areas_2(id),
    specific_location TEXT,
    company_id UUID REFERENCES public.companies(id),
    
    -- Audit Details
    audit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    audit_time TIME NOT NULL DEFAULT CURRENT_TIME,
    category_id VARCHAR(50) NOT NULL REFERENCES public.safety_audit_categories(id),
    
    -- Revision tracking - stores which revision was used for each category
    -- Format: { "category_id": "e2r532d", "revision": 1 }
    audit_criteria_revision JSONB NOT NULL,
    
    -- Status and Scoring
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    total_score DECIMAL(5,2), -- Calculated total score
    max_possible_score DECIMAL(5,2), -- Maximum possible score (sum of all weights × 3)
    average_score DECIMAL(5,2), -- Percentage score (total_score / max_possible_score × 100)
    
    -- Auditor Information
    auditor_id UUID NOT NULL REFERENCES public.users(id),
    auditor_name VARCHAR(200) NOT NULL, -- Denormalized for reporting
    reviewed_by UUID REFERENCES public.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- General Notes
    audit_note TEXT,
    recommendations TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    
    -- Constraints
    CONSTRAINT chk_audit_status CHECK (status IN ('draft', 'in_progress', 'completed', 'reviewed', 'closed')),
    CONSTRAINT chk_scores CHECK (
        total_score >= 0 AND 
        max_possible_score >= 0 AND 
        average_score >= 0 AND average_score <= 100
    )
);

-- Indexes for performance
CREATE INDEX idx_safety_audits_date ON public.safety_audits(audit_date DESC);
CREATE INDEX idx_safety_audits_project ON public.safety_audits(project_id);
CREATE INDEX idx_safety_audits_category ON public.safety_audits(category_id);
CREATE INDEX idx_safety_audits_status ON public.safety_audits(status);
CREATE INDEX idx_safety_audits_auditor ON public.safety_audits(auditor_id);

-- ============================================================================
-- 4. AUDIT RESULTS TABLE (DETAILED SCORING)
-- ============================================================================
-- Stores individual requirement scores and comments
-- This is the RECOMMENDED APPROACH (normalized data)

CREATE TABLE IF NOT EXISTS public.safety_audit_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES public.safety_audits(id) ON DELETE CASCADE,
    requirement_id UUID NOT NULL REFERENCES public.safety_audit_requirements(id),
    
    -- Scoring
    score INTEGER NOT NULL, -- 0, 1, 2, 3, or -1 for N/A
    is_na BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE if N/A selected
    weight INTEGER NOT NULL, -- Copied from requirement for historical accuracy
    weighted_score DECIMAL(5,2), -- score × weight (NULL if N/A)
    
    -- Comments
    comment TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_score_values CHECK (
        (is_na = TRUE AND score = -1) OR 
        (is_na = FALSE AND score IN (0, 1, 2, 3))
    ),
    CONSTRAINT unique_audit_requirement UNIQUE (audit_id, requirement_id)
);

-- Index for fast querying
CREATE INDEX idx_audit_results_audit ON public.safety_audit_results(audit_id);
CREATE INDEX idx_audit_results_requirement ON public.safety_audit_results(requirement_id);

-- ============================================================================
-- 5. AUDIT PHOTOS TABLE
-- ============================================================================
-- Stores photos for each audit category

CREATE TABLE IF NOT EXISTS public.safety_audit_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES public.safety_audits(id) ON DELETE CASCADE,
    
    -- Photo Information
    photo_url TEXT NOT NULL, -- Cloudflare R2 or Azure Blob Storage URL
    photo_key VARCHAR(500) NOT NULL, -- Storage key for deletion
    photo_caption TEXT,
    photo_type VARCHAR(50) DEFAULT 'evidence', -- 'evidence', 'violation', 'corrective_action'
    
    -- Optional: Link to specific requirement
    requirement_id UUID REFERENCES public.safety_audit_requirements(id),
    
    -- Metadata
    file_size INTEGER, -- in bytes
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID REFERENCES public.users(id)
);

-- Indexes
CREATE INDEX idx_audit_photos_audit ON public.safety_audit_photos(audit_id);
CREATE INDEX idx_audit_photos_requirement ON public.safety_audit_photos(requirement_id);

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function to get latest revision for a category
CREATE OR REPLACE FUNCTION get_latest_revision(p_category_id VARCHAR(50))
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_latest_rev INTEGER;
BEGIN
    SELECT COALESCE(MAX(revision), 0)
    INTO v_latest_rev
    FROM public.safety_audit_requirements
    WHERE category_id = p_category_id
      AND is_active = TRUE;
    
    RETURN v_latest_rev;
END;
$$;

-- Function to auto-generate audit number
CREATE OR REPLACE FUNCTION generate_audit_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_year TEXT;
    v_count INTEGER;
    v_audit_number TEXT;
BEGIN
    v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    SELECT COUNT(*) + 1
    INTO v_count
    FROM public.safety_audits
    WHERE audit_number LIKE 'AUD-' || v_year || '%';
    
    v_audit_number := 'AUD-' || v_year || '-' || LPAD(v_count::TEXT, 4, '0');
    
    RETURN v_audit_number;
END;
$$;

-- Function to calculate audit scores
CREATE OR REPLACE FUNCTION calculate_audit_scores(p_audit_id UUID)
RETURNS TABLE (
    total_score DECIMAL(5,2),
    max_possible_score DECIMAL(5,2),
    average_score DECIMAL(5,2)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total DECIMAL(5,2);
    v_max DECIMAL(5,2);
    v_avg DECIMAL(5,2);
BEGIN
    -- Calculate total score (excluding N/A items)
    SELECT COALESCE(SUM(score * weight), 0)
    INTO v_total
    FROM public.safety_audit_results
    WHERE audit_id = p_audit_id
      AND is_na = FALSE;
    
    -- Calculate max possible score (excluding N/A items)
    SELECT COALESCE(SUM(3 * weight), 0)
    INTO v_max
    FROM public.safety_audit_results
    WHERE audit_id = p_audit_id
      AND is_na = FALSE;
    
    -- Calculate average percentage
    IF v_max > 0 THEN
        v_avg := (v_total / v_max) * 100;
    ELSE
        v_avg := 0;
    END IF;
    
    RETURN QUERY SELECT v_total, v_max, v_avg;
END;
$$;

-- ============================================================================
-- 7. TRIGGERS
-- ============================================================================

-- Trigger to auto-generate audit number
CREATE OR REPLACE FUNCTION trigger_generate_audit_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.audit_number IS NULL OR NEW.audit_number = '' THEN
        NEW.audit_number := generate_audit_number();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER before_insert_safety_audits
    BEFORE INSERT ON public.safety_audits
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generate_audit_number();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER before_update_safety_audits
    BEFORE UPDATE ON public.safety_audits
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_timestamp();

CREATE TRIGGER before_update_safety_audit_results
    BEFORE UPDATE ON public.safety_audit_results
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_timestamp();

-- Trigger to auto-calculate weighted score
CREATE OR REPLACE FUNCTION trigger_calculate_weighted_score()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.is_na = TRUE THEN
        NEW.weighted_score := NULL;
    ELSE
        NEW.weighted_score := NEW.score * NEW.weight;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER before_insert_update_audit_results
    BEFORE INSERT OR UPDATE ON public.safety_audit_results
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_weighted_score();

-- Trigger to update audit total scores when results change
CREATE OR REPLACE FUNCTION trigger_update_audit_scores()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_scores RECORD;
BEGIN
    -- Get audit_id (works for INSERT, UPDATE, DELETE)
    DECLARE
        v_audit_id UUID;
    BEGIN
        IF TG_OP = 'DELETE' THEN
            v_audit_id := OLD.audit_id;
        ELSE
            v_audit_id := NEW.audit_id;
        END IF;
        
        -- Calculate new scores
        SELECT * INTO v_scores
        FROM calculate_audit_scores(v_audit_id);
        
        -- Update the audit record
        UPDATE public.safety_audits
        SET total_score = v_scores.total_score,
            max_possible_score = v_scores.max_possible_score,
            average_score = v_scores.average_score,
            updated_at = NOW()
        WHERE id = v_audit_id;
    END;
    
    RETURN NULL;
END;
$$;

CREATE TRIGGER after_insert_update_delete_audit_results
    AFTER INSERT OR UPDATE OR DELETE ON public.safety_audit_results
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_audit_scores();

-- ============================================================================
-- 8. VIEWS FOR REPORTING
-- ============================================================================

-- View: Audit Summary with Category Information
CREATE OR REPLACE VIEW v_audit_summary AS
SELECT 
    a.id,
    a.audit_number,
    a.audit_date,
    a.status,
    a.average_score,
    c.category_code,
    c.category_name_en,
    c.category_name_th,
    p.project_name,
    u.full_name AS auditor_name,
    a.audit_criteria_revision->>'revision' AS revision_used
FROM public.safety_audits a
LEFT JOIN public.safety_audit_categories c ON a.category_id = c.id
LEFT JOIN public.projects p ON a.project_id = p.id
LEFT JOIN public.users u ON a.auditor_id = u.id
ORDER BY a.audit_date DESC, a.audit_number DESC;

-- View: Detailed Audit Results with Requirement Info
CREATE OR REPLACE VIEW v_audit_detailed_results AS
SELECT 
    ar.id AS result_id,
    a.id AS audit_id,
    a.audit_number,
    a.audit_date,
    req.category_id,
    req.revision,
    req.item_number,
    req.item_name,
    req.description,
    req.weight,
    ar.score,
    ar.is_na,
    ar.weighted_score,
    ar.comment,
    CASE 
        WHEN ar.is_na THEN 'N/A'
        WHEN ar.score = 3 THEN 'Compliant (ปฏิบัติครบถ้วน)'
        WHEN ar.score = 2 THEN 'Partial (ปฏิบัติได้บางส่วน / หลักฐานไม่ครบ)'
        WHEN ar.score = 1 THEN 'Partial (ปฏิบัติได้เป็นส่วนน้อย / พบหลักฐานบางส่วน)'
        WHEN ar.score = 0 THEN 'Non-Compliant (ไม่ปฏิบัติ / ไม่มีหลักฐาน)'
    END AS score_label
FROM public.safety_audit_results ar
JOIN public.safety_audits a ON ar.audit_id = a.id
JOIN public.safety_audit_requirements req ON ar.requirement_id = req.id
ORDER BY a.audit_date DESC, req.item_number ASC;

-- ============================================================================
-- 9. SAMPLE QUERIES
-- ============================================================================

-- Get latest requirements for a category
COMMENT ON FUNCTION get_latest_revision(VARCHAR) IS 'Get the latest active revision number for a category';

-- Example: Get all requirements for category B (latest revision)
/*
SELECT req.*
FROM public.safety_audit_requirements req
WHERE req.category_id = 'e2r532d'
  AND req.revision = get_latest_revision('e2r532d')
  AND req.is_active = TRUE
ORDER BY req.item_number;
*/

-- Example: Create a new audit
/*
INSERT INTO public.safety_audits (
    category_id,
    audit_criteria_revision,
    project_id,
    audit_date,
    auditor_id,
    auditor_name,
    specific_location
) VALUES (
    'e2r532d',
    '{"category_id": "e2r532d", "revision": 1}'::jsonb,
    'project-uuid-here',
    CURRENT_DATE,
    'auditor-uuid-here',
    'John Doe',
    'Building A, Floor 3'
);
*/

-- Example: Insert audit results
/*
INSERT INTO public.safety_audit_results (audit_id, requirement_id, score, is_na, weight, comment)
SELECT 
    'audit-uuid-here',
    req.id,
    3, -- Compliant
    FALSE,
    req.weight,
    'All requirements met'
FROM public.safety_audit_requirements req
WHERE req.category_id = 'e2r532d'
  AND req.revision = 1;
*/

-- ============================================================================
-- 10. GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT ALL ON public.safety_audit_categories TO authenticated;
GRANT ALL ON public.safety_audit_requirements TO authenticated;
GRANT ALL ON public.safety_audits TO authenticated;
GRANT ALL ON public.safety_audit_results TO authenticated;
GRANT ALL ON public.safety_audit_photos TO authenticated;

-- Enable RLS (Row Level Security) - Configure based on your needs
ALTER TABLE public.safety_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_audit_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_audit_photos ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (adjust based on your requirements)
CREATE POLICY "Users can view audits from their projects" ON public.safety_audits
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM public.project_members 
            WHERE user_id = auth.uid()
        )
    );

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================

COMMENT ON TABLE public.safety_audit_categories IS 'Master table for audit categories (A-G)';
COMMENT ON TABLE public.safety_audit_requirements IS 'Master table for audit requirements with revision control';
COMMENT ON TABLE public.safety_audits IS 'Transaction table for audit sessions';
COMMENT ON TABLE public.safety_audit_results IS 'Detailed scoring for each requirement in an audit';
COMMENT ON TABLE public.safety_audit_photos IS 'Photos associated with audits';
