# Global State Management with Pinia

## Overview
Your app now uses **Pinia stores** for global reactive state management. This replaces the composable-based approach and ensures all components reactively respond to state changes.

## Available Stores

### 1. AuthStore (`@/stores/authStore`)
Manages user authentication and profile data.

**Usage:**
```typescript
import { useAuthStore } from '@/stores/authStore'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const { user, userId, userRole, isAuthenticated, isAdmin } = storeToRefs(authStore)
```

**State & Getters:**
- `user` - Full user object with id, email, role, etc.
- `userId` - Computed getter for user ID (null if not authenticated)
- `userRole` - Computed getter for user role (null if not authenticated)
- `isAuthenticated` - Boolean computed based on user existence
- `isAdmin` - Boolean computed (true if role === 'system_admin')
- `azureUser` - Azure AD profile
- `loading` - Loading state
- `error` - Error message if any

**Actions:**
- `initialize()` - Initialize auth on app load
- `signIn()` - Sign in with Azure AD
- `signOut()` - Sign out user

---

### 2. ProjectStore (`@/stores/projectStore`)
Manages project selection and project list.

**Usage:**
```typescript
import { useProjectStore } from '@/stores/projectStore'
import { storeToRefs } from 'pinia'

const projectStore = useProjectStore()
const { selectedProject, projectId, displayName, projects } = storeToRefs(projectStore)
```

**State & Getters:**
- `selectedProject` - Currently selected project object (null for "All Projects")
- `projectId` - Computed getter for project ID (null if no project selected)
- `displayName` - Computed getter for display name (project name or "All Projects")
- `projects` - Array of all projects
- `loading` - Loading state
- `error` - Error message if any

**Actions:**
- `loadProjects()` - Load all projects
- `loadActiveProjects(user)` - Load active projects for user
- `setProject(project)` - Set selected project and persist to localStorage
- `clearProject()` - Clear project selection

---

## Example: PatrolView Integration

### Before (using composable - broken reactivity):
```typescript
import { useProject } from '@/composables/useProject'

const { selectedProject } = useProject()

// Had to use event listeners and nextTick workarounds
window.addEventListener('project-changed', handleProjectChange)
```

### After (using Pinia store - reactive):
```typescript
import { useProjectStore } from '@/stores/projectStore'
import { storeToRefs } from 'pinia'

const projectStore = useProjectStore()
const { selectedProject } = storeToRefs(projectStore)

// Simple reactive watcher - no event listeners needed!
watch(() => selectedProject.value, (newProject, oldProject) => {
  if (newProject?.id !== oldProject?.id) {
    loadPatrols()
  }
})
```

---

## Key Benefits

1. **True Reactivity**: Changes in TopNav immediately propagate to PatrolView
2. **No Event Hacks**: No need for custom events or nextTick delays
3. **Type Safety**: Full TypeScript support with proper typing
4. **Persistence**: Selected project auto-saved to localStorage
5. **Centralized State**: Single source of truth for user and project data
6. **Composable**: Easy to use in any component with `storeToRefs()`

---

## Files Updated

- ✅ `src/stores/authStore.ts` - Added `userId` and `userRole` computed getters
- ✅ `src/stores/projectStore.ts` - Added `projectId` computed getter
- ✅ `src/features/patrol/views/PatrolView.vue` - Migrated from composable to Pinia store
- ✅ `src/components/layout/TopNav.vue` - Already using projectStore

---

## Testing

Build successful ✅
```bash
npm run build
# ✓ built in 3.00s
```

The project filtering now works reactively:
1. User selects project in TopNav
2. `projectStore.setProject()` updates the store
3. PatrolView watcher automatically triggers
4. Patrol list filters by new project_id immediately
5. No page refresh needed!
