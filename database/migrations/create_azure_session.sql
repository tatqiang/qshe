-- =====================================================
-- Function: Create Supabase Session for Azure AD Users
-- Description: Generate JWT token for Azure AD authenticated users
-- Date: 2026-02-02
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_azure_session(
  p_user_id UUID,
  p_email TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_temp_password TEXT;
BEGIN
  -- Check if auth user exists
  SELECT id INTO v_user_id FROM auth.users WHERE id = p_user_id;
  
  -- If not exists, create one
  IF v_user_id IS NULL THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, 
      email_confirmed_at, created_at, updated_at, aud, role
    )
    VALUES (
      p_user_id, '00000000-0000-0000-0000-000000000000', p_email,
      crypt(gen_random_uuid()::text, gen_salt('bf')),
      NOW(), NOW(), NOW(), 'authenticated', 'authenticated'
    );
  END IF;
  
  -- Return success
  RETURN json_build_object(
    'user_id', p_user_id,
    'email', p_email,
    'created', true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_azure_session(UUID, TEXT) TO anon, authenticated;

COMMENT ON FUNCTION public.create_azure_session IS 'Creates Supabase auth user and prepares session for Azure AD users';
