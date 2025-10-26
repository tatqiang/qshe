-- Script to create Azure AD user for backend API access
-- Run this in Azure Data Studio connected to jectqshe database

-- Create contained database user for Azure AD account
CREATE USER [nithat.su@th.jec.com] FROM EXTERNAL PROVIDER;

-- Grant necessary permissions
ALTER ROLE db_datareader ADD MEMBER [nithat.su@th.jec.com];
ALTER ROLE db_datawriter ADD MEMBER [nithat.su@th.jec.com];
ALTER ROLE db_ddladmin ADD MEMBER [nithat.su@th.jec.com];

-- Check if user was created
SELECT name, type_desc, authentication_type_desc 
FROM sys.database_principals 
WHERE name = 'nithat.su@th.jec.com';

-- Grant specific permissions on projects table if needed
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.projects TO [nithat.su@th.jec.com];