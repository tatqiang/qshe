<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-8">
    <!-- Back Button -->
    <div class="mb-3 sm:mb-6">
      <Button @click="router.push('/patrol')" variant="outline" size="sm">
        <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </Button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <p class="text-red-600 dark:text-red-400 mb-4">{{ error }}</p>
      <Button @click="router.push('/patrol')" variant="outline">Go Back</Button>
    </div>

    <!-- Patrol Detail -->
    <div v-else-if="patrol" class="space-y-3 sm:space-y-6">
      <!-- Combined Safety Patrol Information - Single Blue Box -->
      <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-6">
        <div class="flex items-center justify-between mb-3 sm:mb-6">
          <div>
            <h3 class="font-medium text-blue-900 dark:text-blue-100 flex items-center text-base sm:text-lg">
              🛡️ Safety Patrol Report
            </h3>
            <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
              Created: {{ formatDateTime(patrol.created_at) }}
              <span v-if="!canEdit" class="text-red-600 dark:text-red-400"> (Edit period expired)</span>
            </p>
          </div>
          <Button
            v-if="canEdit || userId"
            @click="canEdit ? handleEdit() : showEditExpiredAlert()"
            :variant="canEdit ? 'primary' : 'ghost'"
            size="sm"
            :disabled="!canEdit"
            class="text-xs sm:text-sm"
          >
            <span>✏️</span>
            <span class="ml-1.5 sm:ml-2">Edit</span>
          </Button>
        </div>

        <!-- Basic Information Section -->
        <div class="mb-3 sm:mb-6">
          <h4 class="font-medium text-blue-800 dark:text-blue-200 mb-2 sm:mb-4 text-sm sm:text-base">📋 Patrol Information</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 mb-2 sm:mb-4">
            <div>
              <span class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Created By: </span>
              <span class="text-sm sm:text-base text-gray-900 dark:text-white font-medium">{{ patrol.creator_name || 'Unknown' }}</span>
            </div>
            <div>
              <span class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Patrol Type: </span>
              <span class="text-sm sm:text-base text-gray-900 dark:text-white font-medium">{{ getPatrolTypeDisplay(patrol.patrol_type) }}</span>
            </div>
            <div>
              <span class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Patrol Date: </span>
              <span class="text-sm sm:text-base text-gray-900 dark:text-white font-medium">{{ formatDate(patrol.patrol_date) }}</span>
            </div>
          </div>

          <!-- Title and Description -->
          <div class="mb-2 sm:mb-4">
            <div class="mb-2 sm:mb-3">
              <span class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Title: </span>
              <div class="mt-1 bg-white dark:bg-gray-800 px-2 py-1.5 sm:px-3 sm:py-2 rounded border border-gray-300 dark:border-gray-600 text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                {{ patrol.title || 'No title provided' }}
              </div>
            </div>
            <div>
              <span class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Description: </span>
              <div class="mt-1 bg-white dark:bg-gray-800 px-2 py-1.5 sm:px-3 sm:py-2 rounded border border-gray-300 dark:border-gray-600 text-xs sm:text-base text-gray-900 dark:text-white min-h-[50px] sm:min-h-[60px] leading-normal sm:leading-relaxed">
                {{ patrol.description || 'No description provided' }}
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
            <div>
              <span class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Location: </span>
              <span class="text-sm sm:text-base text-gray-900 dark:text-white font-medium">{{ [patrol.main_area, patrol.sub_area_1, patrol.sub_area_2].filter(Boolean).join(' › ') || 'No location specified' }}</span>
            </div>
            <div>
              <span class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Specific Location: </span>
              <span class="text-sm sm:text-base text-gray-900 dark:text-white font-medium">{{ patrol.specific_location || 'Not specified' }}</span>
            </div>
          </div>
        </div>

        <!-- Risk Assessment Section -->
        <div class="mb-3 sm:mb-6 pt-2 sm:pt-4 border-t border-blue-200 dark:border-blue-700">
          <h4 class="font-medium text-blue-800 dark:text-blue-200 mb-2 sm:mb-4 text-sm sm:text-base">⚠️ Risk Assessment</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4 mb-2 sm:mb-4">
            <div>
              <span class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Risk Level: </span>
              <span :class="getRiskLevelClass(patrol.risk_level)" class="inline-flex px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs sm:text-sm font-medium rounded-full">
                {{ getRiskLevelEmoji(patrol.risk_level) }} {{ getRiskLevelLabel(patrol.risk_level) }}
              </span>
              <div class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Score: {{ patrol.likelihood * patrol.severity }}</div>
            </div>
            <div>
              <span class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Likelihood: </span>
              <span class="text-sm sm:text-base text-gray-900 dark:text-white font-medium">Level {{ patrol.likelihood }} of 5</span>
            </div>
            <div>
              <span class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Severity: </span>
              <span class="text-sm sm:text-base text-gray-900 dark:text-white font-medium">Level {{ patrol.severity }} of 5</span>
            </div>
          </div>

          <!-- Immediate Hazard & Work Stopped -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
            <div>
              <span class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Immediate Hazard: </span>
              <span :class="patrol.immediate_hazard ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'" class="inline-flex px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full">
                {{ patrol.immediate_hazard ? '🚨 YES' : '✅ NO' }}
              </span>
            </div>
            <div>
              <span class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Work Stopped: </span>
              <span :class="patrol.work_stopped ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'" class="inline-flex px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full">
                {{ patrol.work_stopped ? '🛑 YES' : '▶️ NO' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Evidence Photos Section -->
        <div v-if="photos.length > 0" class="mb-3 sm:mb-6 pt-2 sm:pt-4 border-t border-blue-200 dark:border-blue-700">
          <h4 class="font-medium text-blue-800 dark:text-blue-200 mb-2 sm:mb-4 text-sm sm:text-base">📸 Evidence Photos</h4>
          
          <div class="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
            <div v-for="(photo, index) in photos" :key="photo.id" class="relative cursor-pointer hover:opacity-80 transition-opacity">
              <img
                :src="photo.url || photo.file_path"
                :alt="`Evidence photo ${index + 1}`"
                class="w-full h-16 sm:h-20 object-cover rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800"
                @click="handlePatrolPhotoClick(index)"
                @error="handleImageError($event, photo)"
              />
              <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-[10px] sm:text-xs p-0.5 sm:p-1 text-center">
                {{ index + 1 }}
              </div>
            </div>
          </div>
          
          <div class="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
            {{ photos.length }} photo{{ photos.length !== 1 ? 's' : '' }} uploaded
          </div>
        </div>

        <!-- Remark Section -->
        <div class="pt-2 sm:pt-4 border-t border-blue-200 dark:border-blue-700">
          <h4 class="font-medium text-blue-800 dark:text-blue-200 mb-2 sm:mb-3 text-sm sm:text-base">💬 Remark</h4>
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 sm:p-4">
            <p v-if="patrol.remark && patrol.remark.trim()" class="text-xs sm:text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-normal sm:leading-relaxed">{{ patrol.remark }}</p>
            <p v-else class="text-xs sm:text-base text-gray-500 dark:text-gray-400 italic">No remark provided</p>
          </div>
        </div>
      </div>

      <!-- Corrective Actions Section - Always show -->
      <div>
        <h3 class="font-medium text-gray-900 dark:text-white mb-3 sm:mb-4 text-base sm:text-lg flex items-center">
          📋 Corrective Actions
        </h3>
        
        <!-- Show corrective actions if any exist -->
        <div v-if="correctiveActions.length > 0" class="space-y-3 sm:space-y-4">
          <div v-for="action in correctiveActions" :key="action.id" class="mb-3 sm:mb-4">
            
            <!-- Show form if editing this specific action -->
            <CorrectiveActionForm
              v-if="editingAction && editingAction.id === action.id"
              :patrol-id="patrol.id"
              :action="editingAction"
              @submit="handleCorrectiveActionSubmit"
              @cancel="handleCorrectiveActionCancel"
            />
            
            <!-- Show action details if not editing -->
            <div v-else class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 sm:p-4">
              <div class="flex items-center justify-between mb-2 sm:mb-3">
                <h4 class="font-medium text-yellow-900 dark:text-yellow-100 flex items-center text-sm sm:text-base">
                  🔧 Corrective Action Details
                </h4>
                <div class="flex items-center gap-2">
                  <button
                    v-if="canEditAction(action)"
                    @click="handleEditAction(action)"
                    class="px-3 py-1 text-xs sm:text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 flex items-center gap-1"
                  >
                    <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edit</span>
                  </button>
                  <span v-if="action.status === 'completed'" class="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                    ✅ Verified
                  </span>
                </div>
              </div>
            
            <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">
              Created: {{ formatDateTime(action.created_at) }}
              <span v-if="!canEditAction(action)" class="text-red-600 dark:text-red-400"> (Edit period expired)</span>
            </p>

            <div class="space-y-2 sm:space-y-3">
              <div>
                <span class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Action By: </span>
                <span class="text-sm sm:text-base text-gray-900 dark:text-white font-medium">{{ action.assigned_to_name || 'Not assigned' }}</span>
              </div>

              <div>
                <span class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Action Date: </span>
                <span class="text-sm sm:text-base text-gray-900 dark:text-white font-medium">{{ formatDate(action.due_date) }}</span>
              </div>

              <div>
                <span class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Description: </span>
                <div class="mt-1 bg-white dark:bg-gray-800 px-2 py-1.5 sm:px-3 sm:py-2 rounded border border-gray-300 dark:border-gray-600 text-xs sm:text-base text-gray-900 dark:text-white">
                  {{ action.description }}
                </div>
              </div>

              <!-- Action Photos -->
              <div v-if="action.photos && action.photos.length > 0">
                <h5 class="font-medium text-yellow-800 dark:text-yellow-200 mb-2 text-xs sm:text-sm">📸 Evidence Photos</h5>
                <div class="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  <div v-for="(photo, photoIndex) in action.photos" :key="photo.id" class="relative cursor-pointer hover:opacity-80 transition-opacity">
                    <img
                      :src="photo.url || photo.file_path"
                      :alt="`Action photo ${photoIndex + 1}`"
                      class="w-full h-12 sm:h-16 object-cover rounded border border-gray-300 dark:border-gray-600"
                      @click="handleActionPhotoClick(action.photos, photoIndex)"
                    />
                    <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-[8px] sm:text-[10px] p-0.5 text-center">
                      {{ photoIndex + 1 }}
                    </div>
                  </div>
                </div>
                <div class="mt-1 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
                  {{ action.photos.length }} evidence photo{{ action.photos.length !== 1 ? 's' : '' }}
                </div>
              </div>

              <!-- Verification Section: Shows status, button, or form -->

              <!-- State 1: Verification view - Always show if any verification fields found AND form is not open -->
              <div v-if="(action.verified_by || action.verification_date || action.verification_notes) && !showVerificationForm[action.id]" class="mt-2 pt-2 border-t -mx-3 sm:-mx-4 px-3 sm:px-4 pb-3 sm:pb-4 rounded-lg" :class="action.verification_result === false ? 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20' : 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20'">
                <div class="flex items-center justify-between mb-2">
                  <h4 :class="action.verification_result === false ? 'text-red-900 dark:text-red-100' : 'text-green-900 dark:text-green-100'" class="font-medium text-sm sm:text-base">
                    {{ action.verification_result === false ? '❌ Rejected' : '✅ Verified' }}
                  </h4>
                  <Button
                    v-if="canEditVerification(action)"
                    @click="handleEditVerification(action)"
                    variant="outline"
                    size="sm"
                    class="text-xs"
                  >
                    ✏️ Edit
                  </Button>
                </div>

                <p v-if="action.verification_date" class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {{ action.verification_result === false ? 'Rejected' : 'Verified' }} on: {{ formatDateTime(action.verification_date) }}
                  <span v-if="!canEditVerification(action)" class="text-red-600 dark:text-red-400"> (Edit period expired)</span>
                </p>
                <p v-else class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {{ action.verification_result === false ? 'Rejected' : 'Verified' }} (verification date not recorded)
                </p>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div v-if="action.verified_by">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">By: </span>
                    <span class="text-base text-gray-900 dark:text-white font-medium">{{ getVerifierName(action) }}</span>
                  </div>
                  <div v-else>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">By: </span>
                    <span class="text-base text-gray-500 dark:text-gray-400 italic">Not recorded</span>
                  </div>
                </div>

                <div v-if="action.verification_notes" class="mt-4">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Notes: </span>
                  <div class="text-base text-gray-900 dark:text-white mt-1">{{ action.verification_notes }}</div>
                </div>

                <div v-if="action.verification_photos && action.verification_photos.length > 0" class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h5 class="font-medium text-gray-800 dark:text-gray-200 mb-3 text-sm sm:text-base">📸 Verification Photos</h5>
                  <div class="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    <div v-for="(photo, photoIndex) in action.verification_photos" :key="photo.id" class="relative cursor-pointer hover:opacity-80 transition-opacity">
                      <img :src="photo.url || photo.file_path" :alt="`Verification photo ${photoIndex + 1}`" class="w-full h-12 sm:h-16 object-cover rounded border border-gray-300 dark:border-gray-600" @click="handleVerificationPhotoClick(action.verification_photos, photoIndex)" />
                      <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-[8px] sm:text-[10px] p-0.5 text-center">
                        Verify {{ photoIndex + 1 }}
                      </div>
                    </div>
                  </div>
                  <div class="mt-1 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
                    {{ action.verification_photos.length }} verification photo{{ action.verification_photos.length !== 1 ? 's' : '' }}
                  </div>
                </div>
              </div>

              <!-- State 2: Start Verification Button -->
              <!-- Display if status is 'pending_verification' OR verification_result is null (not yet verified) -->
              <div v-if="(patrol.status === 'pending_verification' || action.verification_result === null) && !showVerificationForm[action.id]" class="mt-2 pt-2 border-t border-orange-200 dark:border-orange-700">
                <div class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-3 sm:p-4">
                  <div class="flex items-center justify-between">
                    <span class="text-orange-700 dark:text-orange-300 font-medium text-sm sm:text-base">⚠️ Verification Required</span>
                    <Button @click="handleStartVerification(action)" class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center space-x-2 text-sm">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span>Start Verification</span>
                    </Button>
                  </div>
                </div>
              </div>

              <!-- State 3: Verification form is open -->
              <div v-if="showVerificationForm[action.id]" class="mt-2 pt-2 border-t border-orange-200 dark:border-orange-700">
                <VerificationForm :action-id="action.id" :action="action" @approve="handleVerificationApprove(action, $event)" @reject="handleVerificationReject(action, $event)" @cancel="handleCancelVerification(action)" />
              </div>
            </div>
            </div>
          </div>
        </div>

        <!-- Add New Corrective Action Section -->
        <!-- Show if: (1) No corrective actions OR (2) Last action was rejected (verification_result = false) -->
        <div v-if="correctiveActions.length === 0 || (correctiveActions.length > 0 && correctiveActions[correctiveActions.length - 1].verification_result === false)" class="mt-4">
          <!-- Show empty state when form not open -->
          <div v-if="!showCorrectiveActionForm" class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 sm:p-8 text-center">
            <p v-if="correctiveActions.length > 0 && correctiveActions[correctiveActions.length - 1].verification_result === false" class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Previous corrective action was rejected. Please create a new corrective action.
            </p>
            <p v-else class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              No corrective actions have been created yet.
            </p>
            <Button @click="handleAddAction" variant="primary" size="md" class="inline-flex items-center">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>📋 Add Corrective Action</span>
            </Button>
          </div>

          <!-- Corrective Action Form (shown when Add button is clicked) -->
          <CorrectiveActionForm
            v-else
            :patrol-id="patrol.id"
            :action="editingAction"
            @submit="handleCorrectiveActionSubmit"
            @cancel="handleCorrectiveActionCancel"
          />
        </div>
      </div>
    </div>

    <!-- Photo Viewer Modal -->
    <Teleport to="body">
      <div v-if="showPhotoViewer" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90" @click="closePhotoViewer">
        <!-- Close Button -->
        <button 
          @click="closePhotoViewer"
          class="absolute top-4 right-4 z-10 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          aria-label="Close"
        >
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Photo Counter -->
        <div class="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 px-4 py-2 bg-black bg-opacity-50 text-white rounded-full text-sm">
          {{ currentPhotoIndex + 1 }} / {{ currentPhotoList.length }}
        </div>

        <!-- Previous Button -->
        <button 
          v-if="currentPhotoIndex > 0"
          @click.stop="previousPhoto"
          class="absolute left-4 z-10 p-3 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          aria-label="Previous"
        >
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <!-- Photo Container -->
        <div class="relative max-w-7xl max-h-screen px-16 py-16" @click.stop>
          <img
            :src="currentPhotoList[currentPhotoIndex]?.url || currentPhotoList[currentPhotoIndex]?.file_path"
            :alt="`Photo ${currentPhotoIndex + 1}`"
            class="max-w-full max-h-full object-contain rounded"
          />
          
          <!-- Photo Info -->
          <div v-if="currentPhotoList[currentPhotoIndex]?.caption || currentPhotoList[currentPhotoIndex]?.file_name" 
               class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-4 rounded-b">
            <p v-if="currentPhotoList[currentPhotoIndex]?.caption" class="text-sm mb-1">
              {{ currentPhotoList[currentPhotoIndex].caption }}
            </p>
            <p class="text-xs text-gray-300">
              {{ currentPhotoList[currentPhotoIndex].file_name }}
            </p>
          </div>
        </div>

        <!-- Next Button -->
        <button 
          v-if="currentPhotoIndex < currentPhotoList.length - 1"
          @click.stop="nextPhoto"
          class="absolute right-4 z-10 p-3 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          aria-label="Next"
        >
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <!-- Keyboard Hints -->
        <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-xs opacity-75">
          <span class="inline-flex items-center gap-2 mr-4">
            <kbd class="px-2 py-1 bg-white bg-opacity-20 rounded">←</kbd>
            <span>Previous</span>
          </span>
          <span class="inline-flex items-center gap-2 mr-4">
            <kbd class="px-2 py-1 bg-white bg-opacity-20 rounded">→</kbd>
            <span>Next</span>
          </span>
          <span class="inline-flex items-center gap-2">
            <kbd class="px-2 py-1 bg-white bg-opacity-20 rounded">ESC</kbd>
            <span>Close</span>
          </span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { patrolService } from '@/services/patrolService'
import { useAuthStore } from '@/stores/authStore'
import { storeToRefs } from 'pinia'
import Button from '@/components/ui/Button.vue'
import CorrectiveActionForm from '@/features/patrol/components/CorrectiveActionForm.vue'
import VerificationForm from '@/features/patrol/components/VerificationForm.vue'
import { format, parseISO } from 'date-fns'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { user, userId } = storeToRefs(authStore)

const patrol = ref<any>(null)
const photos = ref<any[]>([])
const correctiveActions = ref<any[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const showCorrectiveActionForm = ref(false)
const editingAction = ref<any>(null)
const showVerificationForm = ref<Record<string, boolean>>({}) // Use an object to track form visibility per action

// Photo viewer state
const showPhotoViewer = ref(false)
const currentPhotoUrl = ref('')
const currentPhotoIndex = ref(0)
const currentPhotoList = ref<any[]>([])

const patrolId = route.params.id as string

const canEdit = computed(() => {
  if (!patrol.value) return false
  const createdAt = new Date(patrol.value.created_at)
  const now = new Date()
  const diffInMinutes = (now.getTime() - createdAt.getTime()) / 60000
  return diffInMinutes <= 60
})

const canEditAction = (action: any) => {
  // Allow edit if within 60 minutes of creation
  const createdAt = new Date(action.created_at)
  const now = new Date()
  const diffInMinutes = (now.getTime() - createdAt.getTime()) / 60000
  return diffInMinutes <= 60
}

const canEditVerification = (action: any) => {
  if (!userId.value || userId.value !== action.verified_by) {
    return false
  }
  const verificationDate = new Date(action.verification_date)
  const now = new Date()
  const diffInMinutes = (now.getTime() - verificationDate.getTime()) / 60000
  return diffInMinutes <= 60
}

const handleEditVerification = (action: any) => {
  showVerificationForm.value[action.id] = true
}

const getPatrolTypeDisplay = (type: string) => {
  const typeMap: Record<string, string> = {
    'scheduled': 'Scheduled Patrol',
    'random': 'Random Patrol',
    'incident_followup': 'Incident Follow-up'
  }
  return typeMap[type] || type
}

const getRiskLevelClass = (level: string) => {
  const classMap: Record<string, string> = {
    'low': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'high': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'extremely_high': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }
  return classMap[level] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
}

const getRiskLevelEmoji = (level: string) => {
  const emojiMap: Record<string, string> = {
    'low': '✅',
    'medium': '⚠️',
    'high': '🔴',
    'extremely_high': '🚨'
  }
  return emojiMap[level] || '❓'
}

const getRiskLevelLabel = (level: string) => {
  const labelMap: Record<string, string> = {
    'low': 'Low Risk',
    'medium': 'Medium Risk',
    'high': 'High Risk',
    'extremely_high': 'Extremely High Risk'
  }
  return labelMap[level] || level
}

const getVerifierName = (action: any) => {
  // Assuming you have a way to get the verifier's name from their ID
  // This might involve a lookup in a users store or another service
  return action.verified_by_name || 'Unknown Verifier'
}

const fetchPatrolDetails = async () => {
  try {
    loading.value = true
    const patrolData = await patrolService.getById(patrolId)
    patrol.value = patrolData
    
    const photoData = await patrolService.getPhotos(patrolId)
    photos.value = photoData.map((p: any) => ({ ...p, type: 'patrol' }))

    const actionData = await patrolService.getActions(patrolId)
    correctiveActions.value = actionData.map((action: any) => {
      // Initialize verification form state for each action
      showVerificationForm.value[action.id] = false
      return {
        ...action,
        verification_photos: action.verification_photos.map((p: any) => ({ ...p, type: 'verification' })),
        photos: action.photos.map((p: any) => ({ ...p, type: 'action' }))
      }
    })

  } catch (err) {
    console.error('Error fetching patrol details:', err)
    error.value = 'Failed to load patrol details. Please try again.'
    alert(error.value)
  } finally {
    loading.value = false
  }
}

const handleEdit = () => {
  router.push({ name: 'patrol-edit', params: { id: patrolId } })
}

const showEditExpiredAlert = () => {
  alert('Edit period expired. You can no longer edit this patrol report.')
}

const handleAddAction = () => {
  editingAction.value = null
  showCorrectiveActionForm.value = true
}

const handleEditAction = (action: any) => {
  editingAction.value = action
  showCorrectiveActionForm.value = true
}

const handleCorrectiveActionCancel = () => {
  showCorrectiveActionForm.value = false
  editingAction.value = null
}

const handleStartVerification = (action: any) => {
  showVerificationForm.value[action.id] = true
}

const handleCancelVerification = (action: any) => {
  showVerificationForm.value[action.id] = false
}

const handleCorrectiveActionSubmit = async (formData: any) => {
  try {
    loading.value = true
    
    console.log('🔍 handleCorrectiveActionSubmit - formData:', formData)
    console.log('🔍 handleCorrectiveActionSubmit - userId.value:', userId.value)
    
    // Check if editing or creating
    if (formData.id) {
      // Update existing action
      const { id, photos, removedPhotoIds, ...updateFields } = formData
      await patrolService.updateCorrectiveAction(id, updateFields)
      
      // Delete removed photos if any
      if (removedPhotoIds && removedPhotoIds.length > 0) {
        await patrolService.deleteActionPhotos(removedPhotoIds)
      }
      
      // Upload new photos if any
      if (photos && photos.length > 0) {
        const createdBy = userId.value
        if (!createdBy) {
          console.warn('⚠️ No user ID for photo upload, but continuing...')
        }
        await patrolService.uploadActionPhotos(patrol.value.id, id, photos, createdBy || undefined)
      }
    } else {
      // Create new action
      // Get user ID from authStore
      const currentUserId = userId.value
      
      if (!currentUserId) {
        console.error('❌ No user ID found. User object:', user.value)
        alert('User not authenticated. Please log in again.')
        return
      }
      
      // Create the corrective action (assigned_to will be set to current user)
      await patrolService.createAction(patrol.value.id, formData, currentUserId)
      
      // Update patrol status to 'pending_verification'
      await patrolService.update(patrol.value.id, { status: 'pending_verification' })
    }

    // Refetch details to show the updated/new action and updated status
    await fetchPatrolDetails()
    
    showCorrectiveActionForm.value = false
    editingAction.value = null
    alert(formData.id ? 'Corrective action updated successfully!' : 'Corrective action created and patrol status updated.')
  } catch (err) {
    console.error('Error submitting corrective action:', err)
    alert('Failed to submit corrective action.')
  } finally {
    loading.value = false
  }
}

const handleVerificationApprove = async (action: any, verificationData: any) => {
  try {
    loading.value = true
    
    // Get user ID from authStore user (which comes from users table)
    const currentUserId = userId.value
    
    console.log('🔍 Verification Approve - User:', user.value)
    console.log('🔍 Verification Approve - User ID:', currentUserId)
    
    if (!currentUserId) {
      alert('Error: No user ID found. Please make sure you are logged in.')
      return
    }
    
    const updatePayload = {
      verification_notes: verificationData.review_description || '',
      verified_by: currentUserId,
      verification_date: new Date().toISOString(),
      verification_result: true  // Approved
    }
    
    console.log('📤 Sending update payload:', updatePayload)

    // Delete removed photos if any
    if (verificationData.removedPhotoIds && verificationData.removedPhotoIds.length > 0) {
      await patrolService.deleteActionPhotos(verificationData.removedPhotoIds)
    }

    // Upload photos if any
    if (verificationData.photos && verificationData.photos.length > 0) {
      await patrolService.uploadVerificationPhotos(action.id, verificationData.photos)
    }
    
    // Update the corrective action
    await patrolService.updateCorrectiveAction(action.id, updatePayload)
    
    // Update the patrol status to 'closed'
    await patrolService.update(patrol.value.id, { status: 'closed' })
    
    // Refetch details
    await fetchPatrolDetails()
    
    showVerificationForm.value[action.id] = false
    alert('Verification approved. The corrective action has been marked as verified and the patrol is now closed.')
  } catch (err) {
    console.error('Error approving verification:', err)
    alert('Failed to approve verification.')
  } finally {
    loading.value = false
  }
}

const handleVerificationReject = async (action: any, verificationData: any) => {
  try {
    loading.value = true
    
    // Get user ID from authStore user (which comes from users table)
    const currentUserId = userId.value
    
    console.log('🔍 Verification Reject - User:', user.value)
    console.log('🔍 Verification Reject - User ID:', currentUserId)
    
    if (!currentUserId) {
      alert('Error: No user ID found. Please make sure you are logged in.')
      return
    }
    
    const updatePayload = {
      // Keep verification data to track who rejected and when
      verified_by: currentUserId,
      verification_date: new Date().toISOString(),
      // Store rejection reason
      verification_notes: verificationData.review_description || '',
      verification_result: false  // Rejected
    }
    
    console.log('📤 Sending update payload:', updatePayload)

    // Delete removed photos if any
    if (verificationData.removedPhotoIds && verificationData.removedPhotoIds.length > 0) {
      await patrolService.deleteActionPhotos(verificationData.removedPhotoIds)
    }

    // Upload rejection photos if any
    if (verificationData.photos && verificationData.photos.length > 0) {
      await patrolService.uploadVerificationPhotos(action.id, verificationData.photos)
    }

    // Update the corrective action with rejection details
    await patrolService.updateCorrectiveAction(action.id, updatePayload)
    
    // Update the patrol status to 'rejected'
    await patrolService.update(patrol.value.id, { status: 'rejected' })
    
    // Refetch details to reflect the rejection
    await fetchPatrolDetails()
    
    showVerificationForm.value[action.id] = false
    alert('Verification rejected. The corrective action has been rejected.')
  } catch (err) {
    console.error('Error rejecting verification:', err)
    alert('Failed to reject verification.')
  } finally {
    loading.value = false
  }
}

// Photo Viewer Functions
const openPhotoViewer = (photos: any[], index: number) => {
  currentPhotoList.value = photos
  currentPhotoIndex.value = index
  currentPhotoUrl.value = photos[index].url || photos[index].file_path
  showPhotoViewer.value = true
}

const closePhotoViewer = () => {
  showPhotoViewer.value = false
}

const nextPhoto = () => {
  currentPhotoIndex.value = (currentPhotoIndex.value + 1) % currentPhotoList.value.length
  currentPhotoUrl.value = currentPhotoList.value[currentPhotoIndex.value].url || currentPhotoList.value[currentPhotoIndex.value].file_path
}

const previousPhoto = () => {
  currentPhotoIndex.value = (currentPhotoIndex.value - 1 + currentPhotoList.value.length) % currentPhotoList.value.length
  currentPhotoUrl.value = currentPhotoList.value[currentPhotoIndex.value].url || currentPhotoList.value[currentPhotoIndex.value].file_path
}

const handlePatrolPhotoClick = (index: number) => {
  openPhotoViewer(photos.value, index)
}

const handleActionPhotoClick = (actionPhotos: any[], index: number) => {
  openPhotoViewer(actionPhotos, index)
}

const handleVerificationPhotoClick = (verificationPhotos: any[], index: number) => {
  openPhotoViewer(verificationPhotos, index)
}

const handleImageError = (event: any, photo: any) => {
  console.error('Failed to load image:', photo)
  event.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage Error%3C/text%3E%3C/svg%3E'
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (showPhotoViewer.value) {
    if (event.key === 'Escape') {
      closePhotoViewer()
    } else if (event.key === 'ArrowRight') {
      nextPhoto()
    } else if (event.key === 'ArrowLeft') {
      previousPhoto()
    }
  }
}

const formatDateTime = (dateTimeString: string) => {
  if (!dateTimeString) return 'N/A'
  try {
    return format(parseISO(dateTimeString), 'dd MMM yyyy, hh:mm a')
  } catch (e) {
    return 'Invalid Date'
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  try {
    // Assuming dateString is in 'yyyy-MM-dd' format
    return format(parseISO(`${dateString}T00:00:00`), 'dd MMM yyyy')
  } catch (e) {
    return 'Invalid Date'
  }
}

onMounted(() => {
  fetchPatrolDetails()
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

watch(() => route.params.id, (newId) => {
  if (newId) {
    fetchPatrolDetails()
  }
})
</script>

<style scoped>
/* Add any specific styles if needed */
.whitespace-pre-wrap {
  white-space: pre-wrap;
}
</style>
