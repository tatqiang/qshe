import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { projectService } from '@/services/projectService'
import { APP_CONFIG } from '@/constants'

export const useProjectStore = defineStore('project', () => {
  const selectedProject = ref(null)
  const projects = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Load selected project from localStorage
  const savedProject = localStorage.getItem(APP_CONFIG.PROJECT_STORAGE_KEY)
  if (savedProject) {
    try {
      selectedProject.value = JSON.parse(savedProject)
    } catch (e) {
      console.error('Failed to parse saved project:', e)
    }
  }

  const displayName = computed(() => {
    if (!selectedProject.value) return 'All Projects'
    return selectedProject.value.name || selectedProject.value.project_code
  })

  const loadProjects = async () => {
    loading.value = true
    error.value = null
    try {
      projects.value = await projectService.getAll()
    } catch (err) {
      error.value = err.message
      console.error('Error loading projects:', err)
    } finally {
      loading.value = false
    }
  }

  const loadActiveProjects = async () => {
    loading.value = true
    error.value = null
    try {
      projects.value = await projectService.getActive()
    } catch (err) {
      error.value = err.message
      console.error('Error loading active projects:', err)
    } finally {
      loading.value = false
    }
  }

  const setProject = (project) => {
    selectedProject.value = project
    if (project) {
      localStorage.setItem(APP_CONFIG.PROJECT_STORAGE_KEY, JSON.stringify(project))
    } else {
      localStorage.removeItem(APP_CONFIG.PROJECT_STORAGE_KEY)
    }
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('project-changed', { detail: project }))
  }

  const clearProject = () => {
    setProject(null)
  }

  return {
    selectedProject,
    projects,
    loading,
    error,
    displayName,
    loadProjects,
    loadActiveProjects,
    setProject,
    clearProject
  }
})
