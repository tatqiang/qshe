-- Simple System Admin Creation (Alternative Method)
-- Run this in Supabase SQL Editor
-- This creates only the profile, you'll need to create the auth user separately

-- Method 1: If you want to manually create auth user first, then run this
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Invite User" or "Add User"
-- 3. Email: nithat.su@th.jec.com
-- 4. Password: jeCt1234
-- 5. Then run this SQL to create the profile:

INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    position,
    user_type,
    status,
    face_descriptors,
    profile_photo_url,
    company_id,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'nithat.su@th.jec.com'),
    'nithat.su@th.jec.com',
    'Nithat',
    'Su',
    'System Administrator',
    'internal',
    'active',
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    position = EXCLUDED.position,
    user_type = EXCLUDED.user_type,
    status = EXCLUDED.status,
    updated_at = NOW();

-- Verify the user
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    p.first_name,
    p.last_name,
    p.position,
    p.user_type,
    p.status
FROM auth.users u
LEFT JOIN public.users p ON u.id = p.id
WHERE u.email = 'nithat.su@th.jec.com';
