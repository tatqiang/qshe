-- ============================================
-- SAFETY AUDIT MODULE - COMPLETE SQL SCHEMA
-- ============================================
-- Version: 2.0
-- Date: October 16, 2025
-- Changes:
--   - Removed company_id from safety_audits (now many-to-many)
--   - Added safety_audit_companies intermediate table
--   - Added number_of_personnel to safety_audits
-- ============================================

-- ============================================
-- 1. SAFETY AUDIT CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.safety_audit_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_code VARCHAR(10) UNIQUE NOT NULL,        -- 'A', 'B', 'C', etc.
  category_id VARCHAR(20) UNIQUE NOT NULL,          -- 'sfs21sw', 'e2r532d', etc.
  name_th TEXT NOT NULL,                            -- 'ความพร้อมของผู้ปฏิบัติงาน'
  name_en TEXT,                                     -- 'Worker Readiness'
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) TABLESPACE pg_default;

-- Sample data for categories
INSERT INTO public.safety_audit_categories (category_code, category_id, name_th, name_en, display_order) VALUES
('A', 'sfs21sw', 'ความพร้อมของผู้ปฏิบัติงาน', 'Worker Readiness', 1),
('B', 'e2r532d', 'Tools & Equipment', 'Tools & Equipment', 2),
('C', 'ddsd12a', 'Hot Work', 'Hot Work', 3),
('D', '12we3dw', 'High Work', 'High Work', 4),
('E', '1eq1dsd', 'LOTO', 'LOTO', 5),
('F', 'q1d22df', 'Confined Space', 'Confined Space', 6),
('G', 'dasdfds', 'Crane Lifting', 'Crane Lifting', 7)
ON CONFLICT (category_code) DO NOTHING;

COMMENT ON TABLE public.safety_audit_categories IS 'Safety audit categories (A-G) with Thai and English names';
COMMENT ON COLUMN public.safety_audit_categories.category_code IS 'Single letter code: A, B, C, D, E, F, G';
COMMENT ON COLUMN public.safety_audit_categories.category_id IS 'Original category identifier from legacy system';

-- ============================================
-- 2. SAFETY AUDIT REQUIREMENT REVISIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.safety_audit_requirement_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.safety_audit_categories(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL,                 -- 0, 1, 2, ...
  effective_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,                   -- Only one active per category
  approved_by UUID REFERENCES public.users(id),
  approval_date TIMESTAMP WITH TIME ZONE,
  change_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT safety_audit_requirement_revisions_unique_category_rev 
    UNIQUE(category_id, revision_number),
  CONSTRAINT safety_audit_requirement_revisions_revision_check 
    CHECK (revision_number >= 0)
) TABLESPACE pg_default;

COMMENT ON TABLE public.safety_audit_requirement_revisions IS 'Version control for audit requirements - tracks changes over time';
COMMENT ON COLUMN public.safety_audit_requirement_revisions.is_active IS 'Only one revision can be active per category at a time';

-- ============================================
-- 3. SAFETY AUDIT REQUIREMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.safety_audit_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id UUID REFERENCES public.safety_audit_requirement_revisions(id) ON DELETE CASCADE,
  item_number INTEGER NOT NULL,                     -- 1, 2, 3, ...
  description_th TEXT NOT NULL,                     -- 'บัตรอนุญาตทำงาน'
  description_en TEXT,
  criteria_th TEXT NOT NULL,                        -- 'ติดบัตรอนุญาตถูกต้อง'
  criteria_en TEXT,
  weight INTEGER NOT NULL CHECK (weight BETWEEN 1 AND 5),
  display_order INTEGER DEFAULT 0,
  is_optional BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT safety_audit_requirements_unique_revision_item 
    UNIQUE(revision_id, item_number)
) TABLESPACE pg_default;

COMMENT ON TABLE public.safety_audit_requirements IS 'Audit requirements/checklist items with weights for scoring';
COMMENT ON COLUMN public.safety_audit_requirements.weight IS 'Weight for scoring calculation (1-5, higher = more important)';
COMMENT ON COLUMN public.safety_audit_requirements.is_optional IS 'If true, N/A is allowed and expected for this requirement';

-- ============================================
-- 4. SAFETY AUDITS (HEADER) TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.safety_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_number VARCHAR(50) UNIQUE NOT NULL,         -- 'SA-2025-001'
  
  -- Location Information
  project_id UUID REFERENCES public.projects(id) ON DELETE RESTRICT,
  main_area_id UUID REFERENCES public.main_areas(id),      -- nullable
  sub_area1_id UUID REFERENCES public.sub_areas_1(id),     -- nullable
  sub_area2_id UUID REFERENCES public.sub_areas_2(id),     -- nullable
  main_area VARCHAR,                                        -- Text fallback if needed
  sub_area1 VARCHAR,                                        -- Text fallback if needed
  sub_area2 VARCHAR,                                        -- Text fallback if needed
  specific_location TEXT,
  area_info JSONB,                                          -- Additional area metadata
  
  -- Audit Information
  category_id UUID REFERENCES public.safety_audit_categories(id) ON DELETE RESTRICT,
  revision_id UUID REFERENCES public.safety_audit_requirement_revisions(id) ON DELETE RESTRICT,
  audit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  auditor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- NEW: Number of personnel present during audit
  number_of_personnel INTEGER CHECK (number_of_personnel >= 0),
  
  -- Scores (calculated fields)
  total_score DECIMAL(5,2),                         -- Sum of all weighted scores
  max_possible_score DECIMAL(5,2),                  -- Maximum if all items = 3
  weighted_average DECIMAL(5,2),                    -- Weighted average (with weight consideration)
  percentage_score DECIMAL(5,2),                    -- 0-100%
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft',               -- draft, submitted, reviewed, approved, rejected
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  
  -- Metadata
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT safety_audits_status_check 
    CHECK (status IN ('draft', 'submitted', 'reviewed', 'approved', 'rejected')),
  CONSTRAINT safety_audits_scores_check 
    CHECK (
      total_score >= 0 AND 
      max_possible_score >= 0 AND 
      weighted_average >= 0 AND weighted_average <= 3 AND
      percentage_score >= 0 AND percentage_score <= 100
    )
) TABLESPACE pg_default;

COMMENT ON TABLE public.safety_audits IS 'Safety audit header records - one per audit session';
COMMENT ON COLUMN public.safety_audits.audit_number IS 'Unique audit identifier (auto-generated or manual)';
COMMENT ON COLUMN public.safety_audits.number_of_personnel IS 'Number of workers/personnel present during the audit';
COMMENT ON COLUMN public.safety_audits.main_area IS 'Text fallback for main area name';
COMMENT ON COLUMN public.safety_audits.sub_area1 IS 'Text fallback for sub area 1 name';
COMMENT ON COLUMN public.safety_audits.sub_area2 IS 'Text fallback for sub area 2 name';
COMMENT ON COLUMN public.safety_audits.area_info IS 'JSONB storage for flexible area metadata';
COMMENT ON COLUMN public.safety_audits.weighted_average IS 'Weighted average score (0-3 scale)';
COMMENT ON COLUMN public.safety_audits.percentage_score IS 'Percentage score (0-100%)';

-- ============================================
-- 5. SAFETY AUDIT COMPANIES (INTERMEDIATE TABLE)
-- ============================================
-- NEW: Many-to-many relationship between audits and companies
CREATE TABLE IF NOT EXISTS public.safety_audit_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.safety_audits(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  
  -- Optional: Track company-specific details
  personnel_count INTEGER CHECK (personnel_count >= 0),  -- How many from this company
  primary_company BOOLEAN DEFAULT false,                  -- Is this the main company?
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT safety_audit_companies_unique_audit_company 
    UNIQUE(audit_id, company_id)
) TABLESPACE pg_default;

COMMENT ON TABLE public.safety_audit_companies IS 'Many-to-many relationship: one audit can involve multiple companies';
COMMENT ON COLUMN public.safety_audit_companies.personnel_count IS 'Number of personnel from this specific company';
COMMENT ON COLUMN public.safety_audit_companies.primary_company IS 'Flag to identify the main/lead company for this audit';

-- ============================================
-- 6. SAFETY AUDIT RESULTS (DETAIL) TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.safety_audit_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.safety_audits(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL REFERENCES public.safety_audit_requirements(id) ON DELETE RESTRICT,
  
  -- Result
  score INTEGER CHECK (score IN (0, 1, 2, 3) OR score IS NULL),  -- null = N/A
  score_label VARCHAR(20),                          -- 'compliant', 'partial', 'minimal', 'non_compliant', 'n/a'
  comment TEXT,
  
  -- Calculated
  weighted_score DECIMAL(5,2),                      -- score * weight
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT safety_audit_results_unique_audit_requirement 
    UNIQUE(audit_id, requirement_id),
  CONSTRAINT safety_audit_results_score_label_check 
    CHECK (score_label IN ('compliant', 'partial', 'minimal', 'non_compliant', 'n/a'))
) TABLESPACE pg_default;

COMMENT ON TABLE public.safety_audit_results IS 'Detailed scores for each requirement in an audit';
COMMENT ON COLUMN public.safety_audit_results.score IS '3=Compliant, 2=Partial, 1=Minimal, 0=Non-compliant, NULL=N/A';
COMMENT ON COLUMN public.safety_audit_results.weighted_score IS 'score × requirement.weight (for calculation)';

-- ============================================
-- 7. SAFETY AUDIT PHOTOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.safety_audit_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.safety_audits(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES public.safety_audit_requirements(id) ON DELETE SET NULL,  -- Optional: link to specific requirement
  
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) TABLESPACE pg_default;

COMMENT ON TABLE public.safety_audit_photos IS 'Photo evidence for safety audits';
COMMENT ON COLUMN public.safety_audit_photos.requirement_id IS 'Optional: link photo to specific requirement item';

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Safety Audit Categories
CREATE INDEX IF NOT EXISTS idx_safety_audit_categories_code 
  ON public.safety_audit_categories(category_code);
CREATE INDEX IF NOT EXISTS idx_safety_audit_categories_active 
  ON public.safety_audit_categories(is_active);

-- Requirement Revisions
CREATE INDEX IF NOT EXISTS idx_safety_audit_revisions_category 
  ON public.safety_audit_requirement_revisions(category_id);
CREATE INDEX IF NOT EXISTS idx_safety_audit_revisions_active 
  ON public.safety_audit_requirement_revisions(category_id, is_active);

-- Requirements
CREATE INDEX IF NOT EXISTS idx_safety_audit_requirements_revision 
  ON public.safety_audit_requirements(revision_id);
CREATE INDEX IF NOT EXISTS idx_safety_audit_requirements_item 
  ON public.safety_audit_requirements(revision_id, item_number);

-- Safety Audits
CREATE INDEX IF NOT EXISTS idx_safety_audits_project 
  ON public.safety_audits(project_id);
CREATE INDEX IF NOT EXISTS idx_safety_audits_category 
  ON public.safety_audits(category_id);
CREATE INDEX IF NOT EXISTS idx_safety_audits_date 
  ON public.safety_audits(audit_date DESC);
CREATE INDEX IF NOT EXISTS idx_safety_audits_status 
  ON public.safety_audits(status);
CREATE INDEX IF NOT EXISTS idx_safety_audits_auditor 
  ON public.safety_audits(auditor_id);
CREATE INDEX IF NOT EXISTS idx_safety_audits_created 
  ON public.safety_audits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_safety_audits_main_area 
  ON public.safety_audits(main_area_id);
CREATE INDEX IF NOT EXISTS idx_safety_audits_sub_area1 
  ON public.safety_audits(sub_area1_id);
CREATE INDEX IF NOT EXISTS idx_safety_audits_sub_area2 
  ON public.safety_audits(sub_area2_id);

-- Safety Audit Companies (NEW)
CREATE INDEX IF NOT EXISTS idx_safety_audit_companies_audit 
  ON public.safety_audit_companies(audit_id);
CREATE INDEX IF NOT EXISTS idx_safety_audit_companies_company 
  ON public.safety_audit_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_safety_audit_companies_primary 
  ON public.safety_audit_companies(audit_id, primary_company);

-- Safety Audit Results
CREATE INDEX IF NOT EXISTS idx_safety_audit_results_audit 
  ON public.safety_audit_results(audit_id);
CREATE INDEX IF NOT EXISTS idx_safety_audit_results_requirement 
  ON public.safety_audit_results(requirement_id);
CREATE INDEX IF NOT EXISTS idx_safety_audit_results_score 
  ON public.safety_audit_results(score);

-- Safety Audit Photos
CREATE INDEX IF NOT EXISTS idx_safety_audit_photos_audit 
  ON public.safety_audit_photos(audit_id);
CREATE INDEX IF NOT EXISTS idx_safety_audit_photos_requirement 
  ON public.safety_audit_photos(requirement_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.safety_audit_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_audit_requirement_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_audit_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_audit_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_audit_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_audit_photos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: Categories & Requirements (Public Read)
-- ============================================

-- Categories: Everyone can read
CREATE POLICY "Categories are viewable by everyone" 
  ON public.safety_audit_categories FOR SELECT 
  USING (true);

-- Categories: Only admins can modify
CREATE POLICY "Categories are editable by admins only" 
  ON public.safety_audit_categories FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('system_admin', 'admin')
    )
  );

-- Revisions: Everyone can read
CREATE POLICY "Revisions are viewable by everyone" 
  ON public.safety_audit_requirement_revisions FOR SELECT 
  USING (true);

-- Revisions: Only admins can modify
CREATE POLICY "Revisions are editable by admins only" 
  ON public.safety_audit_requirement_revisions FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('system_admin', 'admin')
    )
  );

-- Requirements: Everyone can read
CREATE POLICY "Requirements are viewable by everyone" 
  ON public.safety_audit_requirements FOR SELECT 
  USING (true);

-- Requirements: Only admins can modify
CREATE POLICY "Requirements are editable by admins only" 
  ON public.safety_audit_requirements FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('system_admin', 'admin')
    )
  );

-- ============================================
-- RLS POLICIES: Safety Audits (Company-based)
-- ============================================

-- Audits: Users can view audits from their companies
CREATE POLICY "Audits are viewable by company members" 
  ON public.safety_audits FOR SELECT 
  USING (
    -- System admins can see all
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'system_admin'
    )
    OR
    -- Users can see audits where they are in one of the associated companies
    EXISTS (
      SELECT 1 FROM public.safety_audit_companies sac
      JOIN public.users u ON sac.company_id = u.company_id
      WHERE sac.audit_id = safety_audits.id
      AND u.id = auth.uid()
    )
    OR
    -- Users can see their own audits
    auditor_id = auth.uid()
    OR
    created_by = auth.uid()
  );

-- Audits: Users can create audits for their projects
CREATE POLICY "Audits are insertable by authorized users" 
  ON public.safety_audits FOR INSERT 
  WITH CHECK (
    -- System admins and regular admins can create audits
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('system_admin', 'admin')
    )
    OR
    -- Members can create audits if they have access to the project
    (
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role = 'member'
      )
      AND
      EXISTS (
        SELECT 1 FROM public.project_members 
        WHERE project_id = safety_audits.project_id 
        AND user_id = auth.uid()
      )
    )
  );

-- Audits: Users can update their own draft audits
CREATE POLICY "Audits are updatable by creators" 
  ON public.safety_audits FOR UPDATE 
  USING (
    (created_by = auth.uid() AND status = 'draft')
    OR
    (auditor_id = auth.uid() AND status = 'draft')
    OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('system_admin', 'admin')
    )
  );

-- Audits: Only admins can delete
CREATE POLICY "Audits are deletable by admins only" 
  ON public.safety_audits FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('system_admin', 'admin')
    )
  );

-- ============================================
-- RLS POLICIES: Audit Companies (NEW)
-- ============================================

-- Audit Companies: Inherit from audit visibility
CREATE POLICY "Audit companies are viewable with audit" 
  ON public.safety_audit_companies FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.safety_audits 
      WHERE id = audit_id
      -- Audit RLS will handle the rest
    )
  );

-- Audit Companies: Can be inserted with audit
CREATE POLICY "Audit companies are insertable by audit creators" 
  ON public.safety_audit_companies FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.safety_audits 
      WHERE id = audit_id 
      AND (created_by = auth.uid() OR auditor_id = auth.uid())
    )
  );

-- Audit Companies: Can be updated by audit creators
CREATE POLICY "Audit companies are updatable by audit creators" 
  ON public.safety_audit_companies FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.safety_audits 
      WHERE id = audit_id 
      AND (created_by = auth.uid() OR auditor_id = auth.uid())
      AND status = 'draft'
    )
  );

-- ============================================
-- RLS POLICIES: Results & Photos
-- ============================================

-- Results: Inherit from audit visibility
CREATE POLICY "Results are viewable with audit" 
  ON public.safety_audit_results FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.safety_audits 
      WHERE id = audit_id
    )
  );

CREATE POLICY "Results are insertable by audit creators" 
  ON public.safety_audit_results FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.safety_audits 
      WHERE id = audit_id 
      AND (created_by = auth.uid() OR auditor_id = auth.uid())
    )
  );

CREATE POLICY "Results are updatable by audit creators" 
  ON public.safety_audit_results FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.safety_audits 
      WHERE id = audit_id 
      AND (created_by = auth.uid() OR auditor_id = auth.uid())
      AND status = 'draft'
    )
  );

-- Photos: Inherit from audit visibility
CREATE POLICY "Photos are viewable with audit" 
  ON public.safety_audit_photos FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.safety_audits 
      WHERE id = audit_id
    )
  );

CREATE POLICY "Photos are insertable by audit creators" 
  ON public.safety_audit_photos FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.safety_audits 
      WHERE id = audit_id 
      AND (created_by = auth.uid() OR auditor_id = auth.uid())
    )
  );

CREATE POLICY "Photos are deletable by audit creators" 
  ON public.safety_audit_photos FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.safety_audits 
      WHERE id = audit_id 
      AND (created_by = auth.uid() OR auditor_id = auth.uid())
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to generate next audit number
CREATE OR REPLACE FUNCTION generate_audit_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  year_part TEXT;
  audit_number TEXT;
BEGIN
  -- Get current year
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Get next sequence number for this year
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(audit_number FROM 'SA-' || year_part || '-(.*)') 
      AS INTEGER
    )
  ), 0) + 1
  INTO next_number
  FROM public.safety_audits
  WHERE audit_number LIKE 'SA-' || year_part || '-%';
  
  -- Format: SA-2025-001
  audit_number := 'SA-' || year_part || '-' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN audit_number;
END;
$$;

COMMENT ON FUNCTION generate_audit_number() IS 'Generate next sequential audit number in format SA-YYYY-NNN';

-- Function to calculate audit scores
CREATE OR REPLACE FUNCTION calculate_audit_scores(p_audit_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_score DECIMAL(5,2);
  v_max_possible DECIMAL(5,2);
  v_weighted_avg DECIMAL(5,2);
  v_percentage DECIMAL(5,2);
  v_total_weight INTEGER;
  v_weighted_sum DECIMAL(5,2);
BEGIN
  -- Calculate scores from results
  SELECT 
    SUM(sar.weighted_score),
    SUM(CASE WHEN sar.score IS NOT NULL THEN req.weight * 3 ELSE 0 END),
    SUM(CASE WHEN sar.score IS NOT NULL THEN req.weight ELSE 0 END),
    SUM(CASE WHEN sar.score IS NOT NULL THEN sar.weighted_score ELSE 0 END)
  INTO 
    v_total_score,
    v_max_possible,
    v_total_weight,
    v_weighted_sum
  FROM public.safety_audit_results sar
  JOIN public.safety_audit_requirements req ON sar.requirement_id = req.id
  WHERE sar.audit_id = p_audit_id;
  
  -- Calculate weighted average
  IF v_total_weight > 0 THEN
    v_weighted_avg := v_weighted_sum / v_total_weight;
    v_percentage := (v_weighted_avg / 3.0) * 100.0;
  ELSE
    v_weighted_avg := 0;
    v_percentage := 0;
  END IF;
  
  -- Update audit record
  UPDATE public.safety_audits
  SET 
    total_score = COALESCE(v_total_score, 0),
    max_possible_score = COALESCE(v_max_possible, 0),
    weighted_average = ROUND(v_weighted_avg, 2),
    percentage_score = ROUND(v_percentage, 2),
    updated_at = NOW()
  WHERE id = p_audit_id;
END;
$$;

COMMENT ON FUNCTION calculate_audit_scores(UUID) IS 'Recalculate all scores for a given audit based on results';

-- Trigger to auto-calculate scores when results change
CREATE OR REPLACE FUNCTION trigger_calculate_audit_scores()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Recalculate scores for the affected audit
  PERFORM calculate_audit_scores(
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.audit_id
      ELSE NEW.audit_id
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger on results table
DROP TRIGGER IF EXISTS trigger_audit_results_calculate_scores ON public.safety_audit_results;
CREATE TRIGGER trigger_audit_results_calculate_scores
  AFTER INSERT OR UPDATE OR DELETE ON public.safety_audit_results
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_audit_scores();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View: Audit summary with all companies
CREATE OR REPLACE VIEW public.safety_audit_summary AS
SELECT 
  sa.id,
  sa.audit_number,
  sa.audit_date,
  sa.number_of_personnel,
  sa.status,
  
  -- Category info
  sac.category_code,
  sac.name_th as category_name_th,
  sac.name_en as category_name_en,
  
  -- Project info
  p.name as project_name,
  
  -- Companies (aggregated)
  ARRAY_AGG(DISTINCT c.name ORDER BY c.name) as company_names,
  STRING_AGG(DISTINCT c.name, ', ' ORDER BY c.name) as companies_text,
  
  -- Scores
  sa.weighted_average,
  sa.percentage_score,
  sa.total_score,
  sa.max_possible_score,
  
  -- Auditor info
  CONCAT(u.first_name, ' ', u.last_name) as auditor_name,
  u.first_name as auditor_first_name,
  u.last_name as auditor_last_name,
  
  -- Timestamps
  sa.created_at,
  sa.submitted_at
  
FROM public.safety_audits sa
JOIN public.safety_audit_categories sac ON sa.category_id = sac.id
LEFT JOIN public.projects p ON sa.project_id = p.id
LEFT JOIN public.safety_audit_companies sac2 ON sa.id = sac2.audit_id
LEFT JOIN public.companies c ON sac2.company_id = c.id
LEFT JOIN public.users u ON sa.auditor_id = u.id
GROUP BY 
  sa.id, sa.audit_number, sa.audit_date, sa.number_of_personnel, sa.status,
  sac.category_code, sac.name_th, sac.name_en,
  p.name, sa.weighted_average, sa.percentage_score, 
  sa.total_score, sa.max_possible_score,
  u.first_name, u.last_name, sa.created_at, sa.submitted_at;

COMMENT ON VIEW public.safety_audit_summary IS 'Summary view of audits with aggregated company names';

-- ============================================
-- SAMPLE QUERIES
-- ============================================

-- Example 1: Get all audits with companies
/*
SELECT * FROM public.safety_audit_summary
WHERE audit_date >= '2025-01-01'
ORDER BY audit_date DESC;
*/

-- Example 2: Get audit detail with results
/*
SELECT 
  sa.*,
  json_agg(
    json_build_object(
      'requirement_id', sar.requirement_id,
      'item_number', req.item_number,
      'description_th', req.description_th,
      'criteria_th', req.criteria_th,
      'weight', req.weight,
      'score', sar.score,
      'comment', sar.comment,
      'weighted_score', sar.weighted_score
    ) ORDER BY req.item_number
  ) as results
FROM public.safety_audits sa
LEFT JOIN public.safety_audit_results sar ON sa.id = sar.audit_id
LEFT JOIN public.safety_audit_requirements req ON sar.requirement_id = req.id
WHERE sa.id = '<audit-uuid>'
GROUP BY sa.id;
*/

-- Example 3: Get companies for an audit
/*
SELECT 
  c.id,
  c.name,
  c.name_th,
  sac.personnel_count,
  sac.primary_company
FROM public.safety_audit_companies sac
JOIN public.companies c ON sac.company_id = c.id
WHERE sac.audit_id = '<audit-uuid>'
ORDER BY sac.primary_company DESC, c.name;
*/

-- ============================================
-- GRANTS (Adjust based on your setup)
-- ============================================

-- Grant access to authenticated users
GRANT SELECT ON public.safety_audit_categories TO authenticated;
GRANT SELECT ON public.safety_audit_requirement_revisions TO authenticated;
GRANT SELECT ON public.safety_audit_requirements TO authenticated;
GRANT ALL ON public.safety_audits TO authenticated;
GRANT ALL ON public.safety_audit_companies TO authenticated;
GRANT ALL ON public.safety_audit_results TO authenticated;
GRANT ALL ON public.safety_audit_photos TO authenticated;

-- Grant access to view
GRANT SELECT ON public.safety_audit_summary TO authenticated;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Safety Audit Schema Installation Complete!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tables created: 7';
  RAISE NOTICE '  1. safety_audit_categories';
  RAISE NOTICE '  2. safety_audit_requirement_revisions';
  RAISE NOTICE '  3. safety_audit_requirements';
  RAISE NOTICE '  4. safety_audits (with number_of_personnel)';
  RAISE NOTICE '  5. safety_audit_companies (NEW - many-to-many)';
  RAISE NOTICE '  6. safety_audit_results';
  RAISE NOTICE '  7. safety_audit_photos';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes in v2.0:';
  RAISE NOTICE '  - Removed company_id from safety_audits';
  RAISE NOTICE '  - Added safety_audit_companies intermediate table';
  RAISE NOTICE '  - Added number_of_personnel to safety_audits';
  RAISE NOTICE '  - One audit can now have multiple companies';
  RAISE NOTICE '';
  RAISE NOTICE 'Indexes: 18 created for performance';
  RAISE NOTICE 'RLS Policies: All tables secured';
  RAISE NOTICE 'Functions: 2 helper functions';
  RAISE NOTICE 'Views: 1 summary view';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Import your requirements data';
  RAISE NOTICE '  2. Create initial revision records';
  RAISE NOTICE '  3. Test with sample audit';
  RAISE NOTICE '============================================';
END $$;
