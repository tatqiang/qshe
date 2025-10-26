-- Azure PostgreSQL Database Migration Script
-- This script migrates from Supabase to Azure Database for PostgreSQL

-- ===================================
-- PHASE 1: REMOVE SUPABASE DEPENDENCIES
-- ===================================

-- Remove Supabase Auth specific functions
DROP FUNCTION IF EXISTS auth.uid() CASCADE;
DROP FUNCTION IF EXISTS auth.jwt() CASCADE;
DROP FUNCTION IF EXISTS auth.role() CASCADE;

-- Remove Supabase Auth schema references (if any custom ones exist)
-- Note: auth.users table will remain but we'll use Azure AD for authentication

-- ===================================
-- PHASE 2: CREATE AZURE AD USER CONTEXT
-- ===================================

-- Function to get current user ID from application context
-- This will be set by the application when a user logs in with Azure AD
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS uuid AS $$
BEGIN
  -- Get user ID from application-set session variable
  -- This will be set by the application after Azure AD authentication
  RETURN COALESCE(
    current_setting('app.current_user_id', true)::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN '00000000-0000-0000-0000-000000000000'::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set current user context (called by application)
CREATE OR REPLACE FUNCTION set_current_user_context(user_id uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- PHASE 3: UPDATE USER TABLE FOR AZURE AD
-- ===================================

-- Add Azure AD specific columns
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS azure_object_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS user_principal_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS azure_tenant_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS company_domain VARCHAR(100),
ADD COLUMN IF NOT EXISTS job_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS department VARCHAR(255),
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS last_azure_sync TIMESTAMP WITH TIME ZONE;

-- Add indexes for Azure AD lookups
CREATE INDEX IF NOT EXISTS idx_users_azure_object_id ON public.users(azure_object_id);
CREATE INDEX IF NOT EXISTS idx_users_user_principal_name ON public.users(user_principal_name);
CREATE INDEX IF NOT EXISTS idx_users_company_domain ON public.users(company_domain);

-- Add comments for documentation
COMMENT ON COLUMN public.users.azure_object_id IS 'Azure AD Object ID from Microsoft Entra ID';
COMMENT ON COLUMN public.users.user_principal_name IS 'Azure AD User Principal Name (UPN)';
COMMENT ON COLUMN public.users.azure_tenant_id IS 'Azure AD Tenant ID';
COMMENT ON COLUMN public.users.company_domain IS 'Company email domain (e.g., th.jec.com)';
COMMENT ON COLUMN public.users.job_title IS 'Job title from Azure AD';
COMMENT ON COLUMN public.users.department IS 'Department from Azure AD';
COMMENT ON COLUMN public.users.manager_id IS 'Reference to manager user';
COMMENT ON COLUMN public.users.last_azure_sync IS 'Last sync with Azure AD';

-- ===================================
-- PHASE 4: UPDATE RLS POLICIES FOR AZURE AD
-- ===================================

-- Drop existing RLS policies that depend on auth.uid()
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;

-- Create new RLS policies using our Azure AD user context
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (id = get_current_user_id());

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (id = get_current_user_id());

CREATE POLICY "System admins can view all users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = get_current_user_id() 
      AND role = 'system_admin'
    )
  );

-- ===================================
-- PHASE 5: UPDATE OTHER TABLES' RLS POLICIES
-- ===================================

-- Update projects table RLS
DROP POLICY IF EXISTS "Users can view assigned projects" ON public.projects;
CREATE POLICY "Users can view assigned projects" ON public.projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = id 
      AND pm.user_id = get_current_user_id()
    )
  );

-- Update patrols table RLS
DROP POLICY IF EXISTS "Users can view own patrols" ON public.safety_patrols;
CREATE POLICY "Users can view own patrols" ON public.safety_patrols
  FOR SELECT USING (created_by = get_current_user_id());

-- Update patrol issues RLS
DROP POLICY IF EXISTS "Users can view patrol issues" ON public.patrol_issues;
CREATE POLICY "Users can view patrol issues" ON public.patrol_issues
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.safety_patrols sp
      WHERE sp.id = patrol_id 
      AND sp.created_by = get_current_user_id()
    )
  );

-- ===================================
-- PHASE 6: CREATE AZURE AD USER SYNC FUNCTION
-- ===================================

-- Function to sync user from Azure AD
CREATE OR REPLACE FUNCTION sync_azure_user(
  p_azure_object_id VARCHAR(255),
  p_user_principal_name VARCHAR(255),
  p_email VARCHAR(255),
  p_first_name VARCHAR(255),
  p_last_name VARCHAR(255),
  p_job_title VARCHAR(255) DEFAULT NULL,
  p_department VARCHAR(255) DEFAULT NULL,
  p_company_domain VARCHAR(100) DEFAULT NULL,
  p_azure_tenant_id VARCHAR(255) DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  user_id uuid;
  existing_user RECORD;
BEGIN
  -- Check if user already exists by Azure Object ID
  SELECT * INTO existing_user 
  FROM public.users 
  WHERE azure_object_id = p_azure_object_id;
  
  IF existing_user IS NOT NULL THEN
    -- Update existing user
    UPDATE public.users SET
      user_principal_name = p_user_principal_name,
      email = p_email,
      first_name = p_first_name,
      last_name = p_last_name,
      job_title = p_job_title,
      department = p_department,
      company_domain = p_company_domain,
      azure_tenant_id = p_azure_tenant_id,
      last_azure_sync = NOW(),
      updated_at = NOW()
    WHERE azure_object_id = p_azure_object_id;
    
    user_id := existing_user.id;
  ELSE
    -- Create new user
    INSERT INTO public.users (
      id,
      azure_object_id,
      user_principal_name,
      email,
      first_name,
      last_name,
      job_title,
      department,
      company_domain,
      azure_tenant_id,
      user_type,
      status,
      role,
      last_azure_sync,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      p_azure_object_id,
      p_user_principal_name,
      p_email,
      p_first_name,
      p_last_name,
      p_job_title,
      p_department,
      p_company_domain,
      p_azure_tenant_id,
      'internal',
      'active',
      'member',
      NOW(),
      NOW(),
      NOW()
    ) RETURNING id INTO user_id;
  END IF;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- PHASE 7: CREATE MIGRATION HELPER FUNCTIONS
-- ===================================

-- Function to migrate existing Supabase users to Azure AD format
CREATE OR REPLACE FUNCTION migrate_existing_users_to_azure()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  company_domain VARCHAR(100);
BEGIN
  -- Update existing users to have Azure-compatible structure
  FOR user_record IN 
    SELECT * FROM public.users 
    WHERE azure_object_id IS NULL 
    AND email IS NOT NULL
  LOOP
    -- Extract company domain from email
    company_domain := split_part(user_record.email, '@', 2);
    
    -- Update user with Azure-compatible fields
    UPDATE public.users SET
      user_principal_name = user_record.email,
      company_domain = company_domain,
      last_azure_sync = NOW()
    WHERE id = user_record.id;
    
    RAISE NOTICE 'Migrated user: % (domain: %)', user_record.email, company_domain;
  END LOOP;
  
  RAISE NOTICE 'Migration completed for existing users';
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- PHASE 8: UPDATE CONFIGURATION TABLES
-- ===================================

-- Create Azure configuration table
CREATE TABLE IF NOT EXISTS public.azure_config (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  client_id VARCHAR(255) NOT NULL,
  allowed_domains TEXT[] NOT NULL DEFAULT ARRAY['th.jec.com'],
  sync_enabled BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default Azure configuration
INSERT INTO public.azure_config (
  tenant_id,
  client_id,
  allowed_domains
) VALUES (
  'your-tenant-id-here',
  'your-client-id-here',
  ARRAY['th.jec.com', 'jec.com']
) ON CONFLICT DO NOTHING;

-- ===================================
-- PHASE 9: CREATE AUDIT FUNCTIONS
-- ===================================

-- Function to log Azure AD authentication events
CREATE TABLE IF NOT EXISTS public.azure_auth_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  azure_object_id VARCHAR(255),
  user_principal_name VARCHAR(255),
  action VARCHAR(50) NOT NULL, -- 'login', 'logout', 'sync', 'error'
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to log authentication events
CREATE OR REPLACE FUNCTION log_azure_auth_event(
  p_user_id UUID,
  p_azure_object_id VARCHAR(255),
  p_user_principal_name VARCHAR(255),
  p_action VARCHAR(50),
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.azure_auth_logs (
    user_id,
    azure_object_id,
    user_principal_name,
    action,
    ip_address,
    user_agent,
    details
  ) VALUES (
    p_user_id,
    p_azure_object_id,
    p_user_principal_name,
    p_action,
    p_ip_address,
    p_user_agent,
    p_details
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- PHASE 10: VERIFICATION QUERIES
-- ===================================

-- Verify the migration
DO $$
BEGIN
  RAISE NOTICE '=== AZURE MIGRATION VERIFICATION ===';
  
  -- Check if new columns exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'azure_object_id'
  ) THEN
    RAISE NOTICE '✅ Azure AD columns added successfully';
  ELSE
    RAISE NOTICE '❌ Azure AD columns missing';
  END IF;
  
  -- Check if new functions exist
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_current_user_id'
  ) THEN
    RAISE NOTICE '✅ Azure AD user context functions created';
  ELSE
    RAISE NOTICE '❌ Azure AD user context functions missing';
  END IF;
  
  -- Check user count
  RAISE NOTICE 'Total users: %', (SELECT COUNT(*) FROM public.users);
  RAISE NOTICE 'Users with Azure fields: %', (SELECT COUNT(*) FROM public.users WHERE azure_object_id IS NOT NULL);
  
  RAISE NOTICE '=== MIGRATION COMPLETE ===';
END;
$$;

-- ===================================
-- FINAL NOTES
-- ===================================

/*
POST-MIGRATION CHECKLIST:

1. Application Updates Required:
   - Replace Supabase auth client with Azure MSAL
   - Update API calls to use set_current_user_context()
   - Update user profile management for Azure AD fields

2. Environment Variables:
   - VITE_AZURE_CLIENT_ID
   - VITE_AZURE_TENANT_ID
   - VITE_AZURE_DB_CONNECTION_STRING

3. Manual Steps:
   - Run: SELECT migrate_existing_users_to_azure();
   - Update azure_config table with actual tenant/client IDs
   - Test authentication flow
   - Verify RLS policies work correctly

4. Security Considerations:
   - All authentication now goes through Azure AD
   - RLS policies use application-set user context
   - Audit logging for compliance
   - Company domain validation

5. Testing:
   - Test login with company Microsoft accounts
   - Verify user data sync from Azure AD
   - Test RLS policies with different user roles
   - Verify patrol and project access controls
*/