-- ============================================
-- MEMBER APPLICATION MODULE - DATABASE SCHEMA
-- ============================================
-- Dynamic form system for member registration (employees and contractors)
-- Supports:
-- - Multiple form templates (Member Application, PTW, Toolbox Talk, etc.)
-- - Per-project field configuration (show/hide, required/optional)
-- - Multiple report templates per project
-- - Public token-based form access (no authentication required)
-- - Document uploads (ID card, medical certificate, etc.)

-- ============================================
-- 1. FORM TEMPLATES (Master Form Definitions)
-- ============================================
CREATE TABLE IF NOT EXISTS form_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- e.g., 'MEMBER_APPLICATION', 'PTW', 'TOOLBOX_TALK'
    name_th TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'personnel', 'safety', 'quality', etc.
    icon TEXT, -- Icon name for UI
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

COMMENT ON TABLE form_templates IS 'Master list of all form types (Member Application, PTW, Toolbox Talk, etc.)';

-- ============================================
-- 2. FORM FIELDS (Field Definitions)
-- ============================================
CREATE TABLE IF NOT EXISTS form_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_template_id UUID NOT NULL REFERENCES form_templates(id) ON DELETE CASCADE,
    field_key TEXT NOT NULL, -- e.g., 'first_name', 'birth_date', 'has_construction_exp'
    field_type TEXT NOT NULL, -- 'text', 'number', 'date', 'radio', 'checkbox', 'textarea', 'select', 'file', 'signature'
    label_th TEXT NOT NULL,
    label_en TEXT,
    placeholder_th TEXT,
    placeholder_en TEXT,
    help_text_th TEXT,
    help_text_en TEXT,
    
    -- Default settings (can be overridden per project)
    default_value TEXT,
    is_required_by_default BOOLEAN DEFAULT false,
    is_visible_by_default BOOLEAN DEFAULT true,
    
    -- Validation rules (JSON)
    validation_rules JSONB DEFAULT '{}', -- {"min": 1, "max": 100, "pattern": "^[0-9]{13}$", "minLength": 5}
    
    -- Options for select/radio/checkbox (JSON array)
    options JSONB DEFAULT '[]', -- [{"value": "yes", "label_th": "เคย", "label_en": "Yes"}]
    
    -- Field grouping and ordering
    section TEXT, -- 'personal_info', 'work_history', 'health', 'documents', 'signatures'
    display_order INTEGER NOT NULL DEFAULT 0,
    
    -- Conditional display (JSON)
    depends_on JSONB DEFAULT '{}', -- {"field": "has_construction_exp", "value": "yes"}
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(form_template_id, field_key)
);

COMMENT ON TABLE form_fields IS 'Field definitions for each form template';
COMMENT ON COLUMN form_fields.validation_rules IS 'JSON validation rules: min, max, pattern, minLength, maxLength, etc.';
COMMENT ON COLUMN form_fields.options IS 'Options for select/radio/checkbox fields';
COMMENT ON COLUMN form_fields.depends_on IS 'Conditional display based on other field values';

CREATE INDEX idx_form_fields_template ON form_fields(form_template_id);
CREATE INDEX idx_form_fields_order ON form_fields(form_template_id, display_order);

-- ============================================
-- 3. PROJECT FORM CONFIGS (Which forms are enabled per project)
-- ============================================
CREATE TABLE IF NOT EXISTS project_form_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    form_template_id UUID NOT NULL REFERENCES form_templates(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL, -- NEW: Link to company
    is_enabled BOOLEAN DEFAULT true,
    
    -- Form-level settings
    allow_multiple_submissions BOOLEAN DEFAULT true, -- Changed to true - one link for multiple people
    require_approval BOOLEAN DEFAULT true,
    notification_emails TEXT[], -- Email addresses to notify on submission
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    UNIQUE(project_id, form_template_id)
);

COMMENT ON TABLE project_form_configs IS 'Configure which form templates are enabled for each project';
COMMENT ON COLUMN project_form_configs.company_id IS 'Optional: Link form to specific company for contractor/vendor management';

CREATE INDEX idx_project_form_configs_project ON project_form_configs(project_id);
CREATE INDEX idx_project_form_configs_company ON project_form_configs(company_id);

-- ============================================
-- 4. PROJECT FIELD CONFIGS (Per-project field customization)
-- ============================================
CREATE TABLE IF NOT EXISTS project_field_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_form_config_id UUID NOT NULL REFERENCES project_form_configs(id) ON DELETE CASCADE,
    form_field_id UUID NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
    
    -- Override default settings
    is_visible BOOLEAN, -- NULL = use default
    is_required BOOLEAN, -- NULL = use default
    custom_label_th TEXT, -- Override label for this project
    custom_label_en TEXT,
    custom_help_text_th TEXT,
    custom_help_text_en TEXT,
    custom_validation_rules JSONB, -- Override validation rules
    custom_options JSONB, -- Override options for select/radio
    custom_display_order INTEGER, -- Override display order
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(project_form_config_id, form_field_id)
);

COMMENT ON TABLE project_field_configs IS 'Per-project customization of form fields (visibility, required, labels, etc.)';

CREATE INDEX idx_project_field_configs_form ON project_field_configs(project_form_config_id);

-- ============================================
-- 5. REPORT TEMPLATES (PDF/Print layouts)
-- ============================================
CREATE TABLE IF NOT EXISTS report_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE, -- NULL = global template
    form_template_id UUID NOT NULL REFERENCES form_templates(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false, -- Default template for this form/project
    
    -- HTML template with placeholders
    header_html TEXT, -- Header section (logo, company name, etc.)
    body_html TEXT NOT NULL, -- Main content with {{field_key}} placeholders
    footer_html TEXT, -- Footer section (signatures, page numbers, etc.)
    
    -- CSS for print
    print_css TEXT, -- @media print styles
    
    -- Field mapping (which fields to include in report)
    included_fields JSONB DEFAULT '[]', -- ["first_name", "last_name", "birth_date", ...]
    
    -- Assets
    logo_url TEXT, -- URL to logo (Cloudflare R2)
    watermark_url TEXT,
    
    -- Page settings
    paper_size TEXT DEFAULT 'A4', -- 'A4', 'Letter', 'Legal'
    orientation TEXT DEFAULT 'portrait', -- 'portrait', 'landscape'
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

COMMENT ON TABLE report_templates IS 'HTML/CSS templates for generating PDF reports';
COMMENT ON COLUMN report_templates.body_html IS 'HTML with {{field_key}} placeholders that will be replaced with actual data';

CREATE INDEX idx_report_templates_project ON report_templates(project_id);
CREATE INDEX idx_report_templates_form ON report_templates(form_template_id);

-- ============================================
-- 6. MEMBER APPLICATIONS (Actual submissions)
-- ============================================
-- Note: token_id foreign key will be added AFTER member_application_tokens table is created
CREATE TABLE IF NOT EXISTS member_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relations
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    form_template_id UUID NOT NULL REFERENCES form_templates(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL, -- NEW: Company from token
    token_id UUID, -- Will add foreign key constraint later
    
    -- Submission metadata
    submission_number TEXT UNIQUE NOT NULL, -- Auto-generated: MA-2025-001, MA-2025-002
    submitted_at TIMESTAMPTZ DEFAULT now(),
    submitted_by_name TEXT, -- Name from form (for non-authenticated users)
    submitted_by_email TEXT,
    submitted_by_phone TEXT,
    
    -- Form data (dynamic JSONB)
    form_data JSONB NOT NULL DEFAULT '{}', -- {"first_name": "John", "last_name": "Doe", ...}
    
    -- Status workflow
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'under_review'
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id),
    reviewer_notes TEXT,
    
    -- Signatures (image URLs)
    applicant_signature_url TEXT,
    supervisor_signature_url TEXT,
    supervisor_signed_at TIMESTAMPTZ,
    supervisor_signed_by UUID REFERENCES users(id),
    
    -- Metadata
    ip_address TEXT, -- For audit trail
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE member_applications IS 'Members (employees and contractors) registered via public link';
COMMENT ON COLUMN member_applications.form_data IS 'Dynamic form data stored as JSONB';
COMMENT ON COLUMN member_applications.submission_number IS 'Unique submission number like MA-2025-001';
COMMENT ON COLUMN member_applications.company_id IS 'Company that this member belongs to (from token)';

CREATE INDEX idx_member_applications_project ON member_applications(project_id);
CREATE INDEX idx_member_applications_company ON member_applications(company_id);
CREATE INDEX idx_member_applications_status ON member_applications(status);
CREATE INDEX idx_member_applications_submitted ON member_applications(submitted_at DESC);
CREATE INDEX idx_member_applications_token ON member_applications(token_id);

-- GIN index for JSONB queries
CREATE INDEX idx_member_applications_form_data ON member_applications USING GIN (form_data);

-- ============================================
-- 7. MEMBER APPLICATION DOCUMENTS (File uploads)
-- ============================================
CREATE TABLE IF NOT EXISTS member_application_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_application_id UUID NOT NULL REFERENCES member_applications(id) ON DELETE CASCADE,
    
    -- Document metadata
    document_type TEXT NOT NULL, -- 'profile_photo', 'id_card', 'medical_certificate'
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Path in Supabase Storage or R2
    file_url TEXT NOT NULL, -- Public URL
    file_size INTEGER, -- Bytes
    mime_type TEXT, -- 'image/jpeg', 'image/png', 'application/pdf'
    
    -- Optional metadata
    description TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT now(),
    
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE member_application_documents IS 'Document uploads: profile photo, ID card, medical certificate';
COMMENT ON COLUMN member_application_documents.document_type IS 'profile_photo, id_card, medical_certificate';

CREATE INDEX idx_member_application_documents_app ON member_application_documents(member_application_id);
CREATE INDEX idx_member_application_documents_type ON member_application_documents(document_type);

-- ============================================
-- 8. MEMBER APPLICATION TOKENS (Public form access)
-- ============================================
CREATE TABLE IF NOT EXISTS member_application_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Token data
    token TEXT UNIQUE NOT NULL, -- Random secure token (32+ chars)
    
    -- Relations
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    form_template_id UUID NOT NULL REFERENCES form_templates(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE, -- NEW: Required company
    
    -- Token settings
    is_one_time_use BOOLEAN DEFAULT false, -- Changed to false - allow multiple submissions per link
    max_uses INTEGER DEFAULT 999, -- Changed to 999 - allow many people
    current_uses INTEGER DEFAULT 0, -- Current number of uses
    
    expires_at TIMESTAMPTZ NOT NULL, -- Token expiration date
    
    -- Optional: Pre-fill data
    prefill_data JSONB DEFAULT '{}', -- Pre-fill form with data like position, department
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    last_used_at TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES users(id),
    revoke_reason TEXT
);

COMMENT ON TABLE member_application_tokens IS 'Secure tokens for public form access - one link for multiple people from same company';
COMMENT ON COLUMN member_application_tokens.token IS 'Unique secure token shared via email/link';
COMMENT ON COLUMN member_application_tokens.company_id IS 'Required: Which company this link is for';
COMMENT ON COLUMN member_application_tokens.max_uses IS 'Maximum number of people that can register (default 999)';
COMMENT ON COLUMN member_application_tokens.prefill_data IS 'Optional data to pre-fill in the form';

CREATE INDEX idx_member_application_tokens_token ON member_application_tokens(token);
CREATE INDEX idx_member_application_tokens_project ON member_application_tokens(project_id);
CREATE INDEX idx_member_application_tokens_company ON member_application_tokens(company_id);
CREATE INDEX idx_member_application_tokens_active ON member_application_tokens(is_active, expires_at);

-- ============================================
-- ADD FOREIGN KEY CONSTRAINT (After both tables exist)
-- ============================================

-- Add foreign key from member_applications to member_application_tokens
ALTER TABLE member_applications 
ADD CONSTRAINT fk_member_applications_token 
FOREIGN KEY (token_id) 
REFERENCES member_application_tokens(id) 
ON DELETE SET NULL;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_form_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_field_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_application_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - Admin/Authenticated Users
-- ============================================

-- Form Templates: Authenticated users can read, admins can manage
CREATE POLICY "form_templates_select" ON form_templates
    FOR SELECT USING (true); -- All authenticated users can read

CREATE POLICY "form_templates_insert" ON form_templates
    FOR INSERT WITH CHECK (true); -- App handles authorization

CREATE POLICY "form_templates_update" ON form_templates
    FOR UPDATE USING (true); -- App handles authorization

CREATE POLICY "form_templates_delete" ON form_templates
    FOR DELETE USING (true); -- App handles authorization

-- Form Fields: Same as form_templates
CREATE POLICY "form_fields_select" ON form_fields
    FOR SELECT USING (true);

CREATE POLICY "form_fields_insert" ON form_fields
    FOR INSERT WITH CHECK (true);

CREATE POLICY "form_fields_update" ON form_fields
    FOR UPDATE USING (true);

CREATE POLICY "form_fields_delete" ON form_fields
    FOR DELETE USING (true);

-- Project Form Configs: Same as above
CREATE POLICY "project_form_configs_select" ON project_form_configs
    FOR SELECT USING (true);

CREATE POLICY "project_form_configs_insert" ON project_form_configs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "project_form_configs_update" ON project_form_configs
    FOR UPDATE USING (true);

CREATE POLICY "project_form_configs_delete" ON project_form_configs
    FOR DELETE USING (true);

-- Project Field Configs: Same as above
CREATE POLICY "project_field_configs_select" ON project_field_configs
    FOR SELECT USING (true);

CREATE POLICY "project_field_configs_insert" ON project_field_configs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "project_field_configs_update" ON project_field_configs
    FOR UPDATE USING (true);

CREATE POLICY "project_field_configs_delete" ON project_field_configs
    FOR DELETE USING (true);

-- Report Templates: Same as above
CREATE POLICY "report_templates_select" ON report_templates
    FOR SELECT USING (true);

CREATE POLICY "report_templates_insert" ON report_templates
    FOR INSERT WITH CHECK (true);

CREATE POLICY "report_templates_update" ON report_templates
    FOR UPDATE USING (true);

CREATE POLICY "report_templates_delete" ON report_templates
    FOR DELETE USING (true);

-- Member Applications: Authenticated users can view their project's data
CREATE POLICY "member_applications_select" ON member_applications
    FOR SELECT USING (true);

CREATE POLICY "member_applications_insert" ON member_applications
    FOR INSERT WITH CHECK (true); -- Allow inserts from public form

CREATE POLICY "member_applications_update" ON member_applications
    FOR UPDATE USING (true);

CREATE POLICY "member_applications_delete" ON member_applications
    FOR DELETE USING (true);

-- Documents: Same as member_applications
CREATE POLICY "member_application_documents_select" ON member_application_documents
    FOR SELECT USING (true);

CREATE POLICY "member_application_documents_insert" ON member_application_documents
    FOR INSERT WITH CHECK (true); -- Allow uploads from public form

CREATE POLICY "member_application_documents_update" ON member_application_documents
    FOR UPDATE USING (true);

CREATE POLICY "member_application_documents_delete" ON member_application_documents
    FOR DELETE USING (true);

-- ============================================
-- RLS POLICIES - Public Access (Token-based)
-- ============================================

-- Tokens: Public can read their own token (by token string)
CREATE POLICY "member_application_tokens_public_select" ON member_application_tokens
    FOR SELECT USING (true); -- App validates token in application code

-- Note: We allow 'true' for RLS policies because:
-- 1. This app uses Azure AD authentication at application level
-- 2. Supabase auth.uid() is always null
-- 3. Authorization is handled in application code
-- 4. For public forms, we validate tokens in application logic

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to generate unique submission number
CREATE OR REPLACE FUNCTION generate_submission_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    year_prefix TEXT;
    counter INTEGER;
BEGIN
    -- Get current year
    year_prefix := 'MA-' || EXTRACT(YEAR FROM now())::TEXT || '-';
    
    -- Get the highest counter for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(submission_number FROM '\d+$') AS INTEGER)), 0) + 1
    INTO counter
    FROM member_applications
    WHERE submission_number LIKE year_prefix || '%';
    
    -- Format: MA-2025-001
    new_number := year_prefix || LPAD(counter::TEXT, 3, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate secure random token
CREATE OR REPLACE FUNCTION generate_secure_token(length INTEGER DEFAULT 32)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(length), 'hex');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-generate submission number
CREATE OR REPLACE FUNCTION set_submission_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.submission_number IS NULL OR NEW.submission_number = '' THEN
        NEW.submission_number := generate_submission_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_submission_number
    BEFORE INSERT ON member_applications
    FOR EACH ROW
    EXECUTE FUNCTION set_submission_number();

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_form_templates_updated_at
    BEFORE UPDATE ON form_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_form_fields_updated_at
    BEFORE UPDATE ON form_fields
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_project_form_configs_updated_at
    BEFORE UPDATE ON project_form_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_report_templates_updated_at
    BEFORE UPDATE ON report_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_member_applications_updated_at
    BEFORE UPDATE ON member_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================
-- GRANTS (Allow public access for anon role)
-- ============================================

-- Grant SELECT on config tables to anon (for public form to read configuration)
GRANT SELECT ON form_templates TO anon;
GRANT SELECT ON form_fields TO anon;
GRANT SELECT ON project_form_configs TO anon;
GRANT SELECT ON project_field_configs TO anon;
GRANT SELECT ON member_application_tokens TO anon;

-- Grant INSERT on submission tables to anon (for public form submission)
GRANT INSERT ON member_applications TO anon;
GRANT INSERT ON member_application_documents TO anon;

-- Grant SELECT, UPDATE on tokens to anon (to check and update usage count)
GRANT UPDATE ON member_application_tokens TO anon;

-- Grant USAGE on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Composite indexes for common queries
CREATE INDEX idx_member_applications_project_status ON member_applications(project_id, status);
CREATE INDEX idx_member_applications_project_submitted ON member_applications(project_id, submitted_at DESC);

-- ============================================
-- SUMMARY
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Member Application Schema Created Successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Tables Created:';
    RAISE NOTICE '  1. form_templates - Master form types';
    RAISE NOTICE '  2. form_fields - Field definitions';
    RAISE NOTICE '  3. project_form_configs - Per-project form settings';
    RAISE NOTICE '  4. project_field_configs - Per-project field customization';
    RAISE NOTICE '  5. report_templates - PDF/Print layouts';
    RAISE NOTICE '  6. member_applications - Submission data (JSONB)';
    RAISE NOTICE '  7. member_application_documents - File uploads';
    RAISE NOTICE '  8. member_application_tokens - Public form access tokens';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 RLS Policies: Enabled with app-level authorization';
    RAISE NOTICE '🎫 Public Access: Token-based (no authentication)';
    RAISE NOTICE '📁 Documents: ID Card + Medical Certificate';
    RAISE NOTICE '';
    RAISE NOTICE '⚡ Next Step: Run seed data script to create Member Application form template';
END $$;
