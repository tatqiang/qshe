-- =====================================================
-- Update ITR Table for Enhanced Workflow
-- =====================================================

-- Add new columns to construction_itrs table
ALTER TABLE construction_itrs 
  DROP COLUMN IF EXISTS status CASCADE;

ALTER TABLE construction_itrs
  ADD COLUMN IF NOT EXISTS status_code itr_status_code DEFAULT 'plan',
  ADD COLUMN IF NOT EXISTS pic_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS internal_requested_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS internal_requested_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS confirm_requested_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS confirm_requested_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS itr_no_assigned_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS review_comments TEXT,
  ADD COLUMN IF NOT EXISTS target_team_id UUID REFERENCES project_teams(id),
  ADD COLUMN IF NOT EXISTS do_file_url TEXT,
  ADD COLUMN IF NOT EXISTS do_file_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS additional_files JSONB DEFAULT '[]'::jsonb;

-- Update existing status field if needed
COMMENT ON COLUMN construction_itrs.status_code IS 'Current status of ITR using enum code';
COMMENT ON COLUMN construction_itrs.pic_user_id IS 'Person in Charge who created the ITR';
COMMENT ON COLUMN construction_itrs.internal_requested_at IS 'When ITR was internally requested to QA/QC';
COMMENT ON COLUMN construction_itrs.confirm_requested_at IS 'When QA/QC confirmed and assigned ITR No';
COMMENT ON COLUMN construction_itrs.target_team_id IS 'Target team for ITR review (usually QA/QC team)';
COMMENT ON COLUMN construction_itrs.do_file_url IS 'Delivery Order file URL';
COMMENT ON COLUMN construction_itrs.additional_files IS 'Array of additional file objects [{url, name, type, uploadedAt}]';

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_construction_itrs_status_code ON construction_itrs(status_code);
CREATE INDEX IF NOT EXISTS idx_construction_itrs_pic_user_id ON construction_itrs(pic_user_id);
CREATE INDEX IF NOT EXISTS idx_construction_itrs_target_team_id ON construction_itrs(target_team_id);

-- Create view for ITR with full details
CREATE OR REPLACE VIEW itr_with_details AS
SELECT 
  itr.*,
  status_def.display_name as status_display,
  status_def.color as status_color,
  status_def.icon as status_icon,
  pic.first_name || ' ' || pic.last_name as pic_name,
  pic.email as pic_email,
  pic_pos.position_title as pic_position,
  req_by.first_name || ' ' || req_by.last_name as requested_by_name,
  conf_by.first_name || ' ' || conf_by.last_name as confirmed_by_name,
  rev_by.first_name || ' ' || rev_by.last_name as reviewed_by_name,
  team.team_name as target_team_name,
  task.name as task_name,
  task.task_id as task_custom_id,
  proj.name as project_name
FROM construction_itrs itr
LEFT JOIN itr_status_definitions status_def ON itr.status_code = status_def.code
LEFT JOIN users pic ON itr.pic_user_id = pic.id
LEFT JOIN positions pic_pos ON pic.position_id = pic_pos.id
LEFT JOIN users req_by ON itr.internal_requested_by = req_by.id
LEFT JOIN users conf_by ON itr.confirm_requested_by = conf_by.id
LEFT JOIN users rev_by ON itr.reviewed_by = rev_by.id
LEFT JOIN project_teams team ON itr.target_team_id = team.id
LEFT JOIN construction_tasks task ON itr.task_id = task.id
LEFT JOIN projects proj ON itr.project_id = proj.id;

COMMENT ON VIEW itr_with_details IS 'Complete ITR view with status labels, user details, and team information';
