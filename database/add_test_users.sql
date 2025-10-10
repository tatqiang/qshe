-- Add some test users for dashboard testing
-- This will help us verify the dashboard statistics are working

-- Insert test users into the public.users table
INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    thai_first_name,
    thai_last_name,
    role,
    authority_level,
    status,
    created_at,
    updated_at
) VALUES 
-- System Admin
(
    gen_random_uuid(),
    'admin@test.com',
    'System',
    'Admin',
    'ผู้ดูแล',
    'ระบบ',
    'system_admin',
    'system_admin',
    'active',
    NOW(),
    NOW()
),
-- Regular Members/Workers
(
    gen_random_uuid(),
    'worker1@test.com',
    'John',
    'Smith',
    'จอห์น',
    'สมิธ',
    'member',
    'member',
    'active',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'worker2@test.com',
    'Jane',
    'Doe',
    'เจน',
    'โด',
    'member',
    'member',
    'active',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'worker3@test.com',
    'Mike',
    'Johnson',
    'ไมค์',
    'จอห์นสัน',
    'member',
    'member',
    'active',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'admin1@test.com',
    'Sarah',
    'Williams',
    'ซาร่า',
    'วิลเลียมส์',
    'admin',
    'admin',
    'active',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    updated_at = NOW();
    
-- Insert test projects with proper UUIDs
INSERT INTO projects (
    id,
    project_code,
    name,
    description,
    status,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(),
    'AIC',
    'Downtown Office Complex',
    'Construction of 25-story office building with underground parking',
    'active',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'RM1',
    'Highway Bridge Construction',
    'Construction of 2.5km bridge spanning the Chao Phraya River',
    'active',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'MEGA',
    'Mega Shopping Mall Project',
    'Large retail complex with entertainment facilities',
    'active',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'GG-U001',
    'Underground Utility Tunnel',
    'Utility infrastructure for downtown area',
    'active',
    NOW(),
    NOW()
)
ON CONFLICT (project_code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Add some test patrol records for the issues count
INSERT INTO safety_patrols (
    id,
    project_id,
    patrol_area,
    status,
    created_by,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    p.id,
    'Test Area',
    'draft',
    u.id,
    NOW(),
    NOW()
FROM projects p, users u 
WHERE p.status = 'active' AND u.status = 'active'
LIMIT 3
ON CONFLICT DO NOTHING;

-- Output success message
SELECT 'Test data added successfully!' as message;
