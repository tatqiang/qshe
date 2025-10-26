-- Add missing fields to existing users table for Azure AD registration
-- Run this in Supabase SQL editor

-- Add department field
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS department TEXT;

-- Add job_title field  
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS job_title TEXT;

-- Add azure_user_id field to link with Azure AD
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS azure_user_id TEXT UNIQUE;

-- Create index for azure_user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_azure_user_id 
ON public.users USING btree (azure_user_id);

-- Create index for department
CREATE INDEX IF NOT EXISTS idx_users_department 
ON public.users USING btree (department);

-- Create index for job_title  
CREATE INDEX IF NOT EXISTS idx_users_job_title
ON public.users USING btree (job_title);

-- Verify the new fields were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
AND column_name IN ('department', 'job_title', 'azure_user_id')
ORDER BY column_name;