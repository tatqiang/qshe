-- Clean Schema Recreation with Improved Design
-- This completely drops and recreates the schema with the unified user management approach

-- ==========================================
-- STEP 1: DROP ALL EXISTING TABLES
-- ==========================================

-- Drop dependent objects first
DROP VIEW IF EXISTS user_details CASCADE;

-- Drop all public tables (order matters due to foreign keys)
DROP TABLE IF EXISTS public.issue_photos CASCADE;
DROP TABLE IF EXISTS public.patrol_issues CASCADE;
DROP TABLE IF EXISTS public.patrols CASCADE;
DROP TABLE IF EXISTS public.project_members CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.file_metadata CASCADE;
DROP TABLE IF EXISTS public.pre_registrations CASCADE;  -- We're eliminating this
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.positions CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS user_type_enum CASCADE;
DROP TYPE IF EXISTS user_status_enum CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS authority_level CASCADE;
DROP TYPE IF EXISTS project_status_enum CASCADE;
DROP TYPE IF EXISTS patrol_status_enum CASCADE;
DROP TYPE IF EXISTS issue_severity_enum CASCADE;
DROP TYPE IF EXISTS issue_status_enum CASCADE;

-- ==========================================
-- STEP 2: CREATE IMPROVED ENUMS
-- ==========================================

-- User types
CREATE TYPE user_type_enum AS ENUM ('internal', 'external', 'worker');

-- User status with invitation flow
CREATE TYPE user_status AS ENUM (
    'invited',              -- Admin created invitation, user hasn't started
    'pending_completion',   -- User started registration but hasn't finished
    'active',              -- Fully registered and can use system
    'inactive',            -- User disabled/suspended
    'expired'              -- Invitation expired
);

-- User roles (renamed from authority_level for clarity)
CREATE TYPE user_role AS ENUM (
    'system_admin',
    'admin', 
    'project_manager',
    'site_manager',
    'qshe_manager',
    'supervisor',
    'member',
    'worker'
);

-- Other enums
CREATE TYPE project_status_enum AS ENUM ('active', 'completed', 'on_hold', 'cancelled');
CREATE TYPE patrol_status_enum AS ENUM ('draft', 'in_progress', 'completed', 'cancelled');
CREATE TYPE issue_severity_enum AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE issue_status_enum AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- ==========================================
-- STEP 3: CREATE CORE TABLES
-- ==========================================

-- Companies table
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    address TEXT,
    contact_person VARCHAR,
    contact_email VARCHAR,
    status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Positions table (for job titles and hierarchy)
CREATE TABLE public.positions (
    id SERIAL PRIMARY KEY,
    level INTEGER NOT NULL,
    position_title VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('internal', 'external')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unified Users table (combines old users + pre_registrations)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR NOT NULL UNIQUE,
    
    -- Basic profile
    first_name VARCHAR,
    last_name VARCHAR,
    user_type user_type_enum DEFAULT 'internal',
    status user_status DEFAULT 'active',
    role user_role DEFAULT 'member',
    
    -- Position and company
    position_id INTEGER REFERENCES public.positions(id),
    company_id UUID REFERENCES public.companies(id),
    
    -- Invitation management (unified approach)
    invitation_token VARCHAR UNIQUE,
    invited_by UUID REFERENCES public.users(id),
    invitation_expires_at TIMESTAMP WITH TIME ZONE,
    registration_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Auth integration (nullable for invitations)
    auth_user_id UUID UNIQUE,
    
    -- Security
    face_descriptors JSONB,
    profile_photo_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key to Supabase auth (nullable for invitations)
    CONSTRAINT users_auth_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Projects table
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    status project_status_enum DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project members (improved with position-based roles)
CREATE TABLE public.project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'member',
    position_id INTEGER REFERENCES public.positions(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES public.users(id),
    status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'removed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(project_id, user_id)
);

-- File metadata table
CREATE TABLE public.file_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR,
    file_size BIGINT,
    entity_type VARCHAR,
    entity_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

-- Patrols table
CREATE TABLE public.patrols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id),
    title VARCHAR NOT NULL,
    date DATE NOT NULL,
    status patrol_status_enum DEFAULT 'draft',
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patrol issues table
CREATE TABLE public.patrol_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patrol_id UUID REFERENCES public.patrols(id),
    title VARCHAR NOT NULL,
    description TEXT,
    location VARCHAR,
    severity issue_severity_enum DEFAULT 'medium',
    status issue_status_enum DEFAULT 'open',
    assignee_id UUID REFERENCES public.users(id),
    reporter_id UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by UUID REFERENCES public.users(id)
);

-- Issue photos table
CREATE TABLE public.issue_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID REFERENCES public.patrol_issues(id),
    type VARCHAR,
    file_metadata_id UUID REFERENCES public.file_metadata(id),
    annotations JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

-- ==========================================
-- STEP 4: CREATE INDEXES
-- ==========================================

-- Users table indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_status ON public.users(status);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_invitation_token ON public.users(invitation_token);
CREATE INDEX idx_users_invited_by ON public.users(invited_by);
CREATE INDEX idx_users_position_id ON public.users(position_id);
CREATE INDEX idx_users_company_id ON public.users(company_id);

-- Project members indexes
CREATE INDEX idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX idx_project_members_role ON public.project_members(role);

-- Other important indexes
CREATE INDEX idx_patrols_project_id ON public.patrols(project_id);
CREATE INDEX idx_patrols_created_by ON public.patrols(created_by);
CREATE INDEX idx_patrol_issues_patrol_id ON public.patrol_issues(patrol_id);
CREATE INDEX idx_patrol_issues_assignee_id ON public.patrol_issues(assignee_id);

-- ==========================================
-- STEP 5: INSERT DEFAULT POSITIONS DATA
-- ==========================================

INSERT INTO public.positions (level, position_title, code, type) VALUES
(0, 'Managing Director', 'MD', 'internal'),
(1, 'General Manager', 'GM', 'internal'),
(1, 'Head of Business Unit', 'BU', 'internal'),
(2, 'Project Director', 'PD', 'internal'),
(3, 'Project Manager', 'PM', 'internal'),
(4, 'Assistant Project Manager', 'APM', 'internal'),
(1, 'QSHE Manager', 'QSHEM', 'internal'),
(5, 'Project Engineer', 'PE', 'internal'),
(6, 'Site Engineer', 'SE', 'internal'),
(7, 'Supervisor', 'SUP', 'internal'),
(8, 'Foreman', 'FM', 'internal'),
(1, 'Team Head', 'H', 'external'),
(2, 'Worker', 'W', 'external');

-- ==========================================
-- STEP 6: ENSURE SYSTEM ADMIN EXISTS
-- ==========================================

-- Create system admin user (ensure it exists regardless of backup)
DO $$
DECLARE
    admin_id UUID;
    md_position_id INTEGER;
    admin_exists BOOLEAN := FALSE;
BEGIN
    -- Get MD position ID
    SELECT id INTO md_position_id FROM public.positions WHERE code = 'MD' LIMIT 1;
    
    -- Check if admin already exists in auth.users
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'nithat.su@th.jec.com') INTO admin_exists;
    
    IF admin_exists THEN
        -- Get existing admin ID
        SELECT id INTO admin_id FROM auth.users WHERE email = 'nithat.su@th.jec.com';
        RAISE NOTICE 'Found existing admin user in auth.users with ID: %', admin_id;
    ELSE
        -- Create new admin user in auth.users
        admin_id := gen_random_uuid();
        
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
            admin_id,
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
        
        RAISE NOTICE 'Created new admin user in auth.users with ID: %', admin_id;
    END IF;
    
    -- Insert/Update in public.users table
    INSERT INTO public.users (
        id,
        auth_user_id,
        email,
        first_name,
        last_name,
        user_type,
        status,
        role,
        position_id,
        registration_completed_at,
        created_at,
        updated_at
    ) VALUES (
        admin_id,
        admin_id,  -- Same ID for auth integration
        'nithat.su@th.jec.com',
        'Nithat',
        'Su',
        'internal',
        'active',
        'system_admin',
        md_position_id,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        auth_user_id = admin_id,
        role = 'system_admin',
        status = 'active',
        position_id = md_position_id,
        updated_at = NOW();
        
    RAISE NOTICE 'System admin user created/updated successfully in public.users';
    
    -- Create a test invitation for development
    INSERT INTO public.users (
        email,
        user_type,
        status,
        invitation_token,
        invited_by,
        invitation_expires_at,
        created_at,
        updated_at
    ) VALUES (
        'test.user@example.com',
        'internal',
        'invited',
        'test-invitation-token-123',
        admin_id,
        NOW() + INTERVAL '7 days',
        NOW(),
        NOW()
    ) ON CONFLICT (email) DO UPDATE SET
        status = 'invited',
        invitation_token = 'test-invitation-token-123',
        invitation_expires_at = NOW() + INTERVAL '7 days',
        updated_at = NOW();
        
    RAISE NOTICE 'Test invitation created: http://localhost:5173/register/test-invitation-token-123';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating system admin: %', SQLERRM;
        -- Continue anyway
END $$;

-- ==========================================
-- STEP 7: ROW LEVEL SECURITY POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patrols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patrol_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_photos ENABLE ROW LEVEL SECURITY;

-- Positions table policies (read-only for authenticated and anonymous users)
CREATE POLICY "Allow authenticated users to read positions" ON public.positions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow anonymous users to read positions for registration" ON public.positions
    FOR SELECT TO anon USING (true);

-- Users table policies (simplified to avoid recursion)
CREATE POLICY "Allow public access to invitation validation" ON public.users
    FOR SELECT TO anon USING (invitation_token IS NOT NULL AND status = 'invited');

CREATE POLICY "Allow all access for authenticated users" ON public.users
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow public registration updates via invitation token" ON public.users
    FOR UPDATE TO anon USING (invitation_token IS NOT NULL AND status = 'invited')
    WITH CHECK (invitation_token IS NOT NULL);

-- Companies table policies (read for authenticated users)
CREATE POLICY "Allow authenticated users to read companies" ON public.companies
    FOR SELECT TO authenticated USING (true);

-- ==========================================
-- STEP 8: VERIFICATION
-- ==========================================

SELECT 
    'Schema Recreation Complete' as status,
    COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public';

SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- Show system admin user
SELECT 
    email,
    role,
    status,
    position_id,
    'System admin restored' as note
FROM public.users 
WHERE email = 'nithat.su@th.jec.com';

COMMENT ON TABLE public.users IS 'Unified user management table handling invitations, registration, and user profiles';
COMMENT ON COLUMN public.users.status IS 'User lifecycle: invited → pending_completion → active';
COMMENT ON COLUMN public.users.role IS 'User authority level in the system';
COMMENT ON COLUMN public.users.invitation_token IS 'Unique token for invitation links';
COMMENT ON COLUMN public.users.position_id IS 'Reference to positions table for job title and hierarchy';
