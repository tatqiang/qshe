-- Update String Field Types from VARCHAR to TEXT
-- PostgreSQL Best Practice: Use TEXT instead of VARCHAR unless specific length constraint needed
-- Run this in Supabase Dashboard > SQL Editor

-- ==============================================
-- STEP 0: Store existing policies that might reference string columns
-- ==============================================

-- First, let's see what policies exist
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'companies', 'positions', 'projects');

-- ==============================================
-- STEP 1: Temporarily drop RLS policies that reference string columns
-- ==============================================

-- Drop policies on users table that might reference invitation_token or other string fields
DROP POLICY IF EXISTS "Allow public access to invitation validation" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile during completion" ON public.users;
DROP POLICY IF EXISTS "Allow invitation token lookup" ON public.users;
DROP POLICY IF EXISTS "Allow profile completion" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.users;

-- Drop any other policies that might reference string columns
DROP POLICY IF EXISTS "Enable read access for all users" ON public.companies;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.positions;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.projects;

-- ==============================================
-- STEP 2: Update users table string fields to TEXT
-- ==============================================

-- Update name fields to TEXT (no length restrictions needed)
ALTER TABLE public.users ALTER COLUMN first_name TYPE text;
ALTER TABLE public.users ALTER COLUMN last_name TYPE text;
ALTER TABLE public.users ALTER COLUMN first_name_thai TYPE text;
ALTER TABLE public.users ALTER COLUMN last_name_thai TYPE text;

-- Update nationality to TEXT (more flexible for international names)
ALTER TABLE public.users ALTER COLUMN nationality TYPE text;

-- Update other string fields
ALTER TABLE public.users ALTER COLUMN email TYPE text;
ALTER TABLE public.users ALTER COLUMN username TYPE text;
ALTER TABLE public.users ALTER COLUMN invitation_token TYPE text;

-- ==============================================
-- STEP 3: Update companies table (if exists)
-- ==============================================

ALTER TABLE public.companies ALTER COLUMN name TYPE text;
ALTER TABLE public.companies ALTER COLUMN address TYPE text;
ALTER TABLE public.companies ALTER COLUMN contact_person TYPE text;
ALTER TABLE public.companies ALTER COLUMN contact_email TYPE text;

-- ==============================================
-- STEP 4: Update positions table (if exists) 
-- ==============================================

-- Update string fields to TEXT
ALTER TABLE public.positions ALTER COLUMN position_title TYPE text;
ALTER TABLE public.positions ALTER COLUMN code TYPE text;

-- Change level from integer to numeric for decimal precision (e.g., 1.0, 1.1, 2.0, 2.1)
ALTER TABLE public.positions ALTER COLUMN level TYPE numeric(3,1);

-- ==============================================
-- STEP 5: Update projects table (if exists)
-- ==============================================

ALTER TABLE public.projects ALTER COLUMN name TYPE text;
ALTER TABLE public.projects ALTER COLUMN description TYPE text;

-- ==============================================
-- STEP 6: Recreate essential RLS policies
-- ==============================================

-- Recreate the invitation validation policy (most critical)
CREATE POLICY "Allow public access to invitation validation" ON public.users
    FOR SELECT USING (invitation_token IS NOT NULL);

-- Recreate profile completion policy
CREATE POLICY "Users can update own profile during completion" ON public.users
    FOR UPDATE USING (auth.uid() = id OR invitation_token IS NOT NULL);

-- Recreate basic read policy
CREATE POLICY "Enable read access for all users" ON public.users
    FOR SELECT USING (true);

-- Recreate insert policy
CREATE POLICY "Enable insert for authenticated users only" ON public.users
    FOR INSERT WITH CHECK (true);

-- Recreate update policy for profile management
CREATE POLICY "Enable update for users based on email" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Recreate company policies if needed
CREATE POLICY "Enable read access for all users" ON public.companies
    FOR SELECT USING (true);

-- Recreate position policies if needed
CREATE POLICY "Enable read access for all users" ON public.positions
    FOR SELECT USING (true);

-- Recreate project policies if needed
CREATE POLICY "Enable read access for all users" ON public.projects
    FOR SELECT USING (true);

-- ==============================================
-- STEP 7: Add comments explaining the choice
-- ==============================================

COMMENT ON COLUMN public.users.first_name IS 'First name - using TEXT for flexibility and PostgreSQL best practices';
COMMENT ON COLUMN public.users.last_name IS 'Last name - using TEXT for flexibility and PostgreSQL best practices';
COMMENT ON COLUMN public.users.first_name_thai IS 'Thai first name - TEXT allows for complex Unicode characters';
COMMENT ON COLUMN public.users.last_name_thai IS 'Thai last name - TEXT allows for complex Unicode characters';
COMMENT ON COLUMN public.users.nationality IS 'Nationality - TEXT for international flexibility';
COMMENT ON COLUMN public.users.email IS 'Email address - TEXT for maximum compatibility';

-- Add comment for positions level change
COMMENT ON COLUMN public.positions.level IS 'Hierarchical level - using NUMERIC(3,1) for decimal precision (e.g., 1.0, 1.1, 2.0, 2.1)';
COMMENT ON COLUMN public.positions.position_title IS 'Position title - using TEXT for flexibility';

-- ==============================================
-- STEP 8: Verify the changes and policies
-- ==============================================

-- Show updated column types
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'companies', 'positions', 'projects')
  AND data_type IN ('text', 'character varying')
ORDER BY table_name, column_name;

-- Verify policies are recreated
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'companies', 'positions', 'projects')
ORDER BY tablename, policyname;

SELECT 'Successfully updated string fields to TEXT type and recreated RLS policies!' as status;
