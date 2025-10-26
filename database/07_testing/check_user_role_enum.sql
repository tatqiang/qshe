-- ============================================
-- CHECK CURRENT user_role ENUM VALUES
-- ============================================

-- Method 1: Check enum values
SELECT e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;

-- Method 2: Check if authority_level exists instead
SELECT e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'authority_level'
ORDER BY e.enumsortorder;

-- Method 3: List all enum types
SELECT typname FROM pg_type 
WHERE typtype = 'e' 
AND typname LIKE '%role%' OR typname LIKE '%authority%';
