-- Add Thai name fields to users table
-- Run this in Supabase Dashboard > SQL Editor

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS first_name_thai VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_name_thai VARCHAR(255);

-- Add comments for documentation
COMMENT ON COLUMN public.users.first_name_thai IS 'First name in Thai language';
COMMENT ON COLUMN public.users.last_name_thai IS 'Last name in Thai language';

-- Verify the fields were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users' 
  AND column_name IN ('first_name_thai', 'last_name_thai')
ORDER BY column_name;

SELECT 'Thai name fields added successfully to users table!' as status;
