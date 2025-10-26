-- User-Company Many-to-Many Relationship Migration
-- This migration implements:
-- 1. Many-to-many relationship between users and companies
-- 2. Removes face scan requirements (face_descriptors column)
-- 3. Supports external workers working for multiple companies
-- 4. Company-specific role assignments

-- Step 1: Create user_company_associations junction table
CREATE TABLE IF NOT EXISTS public.user_company_associations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    company_id uuid NOT NULL,
    role_in_company VARCHAR NOT NULL DEFAULT 'member',
    status VARCHAR NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    approval_status VARCHAR DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approved_by uuid,
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    CONSTRAINT user_company_associations_pkey PRIMARY KEY (id),
    CONSTRAINT user_company_associations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT user_company_associations_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE,
    CONSTRAINT user_company_associations_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id),
    
    -- Ensure unique combination of user, company, and role (no duplicate active assignments)
    CONSTRAINT unique_active_user_company_role UNIQUE (user_id, company_id, role_in_company, status)
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_company_user_id ON public.user_company_associations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_company_company_id ON public.user_company_associations(company_id);
CREATE INDEX IF NOT EXISTS idx_user_company_status ON public.user_company_associations(status);
CREATE INDEX IF NOT EXISTS idx_user_company_role ON public.user_company_associations(role_in_company);
CREATE INDEX IF NOT EXISTS idx_user_company_active ON public.user_company_associations(user_id, company_id) WHERE status = 'active';

-- Step 3: Add new fields to users table for multi-company support
ALTER TABLE public.users 
    ADD COLUMN IF NOT EXISTS primary_company_id uuid,
    ADD COLUMN IF NOT EXISTS worker_type VARCHAR DEFAULT 'internal' CHECK (worker_type IN ('internal', 'contractor', 'consultant', 'temporary', 'visitor')),
    ADD COLUMN IF NOT EXISTS verification_status VARCHAR DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
    ADD COLUMN IF NOT EXISTS external_worker_id VARCHAR, -- For external system integration
    ADD COLUMN IF NOT EXISTS nationality VARCHAR,
    ADD COLUMN IF NOT EXISTS passport_number VARCHAR,
    ADD COLUMN IF NOT EXISTS work_permit_number VARCHAR,
    ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR,
    ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR;

-- Add foreign key for primary company
ALTER TABLE public.users 
    ADD CONSTRAINT users_primary_company_id_fkey 
    FOREIGN KEY (primary_company_id) REFERENCES public.companies(id);

-- Step 4: Remove face scan related columns (prepare for removal)
-- First, create a backup table for face descriptors if needed
CREATE TABLE IF NOT EXISTS public.user_face_descriptors_backup AS 
SELECT id, face_descriptors, created_at, updated_at 
FROM public.users 
WHERE face_descriptors IS NOT NULL;

-- Remove face_descriptors column
ALTER TABLE public.users DROP COLUMN IF EXISTS face_descriptors;

-- Step 5: Create migration function to move existing single company relationships to junction table
CREATE OR REPLACE FUNCTION migrate_user_company_relationships()
RETURNS void AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- For each user with a company_id, create an association record
    FOR user_record IN 
        SELECT id, company_id, user_type, authority_level, created_at
        FROM public.users 
        WHERE company_id IS NOT NULL
    LOOP
        -- Insert into junction table if not already exists
        INSERT INTO public.user_company_associations (
            user_id, 
            company_id, 
            role_in_company, 
            status, 
            approval_status,
            start_date,
            created_at
        )
        SELECT 
            user_record.id,
            user_record.company_id,
            CASE 
                WHEN user_record.authority_level = 'admin' THEN 'admin'
                WHEN user_record.authority_level = 'manager' THEN 'manager'
                WHEN user_record.authority_level = 'supervisor' THEN 'supervisor'
                ELSE 'member'
            END,
            'active',
            'approved', -- Existing relationships are pre-approved
            COALESCE(user_record.created_at::date, CURRENT_DATE),
            user_record.created_at
        WHERE NOT EXISTS (
            SELECT 1 FROM public.user_company_associations 
            WHERE user_id = user_record.id AND company_id = user_record.company_id
        );
        
        -- Set primary company
        UPDATE public.users 
        SET primary_company_id = user_record.company_id
        WHERE id = user_record.id AND primary_company_id IS NULL;
        
    END LOOP;
    
    RAISE NOTICE 'Migration completed: Moved existing user-company relationships to junction table';
END;
$$ LANGUAGE plpgsql;

-- Step 6: Run the migration
SELECT migrate_user_company_relationships();

-- Step 7: Create helper functions for multi-company operations

-- Function to get all companies for a user
CREATE OR REPLACE FUNCTION get_user_companies(p_user_id uuid)
RETURNS TABLE(
    company_id uuid,
    company_name varchar,
    role_in_company varchar,
    status varchar,
    start_date date,
    end_date date
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uca.company_id,
        c.name as company_name,
        uca.role_in_company,
        uca.status,
        uca.start_date,
        uca.end_date
    FROM public.user_company_associations uca
    JOIN public.companies c ON c.id = uca.company_id
    WHERE uca.user_id = p_user_id
    AND uca.status = 'active'
    ORDER BY 
        CASE WHEN uca.company_id = (SELECT primary_company_id FROM public.users WHERE id = p_user_id) THEN 0 ELSE 1 END,
        uca.start_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has access to company
CREATE OR REPLACE FUNCTION user_has_company_access(p_user_id uuid, p_company_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_company_associations
        WHERE user_id = p_user_id 
        AND company_id = p_company_id 
        AND status = 'active'
        AND approval_status = 'approved'
        AND (end_date IS NULL OR end_date > CURRENT_DATE)
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get user role in specific company
CREATE OR REPLACE FUNCTION get_user_role_in_company(p_user_id uuid, p_company_id uuid)
RETURNS varchar AS $$
DECLARE
    user_role varchar;
BEGIN
    SELECT role_in_company INTO user_role
    FROM public.user_company_associations
    WHERE user_id = p_user_id 
    AND company_id = p_company_id 
    AND status = 'active'
    AND approval_status = 'approved'
    LIMIT 1;
    
    RETURN COALESCE(user_role, 'none');
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create view for easy querying of user-company relationships
CREATE OR REPLACE VIEW user_company_details AS
SELECT 
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    u.user_type,
    u.worker_type,
    u.verification_status,
    uca.company_id,
    c.name as company_name,
    uca.role_in_company,
    uca.status as association_status,
    uca.start_date,
    uca.end_date,
    uca.approval_status,
    CASE WHEN u.primary_company_id = uca.company_id THEN true ELSE false END as is_primary_company
FROM public.users u
LEFT JOIN public.user_company_associations uca ON u.id = uca.user_id
LEFT JOIN public.companies c ON uca.company_id = c.id;

-- Step 9: Update RLS (Row Level Security) policies for multi-company access
-- Drop existing company-based RLS if it exists
DROP POLICY IF EXISTS "Users can view company data" ON public.users;
DROP POLICY IF EXISTS "Company admins can manage users" ON public.users;

-- Create new RLS policies for user_company_associations
ALTER TABLE public.user_company_associations ENABLE ROW LEVEL SECURITY;

-- Users can see their own associations
CREATE POLICY "Users can view own company associations" ON public.user_company_associations
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- Company admins can manage associations for their company
CREATE POLICY "Company admins can manage associations" ON public.user_company_associations
    FOR ALL USING (
        company_id IN (
            SELECT uca2.company_id 
            FROM public.user_company_associations uca2
            WHERE uca2.user_id = auth.uid() 
            AND uca2.role_in_company IN ('admin', 'manager')
            AND uca2.status = 'active'
            AND uca2.approval_status = 'approved'
        )
    );

-- System admins can manage all associations
CREATE POLICY "System admins can manage all associations" ON public.user_company_associations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND authority_level = 'system_admin'
        )
    );

-- Step 10: Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_company_associations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_company_associations_updated_at
    BEFORE UPDATE ON public.user_company_associations
    FOR EACH ROW
    EXECUTE FUNCTION update_user_company_associations_updated_at();

-- Step 11: Create stored procedure for adding user to company
CREATE OR REPLACE FUNCTION add_user_to_company(
    p_user_id uuid,
    p_company_id uuid,
    p_role varchar DEFAULT 'member',
    p_approved_by uuid DEFAULT NULL,
    p_auto_approve boolean DEFAULT false,
    p_notes text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    association_id uuid;
    approval_status varchar;
    approved_at timestamp with time zone;
BEGIN
    -- Determine approval status
    IF p_auto_approve THEN
        approval_status := 'approved';
        approved_at := now();
    ELSE
        approval_status := 'pending';
        approved_at := NULL;
    END IF;
    
    -- Insert association
    INSERT INTO public.user_company_associations (
        user_id, company_id, role_in_company, status, 
        approval_status, approved_by, approved_at, notes
    ) VALUES (
        p_user_id, p_company_id, p_role, 'active',
        approval_status, p_approved_by, approved_at, p_notes
    ) RETURNING id INTO association_id;
    
    -- Set as primary company if user doesn't have one
    UPDATE public.users 
    SET primary_company_id = p_company_id 
    WHERE id = p_user_id AND primary_company_id IS NULL;
    
    RETURN association_id;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Add comments for documentation
COMMENT ON TABLE public.user_company_associations IS 'Junction table supporting many-to-many relationship between users and companies. Allows external workers to be associated with multiple companies with different roles.';
COMMENT ON COLUMN public.user_company_associations.role_in_company IS 'Role of user within this specific company (admin, manager, supervisor, member, contractor, etc.)';
COMMENT ON COLUMN public.user_company_associations.approval_status IS 'Whether this association has been approved by company admin (pending, approved, rejected)';
COMMENT ON COLUMN public.users.worker_type IS 'Type of worker: internal (company employee), contractor, consultant, temporary, visitor';
COMMENT ON COLUMN public.users.primary_company_id IS 'Primary/main company for this user (used for default context)';
COMMENT ON COLUMN public.users.verification_status IS 'Verification status for external workers (unverified, pending, verified, rejected)';

-- Final step: Print summary
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== MIGRATION SUMMARY ===';
    RAISE NOTICE 'Successfully created many-to-many user-company relationship structure:';
    RAISE NOTICE '1. Created user_company_associations junction table';
    RAISE NOTICE '2. Removed face_descriptors column (backed up first)';
    RAISE NOTICE '3. Added multi-company support fields to users table';
    RAISE NOTICE '4. Migrated existing single company relationships';
    RAISE NOTICE '5. Created helper functions and RLS policies';
    RAISE NOTICE '6. Added triggers and stored procedures';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '- Update application code to use new association table';
    RAISE NOTICE '- Test multi-company user workflows';
    RAISE NOTICE '- Update Azure AD B2C custom attributes';
    RAISE NOTICE '========================';
END;
$$;