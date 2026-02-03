# Project Planning Architecture

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Top Navigation Bar                       │
│                                                               │
│  [Logo]  [Menu]  [🔽 Pomelo Project ▼]  [User]  [Settings] │
│                        │                                      │
│                        │ User selects project                │
│                        ▼                                      │
└────────────────────────┼──────────────────────────────────────┘
                         │
                         │ projectStore.setProject(project)
                         │
                    ┌────▼────┐
                    │         │
                    │ Project │ ← Global State
                    │  Store  │   (Pinia)
                    │         │
                    └────┬────┘
                         │
                         │ projectStore.selectedProject (watched)
                         │
                         ▼
    ┌────────────────────────────────────────────────┐
    │     Project Planning View                      │
    │                                                 │
    │  watch(() => projectStore.selectedProject)     │
    │         │                                       │
    │         ▼                                       │
    │  loadProjectPlanning(projectId)                │
    │         │                                       │
    │         ▼                                       │
    │  ┌──────────────────────────────┐             │
    │  │ constructionTasksService     │             │
    │  │  - getTasksByProject()       │             │
    │  │  - getMainAreas()            │             │
    │  │  - getSubAreas()             │             │
    │  └──────────┬───────────────────┘             │
    │             │                                   │
    │             ▼                                   │
    │  ┌──────────────────────────────┐             │
    │  │     Supabase Database        │             │
    │  │  - construction_tasks        │             │
    │  │  - projects                  │             │
    │  │  - main_areas                │             │
    │  │  - sub_areas_1               │             │
    │  └──────────┬───────────────────┘             │
    │             │                                   │
    │             ▼                                   │
    │  currentProject.value = {                      │
    │    id, name, tasks: [...],                     │
    │    startDate, endDate, ...                     │
    │  }                                              │
    │             │                                   │
    │             ▼                                   │
    │  ┌──────────────────────────────┐             │
    │  │     Gantt Chart Component    │             │
    │  │  - Interactive timeline      │             │
    │  │  - Task editing              │             │
    │  │  - Location display          │             │
    │  └──────────┬───────────────────┘             │
    │             │                                   │
    │             │ @task-update event               │
    │             ▼                                   │
    │  handleTaskUpdate(task)                        │
    │             │                                   │
    │             ▼                                   │
    │  constructionTasksService.updateTask()         │
    │             │                                   │
    │             ▼                                   │
    │  Database updated + Local state synced         │
    └─────────────────────────────────────────────────┘
```

## Component Interaction

### 1. Initial Load

```typescript
// User navigates to /project-planning
// Watcher triggers immediately
watch(() => projectStore.selectedProject, async (newProject) => {
  if (newProject?.id) {
    await loadProjectPlanning(newProject.id)
  } else {
    currentProject.value = null
  }
}, { immediate: true })
```

### 2. Project Switch

```
User clicks project dropdown → Selects different project
                              ↓
        TopNav updates projectStore.selectedProject
                              ↓
        Watcher in ProjectPlanningView detects change
                              ↓
        loadProjectPlanning(newProjectId) called
                              ↓
        New tasks loaded from database
                              ↓
        Gantt chart re-renders with new data
```

### 3. Task Update Flow

```
User drags task in Gantt chart
        ↓
GanttChart emits @task-update event
        ↓
handleTaskUpdate(updatedTask) receives event
        ↓
constructionTasksService.updateTask(id, updates)
        ↓
Supabase database updated
        ↓
Local currentProject.value.tasks updated
        ↓
Gantt chart reflects changes
```

## State Management

### projectStore (Global)
```typescript
{
  selectedProject: Ref<Project | null>,
  projectId: ComputedRef<string | null>,
  projects: Ref<Project[]>,
  
  setProject(project): void,
  loadActiveProjects(): Promise<void>
}
```

### ProjectPlanningView (Local)
```typescript
{
  currentProject: Ref<ConstructionProject | null>,
  mainAreas: Ref<MainArea[]>,
  isLoading: Ref<boolean>,
  error: Ref<string | null>,
  isSyncing: Ref<boolean>
}
```

## Database Schema

```sql
construction_tasks
├── id (uuid, PK)
├── project_id (uuid, FK → projects.id)
├── title (text)
├── description (text)
├── phase (text)
├── start_date (timestamp)
├── end_date (timestamp)
├── duration (integer)
├── progress (integer, 0-100)
├── dependencies (text[], task IDs)
├── status (text)
├── main_area_id (uuid, FK → main_areas.id)
├── sub_area_1_id (uuid, FK → sub_areas_1.id)
├── assigned_user_id (uuid, FK → users.id)
└── created_at (timestamp)
```

## Key Benefits

### 1. Single Source of Truth
- Project selection managed in one place (projectStore)
- No duplication of project selection logic
- Consistent across all views

### 2. Reactive Updates
- Automatic re-loading when project changes
- No manual refresh needed
- Real-time synchronization

### 3. Clean Separation
- Global state (projectStore) vs Local state (currentProject)
- Service layer handles all database operations
- Component focuses on presentation

### 4. Type Safety
```typescript
interface ConstructionProject {
  id: string
  projectCode: string
  name: string
  description: string
  startDate: Date
  endDate: Date
  status: 'not-started' | 'in-progress' | 'completed'
  tasks: ConstructionTask[]
  isTestProject: boolean
  lastSynced: Date
}
```

## Performance Considerations

1. **Lazy Loading**: Tasks only loaded when project selected
2. **Debounced Updates**: Task changes batched to reduce DB calls
3. **Local State**: Gantt chart uses local data for smooth interactions
4. **Optimistic Updates**: UI updates immediately, DB syncs in background

## Error Handling

```typescript
try {
  await loadProjectPlanning(projectId)
} catch (err) {
  error.value = 'Failed to load project: ' + err.message
  // User sees error message
  // Can dismiss and try again
}
```

## Future Optimizations

1. **Caching**: Store recently viewed projects
2. **WebSocket**: Real-time updates from other users
3. **Offline Mode**: Queue updates when offline
4. **Pagination**: Load tasks in batches for large projects
5. **Virtual Scrolling**: Handle 1000+ tasks efficiently
