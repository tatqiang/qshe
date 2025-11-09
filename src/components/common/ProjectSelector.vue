<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="fixed inset-0 z-50 overflow-y-auto" @click.self="closeModal">
        <div class="flex min-h-full items-center justify-center p-4">
          <!-- Modal backdrop -->
          <div class="fixed inset-0 bg-black/50 transition-opacity" @click="closeModal"></div>
          
          <!-- Modal panel -->
          <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Select Project</h3>
              <button
                @click="closeModal"
                class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Content -->
            <div class="p-6 overflow-y-auto max-h-[calc(80vh-8rem)]">
              <!-- All Projects Option -->
              <div
                @click="selectProject(null)"
                class="flex items-center justify-between p-4 mb-3 rounded-lg border-2 cursor-pointer transition-all"
                :class="!selectedProject 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
              >
                <div>
                  <h4 class="font-medium text-gray-900 dark:text-white">All Projects</h4>
                  <p class="text-sm text-gray-500 dark:text-gray-400">View data from all projects</p>
                </div>
                <div v-if="!selectedProject" class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
              </div>

              <!-- Loading State -->
              <div v-if="loading" class="flex items-center justify-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span class="ml-2 text-gray-600 dark:text-gray-400">Loading projects...</span>
              </div>

              <!-- Projects List -->
              <div v-else-if="projects.length > 0" class="space-y-3">
                <div
                  v-for="project in projects"
                  :key="project.id"
                  @click="selectProject(project)"
                  class="flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all"
                  :class="selectedProject?.id === project.id 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
                >
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-3 mb-1">
                      <h4 class="font-medium text-gray-900 dark:text-white truncate">{{ project.name }}</h4>
                      <span
                        class="px-2 py-0.5 text-xs font-medium rounded-full"
                        :class="getStatusClass(project.status)"
                      >
                        {{ getStatusText(project.status) }}
                      </span>
                    </div>
                    <p class="text-sm text-gray-500 dark:text-gray-400">{{ project.project_code }}</p>
                    <p v-if="project.description" class="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                      {{ project.description }}
                    </p>
                  </div>
                  <div v-if="selectedProject?.id === project.id" class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 ml-3">
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div v-else class="text-center py-8">
                <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
                <p class="text-gray-500 dark:text-gray-400">No projects available</p>
              </div>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <button
                @click="closeModal"
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useProject } from '@/composables/useProject'
import { useAuth } from '@/composables/useAuth'
import { projectService } from '@/services/projectService'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue'])

const { selectedProject, setProject } = useProject()
const { user } = useAuth()
const projects = ref([])
const loading = ref(false)

onMounted(() => {
  loadProjects()
})

watch(() => props.modelValue, (value) => {
  if (value) {
    loadProjects()
  }
})

const loadProjects = async () => {
  loading.value = true
  try {
    projects.value = await projectService.getActive(user.value)
  } catch (error) {
    console.error('Error loading projects:', error)
    projects.value = []
  } finally {
    loading.value = false
  }
}

const selectProject = (project) => {
  setProject(project)
  closeModal()
}

const closeModal = () => {
  emit('update:modelValue', false)
}

const getStatusClass = (status) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'active': return 'Active'
    case 'completed': return 'Completed'
    case 'inactive': return 'Inactive'
    default: return status
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
  opacity: 0;
}
</style>
