# Project Planning - Global Project Integration

## Overview
Updated the Project Planning feature to use the global project selector from the top menu bar instead of having its own project selector.

## Changes Made

### 1. Updated `ProjectPlanningView.vue`

#### Removed Local State
- ❌ Removed `selectedProjectId` ref
- ❌ Removed `projects` ref (list of all projects)
- ❌ Removed `showProjectSelector` ref
- ❌ Removed `loadProjects()` function
- ❌ Removed `selectProject()` function (replaced with `loadProjectPlanning()`)

#### Added Global Store Integration
- ✅ Imported `useProjectStore` from `@/stores/projectStore`
- ✅ Added watcher for `projectStore.selectedProject` changes
- ✅ Auto-loads project planning when project changes in global selector

#### Updated UI
- ❌ Removed project selector modal and all related UI
- ❌ Removed "Select Project" and "Change Project" buttons from header
- ✅ Added "No Project Selected" empty state with instructions
- ✅ Simplified header to just show the title

#### Updated Functions
- ✅ `loadProjectPlanning(projectId)` - New function to load project data
- ✅ `createDefaultTasks()` - Updated to use `projectStore.selectedProject.id`
- ✅ All functions now reference global project store

### 2. Code Structure

```typescript
// Watch for global project changes
watch(() => projectStore.selectedProject, async (newProject) => {
  if (newProject?.id) {
    await loadProjectPlanning(newProject.id)
  } else {
    currentProject.value = null
  }
}, { immediate: true })
```

### 3. User Flow

1. User selects project from **top menu bar** (e.g., "Pomelo" project)
2. Project Planning page automatically detects the change via watcher
3. Page loads construction tasks for the selected project
4. All operations (create tasks, update tasks) use the global project context

### 4. Benefits

✅ **Consistent UX**: Single source of truth for project selection
✅ **Reduced Redundancy**: No duplicate project selection UI
✅ **Automatic Updates**: Page responds to project changes from any location
✅ **Better Integration**: Works seamlessly with existing QSHE app architecture

## Testing Checklist

- [ ] Select a project from top menu
- [ ] Navigate to Project Planning - should auto-load that project
- [ ] Switch to different project from top menu - should auto-reload
- [ ] Create default tasks - should use correct project ID
- [ ] Update task - should save to correct project
- [ ] No project selected - should show empty state with message

## Technical Notes

### Store Integration
The page uses `projectStore.selectedProject` which is:
- Persisted in localStorage
- Emits 'project-changed' custom event when changed
- Available globally via `useProjectStore()`
- Has computed `projectId` property for convenience

### Dependencies
- `projectStore.ts` - Global project selection state
- Top navigation component - Project selector dropdown
- `constructionTasksService.ts` - Database operations

## Migration from Previous Version

**Before:**
```vue
<button @click="showProjectSelector = true">Select Project</button>
```

**After:**
```vue
<!-- Project auto-loads from global selector -->
<div v-if="!projectStore.selectedProject">
  Please select a project from the top menu
</div>
```

## Related Files

- `src/views/ProjectPlanningView.vue` - Main planning view (updated)
- `src/stores/projectStore.ts` - Global project store (referenced)
- `src/components/Sidebar.vue` - Navigation with Project Planning link
- `src/types/construction-project.ts` - Type definitions
- `src/services/constructionTasksService.ts` - Database service

## Future Enhancements

- Listen to 'project-changed' event for even faster updates
- Add project loading indicator during project switch
- Cache loaded project data for better performance
- Add breadcrumb showing current project in planning view
