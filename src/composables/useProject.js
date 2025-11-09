import { ref, computed } from 'vue'

const selectedProject = ref(null)
const projects = ref([])

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
  const setProject = (project) => {
    selectedProject.value = project
    if (project) {
      localStorage.setItem('selectedProject', JSON.stringify(project))
    } else {
      localStorage.removeItem('selectedProject')
    }
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('project-changed', { detail: project }))
  }

  const clearProject = () => {
    setProject(null)
  }

  const displayName = computed(() => {
    if (!selectedProject.value) return 'All Projects'
    return selectedProject.value.name || selectedProject.value.project_code
  })

  return {
    selectedProject,
    projects,
    setProject,
    clearProject,
    displayName
  }
}
