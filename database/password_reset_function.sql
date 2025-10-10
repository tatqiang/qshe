-- Password Reset Function for Supabase
-- This function allows server-side password updates for password reset functionality

-- Create a function to reset user password
CREATE OR REPLACE FUNCTION reset_user_password(
  user_id UUID,
  new_password TEXT,
  reset_token TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  result JSON;
BEGIN
  -- Verify user exists
  SELECT id, email, status 
  INTO user_record 
  FROM auth.users 
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;
  
  -- Update password in auth.users table
  -- Note: This requires proper RLS policies and admin privileges
  UPDATE auth.users 
  SET 
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = NOW(),
    password_updated_at = NOW()
  WHERE id = user_id;
  
  -- Update our users table to record the password reset
  UPDATE public.users 
  SET updated_at = NOW()
  WHERE id = user_id;
  
  -- Return success
  RETURN json_build_object(
    'success', true,
    'message', 'Password updated successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION reset_user_password TO authenticated;

-- Alternative simpler approach: Create a stored procedure for password reset
CREATE OR REPLACE FUNCTION public.request_password_reset(
  user_email TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  reset_token TEXT;
  result JSON;
BEGIN
  -- Find user by email and get name information
  SELECT u.id, u.email, u.status, u.first_name, u.last_name
  INTO user_record 
  FROM public.users u
  WHERE u.email = user_email AND u.status = 'active';
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found or inactive'
    );
  END IF;
  
  -- Generate reset token (simple approach) - now includes user name
  reset_token := encode(
    json_build_object(
      'id', user_record.id,
      'email', user_record.email,
      'firstName', user_record.first_name,
      'lastName', user_record.last_name,
      'type', 'password-reset',
      'timestamp', extract(epoch from now()) * 1000,
      'expiresAt', extract(epoch from now() + interval '24 hours') * 1000
    )::text::bytea, 
    'base64'
  );
  
  -- Return the reset token
  RETURN json_build_object(
    'success', true,
    'resetToken', reset_token,
    'email', user_record.email,
    'firstName', user_record.first_name,
    'lastName', user_record.last_name,
    'expiresIn', '24 hours'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.request_password_reset TO authenticated;

-- Create a function to validate and use reset token
CREATE OR REPLACE FUNCTION public.validate_reset_token(
  reset_token TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token_data JSON;
  user_record RECORD;
  expires_at BIGINT;
  current_timestamp_ms BIGINT;
BEGIN
  -- Decode and parse token
  BEGIN
    token_data := convert_from(decode(reset_token, 'base64'), 'UTF8')::JSON;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Invalid token format'
      );
  END;
  
  -- Extract expiration time
  expires_at := (token_data->>'expiresAt')::BIGINT;
  current_timestamp_ms := extract(epoch from now()) * 1000;
  
  -- Check if token is expired
  IF current_timestamp_ms > expires_at THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Token has expired'
    );
  END IF;
  
  -- Verify user exists
  SELECT id, email, status 
  INTO user_record 
  FROM public.users 
  WHERE id = (token_data->>'id')::UUID 
    AND email = token_data->>'email'
    AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid user or token'
    );
  END IF;
  
  -- Return valid token data
  RETURN json_build_object(
    'success', true,
    'userId', user_record.id,
    'email', user_record.email,
    'valid', true
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.validate_reset_token TO anon, authenticated;
