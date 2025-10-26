-- QSHE Safety Management System - Simplified Database Schema
-- Azure SQL Database implementation with simple role field
-- Auto-registration system for company employees

-- =============================================
-- 0. DROP EXISTING TABLES (IF ANY)
-- =============================================

PRINT 'Dropping existing tables if they exist...';

-- Drop views first (they depend on tables)
IF OBJECT_ID('user_summary', 'V') IS NOT NULL DROP VIEW user_summary;
IF OBJECT_ID('overdue_corrective_actions', 'V') IS NOT NULL DROP VIEW overdue_corrective_actions;
IF OBJECT_ID('pending_patrols', 'V') IS NOT NULL DROP VIEW pending_patrols;
IF OBJECT_ID('patrol_location_details', 'V') IS NOT NULL DROP VIEW patrol_location_details;
IF OBJECT_ID('project_areas_hierarchy', 'V') IS NOT NULL DROP VIEW project_areas_hierarchy;
IF OBJECT_ID('active_projects', 'V') IS NOT NULL DROP VIEW active_projects;

-- Drop tables in reverse dependency order
IF OBJECT_ID('attachments', 'U') IS NOT NULL DROP TABLE attachments;
IF OBJECT_ID('corrective_actions', 'U') IS NOT NULL DROP TABLE corrective_actions;
IF OBJECT_ID('patrol_observations', 'U') IS NOT NULL DROP TABLE patrol_observations;
IF OBJECT_ID('safety_patrols', 'U') IS NOT NULL DROP TABLE safety_patrols;
IF OBJECT_ID('project_subareas_2', 'U') IS NOT NULL DROP TABLE project_subareas_2;
IF OBJECT_ID('project_subareas_1', 'U') IS NOT NULL DROP TABLE project_subareas_1;
IF OBJECT_ID('project_areas', 'U') IS NOT NULL DROP TABLE project_areas;
IF OBJECT_ID('subareas_2', 'U') IS NOT NULL DROP TABLE subareas_2;
IF OBJECT_ID('subareas_1', 'U') IS NOT NULL DROP TABLE subareas_1;
IF OBJECT_ID('areas', 'U') IS NOT NULL DROP TABLE areas;
IF OBJECT_ID('projects', 'U') IS NOT NULL DROP TABLE projects;
IF OBJECT_ID('system_settings', 'U') IS NOT NULL DROP TABLE system_settings;
IF OBJECT_ID('risk_categories', 'U') IS NOT NULL DROP TABLE risk_categories;
IF OBJECT_ID('patrol_categories', 'U') IS NOT NULL DROP TABLE patrol_categories;
IF OBJECT_ID('users', 'U') IS NOT NULL DROP TABLE users;

PRINT 'Existing tables dropped. Creating new schema...';
PRINT '';
GO

-- =============================================
-- 1. USER MANAGEMENT SYSTEM (SIMPLIFIED)
-- =============================================

-- Users table - Auto-populated when employees login
CREATE TABLE users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    azure_ad_id NVARCHAR(255) UNIQUE NOT NULL, -- Azure AD user ID
    email NVARCHAR(255) UNIQUE NOT NULL,
    first_name NVARCHAR(100) NOT NULL,
    last_name NVARCHAR(100) NOT NULL,
    display_name NVARCHAR(200) NOT NULL,
    
    -- SIMPLIFIED ROLE SYSTEM - Single role field
    role NVARCHAR(50) DEFAULT 'member' NOT NULL,
    -- Options: system_admin, admin, member, registrant
    
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
    INDEX IX_users_department (department),
    INDEX IX_users_role (role)
);

-- =============================================
-- 2. ROLE DEFINITIONS (Documentation Only)
-- =============================================

-- Role hierarchy and permissions (for reference)
-- 1. system_admin  - Full system access, user management, all operations
-- 2. admin         - QSHE management, project oversight, can assign roles
-- 3. member        - Can create patrols, observations, corrective actions
-- 4. registrant    - Basic access, view only, just registered

-- =============================================
-- 3. PROJECT MANAGEMENT AND AREA STRUCTURE
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

-- Areas table (main areas within projects)
CREATE TABLE areas (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    area_code NVARCHAR(50) NOT NULL,
    area_name NVARCHAR(200) NOT NULL,
    area_description NVARCHAR(1000),
    
    -- Area details
    area_type NVARCHAR(100), -- building, floor, zone, outdoor, etc.
    safety_level NVARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    special_requirements NVARCHAR(1000),
    
    -- Status
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    INDEX IX_areas_code (area_code),
    INDEX IX_areas_active (is_active)
);

-- Subareas Level 1 (subdivisions of areas)
CREATE TABLE subareas_1 (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    area_id UNIQUEIDENTIFIER NOT NULL,
    subarea_code NVARCHAR(50) NOT NULL,
    subarea_name NVARCHAR(200) NOT NULL,
    subarea_description NVARCHAR(1000),
    
    -- Subarea details
    subarea_type NVARCHAR(100), -- room, section, wing, etc.
    access_requirements NVARCHAR(500),
    
    -- Status
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE,
    
    INDEX IX_subareas1_area (area_id),
    INDEX IX_subareas1_code (subarea_code),
    INDEX IX_subareas1_active (is_active)
);

-- Subareas Level 2 (subdivisions of subareas_1)
CREATE TABLE subareas_2 (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    subarea_1_id UNIQUEIDENTIFIER NOT NULL,
    subarea_code NVARCHAR(50) NOT NULL,
    subarea_name NVARCHAR(200) NOT NULL,
    subarea_description NVARCHAR(1000),
    
    -- Subarea details
    subarea_type NVARCHAR(100), -- equipment, workstation, storage, etc.
    specific_hazards NVARCHAR(500),
    
    -- Status
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (subarea_1_id) REFERENCES subareas_1(id) ON DELETE CASCADE,
    
    INDEX IX_subareas2_subarea1 (subarea_1_id),
    INDEX IX_subareas2_code (subarea_code),
    INDEX IX_subareas2_active (is_active)
);

-- Junction table: Projects to Areas (many-to-many)
CREATE TABLE project_areas (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    project_id UNIQUEIDENTIFIER NOT NULL,
    area_id UNIQUEIDENTIFIER NOT NULL,
    
    -- Assignment details
    assigned_date DATE DEFAULT CAST(GETDATE() AS DATE),
    assigned_by UNIQUEIDENTIFIER NOT NULL,
    is_active BIT DEFAULT 1,
    
    -- Notes
    assignment_notes NVARCHAR(500),
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id),
    
    -- Ensure unique project-area combinations
    CONSTRAINT UQ_project_area UNIQUE (project_id, area_id),
    
    INDEX IX_project_areas_project (project_id),
    INDEX IX_project_areas_area (area_id)
);

-- Junction table: Projects to Subareas Level 1 (many-to-many)
CREATE TABLE project_subareas_1 (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    project_id UNIQUEIDENTIFIER NOT NULL,
    subarea_1_id UNIQUEIDENTIFIER NOT NULL,
    
    -- Assignment details
    assigned_date DATE DEFAULT CAST(GETDATE() AS DATE),
    assigned_by UNIQUEIDENTIFIER NOT NULL,
    is_active BIT DEFAULT 1,
    
    -- Notes
    assignment_notes NVARCHAR(500),
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (subarea_1_id) REFERENCES subareas_1(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id),
    
    -- Ensure unique project-subarea combinations
    CONSTRAINT UQ_project_subarea1 UNIQUE (project_id, subarea_1_id),
    
    INDEX IX_project_subareas1_project (project_id),
    INDEX IX_project_subareas1_subarea (subarea_1_id)
);

-- Junction table: Projects to Subareas Level 2 (many-to-many)
CREATE TABLE project_subareas_2 (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    project_id UNIQUEIDENTIFIER NOT NULL,
    subarea_2_id UNIQUEIDENTIFIER NOT NULL,
    
    -- Assignment details
    assigned_date DATE DEFAULT CAST(GETDATE() AS DATE),
    assigned_by UNIQUEIDENTIFIER NOT NULL,
    is_active BIT DEFAULT 1,
    
    -- Notes
    assignment_notes NVARCHAR(500),
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (subarea_2_id) REFERENCES subareas_2(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id),
    
    -- Ensure unique project-subarea combinations
    CONSTRAINT UQ_project_subarea2 UNIQUE (project_id, subarea_2_id),
    
    INDEX IX_project_subareas2_project (project_id),
    INDEX IX_project_subareas2_subarea (subarea_2_id)
);

-- Insert some sample areas and subareas
INSERT INTO areas (area_code, area_name, area_description, area_type, safety_level) VALUES
('BLDG-A', 'Building A', 'Main office building', 'building', 'medium'),
('BLDG-B', 'Building B', 'Manufacturing facility', 'building', 'high'),
('YARD-1', 'Yard Area 1', 'Outdoor storage and loading area', 'outdoor', 'medium'),
('LAB-1', 'Laboratory Block 1', 'Research and testing laboratories', 'building', 'high');
GO

INSERT INTO subareas_1 (area_id, subarea_code, subarea_name, subarea_description, subarea_type) VALUES
((SELECT id FROM areas WHERE area_code = 'BLDG-A'), 'FL-1', 'Floor 1', 'Ground floor offices', 'floor'),
((SELECT id FROM areas WHERE area_code = 'BLDG-A'), 'FL-2', 'Floor 2', 'Second floor meeting rooms', 'floor'),
((SELECT id FROM areas WHERE area_code = 'BLDG-B'), 'PROD-A', 'Production Area A', 'Main production line', 'section'),
((SELECT id FROM areas WHERE area_code = 'BLDG-B'), 'QC-AREA', 'Quality Control', 'Quality control section', 'section'),
((SELECT id FROM areas WHERE area_code = 'LAB-1'), 'CHEM-LAB', 'Chemistry Lab', 'Chemical analysis laboratory', 'room');
GO

INSERT INTO subareas_2 (subarea_1_id, subarea_code, subarea_name, subarea_description, subarea_type) VALUES
((SELECT id FROM subareas_1 WHERE subarea_code = 'FL-1'), 'RECV-1', 'Reception Area', 'Main reception desk', 'workstation'),
((SELECT id FROM subareas_1 WHERE subarea_code = 'FL-1'), 'OFF-101', 'Office 101', 'General office space', 'room'),
((SELECT id FROM subareas_1 WHERE subarea_code = 'PROD-A'), 'LINE-1', 'Production Line 1', 'Assembly line 1', 'equipment'),
((SELECT id FROM subareas_1 WHERE subarea_code = 'PROD-A'), 'STORE-1', 'Storage Area 1', 'Raw material storage', 'storage'),
((SELECT id FROM subareas_1 WHERE subarea_code = 'CHEM-LAB'), 'FUME-1', 'Fume Hood 1', 'Chemical fume hood station', 'equipment');
GO

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
GO

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
    
    -- Location details (flexible - can be area, subarea_1, or subarea_2)
    area_id UNIQUEIDENTIFIER, -- Optional: Main area
    subarea_1_id UNIQUEIDENTIFIER, -- Optional: Subarea level 1
    subarea_2_id UNIQUEIDENTIFIER, -- Optional: Subarea level 2
    area_inspected NVARCHAR(200) NOT NULL, -- Text description of area
    specific_location NVARCHAR(500), -- Specific location within the area
    
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
    patrol_status NVARCHAR(20) DEFAULT 'open', -- open, pending_verification, closed, rejected
    submitted_at DATETIME2,
    reviewed_by UNIQUEIDENTIFIER,
    reviewed_at DATETIME2,
    
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (patrol_category_id) REFERENCES patrol_categories(id),
    FOREIGN KEY (inspector_id) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id),
    FOREIGN KEY (area_id) REFERENCES areas(id),
    FOREIGN KEY (subarea_1_id) REFERENCES subareas_1(id),
    FOREIGN KEY (subarea_2_id) REFERENCES subareas_2(id),
    
    INDEX IX_patrols_date (patrol_date),
    INDEX IX_patrols_project (project_id),
    INDEX IX_patrols_inspector (inspector_id),
    INDEX IX_patrols_status (patrol_status),
    INDEX IX_patrols_area (area_id),
    INDEX IX_patrols_subarea1 (subarea_1_id),
    INDEX IX_patrols_subarea2 (subarea_2_id)
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
GO

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
GO

-- =============================================
-- 9. PERMISSION HELPER FUNCTIONS
-- =============================================

-- Create function to check user permissions based on role hierarchy
-- Note: This will be implemented in application code for better performance

-- Role hierarchy levels:
-- system_admin = 1 (highest)
-- admin = 2  
-- member = 3
-- registrant = 4 (lowest)

-- =============================================
-- 10. INDEXES FOR PERFORMANCE
-- =============================================

-- Additional performance indexes
CREATE INDEX IX_patrols_date_status ON safety_patrols(patrol_date, patrol_status);
CREATE INDEX IX_corrective_actions_due ON corrective_actions(target_completion_date) WHERE action_status IN ('open', 'in_progress');
CREATE INDEX IX_observations_severity_type ON patrol_observations(severity_level, observation_type);
CREATE INDEX IX_users_role_active ON users(role, is_active);
CREATE INDEX IX_patrols_pending ON safety_patrols(patrol_status) WHERE patrol_status = 'pending_verification';
GO

-- =============================================
-- 11. SECURITY VIEWS (SIMPLIFIED)
-- =============================================

-- View for active projects with manager details
CREATE VIEW active_projects AS
SELECT 
    p.*,
    pm.display_name as project_manager_name,
    pm.email as project_manager_email,
    pm.role as project_manager_role
FROM projects p
LEFT JOIN users pm ON p.project_manager_id = pm.id
WHERE p.project_status = 'active';
GO

-- View for project areas hierarchy
CREATE VIEW project_areas_hierarchy AS
SELECT 
    p.project_code,
    p.project_name,
    a.area_code,
    a.area_name,
    a.area_type,
    s1.subarea_code as subarea_1_code,
    s1.subarea_name as subarea_1_name,
    s2.subarea_code as subarea_2_code,
    s2.subarea_name as subarea_2_name,
    pa.assigned_date as area_assigned_date,
    ps1.assigned_date as subarea_1_assigned_date,
    ps2.assigned_date as subarea_2_assigned_date
FROM projects p
LEFT JOIN project_areas pa ON p.id = pa.project_id AND pa.is_active = 1
LEFT JOIN areas a ON pa.area_id = a.id AND a.is_active = 1
LEFT JOIN project_subareas_1 ps1 ON p.id = ps1.project_id AND ps1.is_active = 1
LEFT JOIN subareas_1 s1 ON ps1.subarea_1_id = s1.id AND s1.is_active = 1
LEFT JOIN project_subareas_2 ps2 ON p.id = ps2.project_id AND ps2.is_active = 1
LEFT JOIN subareas_2 s2 ON ps2.subarea_2_id = s2.id AND s2.is_active = 1
WHERE p.project_status = 'active';
GO

-- View for safety patrol locations
CREATE VIEW patrol_location_details AS
SELECT 
    sp.id as patrol_id,
    sp.patrol_code,
    sp.patrol_date,
    p.project_name,
    a.area_name,
    s1.subarea_name as subarea_1_name,
    s2.subarea_name as subarea_2_name,
    sp.area_inspected as text_location,
    sp.specific_location,
    CONCAT(
        COALESCE(a.area_name + ' > ', ''),
        COALESCE(s1.subarea_name + ' > ', ''),
        COALESCE(s2.subarea_name + ' > ', ''),
        sp.area_inspected
    ) as full_location_path
FROM safety_patrols sp
JOIN projects p ON sp.project_id = p.id
LEFT JOIN areas a ON sp.area_id = a.id
LEFT JOIN subareas_1 s1 ON sp.subarea_1_id = s1.id
LEFT JOIN subareas_2 s2 ON sp.subarea_2_id = s2.id;
GO

-- View for pending verification patrols
CREATE VIEW pending_patrols AS
SELECT 
    sp.*,
    u.display_name as inspector_display_name,
    u.email as inspector_email,
    p.project_name,
    p.project_code,
    pc.category_name as patrol_category_name,
    DATEDIFF(day, sp.patrol_date, GETDATE()) as days_since_patrol
FROM safety_patrols sp
JOIN users u ON sp.inspector_id = u.id
JOIN projects p ON sp.project_id = p.id
JOIN patrol_categories pc ON sp.patrol_category_id = pc.id
WHERE sp.patrol_status = 'pending_verification';
GO

-- View for overdue corrective actions
CREATE VIEW overdue_corrective_actions AS
SELECT 
    ca.*,
    assigned_user.display_name as assigned_to_name,
    assigned_user.email as assigned_to_email,
    assigned_user.role as assigned_to_role,
    DATEDIFF(day, ca.target_completion_date, GETDATE()) as days_overdue
FROM corrective_actions ca
JOIN users assigned_user ON ca.assigned_to = assigned_user.id
WHERE ca.action_status IN ('open', 'in_progress') 
  AND ca.target_completion_date < CAST(GETDATE() AS DATE);
GO

-- View for user permissions (simplified)
CREATE VIEW user_summary AS
SELECT 
    id,
    email,
    display_name,
    role,
    department,
    job_title,
    is_active,
    last_login,
    created_at,
    CASE role
        WHEN 'system_admin' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'member' THEN 3
        WHEN 'registrant' THEN 4
        ELSE 999
    END as role_level
FROM users
WHERE is_active = 1;
GO

-- =============================================
-- SCRIPT COMPLETION
-- =============================================

PRINT 'QSHE Safety Management Database Schema Created Successfully!';
PRINT '';
PRINT 'DEPLOYMENT COMPLETED:';
PRINT '- Existing tables and views were safely dropped first';
PRINT '- Complete new schema created with all relationships';
PRINT '- Sample data inserted for areas, subareas, categories, and settings';
PRINT '';
PRINT 'SIMPLIFIED SCHEMA FEATURES:';
PRINT '- Users table with simple role field (no complex role tables)';
PRINT '- Role hierarchy: system_admin → admin → member → registrant';
PRINT '- nithat.su@th.jec.com will auto-get system_admin role on first login';
PRINT '- Complete project-area-subarea hierarchy with junction tables';
PRINT '- Flexible safety patrol location tracking (area/subarea references)';
PRINT '- Safety patrol status workflow: open → pending_verification → closed/rejected';
PRINT '- Complete safety patrol and corrective action system';
PRINT '- Cloudflare R2 integration for photos';
PRINT '- Performance optimized with proper indexes';
PRINT '';
PRINT 'AREA STRUCTURE:';
PRINT '- Projects → Areas (many-to-many via project_areas)';
PRINT '- Areas → Subareas_1 → Subareas_2 (hierarchical)';
PRINT '- Projects can link to any level: project_subareas_1, project_subareas_2';
PRINT '- Safety patrols can reference area_id, subarea_1_id, or subarea_2_id';
PRINT '';
PRINT 'ROLE DEFINITIONS:';
PRINT '1. system_admin  - Full system access (nithat.su@th.jec.com)';
PRINT '2. admin         - QSHE management and user role assignment';
PRINT '3. member        - Can create patrols, observations, corrective actions';
PRINT '4. registrant    - Basic access, view only (new users)';
PRINT '';
PRINT 'SAMPLE DATA INCLUDED:';
PRINT '- 4 sample areas (Building A, Building B, Yard Area 1, Lab Block 1)';
PRINT '- 5 sample subareas_1 (floors, production areas, lab sections)';
PRINT '- 5 sample subareas_2 (rooms, equipment, workstations)';
PRINT '';
PRINT 'Next steps:';
PRINT '1. Test user auto-registration with simplified 4-role system';
PRINT '2. Create projects and assign areas/subareas using junction tables';
PRINT '3. Implement role-based permission checking in application';
PRINT '4. Configure Cloudflare R2 for photo storage';
PRINT '5. Start using safety patrols with area hierarchy tracking';