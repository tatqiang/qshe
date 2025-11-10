import { ref, computed, type Ref, type ComputedRef } from 'vue'

interface Project {
  id?: string
  name?: string
  project_code: string
  [key: string]: any
}

const selectedProject = ref<Project | null>(null)
const projects = ref<Project[]>([])

// Load selected project from localStorage on init
const savedProject = localStorage.getItem('selectedProject')
if (savedProject) {
  try {
    selectedProject.value = JSON.parse(savedProject)
  } catch (e) {
    console.error('Failed to parse saved project:', e)
  }
}

export function useProject() {
  const setProject = (project: Project | null): void => {
    selectedProject.value = project
    if (project) {
      localStorage.setItem('selectedProject', JSON.stringify(project))
    } else {
      localStorage.removeItem('selectedProject')
    }
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('project-changed', { detail: project }))
  }

  const clearProject = (): void => {
    setProject(null)
  }

  const displayName = computed(() => {
    if (!selectedProject.value) return 'All Projects'
    return selectedProject.value.name || selectedProject.value.project_code
  })

  return {
    selectedProject: selectedProject as Ref<Project | null>,
    projects,
    setProject,
    clearProject,
    displayName: displayName as ComputedRef<string>
  }
}
