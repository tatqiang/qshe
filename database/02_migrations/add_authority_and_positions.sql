-- Add Authority Level and Positions Table
-- This script improves the user system by separating authority/role from job position

-- 1. Create positions table first
CREATE TABLE IF NOT EXISTS public.positions (
    id SERIAL PRIMARY KEY,
    level INTEGER NOT NULL,
    position_title VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('internal', 'external')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the positions from your table (handle duplicates)
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
(2, 'Worker', 'W', 'external')
ON CONFLICT (code) DO UPDATE SET
    level = EXCLUDED.level,
    position_title = EXCLUDED.position_title,
    type = EXCLUDED.type,
    updated_at = NOW();

-- 2. Create authority levels enum or table (handle if already exists)
DO $$ BEGIN
    CREATE TYPE authority_level AS ENUM (
        'system_admin',
        'admin', 
        'project_manager',
        'site_manager',
        'qshe_manager',
        'supervisor',
        'member',
        'worker'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Add authority_level column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS authority_level authority_level DEFAULT 'member';

-- 4. Add position_id column to reference positions table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS position_id INTEGER REFERENCES public.positions(id);

-- 5. Update existing users to set authority levels based on current position
UPDATE public.users 
SET authority_level = 'system_admin' 
WHERE position = 'System Administrator';

-- 6. Create project_members table for project-specific positions
CREATE TABLE IF NOT EXISTS public.project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    position_id INTEGER NOT NULL REFERENCES public.positions(id),
    authority_level authority_level NOT NULL DEFAULT 'member',
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES public.users(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'removed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id) -- One user per project, but can have different positions across projects
);

-- 7. Add RLS policies for positions table
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read positions
DROP POLICY IF EXISTS "Allow authenticated users to read positions" ON public.positions;
CREATE POLICY "Allow authenticated users to read positions" ON public.positions
    FOR SELECT TO authenticated USING (true);

-- 8. Add RLS policies for project_members table
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Allow users to read project members for projects they're involved in
DROP POLICY IF EXISTS "Users can read project members for their projects" ON public.project_members;
CREATE POLICY "Users can read project members for their projects" ON public.project_members
    FOR SELECT TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.project_members pm 
            WHERE pm.project_id = project_members.project_id 
            AND pm.user_id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.authority_level IN ('system_admin', 'admin', 'project_manager')
        )
    );

-- Allow project managers and admins to manage project members
DROP POLICY IF EXISTS "Project managers can manage project members" ON public.project_members;
CREATE POLICY "Project managers can manage project members" ON public.project_members
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.authority_level IN ('system_admin', 'admin', 'project_manager')
        )
    );

-- 9. Create function to get filtered positions based on user type
CREATE OR REPLACE FUNCTION public.get_positions_by_type(user_type_param TEXT)
RETURNS TABLE (
    id INTEGER,
    level INTEGER,
    position_title VARCHAR(100),
    code VARCHAR(10),
    type VARCHAR(20)
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.level, p.position_title, p.code, p.type
    FROM public.positions p
    WHERE p.type = user_type_param
    ORDER BY p.level, p.position_title;
END;
$$;

-- 10. Create updated view for user details with position info
CREATE OR REPLACE VIEW public.user_details AS
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.user_type,
    u.status,
    u.authority_level,
    u.position_id,
    p.position_title,
    p.code as position_code,
    p.level as position_level,
    u.profile_photo_url,
    u.company_id,
    u.created_at,
    u.updated_at
FROM public.users u
LEFT JOIN public.positions p ON u.position_id = p.id;

-- Grant permissions
GRANT SELECT ON public.positions TO authenticated;
GRANT SELECT ON public.user_details TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_positions_by_type(TEXT) TO authenticated;
