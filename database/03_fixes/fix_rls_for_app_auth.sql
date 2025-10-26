-- ============================================
-- FIX RLS POLICIES FOR APP-LEVEL AUTHENTICATION
-- ============================================
-- This app doesn't use Supabase auth, so auth.uid() is always null.
-- We need to adjust RLS policies to work with app-level user IDs.

-- Drop existing photo policies
DROP POLICY IF EXISTS "Photos are viewable with audit" ON public.safety_audit_photos;
DROP POLICY IF EXISTS "Photos are insertable by audit creators" ON public.safety_audit_photos;
DROP POLICY IF EXISTS "Photos are deletable by audit creators" ON public.safety_audit_photos;

-- Create new policies that don't rely on auth.uid()
-- Since the app handles authentication at the application level,
-- we'll allow all authenticated operations and trust the app logic

-- Photos: Allow all authenticated users to view photos
CREATE POLICY "Photos are viewable by all" 
  ON public.safety_audit_photos FOR SELECT 
  USING (true);

-- Photos: Allow inserting photos (app handles authorization)
CREATE POLICY "Photos are insertable by all" 
  ON public.safety_audit_photos FOR INSERT 
  WITH CHECK (true);

-- Photos: Allow deleting photos (app handles authorization)
CREATE POLICY "Photos are deletable by all" 
  ON public.safety_audit_photos FOR DELETE 
  USING (true);

-- Update audit policies to be more permissive
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Audits are insertable by authorized users" ON public.safety_audits;
DROP POLICY IF EXISTS "Audits are updatable by creators" ON public.safety_audits;

-- Create new permissive policies for audits
CREATE POLICY "Audits are insertable by all authenticated" 
  ON public.safety_audits FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Audits are updatable by all authenticated" 
  ON public.safety_audits FOR UPDATE 
  USING (true);

-- Update results policies
DROP POLICY IF EXISTS "Results are insertable by audit creators" ON public.safety_audit_results;
DROP POLICY IF EXISTS "Results are updatable by audit creators" ON public.safety_audit_results;

CREATE POLICY "Results are insertable by all" 
  ON public.safety_audit_results FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Results are updatable by all" 
  ON public.safety_audit_results FOR UPDATE 
  USING (true);

-- Update audit companies policies
DROP POLICY IF EXISTS "Audit companies are insertable by audit creators" ON public.safety_audit_companies;
DROP POLICY IF EXISTS "Audit companies are updatable by audit creators" ON public.safety_audit_companies;

CREATE POLICY "Audit companies are insertable by all" 
  ON public.safety_audit_companies FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Audit companies are updatable by all" 
  ON public.safety_audit_companies FOR UPDATE 
  USING (true);

COMMENT ON POLICY "Photos are viewable by all" ON public.safety_audit_photos IS 
  'App uses its own authentication system (Azure AD), not Supabase auth. RLS policies allow all operations and rely on app-level authorization.';

COMMENT ON POLICY "Audits are insertable by all authenticated" ON public.safety_audits IS 
  'App uses its own authentication system (Azure AD), not Supabase auth. Authorization handled at application level.';
