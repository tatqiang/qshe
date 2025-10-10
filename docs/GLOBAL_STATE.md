# Global State Management

This document explains the global state management system for user ID, project ID, and other app-wide variables.

## Overview

The app now uses a centralized state management system through React Context, providing:
- **Global User State** - Current logged-in user information
- **Global Project State** - Currently selected project information  
- **Global Organization State** - Organization/company context (for future multi-org support)
- **Persistent Storage** - Automatic localStorage synchronization
- **Type Safety** - Full TypeScript support with proper types

## Quick Start

### 1. Use the Global Context Hooks

```tsx
import { useCurrentProject, useCurrentUser, useProjectId, useUserId } from '../hooks/useGlobalState';

function MyComponent() {
  const projectId = useProjectId(); // Returns current project ID or null
  const userId = useUserId();       // Returns current user ID or null
  const project = useCurrentProject(); // Returns full project object or null
  const user = useCurrentUser();       // Returns full user object or null
  
  return (
    <div>
      {projectId ? `Current Project: ${project?.name}` : 'No project selected'}
      {userId ? `User: ${user?.name}` : 'Not logged in'}
    </div>
  );
}
```

### 2. For Components That Require Project/User

```tsx
import { useRequiredProjectId, useRequiredUserId } from '../hooks/useGlobalState';

function SafetyPatrolForm() {
  // These will throw errors if no project/user is selected
  const projectId = useRequiredProjectId(); // Throws if no project
  const userId = useRequiredUserId();       // Throws if no user
  
  // Your component logic here...
}
```

### 3. For Form Default Values

```tsx
import { useFormDefaults } from '../hooks/useGlobalState';

function MyForm() {
  const defaults = useFormDefaults();
  
  const form = useForm({
    defaultValues: {
      projectId: defaults.projectId,
      createdBy: defaults.createdBy,
      patrolDate: defaults.patrolDate,
      // ... other defaults
    }
  });
}
```

## Available Hooks

### Basic Hooks
- `useProjectId()` - Returns current project ID or null
- `useUserId()` - Returns current user ID or null  
- `useCurrentProject()` - Returns full project object or null
- `useCurrentUser()` - Returns full user object or null

### Required Hooks (throw errors if missing)
- `useRequiredProjectId()` - Project ID (throws if missing)
- `useRequiredUserId()` - User ID (throws if missing)

### Utility Hooks
- `useGlobalIds()` - Returns { projectId, userId, hasProject, hasUser, isReady }
- `useFormDefaults()` - Returns default form values with global context
- `useProjectSelection()` - Manage project selection state
- `useAuth()` - Manage authentication state

## Setting Global Values

### Set Current Project
```tsx
import { useAppContext } from '../contexts/AppContext';

function ProjectSelector() {
  const { setProject } = useAppContext();
  
  const handleProjectSelect = (project) => {
    setProject(project); // Automatically saves to localStorage
  };
}
```

### Set Current User
```tsx
import { useAppContext } from '../contexts/AppContext';

function AuthComponent() {
  const { setUser } = useAppContext();
  
  const handleLogin = (userData) => {
    setUser(userData); // Automatically saves to localStorage
  };
}
```

## Migration Guide

### Before (Using localStorage directly)
```tsx
// OLD WAY - Don't do this anymore
const [currentProject, setCurrentProject] = useState(null);

useEffect(() => {
  const stored = localStorage.getItem('selected-project');
  if (stored) {
    setCurrentProject(JSON.parse(stored));
  }
}, []);

// Usage
const projectId = currentProject?.id || 'fallback-id';
```

### After (Using global context)
```tsx
// NEW WAY - Much cleaner!
import { useProjectId, useCurrentProject } from '../hooks/useGlobalState';

const projectId = useProjectId();
const project = useCurrentProject();
```

## Constants and Configuration

All app-wide constants are now centralized in `src/constants/index.ts`:

```tsx
import { 
  SAFETY_PATROL, 
  USER_ROLES, 
  ERROR_MESSAGES,
  DEFAULT_VALUES 
} from '../constants';

// Use constants instead of hardcoded values
const patrolTypes = SAFETY_PATROL.PATROL_TYPES;
const errorMsg = ERROR_MESSAGES.PROJECT_REQUIRED;
```

## Benefits

### 1. **Consistency**
- All components use the same global state
- No more prop drilling
- Consistent data across the app

### 2. **Type Safety**
- Full TypeScript support
- Proper error handling for missing data
- IDE autocomplete and error checking

### 3. **Performance**
- Automatic localStorage persistence
- Cross-tab synchronization
- Efficient re-renders

### 4. **Developer Experience**
- Simple, clean API
- Easy to test and debug
- Clear error messages

### 5. **Maintainability**
- Centralized state management
- Easy to add new global variables
- Clear separation of concerns

## Examples

### Safety Patrol Form with Global Context
```tsx
import { useProjectId, useUserId } from '../hooks/useGlobalState';
import { SAFETY_PATROL } from '../constants';

function SafetyPatrolForm() {
  const projectId = useProjectId();
  const userId = useUserId();
  
  if (!projectId) {
    return <ProjectSelectionPrompt />;
  }
  
  const onSubmit = (formData) => {
    const patrolData = {
      ...formData,
      project_id: projectId,
      created_by: userId,
      patrol_type: SAFETY_PATROL.PATROL_TYPES[0].value
    };
    
    // Submit patrol...
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <HierarchicalAreaInput projectId={projectId} />
      {/* Rest of form */}
    </form>
  );
}
```

### Project-Aware API Calls
```tsx
import { useRequiredProjectId } from '../hooks/useGlobalState';

function usePatrolsApi() {
  const projectId = useRequiredProjectId();
  
  const fetchPatrols = useCallback(async () => {
    return await supabase
      .from('safety_patrols')
      .select('*')
      .eq('project_id', projectId); // Always uses correct project
  }, [projectId]);
  
  return { fetchPatrols };
}
```

This global state system makes the codebase much more maintainable and provides a solid foundation for future development!
