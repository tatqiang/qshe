<template>
  <div class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4 space-y-4">
    <h4 class="text-lg font-medium text-orange-900 dark:text-orange-100">
      📋 Verification & Approval
    </h4>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Review Description -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Review Description
        </label>
        <textarea
          v-model="formData.reviewDescription"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="Add your review comments and verification notes..."
        ></textarea>
      </div>

      <!-- Verification Photos -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Verification Photos
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
          </div>

          <!-- Photo Counter -->
          <div class="text-center text-sm text-gray-600 dark:text-gray-400 mb-2">
            {{ formData.verificationPhotos.length }} of 3 photos
          </div>

          <!-- Photo Preview Grid -->
          <div v-if="formData.verificationPhotos.length > 0" class="grid grid-cols-3 gap-2 mb-3">
            <div
              v-for="(photo, index) in formData.verificationPhotos"
              :key="index"
              class="relative group"
            >
              <img
                :src="photo.preview || photo"
                alt="Verification photo"
                class="w-full h-20 object-cover rounded border border-gray-300 dark:border-gray-600"
              />
              <button
                type="button"
                @click="removePhoto(index)"
                class="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Hidden file inputs -->
        <input
          ref="cameraInput"
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          class="hidden"
          @change="handlePhotoCapture"
        />
        <input
          ref="galleryInput"
          type="file"
          accept="image/*"
          multiple
          class="hidden"
          @change="handlePhotoSelect"
        />
      </div>

      <!-- Verify By -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Verify By
        </label>
        <div class="flex items-center space-x-3 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <span class="text-sm font-medium text-green-600 dark:text-green-300">
                {{ getUserInitial() }}
              </span>
            </div>
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {{ currentUser?.name || currentUser?.email || 'Unknown' }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Verification Officer</p>
          </div>
        </div>
      </div>

      <!-- Verification Results -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Verification Results
        </label>
        <div class="flex space-x-3">
          <button
            type="button"
            @click="handleApprove"
            :disabled="submitting"
            class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <span v-if="submitting && approving">
              <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            <span v-else>✓</span>
            <span>Approve</span>
          </button>
          <button
            type="button"
            @click="handleReject"
            :disabled="submitting"
            class="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <span v-if="submitting && !approving">
              <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            <span v-else>✗</span>
            <span>Reject</span>
          </button>
          <button
            type="button"
            @click="$emit('cancel')"
            :disabled="submitting"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'

const props = defineProps({
  actionId: {
    type: String,
    required: true
  },
  action: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['approve', 'reject', 'cancel'])

const { user: currentUser } = useAuth()

const cameraInput = ref(null)
const galleryInput = ref(null)
const submitting = ref(false)
const approving = ref(false)
const removedPhotoIds = ref([]) // Track IDs of removed existing photos

const formData = ref({
  reviewDescription: '',
  verificationPhotos: []
})

// Populate form if editing verification
onMounted(() => {
  if (props.action) {
    // Load existing verification notes
    formData.value.reviewDescription = props.action.verification_notes || ''
    
    // Load existing verification photos
    if (props.action.verification_photos && props.action.verification_photos.length > 0) {
      formData.value.verificationPhotos = props.action.verification_photos.map(photo => ({
        preview: photo.url || photo.r2_url,
        name: photo.file_name || 'Existing photo',
        existing: true,
        id: photo.id
      }))
    }
  }
})

const getUserInitial = () => {
  if (currentUser.value?.name) {
    return currentUser.value.name.charAt(0).toUpperCase()
  }
  if (currentUser.value?.email) {
    return currentUser.value.email.charAt(0).toUpperCase()
  }
  return 'V'
}

const openCamera = () => {
  if (formData.value.verificationPhotos.length >= 3) {
    alert('Maximum 3 photos allowed')
    return
  }
  cameraInput.value.click()
}

const openGallery = () => {
  if (formData.value.verificationPhotos.length >= 3) {
    alert('Maximum 3 photos allowed')
    return
  }
  galleryInput.value.click()
}

const handlePhotoCapture = async (event) => {
  await processFiles(event.target.files)
  event.target.value = ''
}

const handlePhotoSelect = async (event) => {
  await processFiles(event.target.files)
  event.target.value = ''
}

const processFiles = async (files) => {
  const remainingSlots = 3 - formData.value.verificationPhotos.length
  const filesToProcess = Array.from(files).slice(0, remainingSlots)

  for (const file of filesToProcess) {
    if (!file.type.startsWith('image/')) {
      console.warn('Skipping non-image file:', file.name)
      continue
    }

    const preview = URL.createObjectURL(file)
    
    formData.value.verificationPhotos.push({
      file,
      preview,
      name: file.name
    })
  }

  if (files.length > remainingSlots) {
    alert(`Only ${remainingSlots} photo(s) could be added. Maximum 3 photos allowed.`)
  }
}

const removePhoto = (index) => {
  const photo = formData.value.verificationPhotos[index]
  
  // If this is an existing photo, track its ID for deletion
  if (photo.existing && photo.id) {
    removedPhotoIds.value.push(photo.id)
  }
  
  if (photo.preview && !photo.existing) {
    URL.revokeObjectURL(photo.preview)
  }
  formData.value.verificationPhotos.splice(index, 1)
}

const handleApprove = async () => {
  if (submitting.value) return
  
  submitting.value = true
  approving.value = true

  try {
    // Filter out existing photos, only send new ones
    const newPhotos = formData.value.verificationPhotos.filter(p => !p.existing).map(p => p.file)
    
    const approveData = {
      review_description: formData.value.reviewDescription,
      photos: newPhotos,
      verified_by: currentUser.value?.id,
      verification_result: 'approved'
    }
    
    // Include removed photo IDs if any
    if (removedPhotoIds.value.length > 0) {
      approveData.removedPhotoIds = removedPhotoIds.value
    }
    
    emit('approve', approveData)
  } catch (error) {
    console.error('Error approving:', error)
    alert('Failed to approve. Please try again.')
  } finally {
    submitting.value = false
    approving.value = false
  }
}

const handleReject = async () => {
  if (submitting.value) return
  
  if (!formData.value.reviewDescription.trim()) {
    alert('Please provide a reason for rejection in the review description.')
    return
  }
  
  submitting.value = true
  approving.value = false

  try {
    // Filter out existing photos, only send new ones
    const newPhotos = formData.value.verificationPhotos.filter(p => !p.existing).map(p => p.file)
    
    const rejectData = {
      review_description: formData.value.reviewDescription,
      photos: newPhotos,
      verified_by: currentUser.value?.id,
      verification_result: 'rejected'
    }
    
    // Include removed photo IDs if any
    if (removedPhotoIds.value.length > 0) {
      rejectData.removedPhotoIds = removedPhotoIds.value
    }
    
    emit('reject', rejectData)
  } catch (error) {
    console.error('Error rejecting:', error)
    alert('Failed to reject. Please try again.')
  } finally {
    submitting.value = false
  }
}
</script>
