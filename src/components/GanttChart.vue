<template>
  <div class="gantt-chart-container">
    <div class="gantt-header">
      <h3 class="text-lg font-semibold mb-2">{{ projectName }}</h3>
      <div class="controls">
        <label class="text-sm font-medium mr-2">View:</label>
        <select v-model="viewScale" class="view-select">
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
        
        <label class="text-sm font-medium ml-4 mr-2">Show:</label>
        <select v-model="showMode" class="view-select">
          <option value="gantt">Timeline</option>
          <option value="itr">ITR Counts</option>
        </select>
      </div>
    </div>
    
    <div class="gantt-wrapper" v-if="tasks.length > 0">
      <div class="gantt-timeline">
        <!-- Timeline Header -->
        <div class="timeline-header">
          <div class="task-labels">
            <div class="label-header">
              <span class="row-num">#</span>
              <span>Tasks</span>
              <span class="location-header">Location</span>
              
              <!-- ITR Counts Header (when showing ITR counts) -->
              <template v-if="showMode === 'itr'">
                <div class="itr-counts-header-wrapper">
                  <div class="itr-counts-title">ITR Counts</div>
                  <div class="itr-status-columns">
                    <span class="itr-col" title="Draft">Draft</span>
                    <span class="itr-col" title="Internal Requested">Internal</span>
                    <span class="itr-col" title="Confirm Requested">Confirm</span>
                    <span class="itr-col" title="Approved">Approved</span>
                    <span class="itr-col" title="Rejected">Rejected</span>
                  </div>
                </div>
              </template>
            </div>
          </div>
          
          <!-- Timeline Dates (only when showing gantt) -->
          <div v-if="showMode === 'gantt'" class="timeline-dates">
            <div 
              v-for="date in timelineDates" 
              :key="date.label"
              class="date-cell"
              :style="{ width: dateColumnWidth + 'px' }"
            >
              {{ date.label }}
            </div>
          </div>
        </div>

        <!-- Task Rows -->
        <div class="task-row" v-for="task in hierarchicalTasks" :key="task.id" :class="{ 'subtask-row': task.level > 0 }">
          <div class="task-label">
            <span class="row-number">{{ task.rowNumber }}</span>
            <div class="task-controls">
              <button 
                @click.stop="emit('moveTask', task.id, 'up')"
                class="move-btn"
                title="Move up"
              >
                ↑
              </button>
              <button 
                @click.stop="emit('moveTask', task.id, 'down')"
                class="move-btn"
                title="Move down"
              >
                ↓
              </button>
            </div>
            <div class="task-info" :style="{ paddingLeft: (task.level * 1.5) + 'rem' }">
              <button 
                v-if="hasChildren(task.id)" 
                @click.stop="toggleExpand(task.id)"
                class="expand-btn"
              >
                {{ expandedTasks.has(task.id) ? '▼' : '▶' }}
              </button>
              <span class="task-name">{{ task.name }}</span>
              <button 
                @click.stop="emit('addSubtask', task.id)"
                class="add-subtask-btn"
                title="Add subtask"
              >
                +
              </button>
              <!-- ITR button only for subtasks -->
              <button
                v-if="task.type === 'subtask'"
                @click.stop="handleITRClick(task.id)"
                class="request-itr-btn"
                title="Request Inspection (ITR)"
              >
                📋
              </button>
            </div>
            <div class="task-location">
              <span v-if="task.location?.mainAreaName" class="location-tag">{{ task.location.mainAreaName }}</span>
              <span v-if="task.location?.subArea1Name" class="location-tag sub">{{ task.location.subArea1Name }}</span>
            </div>
            
            <!-- Show ITR Counts (when in ITR mode) -->
            <div v-if="showMode === 'itr'" class="task-itr-counts">
              <template v-if="task.type === 'subtask'">
                <span class="itr-count" :class="{ 'has-itrs': getITRCount(task.id, 'draft') > 0 }">
                  {{ getITRCount(task.id, 'draft') }}
                </span>
                <span class="itr-count" :class="{ 'has-itrs': getITRCount(task.id, 'internal_requested') > 0 }">
                  {{ getITRCount(task.id, 'internal_requested') }}
                </span>
                <span class="itr-count" :class="{ 'has-itrs': getITRCount(task.id, 'confirm_requested') > 0 }">
                  {{ getITRCount(task.id, 'confirm_requested') }}
                </span>
                <span class="itr-count" :class="{ 'has-itrs': getITRCount(task.id, 'approved') > 0 }">
                  {{ getITRCount(task.id, 'approved') }}
                </span>
                <span class="itr-count" :class="{ 'has-itrs': getITRCount(task.id, 'rejected') > 0 }">
                  {{ getITRCount(task.id, 'rejected') }}
                </span>
                <button 
                  v-if="getTotalITRCount(task.id) > 0"
                  @click.stop="emit('filter-itrs', task.id)"
                  class="filter-itr-btn"
                  title="View ITRs for this task"
                >
                  🔍
                </button>
              </template>
              <template v-else>
                <span class="itr-count">-</span>
                <span class="itr-count">-</span>
                <span class="itr-count">-</span>
                <span class="itr-count">-</span>
                <span class="itr-count">-</span>
              </template>
            </div>
          </div>
          
          <!-- Show Timeline (when in gantt mode) -->
          <div v-if="showMode === 'gantt'" class="task-timeline">
            <div 
              class="task-bar"
              :style="getTaskBarStyle(task)"
              @dblclick="selectTask(task)"
              @contextmenu.prevent="openContextMenu(task, $event)"
            >
              <span class="task-bar-label">{{ task.progress }}%</span>
              <span v-if="getTaskDates(task).isCalculated" class="auto-calc-badge" title="Auto-calculated from subtasks">🔄</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="empty-gantt">
      <p class="text-gray-500">No tasks to display</p>
    </div>

    <!-- Task Details Modal -->
    <div v-if="selectedTask" class="task-modal-overlay" @click="closeTaskDetails">
      <div class="task-modal" @click.stop>
        <div class="task-modal-header">
          <h3 class="text-xl font-bold">{{ editMode ? 'Edit Task' : selectedTask.name }}</h3>
          <button @click="closeTaskDetails" class="close-btn">&times;</button>
        </div>
        
        <div class="task-modal-body">
          <!-- Edit Mode -->
          <template v-if="editMode">
            <div class="task-field full-width">
              <label>Task Name</label>
              <input v-model="editedTask.name" type="text" class="edit-input">
            </div>

            <div class="task-field">
              <label>Type</label>
              <select v-model="editedTask.type" class="edit-select">
                <option value="task">Task</option>
                <option value="phase">Phase</option>
                <option value="milestone">Milestone</option>
                <option value="subtask">Subtask</option>
              </select>
            </div>
            
            <div class="task-field">
              <label>Status</label>
              <select v-model="editedTask.status" class="edit-select">
                <option value="not-started">Not Started</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
                <option value="delayed">Delayed</option>
              </select>
            </div>

            <div class="task-field full-width" v-if="editedTask.type === 'subtask'">
              <label>Parent Task</label>
              <select v-model="editedTask.parentTaskId" class="edit-select">
                <option :value="null">-- Select Parent Task --</option>
                <option 
                  v-for="task in availableParentTasks" 
                  :key="task.id" 
                  :value="task.id"
                >
                  {{ task.name }} ({{ formatDate(task.start) }} - {{ formatDate(task.end) }})
                </option>
              </select>
            </div>
            
            <div class="task-field">
              <label>Priority</label>
              <select v-model="editedTask.priority" class="edit-select">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div class="task-field">
              <label>Start Date</label>
              <input v-model="editedTask.startDate" type="date" class="edit-input">
            </div>

            <div class="task-field">
              <label>End Date</label>
              <input v-model="editedTask.endDate" type="date" class="edit-input">
            </div>

            <div class="task-field">
              <label>Main Area</label>
              <select v-model="editedTask.mainAreaId" class="edit-select">
                <option :value="null">-- Select Main Area --</option>
                <option v-for="area in mainAreas" :key="area.id" :value="area.id">
                  {{ area.mainAreaName }}
                </option>
              </select>
            </div>

            <div class="task-field">
              <label>Sub Area</label>
              <select v-model="editedTask.subArea1Id" class="edit-select" :disabled="!editedTask.mainAreaId">
                <option :value="null">-- Select Sub Area --</option>
                <option 
                  v-for="subArea in editedTaskSubAreas" 
                  :key="subArea.id" 
                  :value="subArea.id"
                >
                  {{ subArea.subArea1Name }}
                </option>
              </select>
            </div>

            <div class="task-field full-width">
              <label>Location Detail</label>
              <input v-model="editedTask.locationDetail" type="text" class="edit-input" placeholder="Specific location details...">
            </div>
            
            <div class="task-field full-width">
              <label>Progress (%)</label>
              <input v-model.number="editedTask.progress" type="number" min="0" max="100" class="edit-input">
            </div>

            <div class="task-field full-width">
              <label>Description</label>
              <textarea v-model="editedTask.description" class="edit-textarea" rows="3"></textarea>
            </div>

            <div class="task-modal-actions">
              <button @click="cancelEdit" class="btn-cancel">Cancel</button>
              <button @click="saveEdit" class="btn-save">Save Changes</button>
            </div>
          </template>

          <!-- View Mode -->
          <template v-else>
            <div class="task-field">
              <label>Task ID</label>
              <span>{{ selectedTask.taskId }}</span>
            </div>
            
            <div class="task-field">
              <label>Type</label>
              <span class="badge" :class="`badge-${selectedTask.type}`">{{ selectedTask.type }}</span>
            </div>
            
            <div class="task-field">
              <label>Status</label>
              <span class="badge" :class="`badge-${selectedTask.status}`">{{ selectedTask.status }}</span>
            </div>
            
            <div class="task-field">
              <label>Priority</label>
              <span class="badge" :class="`badge-${selectedTask.priority}`">{{ selectedTask.priority }}</span>
            </div>
            
            <div class="task-field full-width">
              <label>Duration</label>
              <span>{{ formatDate(selectedTask.start) }} - {{ formatDate(selectedTask.end) }}</span>
            </div>
            
            <div class="task-field full-width">
              <label>Progress</label>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: selectedTask.progress + '%' }"></div>
                <span class="progress-text">{{ selectedTask.progress }}%</span>
              </div>
            </div>
            
            <div v-if="selectedTask.location" class="task-field full-width">
              <label>Location</label>
              <div class="location-badges">
                <span v-if="selectedTask.location.mainAreaName" class="location-badge">
                  🏢 {{ selectedTask.location.mainAreaName }}
                </span>
                <span v-if="selectedTask.location.subArea1Name" class="location-badge">
                  📍 {{ selectedTask.location.subArea1Name }}
                </span>
              </div>
            </div>
            
            <div v-if="selectedTask.description" class="task-field full-width">
              <label>Description</label>
              <p>{{ selectedTask.description }}</p>
            </div>

            <div class="task-modal-actions">
              <button @click="startEdit" class="btn-edit">✏️ Edit Task</button>
              <button @click="showDeleteConfirm = true" class="btn-delete">🗑️ Delete Task</button>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
      <div class="modal-content confirm-modal">
        <div class="confirm-header">
          <h3 class="text-xl font-bold">⚠️ Confirm Delete</h3>
          <button @click="showDeleteConfirm = false" class="close-btn">&times;</button>
        </div>
        <div class="confirm-body">
          <p>Are you sure you want to delete this task?</p>
          <p class="task-name-highlight">{{ selectedTask?.name }}</p>
          <p class="warning-text" v-if="getTaskChildren(selectedTask?.id).length > 0">
            ⚠️ Warning: This task has {{ getTaskChildren(selectedTask?.id).length }} subtask(s) that will also be deleted.
          </p>
        </div>
        <div class="confirm-actions">
          <button @click="showDeleteConfirm = false" class="btn-cancel">Cancel</button>
          <button @click="confirmDelete" class="btn-confirm-delete">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ConstructionTask, MainArea, SubArea1 } from '../types/construction-project'

interface Props {
  tasks: ConstructionTask[]
  projectName?: string
  mainAreas?: MainArea[]
  subAreasMap?: Map<string, SubArea1[]>
  itrs?: any[] // ITR list
}

const props = withDefaults(defineProps<Props>(), {
  projectName: 'Construction Project',
  mainAreas: () => [],
  subAreasMap: () => new Map(),
  itrs: () => []
})

const emit = defineEmits<{
  taskUpdate: [task: ConstructionTask]
  moveTask: [taskId: string, direction: 'up' | 'down']
  addSubtask: [parentTaskId: string]
  changeParent: [taskId: string, newParentId: string | null]
  deleteTask: [taskId: string]
  'request-itr': [taskId: string]
  'filter-itrs': [taskId: string]
}>()

const selectedTask = ref<ConstructionTask | null>(null)
const editMode = ref(false)
const showMode = ref<'gantt' | 'itr'>('gantt')
const editedTask = ref({
  name: '',
  type: 'task' as any,
  status: 'not-started' as any,
  priority: 'medium' as any,
  parentTaskId: null as string | null,
  startDate: '',
  endDate: '',
  progress: 0,
  description: '',
  mainAreaId: null as string | null,
  subArea1Id: null as string | null,
  locationDetail: ''
})
const viewScale = ref<'day' | 'week' | 'month'>('month')
const dateColumnWidth = 80
const expandedTasks = ref<Set<string>>(new Set()) // Track expanded parent tasks
const showChangeParentModal = ref(false)
const taskToReparent = ref<ConstructionTask | null>(null)
const showDeleteConfirm = ref(false)

// Get tasks organized by parent-child relationship (recursive for unlimited depth)
const hierarchicalTasks = computed(() => {
  const result: Array<ConstructionTask & { level: number; rowNumber: number }> = []
  const taskMap = new Map(props.tasks.map(t => [t.id, t]))
  let rowCounter = 1
  
  // Recursive function to add task and its children
  const addTaskWithChildren = (task: ConstructionTask, level: number) => {
    result.push({ ...task, level, rowNumber: rowCounter++ })
    
    // If expanded, add children recursively
    if (expandedTasks.value.has(task.id)) {
      const children = props.tasks
        .filter(t => t.parentTaskId === task.id)
        .sort((a, b) => a.displayOrder - b.displayOrder)
      
      for (const child of children) {
        addTaskWithChildren(child, level + 1)
      }
    }
  }
  
  // Start with top-level tasks (no parent)
  const topLevelTasks = props.tasks
    .filter(t => !t.parentTaskId)
    .sort((a, b) => a.displayOrder - b.displayOrder)
  
  for (const task of topLevelTasks) {
    addTaskWithChildren(task, 0)
  }
  
  return result
})

// Check if task has children
const hasChildren = (taskId: string) => {
  return props.tasks.some(t => t.parentTaskId === taskId)
}

// Get available parent tasks (exclude current task and its descendants)
const availableParentTasks = computed(() => {
  if (!selectedTask.value) return props.tasks.filter(t => t.type !== 'subtask')
  
  const currentTaskId = selectedTask.value.id
  const descendants = new Set<string>()
  
  // Get all descendants recursively
  const getDescendantIds = (id: string) => {
    const children = props.tasks.filter(t => t.parentTaskId === id)
    for (const child of children) {
      descendants.add(child.id)
      getDescendantIds(child.id)
    }
  }
  
  getDescendantIds(currentTaskId)
  descendants.add(currentTaskId)
  
  // Return tasks that are not descendants and not subtasks themselves
  return props.tasks.filter(t => !descendants.has(t.id) && t.type !== 'subtask')
})

// Get sub areas for edited task's main area
const editedTaskSubAreas = computed(() => {
  if (!editedTask.value.mainAreaId) return []
  return props.subAreasMap.get(editedTask.value.mainAreaId) || []
})

// Watch for main area changes - clear sub area when main area changes
watch(() => editedTask.value.mainAreaId, (newMainAreaId, oldMainAreaId) => {
  if (newMainAreaId !== oldMainAreaId) {
    editedTask.value.subArea1Id = null
  }
})

// Watch for type changes - clear parent task when changing from subtask to task
watch(() => editedTask.value.type, (newType) => {
  if (newType !== 'subtask') {
    editedTask.value.parentTaskId = null
  }
})

// Toggle task expansion
const toggleExpand = (taskId: string) => {
  if (expandedTasks.value.has(taskId)) {
    expandedTasks.value.delete(taskId)
  } else {
    expandedTasks.value.add(taskId)
  }
}

// Get calculated dates for parent tasks
const getTaskDates = (task: ConstructionTask) => {
  if (hasChildren(task.id)) {
    const children = props.tasks.filter(t => t.parentTaskId === task.id)
    if (children.length > 0) {
      const starts = children.map(c => c.start.getTime())
      const ends = children.map(c => c.end.getTime())
      return {
        start: new Date(Math.min(...starts)),
        end: new Date(Math.max(...ends)),
        isCalculated: true
      }
    }
  }
  return {
    start: task.start,
    end: task.end,
    isCalculated: false
  }
}

// Calculate chart start and end from tasks
const chartStart = computed(() => {
  if (props.tasks.length === 0) return new Date()
  const dates = props.tasks.map(t => t.start.getTime())
  const minDate = new Date(Math.min(...dates))
  minDate.setDate(1) // Start of month
  return minDate
})

const chartEnd = computed(() => {
  if (props.tasks.length === 0) return new Date()
  const dates = props.tasks.map(t => t.end.getTime())
  const maxDate = new Date(Math.max(...dates))
  maxDate.setMonth(maxDate.getMonth() + 1)
  maxDate.setDate(0) // End of month
  return maxDate
})

// Generate timeline dates
const timelineDates = computed(() => {
  const dates: { label: string; date: Date }[] = []
  const start = new Date(chartStart.value)
  const end = new Date(chartEnd.value)
  
  if (viewScale.value === 'month') {
    let current = new Date(start)
    while (current <= end) {
      dates.push({
        label: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        date: new Date(current)
      })
      current.setMonth(current.getMonth() + 1)
    }
  }
  
  return dates
})

// Calculate total timeline width in days
const totalDays = computed(() => {
  const start = chartStart.value.getTime()
  const end = chartEnd.value.getTime()
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24))
})

// Get task bar position and width
const getTaskBarStyle = (task: ConstructionTask) => {
  const chartStartTime = chartStart.value.getTime()
  const dates = getTaskDates(task)
  const taskStartTime = dates.start.getTime()
  const taskEndTime = dates.end.getTime()
  
  const startOffset = Math.max(0, (taskStartTime - chartStartTime) / (1000 * 60 * 60 * 24))
  const duration = (taskEndTime - taskStartTime) / (1000 * 60 * 60 * 24)
  
  const pixelsPerDay = dateColumnWidth / 30 // Approximate days per month
  
  return {
    left: `${startOffset * pixelsPerDay}px`,
    width: `${duration * pixelsPerDay}px`,
    backgroundColor: getTaskColor(task),
    opacity: dates.isCalculated ? 0.7 : 1,
    border: dates.isCalculated ? '2px dashed rgba(0,0,0,0.3)' : 'none'
  }
}

/**
 * Open context menu for task
 */
const openContextMenu = (task: ConstructionTask, event: MouseEvent) => {
  taskToReparent.value = task
  showChangeParentModal.value = true
}

/**
 * Get available parent options (excluding task itself and its descendants)
 */
const getParentOptions = computed(() => {
  if (!taskToReparent.value) return []
  
  const taskId = taskToReparent.value.id
  const descendants = new Set<string>()
  
  // Get all descendants recursively
  const getDescendantIds = (id: string) => {
    const children = props.tasks.filter(t => t.parentTaskId === id)
    for (const child of children) {
      descendants.add(child.id)
      getDescendantIds(child.id)
    }
  }
  
  getDescendantIds(taskId)
  descendants.add(taskId)
  
  // Return tasks that are not in descendants
  return props.tasks.filter(t => !descendants.has(t.id))
})

/**
 * Change task parent
 */
const changeParent = (newParentId: string | null) => {
  if (taskToReparent.value) {
    emit('changeParent', taskToReparent.value.id, newParentId)
    showChangeParentModal.value = false
    taskToReparent.value = null
  }
}

/**
 * Get color based on task status
 */
const getTaskColor = (task: ConstructionTask): string => {
  const colors: Record<string, string> = {
    'completed': '#10b981',
    'in-progress': '#3b82f6',
    'not-started': '#9ca3af',
    'on-hold': '#f59e0b',
    'delayed': '#ef4444'
  }
  return colors[task.status] || '#6b7280'
}

/**
 * Select task for details
 */
const selectTask = (task: ConstructionTask) => {
  selectedTask.value = task
  editMode.value = false
}

/**
 * Start editing task
 */
const startEdit = () => {
  if (!selectedTask.value) return
  
  editedTask.value = {
    name: selectedTask.value.name,
    type: selectedTask.value.type,
    status: selectedTask.value.status,
    priority: selectedTask.value.priority,
    parentTaskId: selectedTask.value.parentTaskId || null,
    startDate: (selectedTask.value.start.toISOString().split('T')[0]) || '',
    endDate: (selectedTask.value.end.toISOString().split('T')[0]) || '',
    progress: selectedTask.value.progress,
    description: selectedTask.value.description || '',
    mainAreaId: selectedTask.value.location?.mainAreaId || null,
    subArea1Id: selectedTask.value.location?.subArea1Id || null,
    locationDetail: selectedTask.value.location?.locationDetail || ''
  }
  editMode.value = true
}

/**
 * Cancel edit
 */
const cancelEdit = () => {
  editMode.value = false
}

/**
 * Save edited task
 */
const saveEdit = () => {
  if (!selectedTask.value) return
  
  // Build location object if any location field is set
  const location = editedTask.value.mainAreaId || editedTask.value.subArea1Id || editedTask.value.locationDetail
    ? {
        mainAreaId: editedTask.value.mainAreaId || undefined,
        subArea1Id: editedTask.value.subArea1Id || undefined,
        locationDetail: editedTask.value.locationDetail || undefined
      }
    : undefined

  const updatedTask: ConstructionTask = {
    ...selectedTask.value,
    name: editedTask.value.name,
    type: editedTask.value.type,
    status: editedTask.value.status,
    priority: editedTask.value.priority,
    start: new Date(editedTask.value.startDate),
    end: new Date(editedTask.value.endDate),
    progress: editedTask.value.progress,
    description: editedTask.value.description,
    parentTaskId: editedTask.value.type === 'subtask' ? editedTask.value.parentTaskId : null,
    location: location
  }
  
  emit('taskUpdate', updatedTask)
  editMode.value = false
  selectedTask.value = null
}

/**
 * Close task details modal
 */
const closeTaskDetails = () => {
  selectedTask.value = null
  editMode.value = false
  showDeleteConfirm.value = false
}

/**
 * Handle ITR button click
 */
const handleITRClick = (taskId: string) => {
  console.log('ITR button clicked for task:', taskId)
  emit('request-itr', taskId)
}

/**
 * Get ITR count for a task by status
 */
const getITRCount = (taskId: string, status: string): number => {
  if (!props.itrs || props.itrs.length === 0) return 0
  return props.itrs.filter(itr => itr.taskId === taskId && itr.statusCode === status).length
}

/**
 * Get total ITR count for a task
 */
const getTotalITRCount = (taskId: string): number => {
  if (!props.itrs || props.itrs.length === 0) return 0
  return props.itrs.filter(itr => itr.taskId === taskId).length
}

/**
 * Get children of a task
 */
const getTaskChildren = (taskId: string | undefined) => {
  if (!taskId) return []
  return props.tasks.filter(t => t.parentTaskId === taskId)
}

/**
 * Confirm and execute delete
 */
const confirmDelete = () => {
  if (!selectedTask.value) return
  
  emit('deleteTask', selectedTask.value.id)
  showDeleteConfirm.value = false
  selectedTask.value = null
  editMode.value = false
}

/**
 * Format date
 */
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}
</script>

<style scoped>
.gantt-chart-container {
  width: 100%;
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.gantt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.range-slider {
  width: 120px;
}

.gantt-wrapper {
  min-height: 400px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  overflow: auto;
  background: white;
}

.gantt-timeline {
  display: flex;
  flex-direction: column;
  min-width: 100%;
}

.timeline-header {
  display: flex;
  border-bottom: 2px solid #e5e7eb;
  background: #f9fafb;
  position: sticky;
  top: 0;
  z-index: 10;
}

.task-labels {
  width: 550px;
  min-width: 550px;
  border-right: 2px solid #e5e7eb;
  background-color: #f8fafc;
  position: sticky;
  left: 0;
  z-index: 10;
}

.label-header {
  display: grid;
  grid-template-columns: 30px 1fr 120px;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  font-weight: 600;
  border-bottom: 2px solid #cbd5e0;
  color: #374151;
}

.label-header .row-num {
  text-align: center;
  font-size: 0.875rem;
}

.label-header .location-header {
  font-size: 0.875rem;
}

.itr-counts-header-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.itr-counts-title {
  text-align: center;
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 600;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid #e5e7eb;
}

.itr-status-columns {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.25rem;
}

.itr-col {
  text-align: center;
  font-size: 0.7rem;
  font-weight: 500;
  color: #6b7280;
  padding: 0.25rem;
  background: #f3f4f6;
  border-radius: 4px;
}

.timeline-dates {
  display: flex;
  flex: 1;
  overflow-x: auto;
}

.date-cell {
  padding: 1rem 0.5rem;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  border-right: 1px solid #e5e7eb;
  white-space: nowrap;
}

.task-row {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  min-height: 50px;
}

.task-row:hover {
  background: #f9fafb;
}

.subtask-row {
  background: #fafafa;
}

.subtask-row:hover {
  background: #f3f4f6;
}

.task-label {
  width: 550px;
  min-width: 550px;
  border-right: 2px solid #e5e7eb;
  display: grid;
  grid-template-columns: 30px 80px 200px 120px;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background-color: #f8fafc;
  position: sticky;
  left: 0;
  z-index: 5;
}

.row-number {
  width: 30px;
  text-align: center;
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.task-controls {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.move-btn {
  width: 20px;
  height: 16px;
  padding: 0;
  background-color: #e2e8f0;
  border: 1px solid #cbd5e0;
  border-radius: 2px;
  cursor: pointer;
  font-size: 10px;
  line-height: 1;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
}

.move-btn:hover {
  background-color: #cbd5e0;
  color: #1e293b;
}

.task-info {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.task-bar:hover {
  opacity: 0.8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.task-bar-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  white-space: nowrap;
}

.auto-calc-badge {
  font-size: 0.875rem;
  opacity: 0.9;
}

.expand-btn:hover {
  color: #374151;
  background: #e5e7eb;
  border-radius: 2px;
}

.task-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.875rem;
  color: #374151;
}

.add-subtask-btn {
  width: 20px;
  height: 20px;
  padding: 0;
  background-color: #10b981;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.task-row:hover .add-subtask-btn {
  opacity: 1;
}

.add-subtask-btn:hover {
  background-color: #059669;
}

.request-itr-btn {
  width: 24px;
  height: 20px;
  padding: 0;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  transition: opacity 0.2s;
  margin-left: 2px;
}

.subtask-row .request-itr-btn {
  opacity: 1;
}

.request-itr-btn:hover {
  background-color: #2563eb;
  opacity: 1;
}

.task-itr-counts {
  display: grid;
  grid-template-columns: repeat(5, 1fr) auto;
  gap: 0.25rem;
  align-items: center;
  width: 300px;
}

.itr-count {
  text-align: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: #9ca3af;
  padding: 0.25rem;
  background: #f9fafb;
  border-radius: 4px;
}

.itr-count.has-itrs {
  color: #374151;
  background: #e0e7ff;
}

.filter-itr-btn {
  width: 24px;
  height: 24px;
  padding: 0;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  margin-left: 0.25rem;
}

.filter-itr-btn:hover {
  background-color: #2563eb;
  transform: scale(1.1);
}

.task-location {
  display: flex;
  gap: 0.25rem;
  width: 120px;
  font-size: 0.75rem;
  overflow: hidden;
}

.location-tag {
  padding: 0.125rem 0.375rem;
  background-color: #dbeafe;
  color: #1e40af;
  border-radius: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.location-tag.sub {
  background-color: #e0e7ff;
  color: #4338ca;
}

.task-timeline {
  flex: 1;
  position: relative;
  padding: 0.5rem 0;
}

.task-bar {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  height: 30px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.5rem;
  min-width: 60px;
}

.task-bar:hover {
  opacity: 0.8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.task-bar-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  white-space: nowrap;
}

.view-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
}

.view-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.empty-gantt {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #d1d5db;
  border-radius: 4px;
}

/* Task Modal Styles */
.task-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.task-modal {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.task-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #6b7280;
  line-height: 1;
}

.close-btn:hover {
  color: #374151;
}

.task-modal-body {
  padding: 1.5rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.task-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.task-field.full-width {
  grid-column: 1 / -1;
}

.task-field label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  width: fit-content;
}

.badge-phase { background: #dbeafe; color: #1e40af; }
.badge-milestone { background: #fef3c7; color: #92400e; }
.badge-task { background: #e0e7ff; color: #3730a3; }
.badge-subtask { background: #f3e8ff; color: #6b21a8; }

.badge-not-started { background: #f3f4f6; color: #374151; }
.badge-in-progress { background: #dbeafe; color: #1e40af; }
.badge-completed { background: #d1fae5; color: #065f46; }
.badge-on-hold { background: #fed7aa; color: #92400e; }
.badge-delayed { background: #fee2e2; color: #991b1b; }

.badge-low { background: #f3f4f6; color: #6b7280; }
.badge-medium { background: #dbeafe; color: #1e40af; }
.badge-high { background: #fed7aa; color: #92400e; }
.badge-critical { background: #fee2e2; color: #991b1b; }

.progress-bar {
  position: relative;
  width: 100%;
  height: 2rem;
  background: #f3f4f6;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #388087, #6fb3b8);
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: 600;
  font-size: 0.875rem;
  color: #374151;
}

.location-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.location-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  background: #e0f2f1;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #00695c;
}

/* Edit Form Styles */
.edit-input,
.edit-select,
.edit-textarea {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.edit-input:focus,
.edit-select:focus,
.edit-textarea:focus {
  outline: none;
  border-color: #388087;
  box-shadow: 0 0 0 3px rgba(56, 128, 135, 0.1);
}

.edit-textarea {
  resize: vertical;
  font-family: inherit;
}

.task-modal-actions {
  grid-column: 1 / -1;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  margin-top: 1rem;
}

.btn-edit,
.btn-save,
.btn-cancel,
.btn-delete {
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-edit {
  background: #388087;
  color: white;
}

.btn-edit:hover {
  background: #2d6670;
}

.btn-delete {
  background: #ef4444;
  color: white;
  margin-left: 0.5rem;
}

.btn-delete:hover {
  background: #dc2626;
}

.btn-save {
  background: #10b981;
  color: white;
}

.btn-save:hover {
  background: #059669;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

/* Delete Confirmation Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100; /* Higher than task modal */
}

.confirm-modal {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.confirm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.confirm-body {
  padding: 1.5rem;
}

.confirm-body p {
  margin-bottom: 0.75rem;
  color: #374151;
}

.task-name-highlight {
  font-weight: 600;
  color: #1f2937;
  padding: 0.5rem;
  background: #f3f4f6;
  border-radius: 4px;
}

.warning-text {
  color: #dc2626;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #fef2f2;
  border-left: 3px solid #dc2626;
  border-radius: 4px;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn-confirm-delete {
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  background: #dc2626;
  color: white;
}

.btn-confirm-delete:hover {
  background: #b91c1c;
}
</style>
