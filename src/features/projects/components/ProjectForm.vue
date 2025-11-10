<template>
  <Modal v-model="showModal" title="" size="lg" @close="handleCancel">
    <form @submit.prevent="handleSubmit">
      <div class="space-y-6">
        <!-- Header -->
        <div class="border-b border-gray-200 dark:border-gray-700 pb-4">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ project ? 'Edit Project' : 'Create New Project' }}
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {{ project ? 'Update project information' : 'Add a new project to the system' }}
          </p>
        </div>

        <!-- Project Code -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Project Code <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.project_code"
            type="text"
            required
            placeholder="e.g., ATC, PROJ001"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            :class="errors.project_code ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'"
          />
          <p v-if="errors.project_code" class="mt-1 text-sm text-red-500">{{ errors.project_code }}</p>
        </div>

        <!-- Project Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Project Name <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.name"
            type="text"
            required
            placeholder="Enter project name"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            :class="errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'"
          />
          <p v-if="errors.name" class="mt-1 text-sm text-red-500">{{ errors.name }}</p>
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            v-model="formData.description"
            rows="3"
            placeholder="Enter project description"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        <!-- Status -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status <span class="text-red-500">*</span>
          </label>
          <select
            v-model="formData.status"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <!-- Date Range -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <input
              v-model="formData.project_start"
              type="date"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <input
              v-model="formData.project_end"
              type="date"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              :class="errors.project_end ? 'border-red-500' : ''"
            />
            <p v-if="errors.project_end" class="mt-1 text-sm text-red-500">{{ errors.project_end }}</p>
          </div>
        </div>
      </div>
    </form>

    <template #footer>
      <Button @click="handleCancel" variant="outline">
        Cancel
      </Button>
      <Button @click="handleSubmit" variant="primary" :loading="saving">
        {{ project ? 'Update Project' : 'Create Project' }}
      </Button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import type { Project, ProjectFormData, ProjectFormErrors } from '@/types/project'

const props = defineProps<{
  modelValue: boolean
  project?: Project | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [data: ProjectFormData]
  'cancel': []
}>()

const showModal = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formData = ref<ProjectFormData>({
  project_code: '',
  name: '',
  description: '',
  status: 'active',
  project_start: '',
  project_end: ''
})

const errors = ref<ProjectFormErrors>({})
const saving = ref(false)

// Initialize form when project changes
watch(() => props.project, (newProject) => {
  if (newProject) {
    formData.value = {
      project_code: newProject.project_code || '',
      name: newProject.name || '',
      description: newProject.description || '',
      status: (newProject.status === 'on_hold' || newProject.status === 'cancelled' || newProject.status === 'completed' || newProject.status === 'active') 
        ? newProject.status 
        : 'active',
      project_start: newProject.project_start || '',
      project_end: newProject.project_end || ''
    }
  } else {
    formData.value = {
      project_code: '',
      name: '',
      description: '',
      status: 'active',
      project_start: '',
      project_end: ''
    }
  }
  errors.value = {}
}, { immediate: true })

const validateForm = () => {
  const newErrors: ProjectFormErrors = {}

  if (!formData.value.project_code.trim()) {
    newErrors.project_code = 'Project code is required'
  } else if (formData.value.project_code.length < 2) {
    newErrors.project_code = 'Project code must be at least 2 characters'
  }

  if (!formData.value.name.trim()) {
    newErrors.name = 'Project name is required'
  } else if (formData.value.name.length < 3) {
    newErrors.name = 'Project name must be at least 3 characters'
  }

  if (formData.value.project_start && formData.value.project_end) {
    const startDate = new Date(formData.value.project_start)
    const endDate = new Date(formData.value.project_end)
    if (endDate <= startDate) {
      newErrors.project_end = 'End date must be after start date'
    }
  }

  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  saving.value = true
  try {
    emit('save', { ...formData.value })
  } finally {
    saving.value = false
  }
}

const handleCancel = () => {
  emit('cancel')
  emit('update:modelValue', false)
}
</script>
