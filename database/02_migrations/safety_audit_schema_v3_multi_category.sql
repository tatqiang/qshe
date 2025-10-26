-- ============================================
-- SAFETY AUDIT MODULE - SCHEMA V3 (MULTI-CATEGORY)
-- ============================================
-- Version: 3.0
-- Date: October 16, 2025
-- Purpose: Support ONE audit form covering ALL categories (A-G)
-- Changes from v2:
--   - Removed category_id from safety_audits (one audit = all categories)
--   - Added audit_criteria_rev JSONB to track revision per category
--   - Modified safety_audit_results to include category_id
--   - Updated photos to link to category_id
-- ============================================

-- ============================================
-- STEP 1: DROP DEPENDENT VIEWS FIRST
-- ============================================

-- Drop views that depend on columns we're about to remove
DROP VIEW IF EXISTS public.safety_audit_summary CASCADE;
DROP VIEW IF EXISTS public.v_safety_audit_summary CASCADE;

-- ============================================
-- STEP 2: DROP EXISTING CONSTRAINTS AND COLUMNS
-- ============================================

-- Drop indexes that depend on category_id in safety_audits
DROP INDEX IF EXISTS public.idx_safety_audits_category;

-- Drop foreign key constraint for category_id
ALTER TABLE public.safety_audits 
  DROP CONSTRAINT IF EXISTS safety_audits_category_id_fkey;

-- Drop foreign key constraint for revision_id
ALTER TABLE public.safety_audits 
  DROP CONSTRAINT IF EXISTS safety_audits_revision_id_fkey;

-- Drop category_id and revision_id from safety_audits (moved to JSONB)
ALTER TABLE public.safety_audits 
  DROP COLUMN IF EXISTS category_id CASCADE,
  DROP COLUMN IF EXISTS revision_id CASCADE;

-- ============================================
-- STEP 3: ADD NEW COLUMNS TO SAFETY_AUDITS
-- ============================================

-- Add audit_criteria_rev to track which revision was used for each category
-- Format: {"cat01": 0, "cat02": 1, "cat03": 0, ...}
ALTER TABLE public.safety_audits 
  ADD COLUMN IF NOT EXISTS audit_criteria_rev JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.safety_audits.audit_criteria_rev IS 
  'JSONB mapping of category_id to revision number: {"cat01": 0, "cat02": 1}';

-- ============================================
-- STEP 4: MODIFY SAFETY_AUDIT_RESULTS TABLE
-- ============================================

-- Add category_id to group results by category (for tabs A, B, C...)
ALTER TABLE public.safety_audit_results 
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.safety_audit_categories(id) ON DELETE RESTRICT;

-- Add index for faster category filtering
CREATE INDEX IF NOT EXISTS idx_safety_audit_results_category 
  ON public.safety_audit_results(category_id);

-- Add composite index for audit + category queries
CREATE INDEX IF NOT EXISTS idx_safety_audit_results_audit_category 
  ON public.safety_audit_results(audit_id, category_id);

COMMENT ON COLUMN public.safety_audit_results.category_id IS 
  'Category this result belongs to (enables tab filtering: A, B, C, etc.)';

-- ============================================
-- STEP 5: MODIFY SAFETY_AUDIT_PHOTOS TABLE
-- ============================================

-- Add category_id to organize photos per category
ALTER TABLE public.safety_audit_photos 
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.safety_audit_categories(id) ON DELETE SET NULL;

-- Add index for category-based photo queries
CREATE INDEX IF NOT EXISTS idx_safety_audit_photos_category 
  ON public.safety_audit_photos(category_id);

-- Add composite index for audit + category photo queries
CREATE INDEX IF NOT EXISTS idx_safety_audit_photos_audit_category 
  ON public.safety_audit_photos(audit_id, category_id);

COMMENT ON COLUMN public.safety_audit_photos.category_id IS 
  'Category this photo belongs to (for tab-based photo organization)';

-- ============================================
-- STEP 6: UPDATE SCORE CALCULATION COLUMNS
-- ============================================

-- Add per-category score tracking (JSONB)
ALTER TABLE public.safety_audits 
  ADD COLUMN IF NOT EXISTS category_scores JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.safety_audits.category_scores IS 
  'Per-category scores: {"cat01": {"total": 45, "max": 60, "avg": 2.5, "pct": 75}, ...}';

-- ============================================
-- STEP 7: CREATE HELPER VIEW FOR ACTIVE REQUIREMENTS
-- ============================================

-- View to get all active requirements for each category
CREATE OR REPLACE VIEW public.v_active_audit_requirements AS
SELECT 
  c.id AS category_id,
  c.category_code,
  c.category_id AS category_identifier,
  c.name_th AS category_name_th,
  c.name_en AS category_name_en,
  rev.id AS revision_id,
  rev.revision_number,
  rev.effective_date,
  req.id AS requirement_id,
  req.item_number,
  req.description_th,
  req.description_en,
  req.criteria_th,
  req.criteria_en,
  req.weight,
  req.display_order,
  req.is_optional
FROM public.safety_audit_categories c
JOIN public.safety_audit_requirement_revisions rev 
  ON rev.category_id = c.id AND rev.is_active = true
JOIN public.safety_audit_requirements req 
  ON req.revision_id = rev.id
WHERE c.is_active = true
ORDER BY c.display_order, req.display_order, req.item_number;

COMMENT ON VIEW public.v_active_audit_requirements IS 
  'All active requirements grouped by category - use this for form generation';

-- ============================================
-- STEP 8: CREATE HELPER FUNCTION FOR SCORE CALCULATION
-- ============================================

-- Function to calculate weighted average for a category
CREATE OR REPLACE FUNCTION public.calculate_category_score(
  p_audit_id UUID,
  p_category_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB;
  v_total_score DECIMAL(10,2);
  v_max_score DECIMAL(10,2);
  v_weighted_avg DECIMAL(10,2);
  v_percentage DECIMAL(5,2);
  v_count_items INTEGER;
  v_count_na INTEGER;
BEGIN
  -- Calculate scores excluding N/A items
  SELECT 
    COALESCE(SUM(r.weighted_score), 0) AS total_score,
    COALESCE(SUM(req.weight * 3), 0) AS max_score,  -- Max score per item = 3
    COUNT(*) AS count_items,
    COUNT(*) FILTER (WHERE r.score IS NULL) AS count_na
  INTO v_total_score, v_max_score, v_count_items, v_count_na
  FROM public.safety_audit_results r
  JOIN public.safety_audit_requirements req ON r.requirement_id = req.id
  WHERE r.audit_id = p_audit_id 
    AND r.category_id = p_category_id
    AND r.score IS NOT NULL;  -- Exclude N/A from calculation
  
  -- Calculate weighted average (0-3 scale)
  IF v_max_score > 0 THEN
    v_weighted_avg := (v_total_score / v_max_score) * 3;
    v_percentage := (v_total_score / v_max_score) * 100;
  ELSE
    v_weighted_avg := 0;
    v_percentage := 0;
  END IF;
  
  -- Return as JSONB
  v_result := jsonb_build_object(
    'total_score', v_total_score,
    'max_score', v_max_score,
    'weighted_avg', ROUND(v_weighted_avg, 2),
    'percentage', ROUND(v_percentage, 2),
    'item_count', v_count_items,
    'na_count', v_count_na
  );
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.calculate_category_score IS 
  'Calculate weighted score for a specific category in an audit (excludes N/A items)';

-- ============================================
-- STEP 9: CREATE TRIGGER TO UPDATE SCORES
-- ============================================

-- Function to update category_scores when results change
CREATE OR REPLACE FUNCTION public.update_audit_category_scores()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_category_id UUID;
  v_category_identifier VARCHAR(20);
  v_scores JSONB;
  v_all_category_scores JSONB := '{}'::jsonb;
  v_overall_total DECIMAL(10,2) := 0;
  v_overall_max DECIMAL(10,2) := 0;
  v_overall_avg DECIMAL(10,2) := 0;
  v_overall_pct DECIMAL(5,2) := 0;
BEGIN
  -- Loop through all categories that have results for this audit
  FOR v_category_id, v_category_identifier IN
    SELECT DISTINCT r.category_id, c.category_id
    FROM public.safety_audit_results r
    JOIN public.safety_audit_categories c ON r.category_id = c.id
    WHERE r.audit_id = COALESCE(NEW.audit_id, OLD.audit_id)
  LOOP
    -- Calculate scores for this category
    v_scores := public.calculate_category_score(
      COALESCE(NEW.audit_id, OLD.audit_id),
      v_category_id
    );
    
    -- Add to category_scores JSONB
    v_all_category_scores := jsonb_set(
      v_all_category_scores,
      ARRAY[v_category_identifier],
      v_scores
    );
    
    -- Accumulate for overall scores
    v_overall_total := v_overall_total + (v_scores->>'total_score')::DECIMAL;
    v_overall_max := v_overall_max + (v_scores->>'max_score')::DECIMAL;
  END LOOP;
  
  -- Calculate overall weighted average
  IF v_overall_max > 0 THEN
    v_overall_avg := (v_overall_total / v_overall_max) * 3;
    v_overall_pct := (v_overall_total / v_overall_max) * 100;
  END IF;
  
  -- Update safety_audits table
  UPDATE public.safety_audits
  SET 
    category_scores = v_all_category_scores,
    total_score = v_overall_total,
    max_possible_score = v_overall_max,
    weighted_average = ROUND(v_overall_avg, 2),
    percentage_score = ROUND(v_overall_pct, 2),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.audit_id, OLD.audit_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger on safety_audit_results
DROP TRIGGER IF EXISTS trg_update_audit_scores ON public.safety_audit_results;
CREATE TRIGGER trg_update_audit_scores
  AFTER INSERT OR UPDATE OR DELETE ON public.safety_audit_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_audit_category_scores();

COMMENT ON FUNCTION public.update_audit_category_scores IS 
  'Automatically recalculate scores when audit results change';

-- ============================================
-- STEP 10: CREATE VIEW FOR AUDIT SUMMARY
-- ============================================

CREATE OR REPLACE VIEW public.v_audit_summary AS
SELECT 
  a.id,
  a.audit_number,
  a.project_id,
  p.name AS project_name,
  a.audit_date,
  a.auditor_id,
  CONCAT(u.first_name, ' ', u.last_name) AS auditor_name,
  a.status,
  a.total_score,
  a.max_possible_score,
  a.weighted_average,
  a.percentage_score,
  a.category_scores,
  a.audit_criteria_rev,
  a.number_of_personnel,
  a.created_at,
  a.updated_at,
  -- Count of categories audited
  (SELECT COUNT(DISTINCT category_id) 
   FROM public.safety_audit_results 
   WHERE audit_id = a.id) AS categories_audited,
  -- Total requirements scored
  (SELECT COUNT(*) 
   FROM public.safety_audit_results 
   WHERE audit_id = a.id AND score IS NOT NULL) AS requirements_scored,
  -- Total photos
  (SELECT COUNT(*) 
   FROM public.safety_audit_photos 
   WHERE audit_id = a.id) AS photo_count
FROM public.safety_audits a
LEFT JOIN public.projects p ON a.project_id = p.id
LEFT JOIN public.users u ON a.auditor_id = u.id;

COMMENT ON VIEW public.v_audit_summary IS 
  'Summary view of all audits with calculated statistics';

-- ============================================
-- STEP 11: UPDATE RLS POLICIES (No changes needed)
-- ============================================
-- RLS policies from v2 are still valid since we're using the same
-- company-based access control through safety_audit_companies table

-- ============================================
-- STEP 12: UPDATE CATEGORY DATA TO MATCH DOCUMENTATION
-- ============================================

-- First, update existing categories with correct category_id values
UPDATE public.safety_audit_categories SET category_id = 'cat01' WHERE category_code = 'A';
UPDATE public.safety_audit_categories SET category_id = 'cat02' WHERE category_code = 'B';
UPDATE public.safety_audit_categories SET category_id = 'cat03' WHERE category_code = 'C';
UPDATE public.safety_audit_categories SET category_id = 'cat04' WHERE category_code = 'D';
UPDATE public.safety_audit_categories SET category_id = 'cat05' WHERE category_code = 'E';
UPDATE public.safety_audit_categories SET category_id = 'cat06' WHERE category_code = 'F';
UPDATE public.safety_audit_categories SET category_id = 'cat07' WHERE category_code = 'G';

-- ============================================
-- STEP 13: INSERT REQUIREMENT DATA FROM DOCUMENTATION
-- ============================================

-- Insert requirement revisions and requirements for all categories
DO $$
DECLARE
  v_cat_a UUID;
  v_cat_b UUID;
  v_cat_c UUID;
  v_rev_a_0 UUID;
  v_rev_b_0 UUID;
  v_rev_b_1 UUID;
  v_rev_c_0 UUID;
BEGIN
  -- Get category UUIDs by category_id
  SELECT id INTO v_cat_a FROM public.safety_audit_categories WHERE category_id = 'cat01';
  SELECT id INTO v_cat_b FROM public.safety_audit_categories WHERE category_id = 'cat02';
  SELECT id INTO v_cat_c FROM public.safety_audit_categories WHERE category_id = 'cat03';
  
  RAISE NOTICE 'Category A UUID: %', v_cat_a;
  RAISE NOTICE 'Category B UUID: %', v_cat_b;
  RAISE NOTICE 'Category C UUID: %', v_cat_c;
  
  -- Insert revisions
  INSERT INTO public.safety_audit_requirement_revisions (category_id, revision_number, is_active, effective_date)
  VALUES 
    (v_cat_a, 0, true, CURRENT_DATE),
    (v_cat_b, 0, false, CURRENT_DATE),  -- Rev 0 is superseded by Rev 1
    (v_cat_b, 1, true, CURRENT_DATE),   -- Rev 1 is active
    (v_cat_c, 0, true, CURRENT_DATE)
  ON CONFLICT (category_id, revision_number) DO UPDATE 
    SET is_active = EXCLUDED.is_active, effective_date = EXCLUDED.effective_date;
  
  -- Get revision UUIDs
  SELECT id INTO v_rev_a_0 FROM public.safety_audit_requirement_revisions WHERE category_id = v_cat_a AND revision_number = 0;
  SELECT id INTO v_rev_b_0 FROM public.safety_audit_requirement_revisions WHERE category_id = v_cat_b AND revision_number = 0;
  SELECT id INTO v_rev_b_1 FROM public.safety_audit_requirement_revisions WHERE category_id = v_cat_b AND revision_number = 1;
  SELECT id INTO v_rev_c_0 FROM public.safety_audit_requirement_revisions WHERE category_id = v_cat_c AND revision_number = 0;
  
  RAISE NOTICE 'Category A Rev 0 UUID: %', v_rev_a_0;
  RAISE NOTICE 'Category B Rev 0 UUID: %', v_rev_b_0;
  RAISE NOTICE 'Category B Rev 1 UUID: %', v_rev_b_1;
  RAISE NOTICE 'Category C Rev 0 UUID: %', v_rev_c_0;
  
  -- ============================================
  -- Category A (cat01): Worker Readiness - Rev 0
  -- ============================================
  INSERT INTO public.safety_audit_requirements (revision_id, item_number, description_th, criteria_th, weight, display_order) VALUES
  (v_rev_a_0, 1, 'บัตรอนุญาตทำงาน', 'ติดบัตรอนุญาตถูกต้อง', 1, 1),
  (v_rev_a_0, 2, 'หมวกนิรภัย พร้อมสายรัดคาง', 'สวมหมวกนิรภัย พร้อมรายรัดคางได้ถูกต้อง', 2, 2),
  (v_rev_a_0, 3, 'รองเท้านิรภัย', 'สวมรองเท้านิรภัยที่ได้มาตรฐาน', 2, 3),
  (v_rev_a_0, 4, 'ความเหมาะสมของ PPE อื่นๆ', 'ตรวจสอบ PPE Matrix ตามลักษณะงาน', 3, 4)
  ON CONFLICT (revision_id, item_number) DO NOTHING;
  
  RAISE NOTICE 'Inserted % requirements for Category A Rev 0', 4;
  
  -- ============================================
  -- Category B (cat02): Tools & Equipment - Rev 0 (OLD VERSION)
  -- ============================================
  INSERT INTO public.safety_audit_requirements (revision_id, item_number, description_th, criteria_th, weight, display_order) VALUES
  (v_rev_b_0, 1, 'สติ๊กเกอร์อนุญาต การใช้เครื่องมือ อุปกรณ์', 'ตรวจอนุญาตได้ถูกต้องตามระยะเวลา', 1, 1),
  (v_rev_b_0, 2, 'เซฟตี้การ์ด เช่น ครอบใบตัด', 'มีเซฟตี้ครอบส่วนที่เคลื่อนไหว อันตรายของเครื่องมือ', 2, 2),
  (v_rev_b_0, 3, 'สภาพเพาเวอร์ปลั๊ก และสายไฟฟ้า', 'อยู่ในสภาพที่ปลอดภัย', 2, 3),
  (v_rev_b_0, 4, 'สวิตช์เปิด-ปิด', 'สามารถใช้งานได้เป็นปกติ', 2, 4),
  (v_rev_b_0, 5, 'การตรวจสอบทางกายภาพ', 'อยู่ในสภาพที่ปลอดภัย', 2, 5)
  ON CONFLICT (revision_id, item_number) DO NOTHING;
  
  RAISE NOTICE 'Inserted % requirements for Category B Rev 0', 5;
  
  -- ============================================
  -- Category B (cat02): Tools & Equipment - Rev 1 (ACTIVE VERSION)
  -- ============================================
  INSERT INTO public.safety_audit_requirements (revision_id, item_number, description_th, criteria_th, weight, display_order) VALUES
  (v_rev_b_1, 1, 'สติ๊กเกอร์อนุญาต การใช้เครื่องมือ อุปกรณ์', 'ตรวจอนุญาตได้ถูกต้องตามระยะเวลา', 1, 1),
  (v_rev_b_1, 2, 'เซฟตี้การ์ด เช่น ครอบใบตัด', 'มีเซฟตี้ครอบส่วนที่เคลื่อนไหว อันตรายของเครื่องมือ', 2, 2),
  (v_rev_b_1, 3, 'สภาพเพาเวอร์ปลั๊ก และสายไฟฟ้า', 'อยู่ในสภาพที่ปลอดภัย', 2, 3),
  (v_rev_b_1, 4, 'สวิตช์เปิด-ปิด', 'สามารถใช้งานได้เป็นปกติ', 2, 4),
  (v_rev_b_1, 5, 'การตรวจสอบทางกายภาพ', 'อยู่ในสภาพที่ปลอดภัย', 2, 5),
  (v_rev_b_1, 6, 'กล่องต่อสายไฟฟ้าชั่วคราว', 'ต้องใช้กล่องต่อสายแบบมี เบรกเกอร์ เท่านั้น', 3, 6)
  ON CONFLICT (revision_id, item_number) DO NOTHING;
  
  RAISE NOTICE 'Inserted % requirements for Category B Rev 1 (ACTIVE)', 6;
  
  -- ============================================
  -- Category C (cat03): Hot Work - Rev 0
  -- ============================================
  INSERT INTO public.safety_audit_requirements (revision_id, item_number, description_th, criteria_th, weight, display_order) VALUES
  (v_rev_c_0, 1, 'Hot Work Permit', 'ตรวจอนุญาตได้ถูกต้องตามลักษณะสภาพงานจริง', 3, 1),
  (v_rev_c_0, 2, 'กั้นเขตพื้น และติดป้ายเตือนอันตราย', 'จัดเก็บวัสดุติดไฟ/ไวไฟให้ห่างจากพื้นที่ทำงานในอย่างน้อย 10 เมตร', 3, 2),
  (v_rev_c_0, 3, 'การป้องกันสะเก็ดไฟ', 'ใช้ผ้าใบกันไฟ ถาด เซฟตี้การ์ด ตามความเหมาะสม', 3, 3),
  (v_rev_c_0, 4, 'Tag ตรวจเครื่องตัดแก๊ส', 'ตรวจอนุญาตได้ถูกต้องตามลักษณะสภาพงานจริง', 3, 4),
  (v_rev_c_0, 5, 'วาล์วกันย้อน และ Flash back', '4 จุด', 3, 5),
  (v_rev_c_0, 6, 'ถังดับเพลิง', 'อย่างน้อย ประเภท 20B - 1 ถัง', 3, 6),
  (v_rev_c_0, 7, 'ผู้เฝ้าระวังเหตุเพลิงไหม้', 'สามารถระบุผู้เฝ้าระวังที่ควบคุมเหตุการณ์ได้', 3, 7)
  ON CONFLICT (revision_id, item_number) DO NOTHING;
  
  RAISE NOTICE 'Inserted % requirements for Category C Rev 0', 7;
  
  -- Summary
  RAISE NOTICE '========================================';
  RAISE NOTICE 'REQUIREMENT DATA INSERTED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Category A (cat01): 4 items (Rev 0)';
  RAISE NOTICE 'Category B (cat02): 5 items (Rev 0) + 6 items (Rev 1 ACTIVE)';
  RAISE NOTICE 'Category C (cat03): 7 items (Rev 0)';
  RAISE NOTICE 'Total: 22 requirement records';
  
END $$;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Summary of changes:
-- ✓ Removed category_id from safety_audits (one audit = all categories)
-- ✓ Added audit_criteria_rev JSONB to track revision per category
-- ✓ Added category_id to safety_audit_results for filtering
-- ✓ Added category_id to safety_audit_photos for organization
-- ✓ Created helper view v_active_audit_requirements
-- ✓ Created score calculation function and trigger
-- ✓ Created v_audit_summary view
-- ✓ Inserted sample requirements for categories A, B, C
