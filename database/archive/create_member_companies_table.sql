-- ============================================
-- CREATE MEMBER_COMPANIES JUNCTION TABLE
-- ============================================
-- This table creates a many-to-many relationship between members and companies
-- One member can work for multiple companies
-- One company can have multiple members
-- ============================================

-- ============================================
-- STEP 1: CREATE MEMBER_COMPANIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.member_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_application_id UUID NOT NULL,
  company_id UUID NOT NULL,
  
  -- Assignment details
  start_date DATE,
  end_date DATE,
  position TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  
  -- Foreign Keys
  CONSTRAINT member_companies_member_fkey 
    FOREIGN KEY (member_application_id) 
    REFERENCES member_applications(id) 
    ON DELETE CASCADE,
    
  CONSTRAINT member_companies_company_fkey 
    FOREIGN KEY (company_id) 
    REFERENCES companies(id) 
    ON DELETE CASCADE,
    
  CONSTRAINT member_companies_created_by_fkey 
    FOREIGN KEY (created_by) 
    REFERENCES users(id),
    
  CONSTRAINT member_companies_updated_by_fkey 
    FOREIGN KEY (updated_by) 
    REFERENCES users(id),
  
  -- Prevent duplicate assignments
  UNIQUE(member_application_id, company_id)
);

-- ============================================
-- STEP 2: CREATE INDEXES
-- ============================================

CREATE INDEX idx_member_companies_member 
  ON member_companies(member_application_id);

CREATE INDEX idx_member_companies_company 
  ON member_companies(company_id);

CREATE INDEX idx_member_companies_status 
  ON member_companies(status);

CREATE INDEX idx_member_companies_dates 
  ON member_companies(start_date, end_date);

CREATE INDEX idx_member_companies_member_status 
  ON member_companies(member_application_id, status);

CREATE INDEX idx_member_companies_company_status 
  ON member_companies(company_id, status);

-- ============================================
-- STEP 3: CREATE UPDATED_AT TRIGGER
-- ============================================

CREATE TRIGGER trigger_member_companies_updated_at
  BEFORE UPDATE ON member_companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- STEP 4: RLS POLICIES
-- ============================================

ALTER TABLE member_companies ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "member_companies_admin_all"
ON member_companies
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.auth_user_id = auth.uid() 
    AND users.role IN ('system_admin', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.auth_user_id = auth.uid() 
    AND users.role IN ('system_admin', 'admin')
  )
);

-- Public can view active member-company relationships (for member lists in public forms)
CREATE POLICY "member_companies_public_select"
ON member_companies
FOR SELECT
TO anon
USING (status = 'active');

-- ============================================
-- STEP 5: UPDATE member_applications TABLE
-- ============================================
-- Change company_id to be the PRIMARY company (from the token)
-- Members can have multiple companies via member_companies table

COMMENT ON COLUMN member_applications.company_id IS 
  'Primary company (from registration token). Member can work for multiple companies via member_companies table.';

-- ============================================
-- STEP 6: CREATE HELPER VIEW
-- ============================================
-- View to easily see all companies for each member

CREATE OR REPLACE VIEW member_all_companies AS
SELECT 
  ma.id AS member_id,
  ma.submission_number,
  ma.form_data->>'first_name' AS first_name,
  ma.form_data->>'last_name' AS last_name,
  
  -- Primary company (from token)
  c_primary.id AS primary_company_id,
  c_primary.name AS primary_company_name,
  c_primary.name_th AS primary_company_name_th,
  
  -- All companies (from member_companies)
  ARRAY_AGG(
    DISTINCT JSONB_BUILD_OBJECT(
      'id', mc.company_id,
      'name', c_all.name,
      'name_th', c_all.name_th,
      'start_date', mc.start_date,
      'end_date', mc.end_date,
      'position', mc.position,
      'status', mc.status
    )
  ) FILTER (WHERE mc.id IS NOT NULL) AS all_companies,
  
  COUNT(DISTINCT mc.company_id) FILTER (WHERE mc.status = 'active') AS active_company_count,
  
  ma.status AS member_status,
  ma.submitted_at,
  ma.project_id
  
FROM member_applications ma
LEFT JOIN companies c_primary ON ma.company_id = c_primary.id
LEFT JOIN member_companies mc ON ma.id = mc.member_application_id
LEFT JOIN companies c_all ON mc.company_id = c_all.id
GROUP BY 
  ma.id, 
  ma.submission_number,
  ma.form_data,
  c_primary.id,
  c_primary.name,
  c_primary.name_th,
  ma.status,
  ma.submitted_at,
  ma.project_id;

-- ============================================
-- STEP 7: CREATE HELPER FUNCTIONS
-- ============================================

-- Function to automatically create member_companies record when member is created
CREATE OR REPLACE FUNCTION create_initial_member_company()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically link member to their primary company
  IF NEW.company_id IS NOT NULL THEN
    INSERT INTO member_companies (
      member_application_id,
      company_id,
      start_date,
      status,
      notes,
      created_by
    ) VALUES (
      NEW.id,
      NEW.company_id,
      CURRENT_DATE,
      'active',
      'Initial company from registration',
      NEW.reviewed_by
    )
    ON CONFLICT (member_application_id, company_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create member_companies record
CREATE TRIGGER trigger_create_initial_member_company
  AFTER INSERT ON member_applications
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_member_company();

-- ============================================
-- STEP 8: VERIFY SETUP
-- ============================================

-- Check table exists
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'member_companies') AS column_count
FROM information_schema.tables 
WHERE table_name = 'member_companies';

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'member_companies';

-- Check RLS policies
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'member_companies';

-- Check view exists
SELECT table_name, view_definition
FROM information_schema.views
WHERE table_name = 'member_all_companies';

COMMENT ON TABLE member_companies IS 
  'Junction table for many-to-many relationship between members and companies. One member can work for multiple companies.';

COMMENT ON VIEW member_all_companies IS 
  'Helper view showing all companies (primary + additional) for each member with aggregated data.';
