-- Run this script in Supabase SQL Editor to create the complete safety patrol schema

-- First, run the complete schema
-- Copy and paste the content from safety_patrol_schema.sql into Supabase SQL Editor

-- After running the schema, verify tables were created:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%patrol%' 
  OR table_name LIKE '%risk%'
ORDER BY table_name;

-- Check if the main table has the correct structure:
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'safety_patrols'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test the risk calculation functions:
SELECT 
  likelihood, 
  severity, 
  calculate_risk_level(likelihood, severity) as calculated_risk,
  get_recommended_action(likelihood, severity) as recommended_action
FROM (VALUES 
  (1,1), (1,2), (1,3), (1,4),
  (2,1), (2,2), (2,3), (2,4),
  (3,1), (3,2), (3,3), (3,4),
  (4,1), (4,2), (4,3), (4,4)
) AS test_values(likelihood, severity);

-- Test creating a sample patrol (replace with actual user ID from auth.users):
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
  'Test Safety Patrol',
  'Testing the new database schema',
  'scheduled',
  'Building A',
  'Floor 1',
  'Main entrance area',
  2,
  3,
  false,
  false,
  false
);

-- Verify the patrol was created with auto-calculated values:
SELECT 
  id,
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
