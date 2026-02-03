<template>
  <div class="construction-planning-view">
    <!-- Header -->
    <header class="view-header">
      <div class="header-content">
        <h1 class="text-3xl font-bold">Construction Project Planning</h1>
        <div class="header-actions">
          <!-- Google Account Status -->
          <div v-if="isSignedIn" class="user-info">
            <img v-if="currentUser?.imageUrl" :src="currentUser.imageUrl" alt="Profile" class="user-avatar" />
            <span class="user-name">{{ currentUser?.name }}</span>
            <button @click="handleSignOut" class="btn btn-outline">
              Sign Out
            </button>
          </div>
          <button v-else @click="handleSignIn" class="btn btn-primary">
            <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        </div>
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

      <!-- Project Selection / Creation -->
      <div v-else-if="!currentProject" class="project-selection">
        <div class="selection-card">
          <h2 class="text-2xl font-bold mb-4">Get Started</h2>
          <p class="text-gray-600 mb-6">
            Create a new construction project or load an existing one from Google Sheets
          </p>
          
          <div class="action-grid">
            <!-- Create New Project -->
            <div class="action-card">
              <svg class="action-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              <h3 class="font-semibold mb-2">New Project</h3>
              <p class="text-sm text-gray-600 mb-4">
                Start with a default construction project template
              </p>
              <button @click="createNewProject" class="btn btn-primary w-full" :disabled="!isSignedIn">
                Create Project
              </button>
            </div>

            <!-- Load from Google Sheets -->
            <div class="action-card">
              <svg class="action-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <h3 class="font-semibold mb-2">Load Existing</h3>
              <p class="text-sm text-gray-600 mb-4">
                Import project data from a Google Sheet
              </p>
              <div class="flex gap-2">
                <input 
                  v-model="sheetIdInput"
                  type="text" 
                  placeholder="Enter Sheet ID"
                  class="input-field flex-1"
                  :disabled="!isSignedIn"
                />
                <button @click="loadExistingProject" class="btn btn-secondary" :disabled="!isSignedIn || !sheetIdInput">
                  Load
                </button>
              </div>
            </div>
          </div>

          <div v-if="!isSignedIn" class="signin-notice">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>Please sign in with Google to create or load projects</span>
          </div>
        </div>
      </div>

      <!-- Project View -->
      <div v-else class="project-view">
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
            <button @click="syncToGoogleSheets" class="btn btn-secondary" :disabled="isSyncing">
              <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              {{ isSyncing ? 'Syncing...' : 'Sync to Sheets' }}
            </button>
            
            <button v-if="currentProject.googleSheetId" @click="openInGoogleSheets" class="btn btn-outline">
              <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
              Open in Sheets
            </button>
            
            <button @click="exportProjectData" class="btn btn-outline">
              <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Export JSON
            </button>
            
            <button @click="closeProject" class="btn btn-outline">
              Close Project
            </button>
          </div>
        </div>

        <!-- Gantt Chart -->
        <div class="gantt-section">
          <GanttChart 
            :tasks="currentProject.tasks"
            :project-name="currentProject.name"
            @task-update="handleTaskUpdate"
          />
        </div>

        <!-- Project Statistics -->
        <div class="project-stats">
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
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { googleAuthService } from '../services/googleAuthService'
import { googleSheetsService } from '../services/googleSheetsService'
import GanttChart from '../components/GanttChart.vue'
import type { ConstructionProject, ConstructionTask } from '../types/construction-project'
import { DEFAULT_CONSTRUCTION_TEMPLATE } from '../types/construction-project'

const isSignedIn = ref(false)
const currentUser = ref<any>(null)
const isLoading = ref(false)
const loadingMessage = ref('')
const error = ref<string | null>(null)
const currentProject = ref<ConstructionProject | null>(null)
const sheetIdInput = ref('')
const isSyncing = ref(false)

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
 * Initialize Google Auth
 */
const initAuth = async () => {
  try {
    isLoading.value = true
    loadingMessage.value = 'Initializing Google services...'
    
    await googleAuthService.initialize()
    isSignedIn.value = googleAuthService.isSignedIn()
    
    if (isSignedIn.value) {
      currentUser.value = googleAuthService.getCurrentUser()
    }

    // Listen for auth state changes
    googleAuthService.onSignInChange((signedIn) => {
      isSignedIn.value = signedIn
      if (signedIn) {
        currentUser.value = googleAuthService.getCurrentUser()
      } else {
        currentUser.value = null
        currentProject.value = null
      }
    })
  } catch (err: any) {
    error.value = err.message || 'Failed to initialize Google services'
    console.error('Auth initialization error:', err)
  } finally {
    isLoading.value = false
  }
}

/**
 * Handle Google Sign In
 */
const handleSignIn = async () => {
  try {
    isLoading.value = true
    loadingMessage.value = 'Signing in...'
    await googleAuthService.signIn()
  } catch (err: any) {
    error.value = 'Failed to sign in: ' + (err.message || 'Unknown error')
  } finally {
    isLoading.value = false
  }
}

/**
 * Handle Google Sign Out
 */
const handleSignOut = async () => {
  try {
    await googleAuthService.signOut()
    currentProject.value = null
  } catch (err: any) {
    error.value = 'Failed to sign out: ' + (err.message || 'Unknown error')
  }
}

/**
 * Create a new project from template
 */
const createNewProject = async () => {
  try {
    isLoading.value = true
    loadingMessage.value = 'Creating project...'

    // Generate unique ID
    const projectId = `project-${Date.now()}`
    
    // Create project from template
    const newProject: ConstructionProject = {
      ...DEFAULT_CONSTRUCTION_TEMPLATE,
      id: projectId,
      name: `Construction Project ${new Date().toLocaleDateString()}`,
    }

    // Create Google Sheet
    loadingMessage.value = 'Creating Google Sheet...'
    const sheetId = await googleSheetsService.createProjectSheet(newProject)
    
    newProject.googleSheetId = sheetId
    newProject.lastSynced = new Date()
    
    currentProject.value = newProject
  } catch (err: any) {
    error.value = 'Failed to create project: ' + (err.message || 'Unknown error')
  } finally {
    isLoading.value = false
  }
}

/**
 * Load existing project from Google Sheets
 */
const loadExistingProject = async () => {
  if (!sheetIdInput.value) return

  try {
    isLoading.value = true
    loadingMessage.value = 'Loading project from Google Sheets...'

    const projectData = await googleSheetsService.readProjectFromSheet(sheetIdInput.value)
    
    currentProject.value = {
      id: `project-${Date.now()}`,
      description: '',
      status: 'in-progress',
      ...projectData
    } as ConstructionProject

    sheetIdInput.value = ''
  } catch (err: any) {
    error.value = 'Failed to load project: ' + (err.message || 'Unknown error')
  } finally {
    isLoading.value = false
  }
}

/**
 * Sync project to Google Sheets
 */
const syncToGoogleSheets = async () => {
  if (!currentProject.value) return

  try {
    isSyncing.value = true

    if (currentProject.value.googleSheetId) {
      // Update existing sheet
      await googleSheetsService.writeProjectToSheet(
        currentProject.value.googleSheetId,
        currentProject.value
      )
    } else {
      // Create new sheet
      const sheetId = await googleSheetsService.createProjectSheet(currentProject.value)
      currentProject.value.googleSheetId = sheetId
    }

    currentProject.value.lastSynced = new Date()
  } catch (err: any) {
    error.value = 'Failed to sync: ' + (err.message || 'Unknown error')
  } finally {
    isSyncing.value = false
  }
}

/**
 * Open project in Google Sheets
 */
const openInGoogleSheets = () => {
  if (currentProject.value?.googleSheetId) {
    const url = googleSheetsService.getSheetUrl(currentProject.value.googleSheetId)
    window.open(url, '_blank')
  }
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
 * Handle task update from Gantt chart
 */
const handleTaskUpdate = async (updatedTask: ConstructionTask) => {
  if (!currentProject.value) return

  // Update task in project
  const taskIndex = currentProject.value.tasks.findIndex(t => t.id === updatedTask.id)
  if (taskIndex !== -1) {
    currentProject.value.tasks[taskIndex] = updatedTask

    // Auto-sync to Google Sheets if connected
    if (currentProject.value.googleSheetId) {
      try {
        await googleSheetsService.updateTask(
          currentProject.value.googleSheetId,
          updatedTask.id,
          updatedTask
        )
        currentProject.value.lastSynced = new Date()
      } catch (err: any) {
        console.error('Failed to sync task update:', err)
      }
    }
  }
}

/**
 * Close current project
 */
const closeProject = () => {
  if (confirm('Close this project? Unsaved changes will be lost.')) {
    currentProject.value = null
  }
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

// Initialize on mount
onMounted(() => {
  initAuth()
})
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

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.user-name {
  font-weight: 500;
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

.error-icon {
  width: 64px;
  height: 64px;
  color: #ef4444;
}

/* Project Selection */
.project-selection {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
}

.selection-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 800px;
  width: 100%;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.action-card {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
}

.action-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 1rem;
  color: #388087;
}

.signin-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #fef3c7;
  border-radius: 8px;
  color: #92400e;
}

/* Project View */
.project-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.project-controls {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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

/* Input Fields */
.input-field {
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.input-field:focus {
  outline: none;
  border-color: #388087;
  ring: 2px;
  ring-color: rgba(56, 128, 135, 0.2);
}

.input-field:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}
</style>
