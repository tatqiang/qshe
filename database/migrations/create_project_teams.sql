-- =====================================================
-- Project Teams Structure
-- =====================================================

-- Create project teams table
CREATE TABLE IF NOT EXISTS project_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  team_name VARCHAR(100) NOT NULL,
  team_code VARCHAR(20) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(project_id, team_code)
);

-- Create project team members junction table
-- Maps project members to teams (many-to-many relationship)
CREATE TABLE IF NOT EXISTS project_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_team_id UUID NOT NULL REFERENCES project_teams(id) ON DELETE CASCADE,
  project_member_id UUID NOT NULL REFERENCES project_members(id) ON DELETE CASCADE,
  role_in_team VARCHAR(100), -- e.g., 'Team Lead', 'Member', 'Reviewer'
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(project_team_id, project_member_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_teams_project_id ON project_teams(project_id);
CREATE INDEX IF NOT EXISTS idx_project_teams_team_code ON project_teams(team_code);
CREATE INDEX IF NOT EXISTS idx_project_team_members_team_id ON project_team_members(project_team_id);
CREATE INDEX IF NOT EXISTS idx_project_team_members_member_id ON project_team_members(project_member_id);

-- Enable RLS
ALTER TABLE project_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_teams
CREATE POLICY "Users can view teams in their projects"
  ON project_teams FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "Project admins can manage teams"
  ON project_teams FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT pm.project_id FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE u.auth_user_id = auth.uid()
      AND u.role IN ('admin', 'system_admin')
    )
  );

-- RLS Policies for project_team_members
CREATE POLICY "Users can view team members in their projects"
  ON project_team_members FOR SELECT
  TO authenticated
  USING (
    project_team_id IN (
      SELECT id FROM project_teams 
      WHERE project_id IN (
        SELECT project_id FROM project_members 
        WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Project admins can manage team members"
  ON project_team_members FOR ALL
  TO authenticated
  USING (
    project_team_id IN (
      SELECT pt.id FROM project_teams pt
      JOIN project_members pm ON pt.project_id = pm.project_id
      JOIN users u ON pm.user_id = u.id
      WHERE u.auth_user_id = auth.uid()
      AND u.role IN ('admin', 'system_admin')
    )
  );

COMMENT ON TABLE project_teams IS 'Teams within a project (QA/QC, MEP, Planner, etc.)';
COMMENT ON TABLE project_team_members IS 'Members assigned to project teams - one member can be in multiple teams';
COMMENT ON COLUMN project_team_members.role_in_team IS 'Optional role within the team (e.g., Team Lead, Reviewer)';
