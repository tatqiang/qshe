-- ================================
-- QSHE PWA - Azure SQL Database Schema
-- Simple version for Azure Portal Query Editor
-- ================================

PRINT 'Starting QSHE PWA schema creation...';

-- ================================
-- 1. Create base tables
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

-- Add foreign key for users.primary_company_id
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_users_primary_company')
BEGIN
    ALTER TABLE dbo.users 
    ADD CONSTRAINT FK_users_primary_company 
        FOREIGN KEY (primary_company_id) REFERENCES dbo.companies(id);
    PRINT 'Added primary_company_id foreign key';
END

-- ================================
-- 2. Insert test data
-- ================================

-- Insert test company
IF NOT EXISTS (SELECT * FROM dbo.companies WHERE name = 'Jardine Engineering Company Limited')
BEGIN
    INSERT INTO dbo.companies (name, company_type, email, contact_person) 
    VALUES ('Jardine Engineering Company Limited', 'client', 'info@th.jec.com', 'Nithat Suksomboonlert');
    PRINT 'Inserted test company';
END

-- Insert test user
IF NOT EXISTS (SELECT * FROM dbo.users WHERE email = 'nithat.su@th.jec.com')
BEGIN
    DECLARE @company_id UNIQUEIDENTIFIER;
    SELECT @company_id = id FROM dbo.companies WHERE name = 'Jardine Engineering Company Limited';
    
    INSERT INTO dbo.users (email, full_name, user_type, authority_level, primary_company_id) 
    VALUES ('nithat.su@th.jec.com', 'Nithat Suksomboonlert', 'admin', 'system_admin', @company_id);
    PRINT 'Inserted test user';
END

-- ================================
-- 3. Verify setup
-- ================================

PRINT '=====================================';
PRINT 'QSHE PWA Schema Setup Complete!';
PRINT '=====================================';

SELECT 'Companies' as TableName, COUNT(*) as RecordCount FROM dbo.companies
UNION ALL
SELECT 'Users' as TableName, COUNT(*) as RecordCount FROM dbo.users;

SELECT 'Setup verification completed successfully!' as Status;