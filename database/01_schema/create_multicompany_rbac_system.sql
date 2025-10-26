-- Multi-Company Role Management System
-- This creates a sophisticated RBAC system that supports different roles per company
-- for the same user, enabling external workers to have various permissions across companies

-- Step 1: Create company-specific role definitions
CREATE TABLE IF NOT EXISTS public.company_roles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL,
    role_name VARCHAR NOT NULL,
    role_description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]',
    is_system_role BOOLEAN DEFAULT false, -- Standard roles vs custom company roles
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by uuid,
    
    CONSTRAINT company_roles_pkey PRIMARY KEY (id),
    CONSTRAINT company_roles_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE,
    CONSTRAINT company_roles_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
    CONSTRAINT unique_company_role_name UNIQUE (company_id, role_name)
);

-- Step 2: Create permission definitions table
CREATE TABLE IF NOT EXISTS public.permissions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    permission_key VARCHAR NOT NULL UNIQUE,
    permission_name VARCHAR NOT NULL,
    description TEXT,
    category VARCHAR NOT NULL DEFAULT 'general',
    is_sensitive BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    CONSTRAINT permissions_pkey PRIMARY KEY (id)
);

-- Step 3: Insert standard permissions for QSHE system
INSERT INTO public.permissions (permission_key, permission_name, description, category, is_sensitive) VALUES
-- Safety Patrol Permissions
('patrol.create', 'Create Patrols', 'Create new safety patrol reports', 'patrol', false),
('patrol.edit', 'Edit Patrols', 'Edit existing patrol reports', 'patrol', false),
('patrol.delete', 'Delete Patrols', 'Delete patrol reports', 'patrol', true),
('patrol.view_all', 'View All Patrols', 'View patrol reports across all projects', 'patrol', false),
('patrol.approve', 'Approve Patrols', 'Approve and finalize patrol reports', 'patrol', true),

-- Issue Management Permissions
('issue.create', 'Create Issues', 'Create new safety issues', 'issue', false),
('issue.assign', 'Assign Issues', 'Assign issues to responsible persons', 'issue', false),
('issue.resolve', 'Resolve Issues', 'Mark issues as resolved', 'issue', false),
('issue.view_all', 'View All Issues', 'View issues across all projects', 'issue', false),

-- Project Management Permissions
('project.create', 'Create Projects', 'Create new projects', 'project', true),
('project.edit', 'Edit Projects', 'Edit project details', 'project', true),
('project.delete', 'Delete Projects', 'Delete projects', 'project', true),
('project.view_all', 'View All Projects', 'View all company projects', 'project', false),
('project.manage_members', 'Manage Project Members', 'Add/remove project members', 'project', true),

-- User Management Permissions
('user.create', 'Create Users', 'Create new user accounts', 'user', true),
('user.edit', 'Edit Users', 'Edit user profiles and permissions', 'user', true),
('user.delete', 'Delete Users', 'Delete user accounts', 'user', true),
('user.view_all', 'View All Users', 'View all company users', 'user', false),
('user.manage_roles', 'Manage User Roles', 'Assign/modify user roles', 'user', true),

-- Company Management Permissions
('company.edit', 'Edit Company', 'Edit company profile and settings', 'company', true),
('company.manage_external_workers', 'Manage External Workers', 'Invite and manage external workers', 'company', true),
('company.view_analytics', 'View Analytics', 'Access company analytics and reports', 'company', false),

-- Risk Management Permissions
('risk.create', 'Create Risk Assessments', 'Create new risk assessments', 'risk', false),
('risk.edit', 'Edit Risk Assessments', 'Edit existing risk assessments', 'risk', false),
('risk.approve', 'Approve Risk Assessments', 'Approve risk assessment reports', 'risk', true),
('risk.view_all', 'View All Risk Assessments', 'View risk assessments across projects', 'risk', false),

-- Document Management Permissions
('document.upload', 'Upload Documents', 'Upload company documents', 'document', false),
('document.delete', 'Delete Documents', 'Delete documents', 'document', true),
('document.view_sensitive', 'View Sensitive Documents', 'Access confidential documents', 'document', true),

-- System Administration Permissions
('system.admin', 'System Administration', 'Full system administrative access', 'system', true),
('system.audit', 'System Audit', 'Access audit logs and system reports', 'system', true),
('system.backup', 'System Backup', 'Perform system backups', 'system', true)

ON CONFLICT (permission_key) DO NOTHING;

-- Step 4: Create standard company roles with predefined permissions
CREATE OR REPLACE FUNCTION create_standard_company_roles(p_company_id uuid)
RETURNS void AS $$
BEGIN
    -- Company Admin Role
    INSERT INTO public.company_roles (company_id, role_name, role_description, permissions, is_system_role)
    VALUES (
        p_company_id,
        'company_admin',
        'Full administrative access within the company',
        '["user.create", "user.edit", "user.delete", "user.view_all", "user.manage_roles", 
          "project.create", "project.edit", "project.delete", "project.view_all", "project.manage_members",
          "patrol.create", "patrol.edit", "patrol.delete", "patrol.view_all", "patrol.approve",
          "issue.create", "issue.assign", "issue.resolve", "issue.view_all",
          "risk.create", "risk.edit", "risk.approve", "risk.view_all",
          "company.edit", "company.manage_external_workers", "company.view_analytics",
          "document.upload", "document.delete", "document.view_sensitive"]'::jsonb,
        true
    ) ON CONFLICT (company_id, role_name) DO NOTHING;

    -- Project Manager Role
    INSERT INTO public.company_roles (company_id, role_name, role_description, permissions, is_system_role)
    VALUES (
        p_company_id,
        'project_manager',
        'Manages specific projects and their teams',
        '["project.edit", "project.view_all", "project.manage_members",
          "patrol.create", "patrol.edit", "patrol.view_all", "patrol.approve",
          "issue.create", "issue.assign", "issue.resolve", "issue.view_all",
          "risk.create", "risk.edit", "risk.view_all",
          "user.view_all", "document.upload"]'::jsonb,
        true
    ) ON CONFLICT (company_id, role_name) DO NOTHING;

    -- Safety Officer Role
    INSERT INTO public.company_roles (company_id, role_name, role_description, permissions, is_system_role)
    VALUES (
        p_company_id,
        'safety_officer',
        'Responsible for safety compliance and patrol oversight',
        '["patrol.create", "patrol.edit", "patrol.view_all", "patrol.approve",
          "issue.create", "issue.assign", "issue.resolve", "issue.view_all",
          "risk.create", "risk.edit", "risk.approve", "risk.view_all",
          "document.upload", "document.view_sensitive"]'::jsonb,
        true
    ) ON CONFLICT (company_id, role_name) DO NOTHING;

    -- Supervisor Role
    INSERT INTO public.company_roles (company_id, role_name, role_description, permissions, is_system_role)
    VALUES (
        p_company_id,
        'supervisor',
        'Supervises teams and basic project operations',
        '["patrol.create", "patrol.edit", "patrol.view_all",
          "issue.create", "issue.assign", "issue.resolve", "issue.view_all",
          "risk.create", "risk.edit", "risk.view_all",
          "user.view_all", "document.upload"]'::jsonb,
        true
    ) ON CONFLICT (company_id, role_name) DO NOTHING;

    -- External Worker Role (for contractors, consultants, etc.)
    INSERT INTO public.company_roles (company_id, role_name, role_description, permissions, is_system_role)
    VALUES (
        p_company_id,
        'external_worker',
        'External contractor or consultant with limited access',
        '["patrol.create", "patrol.edit", "issue.create", "risk.create", "document.upload"]'::jsonb,
        true
    ) ON CONFLICT (company_id, role_name) DO NOTHING;

    -- Member Role (basic access)
    INSERT INTO public.company_roles (company_id, role_name, role_description, permissions, is_system_role)
    VALUES (
        p_company_id,
        'member',
        'Basic member with read access and limited actions',
        '["patrol.create", "issue.create", "risk.create", "document.upload"]'::jsonb,
        true
    ) ON CONFLICT (company_id, role_name) DO NOTHING;

    -- Guest Role (very limited access)
    INSERT INTO public.company_roles (company_id, role_name, role_description, permissions, is_system_role)
    VALUES (
        p_company_id,
        'guest',
        'Guest access with view-only permissions',
        '["document.upload"]'::jsonb,
        true
    ) ON CONFLICT (company_id, role_name) DO NOTHING;

    RAISE NOTICE 'Standard roles created for company: %', p_company_id;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Update user_company_associations to reference company_roles
ALTER TABLE public.user_company_associations 
    ADD COLUMN IF NOT EXISTS company_role_id uuid,
    ADD CONSTRAINT user_company_associations_company_role_id_fkey 
    FOREIGN KEY (company_role_id) REFERENCES public.company_roles(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_company_role_id ON public.user_company_associations(company_role_id);

-- Step 6: Create function to check user permissions
CREATE OR REPLACE FUNCTION user_has_permission(
    p_user_id uuid, 
    p_company_id uuid, 
    p_permission_key varchar
)
RETURNS boolean AS $$
DECLARE
    has_permission boolean := false;
BEGIN
    -- Check if user has the permission through their company role
    SELECT EXISTS (
        SELECT 1 
        FROM public.user_company_associations uca
        JOIN public.company_roles cr ON uca.company_role_id = cr.id
        WHERE uca.user_id = p_user_id 
        AND uca.company_id = p_company_id
        AND uca.status = 'active'
        AND uca.approval_status = 'approved'
        AND (uca.end_date IS NULL OR uca.end_date > CURRENT_DATE)
        AND cr.permissions ? p_permission_key
    ) INTO has_permission;
    
    -- Also check if user is system admin (has all permissions)
    IF NOT has_permission THEN
        SELECT EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = p_user_id 
            AND authority_level = 'system_admin'
        ) INTO has_permission;
    END IF;
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create function to get user permissions for a company
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id uuid, p_company_id uuid)
RETURNS TABLE(permission_key varchar, permission_name varchar, category varchar) AS $$
BEGIN
    -- System admins get all permissions
    IF EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id AND authority_level = 'system_admin') THEN
        RETURN QUERY
        SELECT p.permission_key, p.permission_name, p.category
        FROM public.permissions p
        ORDER BY p.category, p.permission_name;
    ELSE
        -- Regular users get permissions based on their company role
        RETURN QUERY
        SELECT DISTINCT p.permission_key, p.permission_name, p.category
        FROM public.user_company_associations uca
        JOIN public.company_roles cr ON uca.company_role_id = cr.id
        JOIN public.permissions p ON (cr.permissions ? p.permission_key)
        WHERE uca.user_id = p_user_id 
        AND uca.company_id = p_company_id
        AND uca.status = 'active'
        AND uca.approval_status = 'approved'
        AND (uca.end_date IS NULL OR uca.end_date > CURRENT_DATE)
        ORDER BY p.category, p.permission_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create function to assign role to user in company
CREATE OR REPLACE FUNCTION assign_user_company_role(
    p_user_id uuid,
    p_company_id uuid,
    p_role_name varchar,
    p_assigned_by uuid DEFAULT NULL,
    p_auto_approve boolean DEFAULT false
)
RETURNS uuid AS $$
DECLARE
    role_id uuid;
    association_id uuid;
    approval_status varchar;
    approved_at timestamp with time zone;
BEGIN
    -- Get the company role ID
    SELECT id INTO role_id
    FROM public.company_roles
    WHERE company_id = p_company_id AND role_name = p_role_name;
    
    IF role_id IS NULL THEN
        RAISE EXCEPTION 'Role % does not exist for company %', p_role_name, p_company_id;
    END IF;
    
    -- Determine approval status
    IF p_auto_approve THEN
        approval_status := 'approved';
        approved_at := now();
    ELSE
        approval_status := 'pending';
        approved_at := NULL;
    END IF;
    
    -- Create or update association
    INSERT INTO public.user_company_associations (
        user_id, company_id, role_in_company, company_role_id, 
        status, approval_status, approved_by, approved_at
    ) VALUES (
        p_user_id, p_company_id, p_role_name, role_id,
        'active', approval_status, p_assigned_by, approved_at
    )
    ON CONFLICT (user_id, company_id, role_in_company, status) 
    DO UPDATE SET
        company_role_id = role_id,
        approval_status = approval_status,
        approved_by = p_assigned_by,
        approved_at = approved_at,
        updated_at = now()
    RETURNING id INTO association_id;
    
    RETURN association_id;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create view for user role details
CREATE OR REPLACE VIEW user_company_role_details AS
SELECT 
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    u.worker_type,
    u.verification_status,
    uca.company_id,
    c.name as company_name,
    uca.role_in_company,
    cr.role_description,
    cr.permissions,
    uca.status as association_status,
    uca.approval_status,
    uca.start_date,
    uca.end_date,
    CASE WHEN u.primary_company_id = uca.company_id THEN true ELSE false END as is_primary_company
FROM public.users u
JOIN public.user_company_associations uca ON u.id = uca.user_id
JOIN public.companies c ON uca.company_id = c.id
JOIN public.company_roles cr ON uca.company_role_id = cr.id
WHERE uca.status = 'active';

-- Step 10: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_roles_company_id ON public.company_roles(company_id);
CREATE INDEX IF NOT EXISTS idx_company_roles_permissions ON public.company_roles USING gin(permissions);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON public.permissions(category);

-- Step 11: Enable RLS on new tables
ALTER TABLE public.company_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_roles
CREATE POLICY "Users can view company roles for their companies" ON public.company_roles
    FOR SELECT USING (
        company_id IN (
            SELECT uca.company_id 
            FROM public.user_company_associations uca
            WHERE uca.user_id = auth.uid() 
            AND uca.status = 'active'
            AND uca.approval_status = 'approved'
        )
    );

CREATE POLICY "Company admins can manage company roles" ON public.company_roles
    FOR ALL USING (
        user_has_permission(auth.uid(), company_id, 'user.manage_roles')
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND authority_level = 'system_admin'
        )
    );

-- RLS Policies for permissions (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view permissions" ON public.permissions
    FOR SELECT TO authenticated USING (true);

-- Step 12: Create trigger for updating company roles timestamp
CREATE OR REPLACE FUNCTION update_company_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_company_roles_updated_at
    BEFORE UPDATE ON public.company_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_company_roles_updated_at();

-- Step 13: Migration function to create standard roles for existing companies
CREATE OR REPLACE FUNCTION migrate_existing_companies_to_role_system()
RETURNS void AS $$
DECLARE
    company_record RECORD;
BEGIN
    -- Create standard roles for all existing companies
    FOR company_record IN 
        SELECT id FROM public.companies WHERE status = 'active'
    LOOP
        PERFORM create_standard_company_roles(company_record.id);
    END LOOP;
    
    -- Update existing user associations to use the new role system
    UPDATE public.user_company_associations uca
    SET company_role_id = cr.id
    FROM public.company_roles cr
    WHERE uca.company_id = cr.company_id
    AND uca.role_in_company = cr.role_name
    AND uca.company_role_id IS NULL;
    
    RAISE NOTICE 'Migration completed: All companies now have standard role system';
END;
$$ LANGUAGE plpgsql;

-- Step 14: Execute migration for existing companies
SELECT migrate_existing_companies_to_role_system();

-- Step 15: Create API helper functions for application use
CREATE OR REPLACE FUNCTION get_user_companies_with_roles(p_user_id uuid)
RETURNS TABLE(
    company_id uuid,
    company_name varchar,
    role_name varchar,
    role_description text,
    permissions jsonb,
    is_primary boolean,
    association_status varchar
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uca.company_id,
        c.name as company_name,
        cr.role_name,
        cr.role_description,
        cr.permissions,
        (u.primary_company_id = uca.company_id) as is_primary,
        uca.status as association_status
    FROM public.user_company_associations uca
    JOIN public.companies c ON uca.company_id = c.id
    JOIN public.company_roles cr ON uca.company_role_id = cr.id
    JOIN public.users u ON uca.user_id = u.id
    WHERE uca.user_id = p_user_id
    AND uca.status = 'active'
    AND uca.approval_status = 'approved'
    AND (uca.end_date IS NULL OR uca.end_date > CURRENT_DATE)
    ORDER BY 
        (u.primary_company_id = uca.company_id) DESC,
        c.name;
END;
$$ LANGUAGE plpgsql;

-- Step 16: Add comments for documentation
COMMENT ON TABLE public.company_roles IS 'Defines roles specific to each company with granular permissions';
COMMENT ON TABLE public.permissions IS 'System-wide permission definitions that can be assigned to roles';
COMMENT ON COLUMN public.company_roles.permissions IS 'JSON array of permission keys that this role grants';
COMMENT ON COLUMN public.permissions.is_sensitive IS 'Marks permissions that require additional approval or audit logging';
COMMENT ON FUNCTION user_has_permission(uuid, uuid, varchar) IS 'Checks if a user has a specific permission in a company context';
COMMENT ON FUNCTION get_user_permissions(uuid, uuid) IS 'Returns all permissions a user has for a specific company';

-- Final summary
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== MULTI-COMPANY ROLE MANAGEMENT SYSTEM CREATED ===';
    RAISE NOTICE 'Features implemented:';
    RAISE NOTICE '1. Company-specific roles with granular permissions';
    RAISE NOTICE '2. Standard roles: company_admin, project_manager, safety_officer, supervisor, external_worker, member, guest';
    RAISE NOTICE '3. Permission-based access control with % total permissions', (SELECT COUNT(*) FROM public.permissions);
    RAISE NOTICE '4. User permission checking functions';
    RAISE NOTICE '5. Role assignment and management functions';
    RAISE NOTICE '6. RLS policies for secure access';
    RAISE NOTICE '7. Migration of existing company relationships';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '- Update frontend to use new permission checking';
    RAISE NOTICE '- Implement role-based UI components';
    RAISE NOTICE '- Test multi-company user scenarios';
    RAISE NOTICE '======================================================';
END;
$$;