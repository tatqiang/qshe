-- Auto-Insert Registered User into Azure SQL Database
-- This script reads from the localStorage auto-registration and inserts into Azure SQL
-- Run this after logging in to see your user in the database

-- Step 1: Check if user exists in Azure SQL Database
SELECT 'Before Insert - Current Users:' as status;
SELECT email, display_name, role, created_at FROM users;

-- Step 2: Insert your auto-registered user
-- (Replace the values below with your actual auto-registration data)
-- You can get these values by running showUsers() in browser console

DECLARE @email NVARCHAR(255) = 'nithat.su@th.jec.com';
DECLARE @existing_user_count INT;

-- Check if user already exists
SELECT @existing_user_count = COUNT(*) FROM users WHERE email = @email;

IF @existing_user_count = 0
BEGIN
    -- Insert the auto-registered user
    INSERT INTO users (
        id, 
        azure_ad_id, 
        email, 
        first_name, 
        last_name, 
        display_name, 
        role,
        job_title, 
        department, 
        phone_number, 
        is_active, 
        created_at, 
        updated_at, 
        last_login, 
        profile_completed
    )
    VALUES (
        NEWID(),  -- Generate new ID for database
        '1f698bb0-e6a5-4be5-bcaf-bdf394845098',  -- Your Azure AD ID
        'nithat.su@th.jec.com',                   -- Your email
        'Nithat',                                 -- First name  
        'Suksomboonlert',                        -- Last name
        'Nithat Suksomboonlert',                 -- Display name
        'member',                                 -- Role (testing as member)
        'Senior Manager - QSHE',                 -- Job title
        'QSHE',                                  -- Department
        NULL,                                    -- Phone number
        1,                                       -- is_active = true
        GETDATE(),                               -- created_at
        GETDATE(),                               -- updated_at  
        GETDATE(),                               -- last_login
        0                                        -- profile_completed = false
    );
    
    PRINT '✅ User successfully auto-registered in Azure SQL Database';
END
ELSE
BEGIN
    PRINT '⚠️ User already exists in database';
END

-- Step 3: Verify the insert
SELECT 'After Insert - All Users:' as status;
SELECT 
    email,
    display_name, 
    role,
    job_title,
    created_at,
    last_login
FROM users 
ORDER BY created_at DESC;

PRINT '';
PRINT '🎯 Auto-Registration Complete!';
PRINT 'User should now be visible in Azure SQL Database users table';