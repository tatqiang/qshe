-- Backup Essential Data Before Schema Recreation
-- Save the system admin user and any other critical data

-- 1. Backup the system admin user from auth.users
CREATE TEMP TABLE temp_admin_backup AS
SELECT 
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at
FROM auth.users 
WHERE email = 'nithat.su@th.jec.com';

-- 2. Backup the system admin profile from public.users  
CREATE TEMP TABLE temp_admin_profile_backup AS
SELECT 
    id,
    email,
    first_name,
    last_name,
    user_type,
    created_at
FROM public.users 
WHERE email = 'nithat.su@th.jec.com';

-- 3. Show what we're backing up
SELECT 'Auth User Backup' as table_name, count(*) as records FROM temp_admin_backup
UNION ALL
SELECT 'Profile Backup' as table_name, count(*) as records FROM temp_admin_profile_backup;

-- Note: The temp tables will be available during this session only
-- The recreation script will restore this data
