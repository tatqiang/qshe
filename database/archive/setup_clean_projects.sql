-- Drop and recreate projects table with clean 7-field schema
-- NO DEMO DATA - table creation only

-- First, drop all foreign key constraints that reference the projects table
DECLARE @sql NVARCHAR(MAX) = '';
SELECT @sql = @sql + 'ALTER TABLE ' + QUOTENAME(SCHEMA_NAME(fk.schema_id)) + '.' + QUOTENAME(OBJECT_NAME(fk.parent_object_id)) + 
              ' DROP CONSTRAINT ' + QUOTENAME(fk.name) + ';' + CHAR(13)
FROM sys.foreign_keys fk
WHERE fk.referenced_object_id = OBJECT_ID('projects');

IF @sql != ''
BEGIN
    PRINT 'Dropping foreign key constraints that reference projects table:';
    PRINT @sql;
    EXEC sp_executesql @sql;
END

-- Drop existing projects table if it exists
IF OBJECT_ID('projects', 'U') IS NOT NULL
    DROP TABLE projects;
GO

-- Create new projects table with exactly 7 fields as specified
CREATE TABLE projects (
    id INT IDENTITY(1,1) PRIMARY KEY,
    project_code NVARCHAR(50) NOT NULL UNIQUE,
    project_name NVARCHAR(255) NOT NULL,
    project_description NVARCHAR(1000) NULL,
    project_start DATE NULL,
    project_end DATE NULL,
    project_status VARCHAR(20) NOT NULL DEFAULT 'active'
        CONSTRAINT CK_project_status 
        CHECK (project_status IN ('active', 'completed', 'on_hold', 'extended', 'cancelled'))
);

-- Create indexes for better performance
CREATE INDEX IX_projects_code ON projects(project_code);
CREATE INDEX IX_projects_status ON projects(project_status);

PRINT 'Clean projects table created successfully - 7 fields, no data';
GO