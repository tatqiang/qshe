# Test Project Implementation Guide

## Overview
Add support for test/sandbox projects that are:
- ✅ Only visible to `system_admin` users
- ✅ Excluded from dashboard statistics
- ✅ Excluded from reports
- ✅ Clearly marked with a badge/indicator

## Database Changes

### 1. Add Field to Projects Table

**File:** `database/add_test_project_field.sql`

```sql
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS is_test_project BOOLEAN DEFAULT false;
```

**Run in Supabase SQL Editor**

## Frontend Changes

### 2. Update Project Interface

**File:** `src/contexts/AppContext.tsx` or `src/types/index.ts`

```typescript
export interface Project {
  id: string;
  project_code: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'completed';
  project_manager_id?: string;
  is_test_project?: boolean; // ✅ ADD THIS
  created_at: string;
  updated_at: string;
}
```

### 3. Update Project Selection Modal

**File:** `src/components/common/ProjectSelectionModal.tsx`

Filter projects based on user role:

```typescript
const ProjectSelectionModal = () => {
  const { isSystemAdmin } = useUserRole();
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Fetch and filter projects
  const filteredProjects = useMemo(() => {
    if (isSystemAdmin) {
      // System admin sees all projects (including test)
      return projects;
    } else {
      // Regular users only see production projects
      return projects.filter(p => !p.is_test_project);
    }
  }, [projects, isSystemAdmin]);
  
  return (
    // Render filteredProjects...
  );
};
```

### 4. Add Test Project Badge

**File:** `src/components/common/ProjectSelectionModal.tsx`

```typescript
const ProjectBadge = ({ project }: { project: Project }) => {
  if (project.is_test_project) {
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300">
        🧪 TEST
      </span>
    );
  }
  
  return (
    <span className={`px-2 py-1 text-xs rounded-full ${
      project.status === 'active' 
        ? 'bg-green-100 text-green-800' 
        : 'bg-gray-100 text-gray-800'
    }`}>
      {project.status}
    </span>
  );
};
```

### 5. Exclude Test Projects from Dashboard Stats

**File:** `src/components/features/Dashboard.tsx`

```typescript
useEffect(() => {
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all patrols excluding test projects
      const { data: patrols, error } = await supabase
        .from('safety_patrols')
        .select(`
          *,
          projects!inner(id, is_test_project)
        `)
        .eq('projects.is_test_project', false); // ✅ Exclude test projects
      
      if (error) throw error;
      
      // Calculate stats from patrols...
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  loadDashboardData();
}, []);
```

### 6. Update Data Filters Component

**File:** `src/components/features/Dashboard.tsx`

Add filter to exclude test projects from dropdown:

```typescript
// Load available projects for filter dropdown
useEffect(() => {
  const loadProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('is_test_project', false) // ✅ Don't show test projects in filters
      .order('name');
    
    if (!error && data) {
      setAvailableProjects(data);
    }
  };
  
  loadProjects();
}, []);
```

### 7. Update Patrol Service

**File:** `src/services/SafetyPatrolService.ts`

Add helper function to exclude test projects:

```typescript
// Get all patrols (excluding test projects for non-admin users)
export const getAllPatrols = async (includeTestProjects = false) => {
  let query = supabase
    .from('safety_patrols')
    .select(`
      *,
      projects!inner(
        id,
        project_code,
        name,
        is_test_project
      )
    `);
  
  if (!includeTestProjects) {
    query = query.eq('projects.is_test_project', false);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};
```

## Implementation Steps

### Step 1: Database Migration
```bash
# Run in Supabase SQL Editor
# File: database/add_test_project_field.sql
```

### Step 2: Create Test Project
```sql
INSERT INTO projects (
    project_code,
    name,
    description,
    status,
    is_test_project
) VALUES (
    'TEST-001',
    '🧪 Test Project - System Admin Only',
    'Sandbox project for testing features',
    'active',
    true
);
```

### Step 3: Update TypeScript Types
- Add `is_test_project?: boolean` to Project interface
- Update all components that use Project type

### Step 4: Update Project Selection
- Filter projects based on user role
- Add test project badge/indicator

### Step 5: Update Dashboard & Stats
- Exclude test project data from calculations
- Add filter option for system admins to include/exclude test data

### Step 6: Update Reports
- Exclude test projects from all reports by default
- Add admin option to include test data

## User Experience

### For System Admin:
```
Project Selection:
┌─────────────────────────────────────┐
│ Select Project                      │
├─────────────────────────────────────┤
│ ○ AIA Connect           [Active]    │
│ ○ Test Project          [🧪 TEST]   │ ← Only visible to admin
│ ○ Project Alpha         [Active]    │
└─────────────────────────────────────┘

Dashboard:
- Option to "Include Test Projects in Statistics" (checkbox)
- Default: Test projects excluded
```

### For Regular Users:
```
Project Selection:
┌─────────────────────────────────────┐
│ Select Project                      │
├─────────────────────────────────────┤
│ ○ AIA Connect           [Active]    │
│ ○ Project Alpha         [Active]    │
└─────────────────────────────────────┘

Dashboard:
- Test projects automatically hidden
- No option to include them
```

## Testing Checklist

### As System Admin:
- [ ] Can see test projects in project selection
- [ ] Test project shows "🧪 TEST" badge
- [ ] Dashboard excludes test project data by default
- [ ] Can create patrols in test project
- [ ] Test patrol data doesn't affect statistics

### As Regular User (Member):
- [ ] Cannot see test projects in project selection
- [ ] Cannot access test project even with direct link
- [ ] Dashboard never shows test project data
- [ ] No indication that test projects exist

### Dashboard Statistics:
- [ ] Total patrols count excludes test projects
- [ ] Risk assessment stats exclude test projects
- [ ] Recent activities exclude test projects
- [ ] Charts and graphs exclude test projects
- [ ] Project dropdown doesn't show test projects

## Advanced Features (Optional)

### 1. Test Data Auto-Cleanup
```sql
-- Delete test project data older than 30 days
DELETE FROM safety_patrols
WHERE project_id IN (
    SELECT id FROM projects WHERE is_test_project = true
)
AND created_at < NOW() - INTERVAL '30 days';
```

### 2. Test Project Templates
```typescript
// Quickly create test data
const createTestPatrol = async (projectId: string) => {
  return await SafetyPatrolService.createPatrol({
    project_id: projectId,
    location: 'Test Location',
    description: '🧪 Test Patrol - Auto Generated',
    // ... other test data
  });
};
```

### 3. Admin Dashboard Toggle
```typescript
// In Dashboard component
const [includeTestProjects, setIncludeTestProjects] = useState(false);

{isSystemAdmin && (
  <div className="mb-4">
    <label className="flex items-center">
      <input
        type="checkbox"
        checked={includeTestProjects}
        onChange={(e) => setIncludeTestProjects(e.target.checked)}
        className="mr-2"
      />
      Include test projects in statistics
    </label>
  </div>
)}
```

## Security Considerations

### RLS Policies (Optional Enhanced Security)
```sql
-- Only system admins can view test projects
CREATE POLICY "system_admin_only_test_projects" 
ON projects FOR SELECT 
USING (
    is_test_project = false 
    OR 
    auth.jwt() ->> 'role' = 'system_admin'
);

-- Prevent regular users from creating records in test projects
CREATE POLICY "no_regular_user_test_project_data" 
ON safety_patrols FOR INSERT 
WITH CHECK (
    NOT EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = safety_patrols.project_id 
        AND projects.is_test_project = true
        AND auth.jwt() ->> 'role' != 'system_admin'
    )
);
```

## Alternative Approaches

### Option 2: Project Category Field
```sql
ALTER TABLE projects 
ADD COLUMN category VARCHAR(50) DEFAULT 'production';
-- Values: 'production', 'test', 'demo', 'archived'
```

### Option 3: Project Tags
```sql
ALTER TABLE projects 
ADD COLUMN tags TEXT[] DEFAULT '{}';
-- Example: ['test', 'internal', 'demo']
```

## Recommendation

**Use Option 1 (Simple Boolean)** because:
- ✅ Simple and clear
- ✅ Easy to query and filter
- ✅ Minimal code changes
- ✅ Good performance
- ✅ Clear intent

The boolean flag is sufficient for your use case and easier to implement and maintain.
