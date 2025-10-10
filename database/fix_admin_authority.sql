-- Fix Admin User Authority Level
-- Run this in Supabase SQL Editor to set the correct authority level for admin users

-- Update existing users to have system_admin authority_level
-- This updates both the dev login helper user and the system admin user

-- Method 1: Update admin@qshe.com if it exists
UPDATE public.users 
SET authority_level = 'system_admin' 
WHERE email = 'admin@qshe.com';

-- Method 2: Update nithat.su@th.jec.com if it exists
UPDATE public.users 
SET authority_level = 'system_admin' 
WHERE email = 'nithat.su@th.jec.com';

-- Method 3: Create admin@qshe.com user if it doesn't exist
-- First, create the auth user (you'll need to do this manually in Supabase Dashboard)
-- Then insert the profile:
INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    user_type,
    status,
    authority_level,
    created_at,
    updated_at
) 
SELECT 
    (SELECT id FROM auth.users WHERE email = 'admin@qshe.com'),
    'admin@qshe.com',
    'System',
    'Administrator',
    'internal',
    'active',
    'system_admin',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.users WHERE email = 'admin@qshe.com'
) AND EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@qshe.com'
);

-- Verify the updates
SELECT 
    email,
    first_name,
    last_name,
    authority_level,
    user_type,
    status
FROM public.users 
WHERE email IN ('admin@qshe.com', 'nithat.su@th.jec.com')
ORDER BY email;
