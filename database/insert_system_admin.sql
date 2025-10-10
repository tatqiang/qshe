-- Database setup for pre-registration testing
-- Based on current Supabase schema, the invited_by field is already nullable
-- This script ensures the table is ready for testing with mock authentication

-- Verify the pre_registrations table structure (no changes needed)
-- The invited_by field is already nullable in the current schema

-- Optional: Insert a test system admin user if you want to test with a real invited_by reference
-- Uncomment the following lines if you want to create a test user:

/*
-- First, you would need to create a user in Supabase Auth, then add to users table
INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    position,
    user_type,
    status,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'admin@qshe.com',
    'System',
    'Administrator',
    'System Administrator',
    'internal'::user_type_enum,
    'active'::user_status_enum,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;
*/

-- For now, the application will create pre-registrations without invited_by field
-- This avoids all foreign key constraint issues during testing
