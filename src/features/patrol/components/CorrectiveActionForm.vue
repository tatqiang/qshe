<template>
  <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6 space-y-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        {{ action ? 'Edit Corrective Action' : 'Create Corrective Action' }}
      </h3>
      <button
        @click="$emit('cancel')"
        type="button"
        class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Action Type -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Action Type <span class="text-red-500">*</span>
        </label>
        <select
          v-model="formData.action_type"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          required
        >
          <option value="">Select action type...</option>
          <option value="immediate">Immediate Action</option>
          <option value="short_term">Short Term</option>
          <option value="long_term">Long Term</option>
          <option value="preventive">Preventive</option>
        </select>
      </div>

      <!-- Action Description -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Action Description <span class="text-red-500">*</span>
        </label>
        <textarea
          v-model="formData.description"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="Describe the corrective action required..."
          required
        ></textarea>
      </div>

      <!-- Action Date (Display Only) -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Action Date
        </label>
        <div class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">
          {{ new Date().toLocaleDateString() }}
        </div>
      </div>

      <!-- Action By -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Action By
        </label>
        <div class="flex items-center space-x-3 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <span class="text-sm font-medium text-blue-600 dark:text-blue-300">
                {{ getUserInitial() }}
              </span>
            </div>
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {{ currentUser?.name || currentUser?.email || 'Unknown' }}
            </p>
            <p v-if="currentUser?.name && currentUser?.email" class="text-xs text-gray-500 dark:text-gray-400">
              {{ currentUser.email }}
            </p>
            <p v-else class="text-xs text-gray-500 dark:text-gray-400">
              Automatically assigned to you
            </p>
          </div>
        </div>
      </div>

      <!-- Action Photos -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Action Photos <span class="text-red-500">*</span>
        </label>
        <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
          <!-- Upload Buttons -->
          <div class="flex flex-wrap gap-2 mb-3">
            <button
              type="button"
              @click="openCamera"
              class="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center space-x-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Camera</span>
            </button>
            <button
              type="button"
              @click="openGallery"
              class="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center space-x-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Gallery</span>
            </button>
            <span class="px-3 py-2 text-sm text-green-600 dark:text-green-400 flex items-center space-x-1">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span>Storage</span>
            </span>
          </div>

          <!-- Photo Counter -->
          <div class="text-center text-sm text-gray-600 dark:text-gray-400 mb-2">
            {{ formData.photos.length }} of 5 photos
          </div>

          <!-- Photo Preview Grid -->
          <div v-if="formData.photos.length > 0" class="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
            <div
              v-for="(photo, index) in formData.photos"
              :key="index"
              class="relative group"
            >
              <img
                :src="photo.preview || photo"
                alt="Photo preview"
                class="w-full h-20 object-cover rounded border border-gray-300 dark:border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
                @click="openPhotoViewer(index)"
              />
              <button
                type="button"
                @click.stop="removePhoto(index)"
                class="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Error message -->
          <p v-if="formData.photos.length === 0" class="text-sm text-red-600 dark:text-red-400">
            At least one photo is required for the corrective action
          </p>
        </div>

        <!-- Hidden file input for camera -->
        <input
          ref="cameraInput"
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          class="hidden"
          @change="handlePhotoCapture"
        />

        <!-- Hidden file input for gallery -->
        <input
          ref="galleryInput"
          type="file"
          accept="image/*"
          multiple
          class="hidden"
          @change="handlePhotoSelect"
        />
      </div>

      <!-- Form Actions -->
      <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          @click="$emit('cancel')"
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="!isFormValid || submitting"
          class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <span v-if="submitting">
            <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
          <span>Save Corrective Action</span>
        </button>
      </div>
    </form>

    <!-- Photo Viewer Modal -->
    <Teleport to="body">
      <div
        v-if="showPhotoViewer"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
        @click="closePhotoViewer"
      >
        <div class="relative w-full h-full flex items-center justify-center p-4">
          <!-- Close button -->
          <button
            @click="closePhotoViewer"
            class="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Previous button -->
          <button
            v-if="formData.photos.length > 1"
            @click.stop="previousPhoto"
            class="absolute left-4 text-white hover:text-gray-300 z-10"
          >
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <!-- Photo -->
          <img
            :src="formData.photos[currentPhotoIndex]?.preview || formData.photos[currentPhotoIndex]"
            alt="Full size photo"
            class="max-w-full max-h-full object-contain"
            @click.stop
          />

          <!-- Next button -->
          <button
            v-if="formData.photos.length > 1"
            @click.stop="nextPhoto"
            class="absolute right-4 text-white hover:text-gray-300 z-10"
          >
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <!-- Photo counter -->
          <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
            {{ currentPhotoIndex + 1 }} / {{ formData.photos.length }}
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/authStore'

const props = defineProps({
  patrolId: {
    type: String,
    required: true
  },
  action: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['submit', 'cancel'])

const authStore = useAuthStore()
const { user: currentUser } = storeToRefs(authStore)

const cameraInput = ref<HTMLInputElement | null>(null)
const galleryInput = ref<HTMLInputElement | null>(null)
const submitting = ref(false)
const showPhotoViewer = ref(false)
const currentPhotoIndex = ref(0)
const removedPhotoIds = ref<string[]>([]) // Track IDs of removed existing photos

const formData = ref({
  action_type: '',
  description: '',
  photos: [] as any[]
})

// Populate form if editing
onMounted(async () => {
  if (props.action) {
    formData.value.action_type = props.action.action_type || ''
    formData.value.description = props.action.description || ''
    
    // Load existing photos if in edit mode - use 'photos' field (not 'execution_photos')
    if (props.action.photos && props.action.photos.length > 0) {
      formData.value.photos = props.action.photos.map((photo: any) => ({
        preview: photo.url || photo.r2_url,
        name: photo.file_name || 'Existing photo',
        existing: true,
        id: photo.id
      }))
    } else {
      formData.value.photos = []
    }
  }
})

const isFormValid = computed(() => {
  // When editing, photos are optional (existing photos remain)
  const photosValid = props.action ? true : formData.value.photos.length > 0
  return formData.value.action_type && 
         formData.value.description.trim().length > 0 && 
         photosValid
})

const getUserInitial = () => {
  const user = currentUser.value as any
  if (user?.name) {
    return user.name.charAt(0).toUpperCase()
  }
  if (user?.email) {
    return user.email.charAt(0).toUpperCase()
  }
  return 'U'
}

const openCamera = () => {
  if (formData.value.photos.length >= 5) {
    alert('Maximum 5 photos allowed')
    return
  }
  cameraInput.value?.click()
}

const openGallery = () => {
  if (formData.value.photos.length >= 5) {
    alert('Maximum 5 photos allowed')
    return
  }
  galleryInput.value?.click()
}

const handlePhotoCapture = async (event: Event) => {
  const target = event.target as HTMLInputElement
  await processFiles(target.files)
  target.value = '' // Reset input
}

const handlePhotoSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  await processFiles(target.files)
  target.value = '' // Reset input
}

const processFiles = async (files: FileList | null) => {
  if (!files) return
  
  const remainingSlots = 5 - formData.value.photos.length
  const filesToProcess = Array.from(files).slice(0, remainingSlots)

  for (const file of filesToProcess) {
    if (!file.type.startsWith('image/')) {
      console.warn('Skipping non-image file:', file.name)
      continue
    }

    // Create preview URL
    const preview = URL.createObjectURL(file)
    
    formData.value.photos.push({
      file,
      preview,
      name: file.name
    })
  }

  if (files.length > remainingSlots) {
    alert(`Only ${remainingSlots} photo(s) could be added. Maximum 5 photos allowed.`)
  }
}

const removePhoto = (index: number) => {
  const photo = formData.value.photos[index]
  
  // If this is an existing photo, track its ID for deletion
  if (photo.existing && photo.id) {
    removedPhotoIds.value.push(photo.id)
  }
  
  if (photo.preview && !photo.existing) {
    URL.revokeObjectURL(photo.preview)
  }
  formData.value.photos.splice(index, 1)
}

const openPhotoViewer = (index: number) => {
  currentPhotoIndex.value = index
  showPhotoViewer.value = true
}

const closePhotoViewer = () => {
  showPhotoViewer.value = false
}

const nextPhoto = () => {
  if (currentPhotoIndex.value < formData.value.photos.length - 1) {
    currentPhotoIndex.value++
  } else {
    currentPhotoIndex.value = 0
  }
}

const previousPhoto = () => {
  if (currentPhotoIndex.value > 0) {
    currentPhotoIndex.value--
  } else {
    currentPhotoIndex.value = formData.value.photos.length - 1
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value || submitting.value) return

  submitting.value = true

  try {
    // Emit the form data to parent component
    // Filter out existing photos, only send new ones
    const newPhotos = formData.value.photos.filter((p: any) => !p.existing).map((p: any) => p.file)
    
    const submitData: any = {
      action_type: formData.value.action_type,
      description: formData.value.description,
      due_date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
      photos: newPhotos,
    }
    
    // Include action ID if editing
    if (props.action) {
      submitData.id = props.action.id
      // Include removed photo IDs if any
      if (removedPhotoIds.value.length > 0) {
        submitData.removedPhotoIds = removedPhotoIds.value
      }
    }
    
    emit('submit', submitData)
  } catch (error) {
    console.error('Error submitting corrective action:', error)
    alert('Failed to save corrective action. Please try again.')
  } finally {
    submitting.value = false
  }
}
</script>
