-- Create System Admin User in Supabase with New Schema
-- This script creates a system admin user using the new authority_level and position_id structure
-- Note: This approach bypasses Supabase Auth, so the user won't be able to reset password via email

-- First, let's check if the user already exists and delete if needed
DELETE FROM auth.users WHERE email = 'nithat.su@th.jec.com';
DELETE FROM public.users WHERE email = 'nithat.su@th.jec.com';

-- Insert into auth.users table (Supabase Auth)
-- Note: You'll need to run this in Supabase SQL Editor as it requires admin access
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'nithat.su@th.jec.com',
    crypt('jeCt1234', gen_salt('bf')), -- Hash the password 'jeCt1234'
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"first_name":"Nithat","last_name":"Su"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

-- Get the user ID and position ID for the profile creation
DO $$
DECLARE
    user_uuid UUID;
    md_position_id INTEGER;
BEGIN
    -- Get the user ID we just created
    SELECT id INTO user_uuid FROM auth.users WHERE email = 'nithat.su@th.jec.com';
    
    -- Get the Managing Director position ID (or you can use a different position)
    -- This gives the System Admin a high-level position title
    SELECT id INTO md_position_id FROM public.positions WHERE code = 'MD' LIMIT 1;
    
    -- Insert into public.users table (User Profile) with new schema
    INSERT INTO public.users (
        id,
        email,
        first_name,
        last_name,
        user_type,
        status,
        role,
        position_id,
        face_descriptors,
        profile_photo_url,
        company_id,
        created_at,
        updated_at
    ) VALUES (
        user_uuid,
        'nithat.su@th.jec.com',
        'Nithat',
        'Su',
        'internal',
        'active',
        'system_admin'::user_status,  -- Using the new user_status enum
        md_position_id,               -- Managing Director position (or NULL if you prefer)
        NULL,
        NULL,
        NULL,
        NOW(),
        NOW()
    );
END $$;

-- Verify the user was created with new schema
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    p.first_name,
    p.last_name,
    p.user_type,
    p.status,
    p.role,
    p.position_id,
    pos.position_title,
    pos.code as position_code
FROM auth.users u
LEFT JOIN public.users p ON u.id = p.id
LEFT JOIN public.positions pos ON p.position_id = pos.id
WHERE u.email = 'nithat.su@th.jec.com';
