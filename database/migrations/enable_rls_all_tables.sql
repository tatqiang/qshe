-- Enable RLS for all tables with permissive policies
-- These policies allow access even without auth.uid() (for development/testing)
-- Use TRUE instead of auth.uid() check since we're not using Supabase Auth

-- ============================================
-- 1. PROJECTS TABLE (already done, included for completeness)
-- ============================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all to view projects" ON public.projects;
DROP POLICY IF EXISTS "Allow all to insert projects" ON public.projects;
DROP POLICY IF EXISTS "Allow all to update projects" ON public.projects;
DROP POLICY IF EXISTS "Allow all to delete projects" ON public.projects;

CREATE POLICY "Allow all to view projects" ON public.projects FOR SELECT USING (TRUE);
CREATE POLICY "Allow all to insert projects" ON public.projects FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Allow all to update projects" ON public.projects FOR UPDATE USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow all to delete projects" ON public.projects FOR DELETE USING (TRUE);

-- ============================================
-- 2. USERS TABLE
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all to view users" ON public.users;
DROP POLICY IF EXISTS "Allow all to insert users" ON public.users;
DROP POLICY IF EXISTS "Allow all to update users" ON public.users;
DROP POLICY IF EXISTS "Allow all to delete users" ON public.users;

CREATE POLICY "Allow all to view users" ON public.users FOR SELECT USING (TRUE);
CREATE POLICY "Allow all to insert users" ON public.users FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Allow all to update users" ON public.users FOR UPDATE USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow all to delete users" ON public.users FOR DELETE USING (TRUE);

-- ============================================
-- 3. MAIN_AREAS TABLE
-- ============================================
ALTER TABLE public.main_areas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all to view main_areas" ON public.main_areas;
DROP POLICY IF EXISTS "Allow all to insert main_areas" ON public.main_areas;
DROP POLICY IF EXISTS "Allow all to update main_areas" ON public.main_areas;
DROP POLICY IF EXISTS "Allow all to delete main_areas" ON public.main_areas;

CREATE POLICY "Allow all to view main_areas" ON public.main_areas FOR SELECT USING (TRUE);
CREATE POLICY "Allow all to insert main_areas" ON public.main_areas FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Allow all to update main_areas" ON public.main_areas FOR UPDATE USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow all to delete main_areas" ON public.main_areas FOR DELETE USING (TRUE);

-- ============================================
-- 4. SUB_AREAS_1 TABLE
-- ============================================
ALTER TABLE public.sub_areas_1 ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all to view sub_areas_1" ON public.sub_areas_1;
DROP POLICY IF EXISTS "Allow all to insert sub_areas_1" ON public.sub_areas_1;
DROP POLICY IF EXISTS "Allow all to update sub_areas_1" ON public.sub_areas_1;
DROP POLICY IF EXISTS "Allow all to delete sub_areas_1" ON public.sub_areas_1;

CREATE POLICY "Allow all to view sub_areas_1" ON public.sub_areas_1 FOR SELECT USING (TRUE);
CREATE POLICY "Allow all to insert sub_areas_1" ON public.sub_areas_1 FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Allow all to update sub_areas_1" ON public.sub_areas_1 FOR UPDATE USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow all to delete sub_areas_1" ON public.sub_areas_1 FOR DELETE USING (TRUE);

-- ============================================
-- 5. SUB_AREAS_2 TABLE
-- ============================================
ALTER TABLE public.sub_areas_2 ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all to view sub_areas_2" ON public.sub_areas_2;
DROP POLICY IF EXISTS "Allow all to insert sub_areas_2" ON public.sub_areas_2;
DROP POLICY IF EXISTS "Allow all to update sub_areas_2" ON public.sub_areas_2;
DROP POLICY IF EXISTS "Allow all to delete sub_areas_2" ON public.sub_areas_2;

CREATE POLICY "Allow all to view sub_areas_2" ON public.sub_areas_2 FOR SELECT USING (TRUE);
CREATE POLICY "Allow all to insert sub_areas_2" ON public.sub_areas_2 FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Allow all to update sub_areas_2" ON public.sub_areas_2 FOR UPDATE USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow all to delete sub_areas_2" ON public.sub_areas_2 FOR DELETE USING (TRUE);

-- ============================================
-- 6. RISK_CATEGORIES TABLE
-- ============================================
ALTER TABLE public.risk_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all to view risk_categories" ON public.risk_categories;
DROP POLICY IF EXISTS "Allow all to insert risk_categories" ON public.risk_categories;
DROP POLICY IF EXISTS "Allow all to update risk_categories" ON public.risk_categories;
DROP POLICY IF EXISTS "Allow all to delete risk_categories" ON public.risk_categories;

CREATE POLICY "Allow all to view risk_categories" ON public.risk_categories FOR SELECT USING (TRUE);
CREATE POLICY "Allow all to insert risk_categories" ON public.risk_categories FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Allow all to update risk_categories" ON public.risk_categories FOR UPDATE USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow all to delete risk_categories" ON public.risk_categories FOR DELETE USING (TRUE);

-- ============================================
-- 7. RISK_ITEMS TABLE
-- ============================================
ALTER TABLE public.risk_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all to view risk_items" ON public.risk_items;
DROP POLICY IF EXISTS "Allow all to insert risk_items" ON public.risk_items;
DROP POLICY IF EXISTS "Allow all to update risk_items" ON public.risk_items;
DROP POLICY IF EXISTS "Allow all to delete risk_items" ON public.risk_items;

CREATE POLICY "Allow all to view risk_items" ON public.risk_items FOR SELECT USING (TRUE);
CREATE POLICY "Allow all to insert risk_items" ON public.risk_items FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Allow all to update risk_items" ON public.risk_items FOR UPDATE USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow all to delete risk_items" ON public.risk_items FOR DELETE USING (TRUE);

-- ============================================
-- 8. SAFETY_PATROLS TABLE
-- ============================================
ALTER TABLE public.safety_patrols ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all to view safety_patrols" ON public.safety_patrols;
DROP POLICY IF EXISTS "Allow all to insert safety_patrols" ON public.safety_patrols;
DROP POLICY IF EXISTS "Allow all to update safety_patrols" ON public.safety_patrols;
DROP POLICY IF EXISTS "Allow all to delete safety_patrols" ON public.safety_patrols;

CREATE POLICY "Allow all to view safety_patrols" ON public.safety_patrols FOR SELECT USING (TRUE);
CREATE POLICY "Allow all to insert safety_patrols" ON public.safety_patrols FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Allow all to update safety_patrols" ON public.safety_patrols FOR UPDATE USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow all to delete safety_patrols" ON public.safety_patrols FOR DELETE USING (TRUE);

-- ============================================
-- 9. PATROL_RISK_CATEGORIES TABLE
-- ============================================
ALTER TABLE public.patrol_risk_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all to view patrol_risk_categories" ON public.patrol_risk_categories;
DROP POLICY IF EXISTS "Allow all to insert patrol_risk_categories" ON public.patrol_risk_categories;
DROP POLICY IF EXISTS "Allow all to update patrol_risk_categories" ON public.patrol_risk_categories;
DROP POLICY IF EXISTS "Allow all to delete patrol_risk_categories" ON public.patrol_risk_categories;

CREATE POLICY "Allow all to view patrol_risk_categories" ON public.patrol_risk_categories FOR SELECT USING (TRUE);
CREATE POLICY "Allow all to insert patrol_risk_categories" ON public.patrol_risk_categories FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Allow all to update patrol_risk_categories" ON public.patrol_risk_categories FOR UPDATE USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow all to delete patrol_risk_categories" ON public.patrol_risk_categories FOR DELETE USING (TRUE);

-- ============================================
-- 10. PATROL_RISK_ITEMS TABLE
-- ============================================
ALTER TABLE public.patrol_risk_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all to view patrol_risk_items" ON public.patrol_risk_items;
DROP POLICY IF EXISTS "Allow all to insert patrol_risk_items" ON public.patrol_risk_items;
DROP POLICY IF EXISTS "Allow all to update patrol_risk_items" ON public.patrol_risk_items;
DROP POLICY IF EXISTS "Allow all to delete patrol_risk_items" ON public.patrol_risk_items;

CREATE POLICY "Allow all to view patrol_risk_items" ON public.patrol_risk_items FOR SELECT USING (TRUE);
CREATE POLICY "Allow all to insert patrol_risk_items" ON public.patrol_risk_items FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Allow all to update patrol_risk_items" ON public.patrol_risk_items FOR UPDATE USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow all to delete patrol_risk_items" ON public.patrol_risk_items FOR DELETE USING (TRUE);

-- ============================================
-- 11. PATROL_PHOTOS TABLE
-- ============================================
ALTER TABLE public.patrol_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all to view patrol_photos" ON public.patrol_photos;
DROP POLICY IF EXISTS "Allow all to insert patrol_photos" ON public.patrol_photos;
DROP POLICY IF EXISTS "Allow all to update patrol_photos" ON public.patrol_photos;
DROP POLICY IF EXISTS "Allow all to delete patrol_photos" ON public.patrol_photos;

CREATE POLICY "Allow all to view patrol_photos" ON public.patrol_photos FOR SELECT USING (TRUE);
CREATE POLICY "Allow all to insert patrol_photos" ON public.patrol_photos FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Allow all to update patrol_photos" ON public.patrol_photos FOR UPDATE USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow all to delete patrol_photos" ON public.patrol_photos FOR DELETE USING (TRUE);

-- ============================================
-- 12. CORRECTIVE_ACTIONS TABLE
-- ============================================
ALTER TABLE public.corrective_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all to view corrective_actions" ON public.corrective_actions;
DROP POLICY IF EXISTS "Allow all to insert corrective_actions" ON public.corrective_actions;
DROP POLICY IF EXISTS "Allow all to update corrective_actions" ON public.corrective_actions;
DROP POLICY IF EXISTS "Allow all to delete corrective_actions" ON public.corrective_actions;

CREATE POLICY "Allow all to view corrective_actions" ON public.corrective_actions FOR SELECT USING (TRUE);
CREATE POLICY "Allow all to insert corrective_actions" ON public.corrective_actions FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Allow all to update corrective_actions" ON public.corrective_actions FOR UPDATE USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow all to delete corrective_actions" ON public.corrective_actions FOR DELETE USING (TRUE);

-- ============================================
-- 13. CORRECTIVE_ACTION_PHOTOS TABLE
-- ============================================
ALTER TABLE public.corrective_action_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all to view corrective_action_photos" ON public.corrective_action_photos;
DROP POLICY IF EXISTS "Allow all to insert corrective_action_photos" ON public.corrective_action_photos;
DROP POLICY IF EXISTS "Allow all to update corrective_action_photos" ON public.corrective_action_photos;
DROP POLICY IF EXISTS "Allow all to delete corrective_action_photos" ON public.corrective_action_photos;

CREATE POLICY "Allow all to view corrective_action_photos" ON public.corrective_action_photos FOR SELECT USING (TRUE);
CREATE POLICY "Allow all to insert corrective_action_photos" ON public.corrective_action_photos FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Allow all to update corrective_action_photos" ON public.corrective_action_photos FOR UPDATE USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow all to delete corrective_action_photos" ON public.corrective_action_photos FOR DELETE USING (TRUE);
