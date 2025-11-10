-- Fix RLS policies for users table to allow reading user information
-- This is needed to display user names in corrective actions

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all to view users" ON users;
DROP POLICY IF EXISTS "Users can view all users" ON users;

-- Enable RLS if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to read from users table
CREATE POLICY "Allow all to view users" 
ON users FOR SELECT 
USING (true);

-- Verify the policy
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';
