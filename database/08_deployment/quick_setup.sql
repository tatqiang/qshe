-- ================================
-- QSHE PWA - Simplified Schema Deployment
-- Azure SQL Database - Basic Setup
-- ================================

USE [jectqshe];
GO

-- Test connection
SELECT 'Azure SQL Database is ready!' as Status, GETDATE() as Timestamp;
GO

-- Create basic users table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE dbo.users (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        email NVARCHAR(255) NOT NULL,
        full_name NVARCHAR(255) NOT NULL,
        azure_object_id NVARCHAR(255) NULL, -- For Azure AD integration
        user_type NVARCHAR(50) NOT NULL DEFAULT 'internal' 
            CONSTRAINT CHK_user_type CHECK (user_type IN ('internal', 'external')),
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        CONSTRAINT PK_users PRIMARY KEY (id),
        CONSTRAINT UQ_users_email UNIQUE (email)
    );
    PRINT 'Created users table';
END
GO

-- Create companies table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'companies')
BEGIN
    CREATE TABLE dbo.companies (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        name NVARCHAR(255) NOT NULL,
        company_type NVARCHAR(50) NOT NULL DEFAULT 'client',
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        CONSTRAINT PK_companies PRIMARY KEY (id),
        CONSTRAINT UQ_companies_name UNIQUE (name)
    );
    PRINT 'Created companies table';
END
GO

-- Insert test data
INSERT INTO dbo.companies (name, company_type) VALUES 
('Jardine Engineering Company Limited', 'client');

INSERT INTO dbo.users (email, full_name, user_type) VALUES 
('nithat.su@th.jec.com', 'Nithat Suksomboonlert', 'internal');

-- Verify setup
SELECT 'Setup Complete!' as Status;
SELECT * FROM dbo.companies;
SELECT * FROM dbo.users;
GO