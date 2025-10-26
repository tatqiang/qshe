-- Add Nationality and Thai Name Fields to Users Table
-- This script adds the missing fields for the updated user management system
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Add Thai name fields (if not already added)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS first_name_thai VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_name_thai VARCHAR(255);

-- 2. Add nationality field for demographic tracking
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS nationality VARCHAR(100);

-- 3. Add comments for documentation
COMMENT ON COLUMN public.users.first_name_thai IS 'First name in Thai language';
COMMENT ON COLUMN public.users.last_name_thai IS 'Last name in Thai language';
COMMENT ON COLUMN public.users.nationality IS 'User nationality for demographic tracking and compliance';

-- 4. Create index for nationality field (for reporting purposes)
CREATE INDEX IF NOT EXISTS idx_users_nationality ON public.users(nationality);

-- 5. Verify the fields were added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users' 
  AND column_name IN ('first_name_thai', 'last_name_thai', 'nationality')
ORDER BY column_name;

-- 6. Show updated table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

SELECT 'Nationality and Thai name fields added successfully to users table!' as status;
