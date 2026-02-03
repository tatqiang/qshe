<template>
  <div class="construction-planning-view">
    <!-- Header -->
    <header class="view-header">
      <div class="header-content">
        <h1 class="text-3xl font-bold">Construction Project Planning</h1>
      </div>
    </header>

    <!-- Main Content -->
    <main class="view-content">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>{{ loadingMessage }}</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <svg class="error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <h3>Error</h3>
        <p>{{ error }}</p>
        <button @click="error = null" class="btn btn-primary">Dismiss</button>
      </div>

      <!-- No Project Selected -->
      <div v-else-if="!projectStore.selectedProject" class="empty-state">
        <svg class="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
        <h3 class="text-xl font-semibold mb-2">No Project Selected</h3>
        <p class="text-gray-600">Please select a project from the top menu to view project planning.</p>
      </div>

      <!-- Project View -->
      <div v-else-if="currentProject" class="project-view">
        <!-- Project Controls -->
        <div class="project-controls">
          <div class="project-info">
            <h2 class="text-xl font-bold">{{ currentProject.name }}</h2>
            <p class="text-sm text-gray-600">
              {{ formatDate(currentProject.startDate) }} - {{ formatDate(currentProject.endDate) }}
            </p>
            <p v-if="currentProject.lastSynced" class="text-xs text-gray-500 mt-1">
              Last synced: {{ formatDateTime(currentProject.lastSynced) }}
            </p>
          </div>
          
          <div class="project-actions">
            <!-- View Toggle -->
            <div class="view-toggle">
              <button 
                @click="viewMode = 'gantt'" 
                :class="['toggle-btn', { active: viewMode === 'gantt' }]"
                title="Gantt View"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                Gantt
              </button>
              <button 
                @click="viewMode = 'itr'" 
                :class="['toggle-btn', { active: viewMode === 'itr' }]"
                title="ITR List View"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                ITRs
              </button>
            </div>
            
            <button @click="createDefaultTasks" class="btn btn-primary" v-if="currentProject.tasks.length === 0">
              <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Create Default Tasks
            </button>
            
            <button @click="showAddTaskModal = true" class="btn btn-secondary">
              <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Add Task
            </button>
          </div>
        </div>

        <!-- Project Layout -->
        <div class="project-layout">
          <!-- ITR List View -->
          <div v-if="viewMode === 'itr'" class="itr-panel-full">
            <ITRListPanel 
              :itrs="projectITRs"
              :loading="loadingITRs"
              :selectedITR="selectedITR"
              :filteredTaskId="filteredTaskId"
              @select="handleSelectITR"
              @clear-filter="filteredTaskId = null"
            />
          </div>

          <!-- Gantt Chart View -->
          <div v-if="viewMode === 'gantt'" class="gantt-panel-full">
            <!-- Gantt Chart -->
            <div class="gantt-section" v-if="currentProject.tasks.length > 0">
              <GanttChart 
                :tasks="currentProject.tasks"
                :project-name="currentProject.name"
                :main-areas="mainAreas"
                :sub-areas-map="subAreasMap"
                :itrs="projectITRs"
                @task-update="handleTaskUpdate"
                @move-task="handleMoveTask"
                @add-subtask="handleAddSubtask"
                @change-parent="handleChangeParent"
                @delete-task="handleDeleteTask"
                @request-itr="handleRequestITR"
                @filter-itrs="handleFilterITRsByTask"
              />
            </div>

            <div v-else class="empty-tasks-state">
          <svg class="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <h3 class="text-xl font-semibold mb-2">No Tasks Yet</h3>
          <p class="text-gray-600 mb-4">Start by creating default construction tasks or add your own.</p>
          <button @click="createDefaultTasks" class="btn btn-primary">
            Create Default Tasks
          </button>
        </div>

        <!-- Project Statistics -->
        <div class="project-stats" v-if="currentProject.tasks.length > 0">
          <div class="stat-card">
            <div class="stat-label">Total Tasks</div>
            <div class="stat-value">{{ currentProject.tasks.length }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Completed</div>
            <div class="stat-value text-green-600">{{ completedTasks }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">In Progress</div>
            <div class="stat-value text-blue-600">{{ inProgressTasks }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Overall Progress</div>
            <div class="stat-value">{{ overallProgress }}%</div>
          </div>
          <div class="stat-card" v-if="currentProject.budget">
            <div class="stat-label">Budget</div>
            <div class="stat-value">${{ currentProject.budget.toLocaleString() }}</div>
          </div>
        </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Add Task Modal -->
    <div v-if="showAddTaskModal" class="modal-overlay" @click="showAddTaskModal = false">
      <div class="modal-content add-task-modal" @click.stop>
        <div class="modal-header">
          <h3 class="text-xl font-bold">Add New Task</h3>
          <button @click="showAddTaskModal = false" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="addNewTask" class="task-form">
            <div class="form-row">
              <div class="form-field">
                <label>Task Name *</label>
                <input v-model="newTask.name" type="text" required class="input-field" placeholder="e.g., Foundation Work">
              </div>
              
              <div class="form-field">
                <label>Type</label>
                <select v-model="newTask.type" class="input-field">
                  <option value="task">Task</option>
                  <option value="phase">Phase</option>
                  <option value="milestone">Milestone</option>
                  <option value="subtask">Subtask</option>
                </select>
              </div>
            </div>
            
            <div class="form-row" v-if="newTask.type === 'subtask'">
              <div class="form-field full-width">
                <label>Parent Task</label>
                <select v-model="newTask.parentTaskId" class="input-field">
                  <option :value="null">-- Select Parent Task --</option>
                  <option 
                    v-for="task in parentTaskOptions" 
                    :key="task.id" 
                    :value="task.id"
                  >
                    {{ task.name }} ({{ formatDate(task.start) }} - {{ formatDate(task.end) }})
                  </option>
                </select>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-field">
                <label>Start Date *</label>
                <input v-model="newTask.startDate" type="date" required class="input-field">
              </div>
              
              <div class="form-field">
                <label>End Date *</label>
                <input v-model="newTask.endDate" type="date" required class="input-field">
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-field">
                <label>Status</label>
                <select v-model="newTask.status" class="input-field">
                  <option value="not-started">Not Started</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="on-hold">On Hold</option>
                  <option value="delayed">Delayed</option>
                </select>
              </div>
              
              <div class="form-field">
                <label>Priority</label>
                <select v-model="newTask.priority" class="input-field">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-field">
                <label>Main Area</label>
                <select v-model="newTask.mainAreaId" class="input-field">
                  <option :value="null">-- Select Main Area --</option>
                  <option v-for="area in mainAreas" :key="area.id" :value="area.id">
                    {{ area.mainAreaName }}
                  </option>
                </select>
              </div>
              
              <div class="form-field">
                <label>Sub Area</label>
                <select v-model="newTask.subArea1Id" class="input-field" :disabled="!newTask.mainAreaId">
                  <option :value="null">-- Select Sub Area --</option>
                  <option 
                    v-for="subArea in selectedMainAreaSubAreas" 
                    :key="subArea.id" 
                    :value="subArea.id"
                  >
                    {{ subArea.subArea1Name }}
                  </option>
                </select>
              </div>
            </div>
            
            <div class="form-field full-width">
              <label>Location Detail</label>
              <input v-model="newTask.locationDetail" type="text" class="input-field" placeholder="Specific location details...">
            </div>
            
            <div class="form-field full-width">
              <label>Description</label>
              <textarea v-model="newTask.description" class="input-field" rows="3" placeholder="Task description..."></textarea>
            </div>
            
            <div class="form-actions">
              <button type="button" @click="showAddTaskModal = false" class="btn btn-outline">Cancel</button>
              <button type="submit" class="btn btn-primary">Add Task</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- ITR Request Modal (Create & Edit) -->
    <ITRRequestModal
      :is-open="showITRModal || showITRDetail"
      :task="showITRModal ? selectedTaskForITR : selectedITR?.task || null"
      :project-id="currentProject?.id || ''"
      :main-areas="mainAreas"
      :sub-areas-map="subAreasMap"
      :edit-i-t-r="showITRDetail ? selectedITR : null"
      @close="showITRModal = false; showITRDetail = false"
      @submit="handleITRSubmit"
      @update="handleITRUpdate"
    />

    <!-- Areas Management Modal -->
    <div v-if="showAreasModal" class="modal-overlay" @click="showAreasModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="text-xl font-bold">Project Areas & Locations</h3>
          <button @click="showAreasModal = false" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="areas-list">
            <h4 class="font-semibold mb-2">Main Areas</h4>
            <div v-if="mainAreas.length > 0" class="area-items">
              <div v-for="area in mainAreas" :key="area.id" class="area-item">
                <span class="area-name">{{ area.mainAreaName }}</span>
                <span v-if="area.areaCode" class="area-code">{{ area.areaCode }}</span>
              </div>
            </div>
            <p v-else class="text-gray-500 text-sm">No areas defined for this project.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { constructionTasksService } from '@/services/constructionTasksService'
import { constructionITRService } from '@/services/constructionITRService'
import { useProjectStore } from '@/stores/projectStore'
import { useAuthStore } from '@/stores/authStore'
import GanttChart from '@/components/GanttChart.vue'
import ITRRequestModal from '@/components/ITRRequestModal.vue'
import ITRListPanel from '@/components/ITRListPanel.vue'
import type { ConstructionProject, ConstructionTask, MainArea, SubArea1, ConstructionITR } from '@/types/construction-project'
import { DEFAULT_CONSTRUCTION_TEMPLATE } from '@/types/construction-project'

const projectStore = useProjectStore()
const authStore = useAuthStore()
const isLoading = ref(false)
const loadingMessage = ref('')
const error = ref<string | null>(null)
const currentProject = ref<ConstructionProject | null>(null)
const isSyncing = ref(false)
const showAreasModal = ref(false)
const showAddTaskModal = ref(false)
const showITRModal = ref(false)
const showITRDetail = ref(false)
const selectedTaskForITR = ref<ConstructionTask | null>(null)
const mainAreas = ref<MainArea[]>([])

// ITR List
const projectITRs = ref<ConstructionITR[]>([])
const loadingITRs = ref(false)
const selectedITR = ref<ConstructionITR | null>(null)
const viewMode = ref<'gantt' | 'itr'>('gantt')
const filteredTaskId = ref<string | null>(null)
const systems = ref<any[]>([])
const itrTypes = ref<any[]>([])

// New task form data
const newTask = ref({
  name: '',
  type: 'task' as any,
  parentTaskId: null as string | null,
  startDate: '',
  endDate: '',
  status: 'not-started' as any,
  priority: 'medium' as any,
  description: '',
  mainAreaId: null as string | null,
  subArea1Id: null as string | null,
  locationDetail: ''
})

// Get tasks that can be parent tasks (not subtasks themselves)
const parentTaskOptions = computed(() => {
  if (!currentProject.value) return []
  return currentProject.value.tasks.filter(t => t.type !== 'subtask')
})

// Get sub areas for selected main area
const selectedMainAreaSubAreas = computed(() => {
  if (!newTask.value.mainAreaId) return []
  return subAreasMap.value.get(newTask.value.mainAreaId) || []
})

// Map to store sub areas by main area ID
const subAreasMap = ref<Map<string, SubArea1[]>>(new Map())

// Computed statistics
const completedTasks = computed(() => 
  currentProject.value?.tasks.filter(t => t.status === 'completed').length || 0
)

const inProgressTasks = computed(() => 
  currentProject.value?.tasks.filter(t => t.status === 'in-progress').length || 0
)

const overallProgress = computed(() => {
  if (!currentProject.value || currentProject.value.tasks.length === 0) return 0
  const total = currentProject.value.tasks.reduce((sum, task) => sum + task.progress, 0)
  return Math.round(total / currentProject.value.tasks.length)
})

/**
 * Load project planning data
 */
const loadProjectPlanning = async (projectId: string) => {
  try {
    isLoading.value = true
    loadingMessage.value = 'Loading project planning...'
    error.value = null
    
    console.log('📊 Loading project planning for:', projectId)

    // Get project details
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError) {
      console.error('❌ Project error:', projectError)
      throw projectError
    }
    
    console.log('✅ Project data:', projectData)

    // Get construction tasks
    const tasks = await constructionTasksService.getTasksByProject(projectId)
    console.log('✅ Tasks loaded:', tasks.length)

    // Load main areas
    mainAreas.value = await constructionTasksService.getMainAreas(projectId)
    console.log('✅ Areas loaded:', mainAreas.value.length)

    // Load sub areas for each main area
    subAreasMap.value.clear()
    for (const area of mainAreas.value) {
      try {
        const subAreas = await constructionTasksService.getSubAreas(area.id)
        subAreasMap.value.set(area.id, subAreas)
        console.log(`✅ Sub areas loaded for ${area.mainAreaName}:`, subAreas.length)
      } catch (err) {
        console.warn(`⚠️ Could not load sub areas for ${area.mainAreaName}:`, err)
      }
    }

    currentProject.value = {
      id: projectData.id,
      projectCode: projectData.project_code,
      name: projectData.name,
      description: projectData.description || '',
      startDate: projectData.project_start ? new Date(projectData.project_start) : new Date(),
      endDate: projectData.project_end ? new Date(projectData.project_end) : new Date(),
      status: projectData.status === 'active' ? 'in-progress' : 'not-started',
      tasks: tasks,
      isTestProject: projectData.is_test_project,
      lastSynced: new Date()
    }
    
    console.log('✅ Current project set:', currentProject.value)
  } catch (err: any) {
    console.error('❌ Load error:', err)
    error.value = 'Failed to load project: ' + (err.message || 'Unknown error')
  } finally {
    isLoading.value = false
  }
}

// Watch for project changes from global selector (must be after loadProjectPlanning is defined)
watch(() => projectStore.selectedProject, async (newProject) => {
  console.log('🔍 Project changed:', newProject)
  if (newProject?.id) {
    await loadProjectPlanning(newProject.id)
    await loadProjectITRs()
  } else {
    currentProject.value = null
    projectITRs.value = []
  }
}, { immediate: true })

/**
 * Create default construction tasks from template
 */
const createDefaultTasks = async () => {
  if (!projectStore.selectedProject?.id) {
    error.value = 'No project selected'
    return
  }

  try {
    isLoading.value = true
    loadingMessage.value = 'Creating default tasks...'

    // Generate tasks from template with proper IDs
    const templateTasks = DEFAULT_CONSTRUCTION_TEMPLATE.tasks.map(task => ({
      ...task,
      id: crypto.randomUUID(),
      projectId: projectStore.selectedProject!.id
    }))

    // Save to database
    const createdTasks = await constructionTasksService.createTasks(templateTasks)
    
    if (currentProject.value) {
      currentProject.value.tasks = createdTasks
      currentProject.value.lastSynced = new Date()
    }
  } catch (err: any) {
    error.value = 'Failed to create tasks: ' + (err.message || 'Unknown error')
  } finally {
    isLoading.value = false
  }
}

/**
 * Sync project to Supabase
 */
const syncToSupabase = async () => {
  if (!currentProject.value) return

  try {
    isSyncing.value = true

    // Update all tasks
    for (const task of currentProject.value.tasks) {
      await constructionTasksService.updateTask(task.id, task)
    }

    currentProject.value.lastSynced = new Date()
  } catch (err: any) {
    error.value = 'Failed to sync: ' + (err.message || 'Unknown error')
  } finally {
    isSyncing.value = false
  }
}

/**
 * Add new task
 */
const addNewTask = async () => {
  if (!projectStore.selectedProject?.id || !currentProject.value) return

  try {
    isLoading.value = true
    loadingMessage.value = 'Adding task...'

    // Get next display_order value
    const maxOrder = currentProject.value.tasks.reduce((max, t) => Math.max(max, t.displayOrder), 0)

    const task: Partial<ConstructionTask> = {
      id: crypto.randomUUID(),
      taskId: `task-${Date.now()}`,
      projectId: projectStore.selectedProject.id,
      parentTaskId: newTask.value.type === 'subtask' ? newTask.value.parentTaskId : null,
      name: newTask.value.name,
      type: newTask.value.type,
      start: new Date(newTask.value.startDate),
      end: new Date(newTask.value.endDate),
      progress: 0,
      status: newTask.value.status,
      priority: newTask.value.priority,
      dependencies: [],
      description: newTask.value.description || undefined,
      displayOrder: maxOrder + 1,
      location: (newTask.value.mainAreaId || newTask.value.subArea1Id || newTask.value.locationDetail) ? {
        mainAreaId: newTask.value.mainAreaId || undefined,
        subArea1Id: newTask.value.subArea1Id || undefined,
        locationDetail: newTask.value.locationDetail || undefined,
        mainAreaName: mainAreas.value.find(a => a.id === newTask.value.mainAreaId)?.mainAreaName,
        subArea1Name: subAreasMap.value
          .get(newTask.value.mainAreaId || '')
          ?.find(sa => sa.id === newTask.value.subArea1Id)?.subArea1Name
      } : undefined
    }

    const createdTask = await constructionTasksService.createTask(task)

    if (currentProject.value) {
      currentProject.value.tasks.push(createdTask)
      currentProject.value.lastSynced = new Date()
      
      // If this is a subtask, recalculate parent dates
      if (createdTask.parentTaskId) {
        await recalculateParentDates(createdTask.parentTaskId)
      }
    }

    // Reset form
    newTask.value = {
      name: '',
      type: 'task',
      parentTaskId: null,
      startDate: '',
      endDate: '',
      status: 'not-started',
      priority: 'medium',
      description: '',
      mainAreaId: null,
      subArea1Id: null,
      locationDetail: ''
    }

    showAddTaskModal.value = false
    console.log('✅ Task added successfully')
  } catch (err: any) {
    error.value = 'Failed to add task: ' + (err.message || 'Unknown error')
  } finally {
    isLoading.value = false
  }
}

/**
 * Delete all tasks
 */
const deleteAllTasks = async () => {
  if (!projectStore.selectedProject?.id) return

  if (!confirm('Are you sure you want to delete ALL tasks? This cannot be undone!')) {
    return
  }

  try {
    isLoading.value = true
    loadingMessage.value = 'Deleting all tasks...'

    await constructionTasksService.deleteTasksByProject(projectStore.selectedProject.id)

    if (currentProject.value) {
      currentProject.value.tasks = []
      currentProject.value.lastSynced = new Date()
    }

    console.log('✅ All tasks deleted')
  } catch (err: any) {
    error.value = 'Failed to delete tasks: ' + (err.message || 'Unknown error')
  } finally {
    isLoading.value = false
  }
}

/**
 * Handle task update from Gantt chart
 */
const handleTaskUpdate = async (updatedTask: ConstructionTask) => {
  if (!currentProject.value) return

  try {
    // Get the old task to check for parent changes
    const oldTask = currentProject.value.tasks.find(t => t.id === updatedTask.id)
    const oldParentId = oldTask?.parentTaskId

    // Update task in database
    await constructionTasksService.updateTask(updatedTask.id, updatedTask)

    // Update local state
    const taskIndex = currentProject.value.tasks.findIndex(t => t.id === updatedTask.id)
    if (taskIndex !== -1) {
      currentProject.value.tasks[taskIndex] = updatedTask
    }

    // Recalculate dates for both old and new parent if parent changed
    if (oldParentId !== updatedTask.parentTaskId) {
      // Recalculate old parent dates if it had a parent before
      if (oldParentId) {
        await recalculateParentDates(oldParentId)
      }
      // Recalculate new parent dates if it has a parent now
      if (updatedTask.parentTaskId) {
        await recalculateParentDates(updatedTask.parentTaskId)
      }
    } else if (updatedTask.parentTaskId) {
      // Parent didn't change, but dates might have - recalculate parent
      await recalculateParentDates(updatedTask.parentTaskId)
    }

    currentProject.value.lastSynced = new Date()
  } catch (err: any) {
    error.value = 'Failed to update task: ' + (err.message || 'Unknown error')
  }
}

/**
 * Handle moving task up/down
 */
const handleMoveTask = async (taskId: string, direction: 'up' | 'down') => {
  if (!currentProject.value) return

  try {
    await constructionTasksService.moveTask(taskId, direction, currentProject.value.id)
    
    // Reload tasks to reflect new order
    const tasks = await constructionTasksService.getTasksByProject(currentProject.value.id)
    currentProject.value.tasks = tasks
  } catch (err: any) {
    error.value = 'Failed to move task: ' + (err.message || 'Unknown error')
  }
}

/**
 * Handle adding a subtask
 */
const handleAddSubtask = (parentTaskId: string) => {
  const parentTask = currentProject.value?.tasks.find(t => t.id === parentTaskId)
  if (!parentTask) return

  // Pre-fill the form with parent info
  newTask.value.type = 'subtask'
  newTask.value.parentTaskId = parentTaskId
  newTask.value.startDate = (parentTask.start.toISOString().split('T')[0]) || ''
  newTask.value.endDate = (parentTask.end.toISOString().split('T')[0]) || ''
  newTask.value.mainAreaId = parentTask.location?.mainAreaId || null
  newTask.value.subArea1Id = parentTask.location?.subArea1Id || null
  newTask.value.locationDetail = parentTask.location?.locationDetail || ''
  
  showAddTaskModal.value = true
}

/**
 * Handle changing task parent
 */
const handleChangeParent = async (taskId: string, newParentId: string | null) => {
  if (!currentProject.value) return

  try {
    // Validate with service (checks circular references)
    await constructionTasksService.changeTaskParent(taskId, newParentId, currentProject.value.tasks)
    
    // Update task in database
    const task = currentProject.value.tasks.find(t => t.id === taskId)
    if (task) {
      task.parentTaskId = newParentId
      await constructionTasksService.updateTask(taskId, task)
      
      // Recalculate dates for both old and new parents
      if (task.parentTaskId) {
        await recalculateParentDates(task.parentTaskId)
      }
      if (newParentId) {
        await recalculateParentDates(newParentId)
      }
    }
    
    // Reload tasks
    const tasks = await constructionTasksService.getTasksByProject(currentProject.value.id)
    currentProject.value.tasks = tasks
  } catch (err: any) {
    error.value = 'Failed to change parent: ' + (err.message || 'Unknown error')
  }
}

/**
 * Handle task deletion
 */
const handleDeleteTask = async (taskId: string) => {
  if (!currentProject.value) return

  try {
    // Get all descendants recursively
    const getAllDescendants = (parentId: string): string[] => {
      const children = currentProject.value!.tasks.filter(t => t.parentTaskId === parentId)
      const descendants: string[] = []
      for (const child of children) {
        descendants.push(child.id)
        descendants.push(...getAllDescendants(child.id))
      }
      return descendants
    }

    // Get the task and all its descendants
    const task = currentProject.value.tasks.find(t => t.id === taskId)
    const descendantIds = getAllDescendants(taskId)
    const allIdsToDelete = [taskId, ...descendantIds]

    // Delete all tasks (main task and descendants)
    for (const id of allIdsToDelete) {
      await constructionTasksService.deleteTask(id)
    }

    // Update local state - remove all deleted tasks
    currentProject.value.tasks = currentProject.value.tasks.filter(
      t => !allIdsToDelete.includes(t.id)
    )

    // If deleted task had a parent, recalculate parent dates
    if (task?.parentTaskId) {
      await recalculateParentDates(task.parentTaskId)
    }

    currentProject.value.lastSynced = new Date()
  } catch (err: any) {
    error.value = 'Failed to delete task: ' + (err.message || 'Unknown error')
  }
}

/**
 * Handle ITR request
 */
const handleRequestITR = (taskId: string) => {
  console.log('handleRequestITR called with taskId:', taskId)
  console.log('currentProject:', currentProject.value)
  
  const task = currentProject.value?.tasks.find(t => t.id === taskId)
  console.log('Found task:', task)
  
  if (!task) {
    console.error('Task not found for ID:', taskId)
    return
  }
  
  selectedTaskForITR.value = task
  showITRModal.value = true
  console.log('showITRModal set to true')
}

/**
 * Handle ITR submission
 */
const handleITRSubmit = async (itrData: any) => {
  try {
    // Get current user ID from authStore
    const userId = authStore.userId
    console.log('📝 Current user ID from authStore:', userId)
    console.log('📝 Auth store user:', authStore.user)
    
    if (!userId) {
      console.error('❌ No user ID available. Please ensure you are logged in.')
      error.value = 'User not authenticated. Please log in again.'
      return
    }
    
    // 1. Create ITR
    const newITR = await constructionITRService.createITR(itrData)
    console.log('ITR created:', newITR.id)

    // 2. Upload all attachments
    if (itrData.attachments && itrData.attachments.length > 0) {
      console.log(`Uploading ${itrData.attachments.length} attachments...`)
      
      for (const attachment of itrData.attachments) {
        try {
          await constructionITRService.uploadAttachment(
            attachment.file,
            newITR.id,
            attachment.type,
            userId
          )
          console.log(`✓ Uploaded ${attachment.name} (${attachment.type})`)
        } catch (err: any) {
          console.error(`✗ Failed to upload ${attachment.name}:`, err)
          // Continue with other files even if one fails
        }
      }
    }

    // 3. If status is submitted, submit it
    if (itrData.status === 'submitted') {
      await constructionITRService.submitITR(newITR.id)
    }

    // Close modal
    showITRModal.value = false
    selectedTaskForITR.value = null

    // Reload ITRs list
    await loadProjectITRs()

    alert(`ITR created successfully with ${itrData.attachments?.length || 0} attachments!`)
  } catch (err: any) {
    console.error('Error creating ITR:', err)
    error.value = 'Failed to create ITR: ' + (err.message || 'Unknown error')
  }
}

/**
 * Load ITRs for current project
 */
const loadProjectITRs = async () => {
  if (!currentProject.value) return
  
  loadingITRs.value = true
  try {
    const [itrs, sys, types] = await Promise.all([
      constructionITRService.getITRsByProject(currentProject.value.id),
      constructionITRService.getSystemsByProject(currentProject.value.id),
      constructionITRService.getITRTypesByProject(currentProject.value.id)
    ])
    projectITRs.value = itrs
    systems.value = sys
    itrTypes.value = types
    console.log('Loaded ITRs:', itrs.length, 'Systems:', sys.length, 'Types:', types.length)
  } catch (err: any) {
    console.error('Error loading ITR data:', err)
  } finally {
    loadingITRs.value = false
  }
}

/**
 * Handle ITR selection from list
 */
const handleSelectITR = (itr: ConstructionITR) => {
  selectedITR.value = itr
  showITRDetail.value = true
}

/**
 * Handle ITR update
 */
const handleITRUpdate = async (id: string, data: any) => {
  try {
    console.log('Updating ITR:', id, data)
    
    // Get current user ID from authStore
    const userId = authStore.userId
    console.log('📝 Current user ID from authStore:', userId)
    
    if (!userId) {
      console.error('❌ No user ID available. Please ensure you are logged in.')
      error.value = 'User not authenticated. Please log in again.'
      return
    }
    
    // TODO: Implement update ITR service method
    // await constructionITRService.updateITR(id, data)
    
    // Handle attachment uploads if any new files
    if (data.attachments && data.attachments.length > 0) {
      console.log(`Uploading ${data.attachments.length} attachments for ITR update...`)
      
      for (const attachment of data.attachments) {
        try {
          await constructionITRService.uploadAttachment(
            attachment.file,
            id,
            attachment.type,
            userId
          )
          console.log(`✓ Uploaded ${attachment.name} (${attachment.type})`)
        } catch (err: any) {
          console.error(`✗ Failed to upload ${attachment.name}:`, err)
          // Continue with other files even if one fails
        }
      }
    }
    
    showITRDetail.value = false
    await loadProjectITRs()
  } catch (error) {
    console.error('Failed to update ITR:', error)
    alert('Failed to update ITR')
  }
}

/**
 * Filter ITRs by task and switch to ITR view
 */
const handleFilterITRsByTask = (taskId: string) => {
  viewMode.value = 'itr'
  filteredTaskId.value = taskId
  console.log('Filtering ITRs for task:', taskId)
}

/**
 * Recalculate parent task dates from children
 */
const recalculateParentDates = async (parentTaskId: string) => {
  if (!currentProject.value) return

  const dates = constructionTasksService.calculateParentDates(parentTaskId, currentProject.value.tasks)
  if (dates) {
    const parentTask = currentProject.value.tasks.find(t => t.id === parentTaskId)
    if (parentTask) {
      // Auto-expand parent dates if children are outside range
      const needsUpdate = 
        dates.start.getTime() < parentTask.start.getTime() ||
        dates.end.getTime() > parentTask.end.getTime()
      
      if (needsUpdate) {
        parentTask.start = dates.start
        parentTask.end = dates.end
        await constructionTasksService.updateTask(parentTaskId, parentTask)
      }
    }
  }
}

/**
 * Show areas management modal
 */
const manageAreas = () => {
  showAreasModal.value = true
}

/**
 * Export project data as JSON
 */
const exportProjectData = () => {
  if (!currentProject.value) return

  const dataStr = JSON.stringify(currentProject.value, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${currentProject.value.name.replace(/\s+/g, '_')}_${Date.now()}.json`
  link.click()
  URL.revokeObjectURL(url)
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

/**
 * Format date with time
 */
const formatDateTime = (date: Date): string => {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

</script>

<style scoped>
.construction-planning-view {
  min-height: 100vh;
  background: #f9fafb;
}

.view-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1.5rem 2rem;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.view-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

/* Loading and Error States */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #388087;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon,
.empty-icon {
  width: 64px;
  height: 64px;
  color: #ef4444;
}

.empty-icon {
  color: #9ca3af;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* Project View */
.project-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.project-layout {
  min-height: 600px;
}

.view-toggle {
  display: flex;
  gap: 0.25rem;
  background: #f3f4f6;
  padding: 0.25rem;
  border-radius: 8px;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  color: #6b7280;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  font-weight: 500;
}

.toggle-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.toggle-btn.active {
  background: white;
  color: #3b82f6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.itr-panel-full {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.gantt-panel-full {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.project-controls {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  flex-wrap: wrap;
  gap: 1rem;
}

.project-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.gantt-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.empty-tasks-state {
  background: white;
  border-radius: 12px;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.project-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1.25rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.875rem;
  font-weight: bold;
  color: #111827;
}

/* Modal */
.modal-overlay {
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

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.modal-header {
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
}

.modal-body {
  padding: 1.5rem;
}

/* Add Task Form */
.add-task-modal {
  max-width: 700px;
}

.task-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field.full-width {
  grid-column: 1 / -1;
}

.form-field label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.input-field {
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  width: 100%;
}

.input-field:focus {
  outline: none;
  border-color: #388087;
  box-shadow: 0 0 0 3px rgba(56, 128, 135, 0.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.areas-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.area-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.area-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 6px;
}

.area-name {
  font-weight: 500;
}

.area-code {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
  border: none;
  font-size: 0.875rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #388087;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2d6770;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-outline {
  background: white;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-outline:hover:not(:disabled) {
  background: #f9fafb;
}
</style>
