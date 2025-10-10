-- Test SQL Script for Password Reset Functions
-- Run these queries to test the password reset functionality

-- 1. Test the request_password_reset function
-- Replace 'snithat@gmail.com' with an actual email from your users table
SELECT public.request_password_reset('snithat@gmail.com');

-- 2. Test with a non-existent email (should return error)
SELECT public.request_password_reset('nonexistent@example.com');

-- 3. Test the validate_reset_token function
-- First get a token from step 1, then test validation
-- Replace 'YOUR_TOKEN_HERE' with the actual token from step 1
-- SELECT public.validate_reset_token('YOUR_TOKEN_HERE');

-- 4. Test with an invalid token (should return error)
SELECT public.validate_reset_token('invalid-token');

-- 5. View all users to see available emails for testing
SELECT id, email, status, first_name, last_name 
FROM public.users 
WHERE status = 'active' 
LIMIT 10;

-- 6. Test password reset with a specific user ID
-- Replace with actual user ID from your database
-- SELECT reset_user_password('29a51712-ca8a-494e-bdcd-73ee7cb666bc', 'NewPassword123!');

-- Example workflow:
-- Step 1: Generate token for user
/*
SELECT public.request_password_reset('snithat@gmail.com');
-- Copy the resetToken from the result

-- Step 2: Validate the token
SELECT public.validate_reset_token('TOKEN_FROM_STEP_1');
-- Should return success: true

-- Step 3: Use the token to reset password (replace with actual values)
SELECT reset_user_password('USER_ID_FROM_TOKEN', 'NewSecurePassword123!');
*/

-- Utility: Decode a token to see its contents (for debugging)
-- Replace 'YOUR_TOKEN_HERE' with an actual token
/*
SELECT convert_from(
  decode('YOUR_TOKEN_HERE', 'base64'), 
  'UTF8'
)::JSON as decoded_token;
*/
