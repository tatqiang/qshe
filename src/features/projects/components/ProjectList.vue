<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Project Management</h2>
      <Button @click="showForm = true" variant="primary">
        + Add Project
      </Button>
    </div>

    <!-- Filters -->
    <Card padding="sm" class="mb-6">
      <div class="flex flex-col sm:flex-row gap-4">
        <!-- Search -->
        <div class="flex-1">
          <input
            type="text"
            placeholder="Search projects..."
            v-model="searchQuery"
            class="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        
        <!-- Status Filter -->
        <div class="sm:w-48">
          <select
            v-model="statusFilter"
            class="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
    </Card>

    <!-- Projects Count -->
    <div class="mb-4 text-sm text-gray-600 dark:text-gray-400">
      Showing {{ filteredProjects.length }} of {{ projects.length }} projects
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600 dark:text-gray-400">Loading projects...</span>
    </div>

    <!-- Empty State -->
    <Card v-else-if="filteredProjects.length === 0" padding="md" class="text-center">
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
      </svg>
      <p class="text-gray-500 dark:text-gray-400 text-lg mb-4">
        {{ projects.length === 0 ? 'No projects found. Create your first project!' : 'No projects match your search criteria.' }}
      </p>
      <Button v-if="projects.length === 0" @click="showForm = true" variant="primary">
        Create First Project
      </Button>
    </Card>

    <!-- Projects List -->
    <div v-else class="space-y-4">
      <Card
        v-for="project in filteredProjects"
        :key="project.id"
        padding="md"
        hover
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-lg text-gray-900 dark:text-white mb-1 truncate">
              {{ project.name }}
            </h3>
            <p class="text-sm font-mono text-gray-600 dark:text-gray-400 truncate">
              {{ project.project_code }}
            </p>
          </div>
          <span
            :class="[
              'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-3 shrink-0',
              getStatusClass(project.status || 'active')
            ]"
          >
            {{ getStatusText(project.status || 'active') }}
          </span>
        </div>

        <p v-if="project.description" class="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
          {{ project.description }}
        </p>

        <!-- Dates -->
        <div v-if="project.project_start || project.project_end" class="text-xs text-gray-500 dark:text-gray-400 mb-4 space-y-1">
          <div v-if="project.project_start">Start: {{ formatDate(project.project_start) }}</div>
          <div v-if="project.project_end">End: {{ formatDate(project.project_end) }}</div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
          <Button
            @click="editProject(project)"
            variant="outline"
            size="sm"
            class="flex-1"
          >
            Edit
          </Button>
        </div>
      </Card>
    </div>

    <!-- Project Form Modal -->
    <ProjectForm
      v-if="showForm"
      v-model="showForm"
      :project="editingProject"
      @save="handleSave"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import ProjectForm from './ProjectForm.vue'
import { projectService } from '@/services/projectService'
import { useOnlineStatus } from '@/composables/useOnlineStatus'
import type { Project, ProjectFormData } from '@/types/project'

const projects = ref<Project[]>([])
const loading = ref(false)
const showForm = ref(false)
const editingProject = ref<Project | null>(null)
const searchQuery = ref('')
const statusFilter = ref('all')
const { isOnline } = useOnlineStatus()

onMounted(() => {
  loadProjects()
})

// Auto-reload when coming back online (after sync completes)
watch(isOnline, (newValue, oldValue) => {
  if (newValue && !oldValue) {
    // Wait a bit for sync to complete, then reload
    setTimeout(() => {
      console.log('🔄 Reloading projects after sync...')
      loadProjects()
    }, 1500)
  }
})

const loadProjects = async () => {
  loading.value = true
  try {
    const data = await projectService.getAll()
    projects.value = data || []
    console.log('📋 Loaded projects:', projects.value.length)
  } catch (error) {
    console.error('❌ Failed to load projects:', error)
  } finally {
    loading.value = false
  }
}

const filteredProjects = computed(() => {
  return projects.value.filter(project => {
    // In System Settings (system_admin only), show ALL projects including test projects
    // No filtering by is_test_project here

    // Search filter
    const matchesSearch = searchQuery.value === '' || 
      (project.name && project.name.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
      project.project_code.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.value.toLowerCase()))

    // Status filter
    const matchesStatus = statusFilter.value === 'all' || project.status === statusFilter.value

    return matchesSearch && matchesStatus
  })
})

const editProject = (project: Project) => {
  editingProject.value = project
  showForm.value = true
}

const handleSave = async (projectData: ProjectFormData) => {
  loading.value = true
  try {
    if (editingProject.value?.id) {
      await projectService.update(editingProject.value.id, projectData)
    } else {
      await projectService.create(projectData)
    }
    
    await loadProjects()
    showForm.value = false
    editingProject.value = null
  } catch (error) {
    console.error('❌ Failed to save project:', error)
    alert(error instanceof Error ? error.message : 'Failed to save project. Please try again.')
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  showForm.value = false
  editingProject.value = null
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'completed':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'on_hold':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
  }
}

const getStatusText = (status: string) => {
  if (!status) return 'Active'
  return status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString()
}
</script>
