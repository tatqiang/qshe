-- QSHE Safety Management System - Complete Database Schema
-- Azure SQL Database implementation
-- Auto-registration system for company employees

-- =============================================
-- 1. USER MANAGEMENT SYSTEM
-- =============================================

-- Users table - Auto-populated when employees login
CREATE TABLE users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    azure_ad_id NVARCHAR(255) UNIQUE NOT NULL, -- Azure AD user ID
    email NVARCHAR(255) UNIQUE NOT NULL,
    first_name NVARCHAR(100) NOT NULL,
    last_name NVARCHAR(100) NOT NULL,
    display_name NVARCHAR(200) NOT NULL,
    job_title NVARCHAR(200),
    department NVARCHAR(100),
    phone_number NVARCHAR(50),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    last_login DATETIME2,
    profile_completed BIT DEFAULT 0,
    
    -- Additional company info
    employee_id NVARCHAR(50),
    office_location NVARCHAR(100),
    manager_email NVARCHAR(255),
    
    INDEX IX_users_email (email),
    INDEX IX_users_azure_ad_id (azure_ad_id),
    INDEX IX_users_department (department)
);

-- =============================================
-- 2. ROLE MANAGEMENT SYSTEM
-- =============================================

-- Roles table
CREATE TABLE roles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    role_name NVARCHAR(50) UNIQUE NOT NULL,
    role_description NVARCHAR(500),
    is_system_role BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    
    -- Role hierarchy level (1=highest)
    hierarchy_level INT DEFAULT 999,
    
    CONSTRAINT UQ_roles_name UNIQUE (role_name)
);

-- User roles junction table
CREATE TABLE user_roles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    role_id UNIQUEIDENTIFIER NOT NULL,
    assigned_by UNIQUEIDENTIFIER,
    assigned_at DATETIME2 DEFAULT GETDATE(),
    is_active BIT DEFAULT 1,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id),
    
    CONSTRAINT UQ_user_roles UNIQUE (user_id, role_id)
);

-- Insert default roles
INSERT INTO roles (role_name, role_description, is_system_role, hierarchy_level) VALUES
('system_admin', 'System Administrator with full access', 1, 1),
('qshe_manager', 'QSHE Manager with full safety management access', 1, 2),
('safety_officer', 'Safety Officer with patrol and inspection management', 1, 3),
('project_manager', 'Project Manager with project-specific access', 1, 4),
('supervisor', 'Site Supervisor with team management access', 1, 5),
('inspector', 'Safety Inspector with inspection and reporting access', 1, 6),
('employee', 'Regular Employee with basic access', 1, 7);

-- =============================================
-- 3. PROJECT MANAGEMENT
-- =============================================

-- Projects table
CREATE TABLE projects (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    project_code NVARCHAR(50) UNIQUE NOT NULL,
    project_name NVARCHAR(200) NOT NULL,
    project_description NVARCHAR(1000),
    
    -- Project details
    client_name NVARCHAR(200),
    project_manager_id UNIQUEIDENTIFIER,
    site_location NVARCHAR(500),
    start_date DATE,
    end_date DATE,
    project_status NVARCHAR(50) DEFAULT 'active', -- active, completed, suspended, cancelled
    
    -- Safety requirements
    safety_requirements NVARCHAR(2000),
    risk_level NVARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    
    created_by UNIQUEIDENTIFIER NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (project_manager_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    
    INDEX IX_projects_status (project_status),
    INDEX IX_projects_code (project_code)
);

-- =============================================
-- 4. SAFETY PATROL SYSTEM
-- =============================================

-- Safety patrol categories
CREATE TABLE patrol_categories (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    category_name NVARCHAR(100) UNIQUE NOT NULL,
    category_description NVARCHAR(500),
    is_active BIT DEFAULT 1,
    sort_order INT DEFAULT 0
);

-- Insert default patrol categories
INSERT INTO patrol_categories (category_name, category_description, sort_order) VALUES
('General Safety', 'General safety inspection and compliance checks', 1),
('PPE Compliance', 'Personal Protective Equipment usage and condition', 2),
('Equipment Safety', 'Machinery and equipment safety checks', 3),
('Environmental', 'Environmental compliance and waste management', 4),
('Fire Safety', 'Fire prevention and emergency preparedness', 5),
('Chemical Safety', 'Hazardous materials handling and storage', 6),
('Electrical Safety', 'Electrical systems and equipment safety', 7),
('Housekeeping', 'Site cleanliness and organization', 8),
('Emergency Procedures', 'Emergency response and evacuation procedures', 9),
('Training Compliance', 'Safety training and certification compliance', 10);

-- Safety patrols table
CREATE TABLE safety_patrols (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    patrol_code NVARCHAR(50) UNIQUE NOT NULL,
    
    -- Patrol details
    project_id UNIQUEIDENTIFIER NOT NULL,
    patrol_category_id UNIQUEIDENTIFIER NOT NULL,
    patrol_date DATE NOT NULL,
    patrol_time TIME NOT NULL,
    
    -- Inspector information
    inspector_id UNIQUEIDENTIFIER NOT NULL,
    inspector_name NVARCHAR(200) NOT NULL, -- Denormalized for reporting
    
    -- Location details
    area_inspected NVARCHAR(200) NOT NULL,
    specific_location NVARCHAR(500),
    
    -- Weather and conditions
    weather_condition NVARCHAR(100),
    temperature DECIMAL(5,2),
    
    -- Patrol results
    overall_status NVARCHAR(20) DEFAULT 'satisfactory', -- satisfactory, needs_attention, unsatisfactory, critical
    total_observations INT DEFAULT 0,
    critical_issues INT DEFAULT 0,
    major_issues INT DEFAULT 0,
    minor_issues INT DEFAULT 0,
    
    -- Notes and comments
    general_notes NVARCHAR(2000),
    recommendations NVARCHAR(2000),
    
    -- Status tracking
    patrol_status NVARCHAR(20) DEFAULT 'draft', -- draft, submitted, reviewed, approved, archived
    submitted_at DATETIME2,
    reviewed_by UNIQUEIDENTIFIER,
    reviewed_at DATETIME2,
    
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (patrol_category_id) REFERENCES patrol_categories(id),
    FOREIGN KEY (inspector_id) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id),
    
    INDEX IX_patrols_date (patrol_date),
    INDEX IX_patrols_project (project_id),
    INDEX IX_patrols_inspector (inspector_id),
    INDEX IX_patrols_status (patrol_status)
);

-- =============================================
-- 5. PATROL OBSERVATIONS AND FINDINGS
-- =============================================

-- Risk categories for observations
CREATE TABLE risk_categories (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    category_name NVARCHAR(100) UNIQUE NOT NULL,
    category_description NVARCHAR(500),
    default_severity NVARCHAR(20) DEFAULT 'medium',
    is_active BIT DEFAULT 1,
    sort_order INT DEFAULT 0
);

-- Insert default risk categories
INSERT INTO risk_categories (category_name, category_description, default_severity, sort_order) VALUES
('Fall Protection', 'Fall hazards and protection measures', 'high', 1),
('Electrical Hazards', 'Electrical safety and hazards', 'high', 2),
('Chemical Exposure', 'Chemical handling and exposure risks', 'high', 3),
('Fire Hazards', 'Fire and explosion risks', 'high', 4),
('Equipment Safety', 'Machinery and equipment safety issues', 'medium', 5),
('PPE Violations', 'Personal protective equipment non-compliance', 'medium', 6),
('Housekeeping', 'Site cleanliness and organization issues', 'low', 7),
('Environmental', 'Environmental compliance issues', 'medium', 8),
('Training', 'Safety training and competency issues', 'medium', 9),
('Documentation', 'Safety documentation and record keeping', 'low', 10);

-- Patrol observations/findings
CREATE TABLE patrol_observations (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    patrol_id UNIQUEIDENTIFIER NOT NULL,
    observation_number INT NOT NULL, -- Sequential number within patrol
    
    -- Classification
    risk_category_id UNIQUEIDENTIFIER NOT NULL,
    observation_type NVARCHAR(20) NOT NULL, -- positive, negative, neutral
    severity_level NVARCHAR(20) NOT NULL, -- low, medium, high, critical
    
    -- Description
    observation_title NVARCHAR(200) NOT NULL,
    observation_description NVARCHAR(2000) NOT NULL,
    location_details NVARCHAR(500),
    
    -- Personnel involved
    person_involved NVARCHAR(200),
    person_role NVARCHAR(100),
    
    -- Evidence and documentation
    photo_urls NVARCHAR(MAX), -- JSON array of Cloudflare URLs
    additional_evidence NVARCHAR(1000),
    
    -- Action required
    immediate_action_taken NVARCHAR(1000),
    requires_followup BIT DEFAULT 0,
    
    created_at DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (patrol_id) REFERENCES safety_patrols(id) ON DELETE CASCADE,
    FOREIGN KEY (risk_category_id) REFERENCES risk_categories(id),
    
    CONSTRAINT UQ_observation_number UNIQUE (patrol_id, observation_number),
    
    INDEX IX_observations_patrol (patrol_id),
    INDEX IX_observations_severity (severity_level),
    INDEX IX_observations_type (observation_type)
);

-- =============================================
-- 6. CORRECTIVE ACTIONS SYSTEM
-- =============================================

-- Corrective actions table
CREATE TABLE corrective_actions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    action_number NVARCHAR(50) UNIQUE NOT NULL, -- CA-2024-001, etc.
    
    -- Source of corrective action
    observation_id UNIQUEIDENTIFIER, -- If from patrol observation
    project_id UNIQUEIDENTIFIER NOT NULL,
    
    -- Action details
    action_title NVARCHAR(200) NOT NULL,
    action_description NVARCHAR(2000) NOT NULL,
    root_cause_analysis NVARCHAR(2000),
    
    -- Classification
    severity_level NVARCHAR(20) NOT NULL, -- low, medium, high, critical
    action_type NVARCHAR(50) NOT NULL, -- immediate, short_term, long_term, systemic
    
    -- Assignment
    assigned_to UNIQUEIDENTIFIER NOT NULL,
    assigned_by UNIQUEIDENTIFIER NOT NULL,
    assigned_date DATE NOT NULL,
    target_completion_date DATE NOT NULL,
    
    -- Status tracking
    action_status NVARCHAR(20) DEFAULT 'open', -- open, in_progress, completed, verified, closed, overdue
    completion_date DATE,
    verification_date DATE,
    verified_by UNIQUEIDENTIFIER,
    
    -- Progress tracking
    progress_percentage INT DEFAULT 0,
    progress_notes NVARCHAR(2000),
    
    -- Evidence of completion
    completion_evidence NVARCHAR(2000),
    completion_photos NVARCHAR(MAX), -- JSON array of Cloudflare URLs
    
    -- Effectiveness review
    effectiveness_review NVARCHAR(2000),
    effectiveness_rating NVARCHAR(20), -- effective, partially_effective, ineffective
    reviewed_by UNIQUEIDENTIFIER,
    review_date DATE,
    
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (observation_id) REFERENCES patrol_observations(id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id),
    FOREIGN KEY (verified_by) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id),
    
    INDEX IX_corrective_actions_status (action_status),
    INDEX IX_corrective_actions_assigned (assigned_to),
    INDEX IX_corrective_actions_project (project_id),
    INDEX IX_corrective_actions_due_date (target_completion_date)
);

-- =============================================
-- 7. PHOTO AND DOCUMENT MANAGEMENT
-- =============================================

-- Document/photo storage tracking (Cloudflare R2)
CREATE TABLE attachments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    
    -- Reference to parent record
    entity_type NVARCHAR(50) NOT NULL, -- patrol, observation, corrective_action, project
    entity_id UNIQUEIDENTIFIER NOT NULL,
    
    -- File details
    file_name NVARCHAR(255) NOT NULL,
    original_name NVARCHAR(255) NOT NULL,
    file_type NVARCHAR(50) NOT NULL, -- photo, document, video
    mime_type NVARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    
    -- Cloudflare R2 details
    cloudflare_url NVARCHAR(1000) NOT NULL,
    cloudflare_key NVARCHAR(500) NOT NULL,
    bucket_name NVARCHAR(100) NOT NULL,
    
    -- Security and access
    is_public BIT DEFAULT 0,
    access_token NVARCHAR(255), -- For secure access
    
    -- Metadata
    description NVARCHAR(500),
    taken_at DATETIME2,
    uploaded_by UNIQUEIDENTIFIER NOT NULL,
    uploaded_at DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (uploaded_by) REFERENCES users(id),
    
    INDEX IX_attachments_entity (entity_type, entity_id),
    INDEX IX_attachments_type (file_type)
);

-- =============================================
-- 8. SYSTEM CONFIGURATION
-- =============================================

-- System settings for QSHE management
CREATE TABLE system_settings (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    setting_key NVARCHAR(100) UNIQUE NOT NULL,
    setting_value NVARCHAR(2000),
    setting_description NVARCHAR(500),
    setting_type NVARCHAR(50) DEFAULT 'string', -- string, number, boolean, json
    is_public BIT DEFAULT 0,
    updated_by UNIQUEIDENTIFIER,
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_description, setting_type, is_public) VALUES
('company_name', 'Jardine Engineering Corporation (Thailand)', 'Company name for reports and headers', 'string', 1),
('cloudflare_r2_bucket', 'qshe-attachments', 'Cloudflare R2 bucket name for file storage', 'string', 0),
('cloudflare_r2_domain', 'https://qshe-attachments.r2.cloudflarestorage.com', 'Cloudflare R2 domain for file access', 'string', 0),
('max_file_size_mb', '50', 'Maximum file size in MB for uploads', 'number', 1),
('allowed_file_types', '["jpg","jpeg","png","pdf","doc","docx"]', 'Allowed file types for uploads', 'json', 1),
('patrol_auto_number_prefix', 'PAT', 'Prefix for auto-generated patrol numbers', 'string', 1),
('corrective_action_prefix', 'CA', 'Prefix for corrective action numbers', 'string', 1),
('notification_email_enabled', 'true', 'Enable email notifications for system events', 'boolean', 0);

-- =============================================
-- 9. SYSTEM ADMIN SETUP
-- =============================================

-- Set nithat.su@th.jec.com as system admin (will be created on first login)
-- This will be handled by the application when user logs in for the first time

-- Create trigger to auto-update updated_at timestamp
-- (Note: This is a simplified version - full implementation would be in application code)

-- =============================================
-- 10. INDEXES FOR PERFORMANCE
-- =============================================

-- Additional performance indexes
CREATE INDEX IX_user_roles_active ON user_roles(user_id, is_active);
CREATE INDEX IX_patrols_date_status ON safety_patrols(patrol_date, patrol_status);
CREATE INDEX IX_corrective_actions_due ON corrective_actions(target_completion_date) WHERE action_status IN ('open', 'in_progress');
CREATE INDEX IX_observations_severity_type ON patrol_observations(severity_level, observation_type);

-- =============================================
-- 11. SECURITY VIEWS
-- =============================================

-- View for user permissions (used by application)
CREATE VIEW user_permissions AS
SELECT 
    u.id as user_id,
    u.email,
    u.display_name,
    r.role_name,
    r.hierarchy_level,
    ur.is_active as role_active
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.is_active = 1 AND ur.is_active = 1;

-- View for active projects with manager details
CREATE VIEW active_projects AS
SELECT 
    p.*,
    pm.display_name as project_manager_name,
    pm.email as project_manager_email
FROM projects p
LEFT JOIN users pm ON p.project_manager_id = pm.id
WHERE p.project_status = 'active';

-- View for overdue corrective actions
CREATE VIEW overdue_corrective_actions AS
SELECT 
    ca.*,
    assigned_user.display_name as assigned_to_name,
    assigned_user.email as assigned_to_email,
    DATEDIFF(day, ca.target_completion_date, GETDATE()) as days_overdue
FROM corrective_actions ca
JOIN users assigned_user ON ca.assigned_to = assigned_user.id
WHERE ca.action_status IN ('open', 'in_progress') 
  AND ca.target_completion_date < CAST(GETDATE() AS DATE);

-- =============================================
-- SCRIPT COMPLETION
-- =============================================

PRINT 'QSHE Safety Management Database Schema Created Successfully!';
PRINT '';
PRINT 'Summary:';
PRINT '- Users table: Auto-registration on first login';
PRINT '- Roles: system_admin, qshe_manager, safety_officer, etc.';
PRINT '- Projects: Complete project management';
PRINT '- Safety Patrols: Comprehensive inspection system';
PRINT '- Corrective Actions: Full lifecycle tracking';
PRINT '- Cloudflare R2: Photo and document storage';
PRINT '- System ready for nithat.su@th.jec.com as system_admin';
PRINT '';
PRINT 'Next steps:';
PRINT '1. Configure Cloudflare R2 bucket: qshe-attachments';
PRINT '2. Setup application authentication';
PRINT '3. Test user auto-registration';
PRINT '4. Assign system_admin role to nithat.su@th.jec.com on first login';