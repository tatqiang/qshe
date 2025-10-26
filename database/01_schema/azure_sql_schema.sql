-- ================================
-- Azure SQL Database Schema Migration
-- QSHE PWA Multi-Company Schema
-- ================================

-- This script converts the PostgreSQL schema to SQL Server/Azure SQL Database
-- Note: This must be run by a user with db_owner permissions

-- NOTE: Make sure you're connected to the 'jectqshe' database before running this script

-- Enable SQLCMD mode for variable support
:setvar DatabaseName "jectqshe"
:setvar SchemaName "dbo"

PRINT 'Starting Azure SQL Database schema migration...';
GO

-- ================================
-- 1. Create base tables with SQL Server equivalents
-- ================================

-- Users table (main authentication table)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE dbo.users (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        email NVARCHAR(255) NOT NULL,
        full_name NVARCHAR(255) NOT NULL,
        thai_first_name NVARCHAR(255) NULL,
        thai_last_name NVARCHAR(255) NULL,
        position_title NVARCHAR(255) NULL,
        phone_number NVARCHAR(50) NULL,
        employee_id NVARCHAR(100) NULL,
        department NVARCHAR(255) NULL,
        authority_level NVARCHAR(50) NOT NULL DEFAULT 'user' 
            CONSTRAINT CHK_authority_level CHECK (authority_level IN ('user', 'admin', 'manager', 'system_admin')),
        user_type NVARCHAR(50) NOT NULL DEFAULT 'registrant' 
            CONSTRAINT CHK_user_type CHECK (user_type IN ('registrant', 'admin', 'safety_officer', 'project_manager', 'system_admin')),
        verification_date DATETIME2 NULL,
        profile_photo_url NVARCHAR(500) NULL,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        -- Multi-company support fields
        primary_company_id UNIQUEIDENTIFIER NULL,
        worker_type NVARCHAR(50) NOT NULL DEFAULT 'internal' 
            CONSTRAINT CHK_worker_type CHECK (worker_type IN ('internal', 'contractor', 'consultant', 'temporary', 'visitor')),
        verification_status NVARCHAR(50) NOT NULL DEFAULT 'unverified' 
            CONSTRAINT CHK_verification_status CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
        external_worker_id NVARCHAR(255) NULL,
        nationality NVARCHAR(100) NULL,
        passport_number NVARCHAR(100) NULL,
        work_permit_number NVARCHAR(100) NULL,
        
        CONSTRAINT PK_users PRIMARY KEY (id),
        CONSTRAINT UQ_users_email UNIQUE (email)
    );
    PRINT 'Created users table';
END
GO

-- Companies table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'companies')
BEGIN
    CREATE TABLE dbo.companies (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        name NVARCHAR(255) NOT NULL,
        name_thai NVARCHAR(255) NULL,
        company_code NVARCHAR(50) NULL,
        company_type NVARCHAR(50) NOT NULL DEFAULT 'client' 
            CONSTRAINT CHK_company_type CHECK (company_type IN ('client', 'contractor', 'consultant', 'supplier', 'government')),
        tax_id NVARCHAR(50) NULL,
        address NVARCHAR(MAX) NULL,
        phone NVARCHAR(50) NULL,
        email NVARCHAR(255) NULL,
        website NVARCHAR(255) NULL,
        contact_person NVARCHAR(255) NULL,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        CONSTRAINT PK_companies PRIMARY KEY (id),
        CONSTRAINT UQ_companies_name UNIQUE (name)
    );
    PRINT 'Created companies table';
END
GO

-- Projects table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'projects')
BEGIN
    CREATE TABLE dbo.projects (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        name NVARCHAR(255) NOT NULL,
        name_thai NVARCHAR(255) NULL,
        project_code NVARCHAR(50) NOT NULL,
        description NVARCHAR(MAX) NULL,
        client_company_id UNIQUEIDENTIFIER NOT NULL,
        contractor_company_id UNIQUEIDENTIFIER NULL,
        project_manager_id UNIQUEIDENTIFIER NULL,
        safety_officer_id UNIQUEIDENTIFIER NULL,
        start_date DATE NULL,
        end_date DATE NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'planning' 
            CONSTRAINT CHK_project_status CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
        budget DECIMAL(15,2) NULL,
        location NVARCHAR(MAX) NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        CONSTRAINT PK_projects PRIMARY KEY (id),
        CONSTRAINT UQ_projects_code UNIQUE (project_code),
        CONSTRAINT FK_projects_client_company 
            FOREIGN KEY (client_company_id) REFERENCES dbo.companies(id),
        CONSTRAINT FK_projects_contractor_company 
            FOREIGN KEY (contractor_company_id) REFERENCES dbo.companies(id),
        CONSTRAINT FK_projects_manager 
            FOREIGN KEY (project_manager_id) REFERENCES dbo.users(id),
        CONSTRAINT FK_projects_safety_officer 
            FOREIGN KEY (safety_officer_id) REFERENCES dbo.users(id)
    );
    PRINT 'Created projects table';
END
GO

-- Areas table (hierarchical)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'areas')
BEGIN
    CREATE TABLE dbo.areas (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        name NVARCHAR(255) NOT NULL,
        name_thai NVARCHAR(255) NULL,
        area_code NVARCHAR(50) NULL,
        area_type NVARCHAR(50) NOT NULL DEFAULT 'zone' 
            CONSTRAINT CHK_area_type CHECK (area_type IN ('site', 'zone', 'building', 'floor', 'room', 'outdoor')),
        parent_area_id UNIQUEIDENTIFIER NULL,
        project_id UNIQUEIDENTIFIER NOT NULL,
        description NVARCHAR(MAX) NULL,
        safety_requirements NVARCHAR(MAX) NULL,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        CONSTRAINT PK_areas PRIMARY KEY (id),
        CONSTRAINT FK_areas_parent 
            FOREIGN KEY (parent_area_id) REFERENCES dbo.areas(id),
        CONSTRAINT FK_areas_project 
            FOREIGN KEY (project_id) REFERENCES dbo.projects(id) ON DELETE CASCADE
    );
    PRINT 'Created areas table';
END
GO

-- Risk categories table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'patrol_risk_categories')
BEGIN
    CREATE TABLE dbo.patrol_risk_categories (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        name NVARCHAR(255) NOT NULL,
        name_thai NVARCHAR(255) NULL,
        description NVARCHAR(MAX) NULL,
        category_type NVARCHAR(50) NOT NULL DEFAULT 'safety' 
            CONSTRAINT CHK_category_type CHECK (category_type IN ('safety', 'health', 'environment', 'quality')),
        severity_weight DECIMAL(3,2) NOT NULL DEFAULT 1.0,
        color_code NVARCHAR(7) NULL, -- Hex color code
        icon_name NVARCHAR(50) NULL,
        is_active BIT NOT NULL DEFAULT 1,
        display_order INT NOT NULL DEFAULT 0,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        CONSTRAINT PK_patrol_risk_categories PRIMARY KEY (id),
        CONSTRAINT UQ_patrol_risk_categories_name UNIQUE (name)
    );
    PRINT 'Created patrol_risk_categories table';
END
GO

-- Risk items table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'patrol_risk_items')
BEGIN
    CREATE TABLE dbo.patrol_risk_items (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        category_id UNIQUEIDENTIFIER NOT NULL,
        name NVARCHAR(255) NOT NULL,
        name_thai NVARCHAR(255) NULL,
        description NVARCHAR(MAX) NULL,
        risk_level NVARCHAR(50) NOT NULL DEFAULT 'medium' 
            CONSTRAINT CHK_risk_level CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
        inspection_guidance NVARCHAR(MAX) NULL,
        corrective_action_template NVARCHAR(MAX) NULL,
        is_active BIT NOT NULL DEFAULT 1,
        display_order INT NOT NULL DEFAULT 0,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        CONSTRAINT PK_patrol_risk_items PRIMARY KEY (id),
        CONSTRAINT FK_patrol_risk_items_category 
            FOREIGN KEY (category_id) REFERENCES dbo.patrol_risk_categories(id) ON DELETE CASCADE
    );
    PRINT 'Created patrol_risk_items table';
END
GO

-- Safety patrols table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'safety_patrols')
BEGIN
    CREATE TABLE dbo.safety_patrols (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        patrol_number NVARCHAR(100) NOT NULL,
        project_id UNIQUEIDENTIFIER NOT NULL,
        area_id UNIQUEIDENTIFIER NULL,
        inspector_id UNIQUEIDENTIFIER NOT NULL,
        patrol_date DATE NOT NULL,
        patrol_time TIME NOT NULL,
        weather_conditions NVARCHAR(100) NULL,
        temperature DECIMAL(5,2) NULL,
        overall_status NVARCHAR(50) NOT NULL DEFAULT 'safe' 
            CONSTRAINT CHK_overall_status CHECK (overall_status IN ('safe', 'unsafe', 'needs_attention', 'critical')),
        total_issues_found INT NOT NULL DEFAULT 0,
        critical_issues_count INT NOT NULL DEFAULT 0,
        notes NVARCHAR(MAX) NULL,
        inspector_signature NVARCHAR(MAX) NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'draft' 
            CONSTRAINT CHK_patrol_status CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected')),
        submitted_at DATETIME2 NULL,
        reviewed_by UNIQUEIDENTIFIER NULL,
        reviewed_at DATETIME2 NULL,
        approval_notes NVARCHAR(MAX) NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        CONSTRAINT PK_safety_patrols PRIMARY KEY (id),
        CONSTRAINT UQ_safety_patrols_number UNIQUE (patrol_number),
        CONSTRAINT FK_safety_patrols_project 
            FOREIGN KEY (project_id) REFERENCES dbo.projects(id) ON DELETE CASCADE,
        CONSTRAINT FK_safety_patrols_area 
            FOREIGN KEY (area_id) REFERENCES dbo.areas(id),
        CONSTRAINT FK_safety_patrols_inspector 
            FOREIGN KEY (inspector_id) REFERENCES dbo.users(id),
        CONSTRAINT FK_safety_patrols_reviewer 
            FOREIGN KEY (reviewed_by) REFERENCES dbo.users(id)
    );
    PRINT 'Created safety_patrols table';
END
GO

-- Patrol findings table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'patrol_findings')
BEGIN
    CREATE TABLE dbo.patrol_findings (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        patrol_id UNIQUEIDENTIFIER NOT NULL,
        risk_item_id UNIQUEIDENTIFIER NOT NULL,
        finding_status NVARCHAR(50) NOT NULL DEFAULT 'safe' 
            CONSTRAINT CHK_finding_status CHECK (finding_status IN ('safe', 'unsafe', 'not_applicable', 'needs_improvement')),
        severity NVARCHAR(50) NULL 
            CONSTRAINT CHK_finding_severity CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        description NVARCHAR(MAX) NULL,
        location_details NVARCHAR(MAX) NULL,
        immediate_action_taken NVARCHAR(MAX) NULL,
        recommended_action NVARCHAR(MAX) NULL,
        target_completion_date DATE NULL,
        responsible_person NVARCHAR(255) NULL,
        photo_urls NVARCHAR(MAX) NULL, -- JSON array of photo URLs
        is_resolved BIT NOT NULL DEFAULT 0,
        resolved_date DATETIME2 NULL,
        resolved_by UNIQUEIDENTIFIER NULL,
        resolution_notes NVARCHAR(MAX) NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        CONSTRAINT PK_patrol_findings PRIMARY KEY (id),
        CONSTRAINT FK_patrol_findings_patrol 
            FOREIGN KEY (patrol_id) REFERENCES dbo.safety_patrols(id) ON DELETE CASCADE,
        CONSTRAINT FK_patrol_findings_risk_item 
            FOREIGN KEY (risk_item_id) REFERENCES dbo.patrol_risk_items(id),
        CONSTRAINT FK_patrol_findings_resolver 
            FOREIGN KEY (resolved_by) REFERENCES dbo.users(id)
    );
    PRINT 'Created patrol_findings table';
END
GO

-- ================================
-- 2. Multi-company support tables
-- ================================

-- User-company associations (many-to-many)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_company_associations')
BEGIN
    CREATE TABLE dbo.user_company_associations (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        user_id UNIQUEIDENTIFIER NOT NULL,
        company_id UNIQUEIDENTIFIER NOT NULL,
        role_in_company NVARCHAR(100) NOT NULL DEFAULT 'member',
        company_role_id UNIQUEIDENTIFIER NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'active' 
            CONSTRAINT CHK_association_status CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
        approval_status NVARCHAR(50) DEFAULT 'pending' 
            CONSTRAINT CHK_approval_status CHECK (approval_status IN ('pending', 'approved', 'rejected')),
        start_date DATE DEFAULT CAST(GETDATE() AS DATE),
        end_date DATE NULL,
        approved_by UNIQUEIDENTIFIER NULL,
        approved_at DATETIME2 NULL,
        notes NVARCHAR(MAX) NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        
        CONSTRAINT PK_user_company_associations PRIMARY KEY (id),
        CONSTRAINT FK_user_company_associations_user_id 
            FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
        CONSTRAINT FK_user_company_associations_company_id 
            FOREIGN KEY (company_id) REFERENCES dbo.companies(id) ON DELETE CASCADE
    );
    PRINT 'Created user_company_associations table';
END
GO

-- Company roles for granular permissions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'company_roles')
BEGIN
    CREATE TABLE dbo.company_roles (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        company_id UNIQUEIDENTIFIER NOT NULL,
        role_name NVARCHAR(100) NOT NULL,
        role_description NVARCHAR(MAX) NULL,
        permissions NVARCHAR(MAX) NOT NULL DEFAULT '[]', -- JSON stored as NVARCHAR(MAX)
        is_system_role BIT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        
        CONSTRAINT PK_company_roles PRIMARY KEY (id),
        CONSTRAINT FK_company_roles_company_id 
            FOREIGN KEY (company_id) REFERENCES dbo.companies(id) ON DELETE CASCADE,
        CONSTRAINT UQ_company_role_name UNIQUE (company_id, role_name)
    );
    PRINT 'Created company_roles table';
END
GO

-- Permissions table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'permissions')
BEGIN
    CREATE TABLE dbo.permissions (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        permission_key NVARCHAR(100) NOT NULL UNIQUE,
        permission_name NVARCHAR(200) NOT NULL,
        description NVARCHAR(MAX) NULL,
        category NVARCHAR(50) NOT NULL DEFAULT 'general',
        is_sensitive BIT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETDATE(),
        
        CONSTRAINT PK_permissions PRIMARY KEY (id)
    );
    PRINT 'Created permissions table';
END
GO

-- Files table for Azure Blob Storage metadata
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'files')
BEGIN
    CREATE TABLE dbo.files (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        filename NVARCHAR(255) NOT NULL,
        blob_url NVARCHAR(500) NOT NULL,
        file_size BIGINT NULL,
        mime_type NVARCHAR(100) NULL,
        uploaded_by UNIQUEIDENTIFIER NULL,
        upload_date DATETIME2 DEFAULT GETDATE(),
        category NVARCHAR(50) NULL,
        
        CONSTRAINT PK_files PRIMARY KEY (id),
        CONSTRAINT FK_files_uploaded_by 
            FOREIGN KEY (uploaded_by) REFERENCES dbo.users(id)
    );
    PRINT 'Created files table';
END
GO

-- ================================
-- 3. Add foreign key for primary_company_id
-- ================================
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_users_primary_company')
BEGIN
    ALTER TABLE dbo.users 
    ADD CONSTRAINT FK_users_primary_company 
        FOREIGN KEY (primary_company_id) REFERENCES dbo.companies(id);
    PRINT 'Added primary_company_id foreign key';
END
GO

-- ================================
-- 4. Insert standard permissions
-- ================================
MERGE dbo.permissions AS target
USING (VALUES
    ('patrol.create', 'Create Patrols', 'Create new safety patrol reports', 'patrol', 0),
    ('patrol.edit', 'Edit Patrols', 'Edit existing patrol reports', 'patrol', 0),
    ('patrol.delete', 'Delete Patrols', 'Delete patrol reports', 'patrol', 1),
    ('patrol.view_all', 'View All Patrols', 'View patrol reports across all projects', 'patrol', 0),
    ('patrol.approve', 'Approve Patrols', 'Approve and finalize patrol reports', 'patrol', 1),
    ('user.create', 'Create Users', 'Create new user accounts', 'user', 1),
    ('user.edit', 'Edit Users', 'Edit user profiles and permissions', 'user', 1),
    ('user.manage_roles', 'Manage User Roles', 'Assign/modify user roles', 'user', 1),
    ('company.manage_external_workers', 'Manage External Workers', 'Invite and manage external workers', 'company', 1),
    ('project.create', 'Create Projects', 'Create new projects', 'project', 1),
    ('project.manage_members', 'Manage Project Members', 'Add/remove project members', 'project', 1)
) AS source (permission_key, permission_name, description, category, is_sensitive)
ON target.permission_key = source.permission_key
WHEN NOT MATCHED THEN
    INSERT (permission_key, permission_name, description, category, is_sensitive)
    VALUES (source.permission_key, source.permission_name, source.description, source.category, source.is_sensitive);

PRINT 'Inserted standard permissions';
GO

-- ================================
-- 5. Create helper functions
-- ================================

-- User context function
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'FN' AND name = 'get_current_user_id')
    DROP FUNCTION dbo.get_current_user_id;
GO

CREATE FUNCTION dbo.get_current_user_id()
RETURNS UNIQUEIDENTIFIER
AS
BEGIN
    DECLARE @user_id UNIQUEIDENTIFIER;
    
    -- Extract user ID from session context or application context
    SET @user_id = TRY_CAST(SESSION_CONTEXT(N'current_user_id') AS UNIQUEIDENTIFIER);
    
    IF @user_id IS NULL
        SET @user_id = TRY_CAST(CONTEXT_INFO() AS UNIQUEIDENTIFIER);
    
    RETURN @user_id;
END
GO
PRINT 'Created get_current_user_id function';

-- Permission checking function
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'FN' AND name = 'user_has_permission')
    DROP FUNCTION dbo.user_has_permission;
GO

CREATE FUNCTION dbo.user_has_permission(
    @user_id UNIQUEIDENTIFIER, 
    @company_id UNIQUEIDENTIFIER, 
    @permission_key NVARCHAR(100)
)
RETURNS BIT
AS
BEGIN
    DECLARE @has_permission BIT = 0;
    
    -- Check if user has the permission through their company role
    IF EXISTS (
        SELECT 1 
        FROM dbo.user_company_associations uca
        INNER JOIN dbo.company_roles cr ON uca.company_role_id = cr.id
        WHERE uca.user_id = @user_id 
        AND uca.company_id = @company_id
        AND uca.status = 'active'
        AND uca.approval_status = 'approved'
        AND JSON_VALUE(cr.permissions, '$') LIKE '%' + @permission_key + '%'
    )
    BEGIN
        SET @has_permission = 1;
    END
    
    -- System admins have all permissions
    IF @has_permission = 0
    BEGIN
        IF EXISTS (
            SELECT 1 FROM dbo.users 
            WHERE id = @user_id 
            AND authority_level = 'system_admin'
        )
        BEGIN
            SET @has_permission = 1;
        END
    END
    
    RETURN @has_permission;
END
GO
PRINT 'Created user_has_permission function';

-- ================================
-- 6. Create indexes for performance
-- ================================

-- Users table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_users_email')
    CREATE INDEX IX_users_email ON dbo.users(email);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_users_employee_id')
    CREATE INDEX IX_users_employee_id ON dbo.users(employee_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_users_primary_company_id')
    CREATE INDEX IX_users_primary_company_id ON dbo.users(primary_company_id);

-- Projects table indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_projects_client_company_id')
    CREATE INDEX IX_projects_client_company_id ON dbo.projects(client_company_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_projects_project_code')
    CREATE INDEX IX_projects_project_code ON dbo.projects(project_code);

-- Safety patrols indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_safety_patrols_project_id')
    CREATE INDEX IX_safety_patrols_project_id ON dbo.safety_patrols(project_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_safety_patrols_patrol_date')
    CREATE INDEX IX_safety_patrols_patrol_date ON dbo.safety_patrols(patrol_date);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_safety_patrols_inspector_id')
    CREATE INDEX IX_safety_patrols_inspector_id ON dbo.safety_patrols(inspector_id);

-- User company associations indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_user_company_associations_user_id')
    CREATE INDEX IX_user_company_associations_user_id ON dbo.user_company_associations(user_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_user_company_associations_company_id')
    CREATE INDEX IX_user_company_associations_company_id ON dbo.user_company_associations(company_id);

PRINT 'Created performance indexes';
GO

-- ================================
-- 7. Create update triggers for updated_at columns
-- ================================

-- Users table trigger
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_users_updated_at')
    DROP TRIGGER dbo.TR_users_updated_at;
GO

CREATE TRIGGER dbo.TR_users_updated_at
ON dbo.users
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.users 
    SET updated_at = GETDATE()
    WHERE id IN (SELECT id FROM inserted);
END
GO

-- Similar triggers for other tables with updated_at columns
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_companies_updated_at')
    DROP TRIGGER dbo.TR_companies_updated_at;
GO

CREATE TRIGGER dbo.TR_companies_updated_at
ON dbo.companies
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.companies 
    SET updated_at = GETDATE()
    WHERE id IN (SELECT id FROM inserted);
END
GO

IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_projects_updated_at')
    DROP TRIGGER dbo.TR_projects_updated_at;
GO

CREATE TRIGGER dbo.TR_projects_updated_at
ON dbo.projects
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.projects 
    SET updated_at = GETDATE()
    WHERE id IN (SELECT id FROM inserted);
END
GO

IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_safety_patrols_updated_at')
    DROP TRIGGER dbo.TR_safety_patrols_updated_at;
GO

CREATE TRIGGER dbo.TR_safety_patrols_updated_at
ON dbo.safety_patrols
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.safety_patrols 
    SET updated_at = GETDATE()
    WHERE id IN (SELECT id FROM inserted);
END
GO

PRINT 'Created update triggers for timestamp management';
GO

PRINT '=====================================';
PRINT 'Azure SQL Database schema migration completed successfully!';
PRINT 'Tables created:';
PRINT '- users (with multi-company support)';
PRINT '- companies';
PRINT '- projects';
PRINT '- areas (hierarchical)';
PRINT '- patrol_risk_categories';
PRINT '- patrol_risk_items';
PRINT '- safety_patrols';
PRINT '- patrol_findings';
PRINT '- user_company_associations';
PRINT '- company_roles';
PRINT '- permissions';
PRINT '- files (for Azure Blob Storage)';
PRINT '';
PRINT 'Functions created:';
PRINT '- get_current_user_id()';
PRINT '- user_has_permission()';
PRINT '';
PRINT 'Performance indexes and update triggers created.';
PRINT 'Face recognition dependencies have been removed.';
PRINT '=====================================';
GO