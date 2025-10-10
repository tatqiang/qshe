-- Quick Test Script for Safety Patrol Database
-- Run this after setting up the schema to verify everything works

-- 1. Check if all tables exist
SELECT 'Tables Created' as status, count(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%patrol%' OR table_name LIKE '%risk%');

-- 2. Check if sample data was inserted
SELECT 'Risk Categories' as data_type, count(*) as count FROM public.risk_categories
UNION ALL
SELECT 'Risk Items' as data_type, count(*) as count FROM public.risk_items;

-- 3. Test risk calculation functions
SELECT 'Risk Matrix Test' as test_name,
  likelihood, 
  severity, 
  calculate_risk_level(likelihood, severity) as calculated_risk,
  get_recommended_action(likelihood, severity) as recommended_action
FROM (VALUES (2,3), (4,4), (1,1)) AS test_values(likelihood, severity);

-- 4. Test creating a patrol (will auto-generate patrol number and calculate risk)
INSERT INTO public.safety_patrols (
  title,
  description,
  patrol_type,
  main_area,
  sub_area1,
  specific_location,
  likelihood,
  severity,
  immediate_hazard,
  work_stopped,
  legal_requirement
) VALUES (
  'Database Test Patrol',
  'Testing schema setup and auto-calculations',
  'scheduled',
  'Test Building',
  'Test Floor',
  'Test Location',
  3,
  3,
  false,
  false,
  false
) RETURNING id, patrol_number, risk_level, recommended_action;

-- 5. Verify the patrol was created correctly
SELECT 
  'Latest Patrol' as info,
  patrol_number,
  title,
  likelihood,
  severity,
  risk_level,
  recommended_action,
  created_at
FROM public.safety_patrols
ORDER BY created_at DESC
LIMIT 1;

-- 6. Test adding risk categories to the patrol
INSERT INTO public.patrol_risk_categories (patrol_id, risk_category_id)
SELECT 
  (SELECT id FROM public.safety_patrols ORDER BY created_at DESC LIMIT 1),
  id
FROM public.risk_categories 
LIMIT 2;

-- 7. Test adding risk items to the patrol  
INSERT INTO public.patrol_risk_items (patrol_id, risk_item_id)
SELECT 
  (SELECT id FROM public.safety_patrols ORDER BY created_at DESC LIMIT 1),
  id
FROM public.risk_items 
LIMIT 3;

-- 8. Verify relationships work
SELECT 
  p.patrol_number,
  p.title,
  rc.name as risk_category,
  ri.name as risk_item
FROM public.safety_patrols p
LEFT JOIN public.patrol_risk_categories prc ON p.id = prc.patrol_id
LEFT JOIN public.risk_categories rc ON prc.risk_category_id = rc.id
LEFT JOIN public.patrol_risk_items pri ON p.id = pri.patrol_id  
LEFT JOIN public.risk_items ri ON pri.risk_item_id = ri.id
WHERE p.title = 'Database Test Patrol'
ORDER BY rc.name, ri.name;

SELECT 'Setup Complete! ✅' as status, 'Database is ready for patrol recording' as message;
