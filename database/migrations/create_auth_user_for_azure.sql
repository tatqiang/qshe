-- =====================================================
-- Function: Create Supabase Auth User for Azure AD Users
-- Description: Sync Azure AD users to Supabase auth.users
-- Date: 2026-02-02
-- =====================================================

-- Function to create auth user if not exists
CREATE OR REPLACE FUNCTION public.ensure_auth_user(
  p_user_id UUID,
  p_email TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_user_id UUID;
BEGIN
  -- Check if auth user exists
  SELECT id INTO v_auth_user_id
  FROM auth.users
  WHERE id = p_user_id;
  
  -- If not exists, create one
  IF v_auth_user_id IS NULL THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      aud,
      role
    )
    VALUES (
      p_user_id,
      '00000000-0000-0000-0000-000000000000',
      p_email,
      crypt('', gen_salt('bf')), -- Dummy password (won't be used)
      NOW(),
      NOW(),
      NOW(),
      'authenticated',
      'authenticated'
    )
    RETURNING id INTO v_auth_user_id;
  END IF;
  
  RETURN v_auth_user_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.ensure_auth_user(UUID, TEXT) TO authenticated;

-- Comment
COMMENT ON FUNCTION public.ensure_auth_user IS 'Creates Supabase auth user for Azure AD users if not exists';
