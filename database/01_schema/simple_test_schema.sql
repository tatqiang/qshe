-- ================================
-- Simple Azure SQL Database Setup
-- Basic tables for QSHE PWA
-- ================================

-- Create a simple test table first
CREATE TABLE test_connection (
    id int IDENTITY(1,1) PRIMARY KEY,
    message nvarchar(100),
    created_at datetime2 DEFAULT GETDATE()
);

-- Insert test data
INSERT INTO test_connection (message) VALUES ('Azure SQL Database is working!');

-- Create basic users table (simplified)
CREATE TABLE users (
    id uniqueidentifier NOT NULL DEFAULT NEWID(),
    email nvarchar(255) NOT NULL,
    full_name nvarchar(255) NOT NULL,
    created_at datetime2 NOT NULL DEFAULT GETDATE(),
    
    CONSTRAINT PK_users PRIMARY KEY (id),
    CONSTRAINT UQ_users_email UNIQUE (email)
);

-- Create basic companies table
CREATE TABLE companies (
    id uniqueidentifier NOT NULL DEFAULT NEWID(),
    name nvarchar(255) NOT NULL,
    created_at datetime2 NOT NULL DEFAULT GETDATE(),
    
    CONSTRAINT PK_companies PRIMARY KEY (id)
);

-- Test query
SELECT * FROM test_connection;