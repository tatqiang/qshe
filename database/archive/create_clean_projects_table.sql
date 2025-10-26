-- Clean projects table creation - NO DEMO DATA
-- Drop and recreate projects table with 7 fields only

-- Drop existing table if it exists
IF OBJECT_ID('projects', 'U') IS NOT NULL
    DROP TABLE projects;
GO

-- Create new projects table with exact 7 field schema
CREATE TABLE projects (
    id INT IDENTITY(1,1) PRIMARY KEY,
    project_code NVARCHAR(50) NOT NULL UNIQUE,
    project_name NVARCHAR(255) NOT NULL,
    project_description NVARCHAR(1000) NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    project_status NVARCHAR(20) NOT NULL DEFAULT 'Planning'
        CONSTRAINT CK_project_status 
        CHECK (project_status IN ('Planning', 'In Progress', 'Completed', 'On Hold'))
);

-- Create indexes for better performance
CREATE INDEX IX_projects_code ON projects(project_code);
CREATE INDEX IX_projects_status ON projects(project_status);

PRINT 'Clean projects table created successfully - 7 fields only, no demo data';
GO