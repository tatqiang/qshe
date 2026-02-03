-- =====================================================
-- Seed Default Project Teams
-- =====================================================

-- Function to create default teams for a project
CREATE OR REPLACE FUNCTION create_default_project_teams(p_project_id UUID, p_created_by UUID)
RETURNS void AS $$
BEGIN
  -- Insert default teams if they don't exist
  INSERT INTO project_teams (project_id, team_name, team_code, description, created_by)
  VALUES 
    (p_project_id, 'QA/QC Team', 'QAQC', 'Quality Assurance and Quality Control team', p_created_by),
    (p_project_id, 'MEP Team', 'MEP', 'Mechanical, Electrical, and Plumbing team', p_created_by),
    (p_project_id, 'Planning Team', 'PLAN', 'Project planning and coordination team', p_created_by),
    (p_project_id, 'Safety Team', 'SAFE', 'Health, Safety, and Environment team', p_created_by),
    (p_project_id, 'Engineering Team', 'ENG', 'Engineering and design team', p_created_by)
  ON CONFLICT (project_id, team_code) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-assign project members to teams based on their position
CREATE OR REPLACE FUNCTION auto_assign_member_to_teams(p_project_member_id UUID)
RETURNS void AS $$
DECLARE
  v_position_code VARCHAR(10);
  v_project_id UUID;
  v_qaqc_team_id UUID;
  v_mep_team_id UUID;
  v_planning_team_id UUID;
  v_safety_team_id UUID;
  v_eng_team_id UUID;
BEGIN
  -- Get member's position code and project
  SELECT pos.code, pm.project_id INTO v_position_code, v_project_id
  FROM project_members pm
  JOIN users u ON pm.user_id = u.id
  LEFT JOIN positions pos ON u.position_id = pos.id
  WHERE pm.id = p_project_member_id;
  
  -- Get team IDs
  SELECT id INTO v_qaqc_team_id FROM project_teams WHERE project_id = v_project_id AND team_code = 'QAQC';
  SELECT id INTO v_mep_team_id FROM project_teams WHERE project_id = v_project_id AND team_code = 'MEP';
  SELECT id INTO v_planning_team_id FROM project_teams WHERE project_id = v_project_id AND team_code = 'PLAN';
  SELECT id INTO v_safety_team_id FROM project_teams WHERE project_id = v_project_id AND team_code = 'SAFE';
  SELECT id INTO v_eng_team_id FROM project_teams WHERE project_id = v_project_id AND team_code = 'ENG';
  
  -- Auto-assign based on position code
  CASE v_position_code
    -- QA/QC Team
    WHEN 'QAM' THEN -- QA/QC Manager
      INSERT INTO project_team_members (project_team_id, project_member_id, role_in_team)
      VALUES (v_qaqc_team_id, p_project_member_id, 'Team Lead')
      ON CONFLICT DO NOTHING;
      
    WHEN 'QE-E', 'QE-M' THEN -- QA/QC Engineers
      INSERT INTO project_team_members (project_team_id, project_member_id, role_in_team)
      VALUES (v_qaqc_team_id, p_project_member_id, 'Engineer')
      ON CONFLICT DO NOTHING;
      
    WHEN 'Q-Adm' THEN -- QA/QC Admin
      INSERT INTO project_team_members (project_team_id, project_member_id, role_in_team)
      VALUES (v_qaqc_team_id, p_project_member_id, 'Admin')
      ON CONFLICT DO NOTHING;
    
    -- Engineering Team  
    WHEN 'PE', 'SE' THEN -- Project/Site Engineer
      INSERT INTO project_team_members (project_team_id, project_member_id, role_in_team)
      VALUES (v_eng_team_id, p_project_member_id, 'Engineer')
      ON CONFLICT DO NOTHING;
      
      -- Also add to MEP if needed
      INSERT INTO project_team_members (project_team_id, project_member_id, role_in_team)
      VALUES (v_mep_team_id, p_project_member_id, 'Engineer')
      ON CONFLICT DO NOTHING;
    
    -- Safety Team
    WHEN 'QSHEM' THEN -- QSHE Manager
      INSERT INTO project_team_members (project_team_id, project_member_id, role_in_team)
      VALUES (v_safety_team_id, p_project_member_id, 'Team Lead')
      ON CONFLICT DO NOTHING;
      
    WHEN 'SO' THEN -- Safety Officer
      INSERT INTO project_team_members (project_team_id, project_member_id, role_in_team)
      VALUES (v_safety_team_id, p_project_member_id, 'Officer')
      ON CONFLICT DO NOTHING;
    
    -- Management (add to planning team)
    WHEN 'PM', 'APM', 'PD' THEN -- Project Manager, Assistant PM, Project Director
      INSERT INTO project_team_members (project_team_id, project_member_id, role_in_team)
      VALUES (v_planning_team_id, p_project_member_id, 'Manager')
      ON CONFLICT DO NOTHING;
      
    ELSE
      -- Default: no auto-assignment
      NULL;
  END CASE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_default_project_teams IS 'Creates default teams (QA/QC, MEP, Planning, Safety, Engineering) for a project';
COMMENT ON FUNCTION auto_assign_member_to_teams IS 'Automatically assigns project member to appropriate teams based on their position code';
