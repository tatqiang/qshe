-- Drop and recreate projects table with clean schema
-- Matching the simplified 7-field interface exactly

-- Drop existing table if it exists
IF OBJECT_ID('projects', 'U') IS NOT NULL
    DROP TABLE projects;
GO

-- Create new projects table with exact schema
CREATE TABLE projects (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    project_code NVARCHAR(50) NOT NULL UNIQUE,
    project_name NVARCHAR(255) NOT NULL,
    project_description NVARCHAR(1000) NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    project_status NVARCHAR(20) NOT NULL DEFAULT 'active'
        CONSTRAINT CK_project_status 
        CHECK (project_status IN ('active', 'completed', 'on_hold', 'extended', 'cancelled'))
);

-- Create indexes for better performance
CREATE INDEX IX_projects_code ON projects(project_code);
CREATE INDEX IX_projects_status ON projects(project_status);
CREATE INDEX IX_projects_dates ON projects(start_date, end_date);

PRINT 'Projects table recreated successfully with clean schema';