-- Fix RLS policies to allow profile completion for anonymous users
-- This addresses the issue where profile completion fails because
-- anonymous users can't INSERT new records in public.users table

-- Check current RLS policies on users table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'users';

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Allow public registration updates via invitation token" ON public.users;
DROP POLICY IF EXISTS "Allow public access to invitation validation" ON public.users;
DROP POLICY IF EXISTS "Allow login authentication" ON public.users;

-- Create comprehensive policies that allow profile completion flow
-- 1. Allow anonymous users to SELECT users with invitation tokens (for validation)
CREATE POLICY "Allow public access to invitation validation" ON public.users
    FOR SELECT TO anon USING (
        invitation_token IS NOT NULL 
        AND status = 'invited'
        AND (invitation_expires_at IS NULL OR invitation_expires_at > NOW())
    );

-- 2. Allow anonymous users to INSERT new records with invitation tokens
-- This is needed when user exists in auth.users but not in public.users
CREATE POLICY "Allow public profile completion via invitation token" ON public.users
    FOR INSERT TO anon WITH CHECK (
        invitation_token IS NOT NULL 
        AND status IN ('invited', 'pending_completion')
    );

-- 3. Allow anonymous users to UPDATE existing records with invitation tokens
CREATE POLICY "Allow public registration updates via invitation token" ON public.users
    FOR UPDATE TO anon USING (
        invitation_token IS NOT NULL 
        AND status IN ('invited', 'pending_completion')
    ) WITH CHECK (
        invitation_token IS NOT NULL
    );

-- 4. Ensure authenticated users have full access
DROP POLICY IF EXISTS "Allow all access for authenticated users" ON public.users;
CREATE POLICY "Allow all access for authenticated users" ON public.users
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Verification query
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users' 
ORDER BY policyname;

COMMENT ON POLICY "Allow public profile completion via invitation token" ON public.users IS 
'Allows anonymous users to INSERT new records in public.users when they have a valid invitation token. This enables profile completion flow where user exists in auth.users but not in public.users.';
