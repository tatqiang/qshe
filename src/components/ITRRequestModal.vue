<template>
  <!-- Loading Overlay -->
  <LoadingOverlay
    :show="isSubmitting"
    title="Submitting ITR"
    :message="submitMessage"
  />
  
  <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content itr-modal">
      <div class="modal-header">
        <h3 class="text-xl font-bold">{{ editITR ? 'Edit ITR' : 'Request Inspection (ITR)' }}</h3>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <!-- Task Information (Read-only) -->
          <div class="section-title">Task Information</div>
          <div class="form-grid">
            <div class="form-field">
              <label>Task Name</label>
              <input type="text" :value="task?.name || editITR?.task?.name || ''" disabled class="input-disabled">
            </div>
            <div class="form-field">
              <label>Task ID</label>
              <input type="text" :value="task?.taskId || editITR?.task?.taskId || ''" disabled class="input-disabled">
            </div>
          </div>

          <!-- ITR Basic Information -->
          <div class="section-title">ITR Information</div>
          <div class="form-grid">
            <div class="form-field">
              <label>ITR No <span class="optional">(optional)</span></label>
              <input 
                v-model="formData.itrNo" 
                type="text" 
                placeholder="Enter ITR number"
                class="form-input"
                :disabled="!isEditMode"
              >
            </div>
            <div class="form-field full-width">
              <label>ITR Title <span class="required">*</span></label>
              <input 
                v-model="formData.itrTitle" 
                type="text" 
                placeholder="Enter ITR title"
                class="form-input"
                :disabled="!isEditMode"
                required
              >
            </div>
          </div>

          <!-- System and Type -->
          <div class="form-grid">
            <div class="form-field">
              <label>System <span class="required">*</span></label>
              <select v-model="formData.systemId" class="form-select" :disabled="!isEditMode" required>
                <option :value="null">-- Select System --</option>
                <option v-for="system in systems" :key="system.id" :value="system.id">
                  {{ system.systemCode }} - {{ system.description }}
                </option>
              </select>
            </div>
            <div class="form-field">
              <label>ITR Type <span class="required">*</span></label>
              <select v-model="formData.itrTypeId" class="form-select" :disabled="!isEditMode" required>
                <option :value="null">-- Select Type --</option>
                <option v-for="type in itrTypes" :key="type.id" :value="type.id">
                  {{ type.typeName }}
                </option>
              </select>
            </div>
          </div>

          <!-- ITP Reference -->
          <div class="section-title">ITP Reference</div>
          <div class="form-field">
            <label>ITP No</label>
            <div class="autocomplete-wrapper">
              <input 
                v-model="itpSearch"
                @input="searchITP"
                @focus="searchITP"
                type="text" 
                placeholder="Search or enter ITP number"
                class="form-input"
                :disabled="!isEditMode"
              >
              <div v-if="showItpDropdown && filteredITPDocs.length > 0" class="autocomplete-dropdown">
                <div 
                  v-for="doc in filteredITPDocs" 
                  :key="doc.docNo"
                  @click="selectITP(doc)"
                  class="autocomplete-item"
                >
                  <div class="doc-no">{{ doc.docNo }}</div>
                  <div class="doc-title">{{ doc.title }}</div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="formData.itpDocNo" class="form-field full-width">
            <label>ITP Title</label>
            <input 
              v-model="formData.itpTitle" 
              type="text" 
              class="input-disabled"
              disabled
            >
          </div>

          <!-- Location -->
          <div class="section-title">Location</div>
          <div class="form-field">
            <label>Main Area <span class="required">*</span></label>
            <select v-model="formData.mainAreaId" class="form-select" :disabled="!isEditMode" required>
              <option :value="null">-- Select Main Area --</option>
              <option v-for="area in mainAreas" :key="area.id" :value="area.id">
                {{ area.mainAreaName }}
              </option>
            </select>
          </div>
          
          <div class="form-field">
            <label>Sub Area 1</label>
            <div class="helper-text">(e.g., Floor 2, Office Wing) - Optional - Requires Main Area</div>
            <div class="autocomplete-wrapper">
              <input
                v-model="subArea1Search"
                type="text"
                placeholder="Type to search or create..."
                class="form-input"
                :disabled="!formData.mainAreaId || !isEditMode"
                @input="handleSubArea1Search"
                @focus="showSubArea1Dropdown = true"
                @blur="hideSubArea1Dropdown"
              />
              <div v-if="showSubArea1Dropdown && formData.mainAreaId" class="autocomplete-dropdown">
                <!-- Create new option -->
                <div 
                  v-if="subArea1Search.trim()"
                  class="autocomplete-item create-item"
                  @mousedown.prevent="createNewSubArea1"
                >
                  <span class="create-icon">+</span>
                  <span>Create "{{ subArea1Search.trim() }}"</span>
                </div>
                <!-- Existing sub areas -->
                <div
                  v-for="subArea in filteredSubArea1List"
                  :key="subArea.id"
                  class="autocomplete-item"
                  @mousedown.prevent="selectSubArea1(subArea)"
                >
                  {{ subArea.subArea1Name }}
                </div>
                <div v-if="!subArea1Search.trim() && filteredSubArea1List.length === 0" class="autocomplete-empty">
                  No sub areas yet. Type to create one.
                </div>
              </div>
            </div>
          </div>

          <div class="form-field">
            <label>Sub Area 2</label>
            <div class="helper-text">(e.g., Room 201, Workstation A) - Optional - Requires Sub Area 1</div>
            <div class="autocomplete-wrapper">
              <input
                v-model="subArea2Search"
                type="text"
                placeholder="Type to search or create..."
                class="form-input"
                :disabled="!formData.subArea1Id || !isEditMode"
                @input="handleSubArea2Search"
                @focus="showSubArea2Dropdown = true"
                @blur="hideSubArea2Dropdown"
              />
              <div v-if="showSubArea2Dropdown && formData.subArea1Id" class="autocomplete-dropdown">
                <!-- Create new option -->
                <div 
                  v-if="subArea2Search.trim()"
                  class="autocomplete-item create-item"
                  @mousedown.prevent="createNewSubArea2"
                >
                  <span class="create-icon">+</span>
                  <span>Create "{{ subArea2Search.trim() }}"</span>
                </div>
                <!-- Existing sub area 2s -->
                <div
                  v-for="subArea in filteredSubArea2List"
                  :key="subArea.id"
                  class="autocomplete-item"
                  @mousedown.prevent="selectSubArea2(subArea)"
                >
                  {{ subArea.subArea2Name }}
                </div>
                <div v-if="!subArea2Search.trim() && filteredSubArea2List.length === 0" class="autocomplete-empty">
                  No sub areas yet. Type to create one.
                </div>
              </div>
            </div>
          </div>
          <div class="form-field full-width">
            <label>Location Detail</label>
            <input 
              v-model="formData.locationDetail" 
              type="text" 
              placeholder="Specific location details"
              class="form-input"
              :disabled="!isEditMode"
            >
          </div>

          <!-- Drawing & Material Reference -->
          <div class="section-title">Drawing & Material Reference</div>
          <div class="form-field full-width">
            <label>Drawing No</label>
            <input 
              v-model="formData.drawingNo" 
              type="text" 
              placeholder="Enter drawing number"
              class="form-input"
              :disabled="!isEditMode"
            >
          </div>
          
          <!-- Drawing Attachment -->
          <div class="form-field full-width attachment-section">
            <div class="attachment-header">
              <label>Drawing</label>
              <label v-if="isEditMode" class="choose-files-btn">
                <input 
                  @change="handleAttachmentUpload($event, 'drawing')"
                  type="file" 
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  class="file-input-hidden"
                >
                Choose Files
              </label>
            </div>
            <div v-if="displayAttachments('drawing').length > 0" class="file-list-box">
              <div v-for="(att, idx) in displayAttachments('drawing')" :key="idx" class="file-item">
                <span class="file-icon">📄</span>
                <span 
                  @click="(att.isNew && 'file' in att) ? previewFile(att.file) : previewExistingFile(att)" 
                  class="file-name-clickable"
                >
                  {{ att.fileName }}
                </span>
                <button 
                  v-if="isEditMode" 
                  type="button" 
                  @click="removeAttachment('drawing', idx)" 
                  class="remove-btn"
                >×</button>
              </div>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-field">
              <label>Material No</label>
              <div class="autocomplete-wrapper">
                <input 
                  v-model="materialSearch"
                  @input="searchMaterial"
                  @focus="searchMaterial"
                  type="text" 
                  placeholder="Search or enter material number"
                  class="form-input"
                  :disabled="!isEditMode"
                >
                <div v-if="showMaterialDropdown && filteredMaterialDocs.length > 0" class="autocomplete-dropdown">
                  <div 
                    v-for="doc in filteredMaterialDocs" 
                    :key="doc.docNo"
                    @click="selectMaterial(doc)"
                    class="autocomplete-item"
                  >
                    <div class="doc-no">{{ doc.docNo }}</div>
                    <div class="doc-title">{{ doc.title }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="formData.materialDocNo" class="form-field full-width">
            <label>Material Title</label>
            <input 
              v-model="formData.materialTitle" 
              type="text" 
              class="input-disabled"
              disabled
            >
          </div>

          <!-- DO (Delivery Order) Attachment -->
          <div class="form-field full-width attachment-section">
            <div class="attachment-header">
              <label>DO (Delivery Order)</label>
              <label v-if="isEditMode" class="choose-files-btn">
                <input 
                  @change="handleAttachmentUpload($event, 'delivery_order')"
                  type="file" 
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  class="file-input-hidden"
                >
                Choose Files
              </label>
            </div>
            <div v-if="displayAttachments('delivery_order').length > 0" class="file-list-box">
              <div v-for="(att, idx) in displayAttachments('delivery_order')" :key="idx" class="file-item">
                <span class="file-icon">📄</span>
                <span 
                  @click="(att.isNew && 'file' in att) ? previewFile(att.file) : previewExistingFile(att)" 
                  class="file-name-clickable"
                >
                  {{ att.fileName }}
                </span>
                <button 
                  v-if="isEditMode" 
                  type="button" 
                  @click="removeAttachment('delivery_order', idx)" 
                  class="remove-btn"
                >×</button>
              </div>
            </div>
          </div>

          <!-- Note -->
          <div class="form-field full-width">
            <label>Note</label>
            <textarea 
              v-model="formData.note" 
              rows="3"
              placeholder="Additional notes or comments"
              class="form-input"
              :disabled="!isEditMode"
            ></textarea>
          </div>

          <!-- Image Attachment -->
          <div class="form-field full-width attachment-section">
            <div class="attachment-header">
              <label>Image</label>
              <label v-if="isEditMode" class="choose-files-btn">
                <input 
                  @change="handleAttachmentUpload($event, 'photo')"
                  type="file" 
                  accept="image/*"
                  multiple
                  class="file-input-hidden"
                >
                Choose Files
              </label>
            </div>
            <div v-if="displayAttachments('photo').length > 0" class="file-list-box">
              <div v-for="(att, idx) in displayAttachments('photo')" :key="idx" class="file-item">
                <span class="file-icon">📄</span>
                <span 
                  @click="(att.isNew && 'file' in att) ? previewFile(att.file) : previewExistingFile(att)" 
                  class="file-name-clickable"
                >
                  {{ att.fileName }}
                </span>
                <button 
                  v-if="isEditMode" 
                  type="button" 
                  @click="removeAttachment('photo', idx)" 
                  class="remove-btn"
                >×</button>
              </div>
            </div>
          </div>

          <!-- Submit Buttons -->
          <div class="form-actions">
            <button type="button" @click="$emit('close')" class="btn-cancel">
              Cancel
            </button>
            <template v-if="editITR && !isEditMode">
              <!-- View Mode: Show Edit button -->
              <button type="button" @click="isEditMode = true" class="btn-primary-action">
                Edit
              </button>
            </template>
            <template v-else-if="editITR && isEditMode">
              <!-- Edit Mode: Show Save Changes -->
              <button type="submit" class="btn-submit">
                Save Changes
              </button>
            </template>
            <template v-else>
              <!-- Create Mode: Show Draft and Submit -->
              <button type="button" @click="saveAsDraft" class="btn-draft">
                Save as Draft
              </button>
              <button type="submit" class="btn-submit">
                Submit ITR
              </button>
            </template>
          </div>
        </form>
      </div>
    </div>

    <!-- File Preview Modal -->
    <div v-if="showPreviewModal" class="preview-modal-overlay" @click.self="closePreviewModal">
      <div class="preview-modal-content">
        <div class="preview-modal-header">
          <h3>{{ previewFileName }}</h3>
          <button @click="closePreviewModal" class="preview-close-btn">&times;</button>
        </div>
        <div class="preview-modal-body">
          <iframe 
            v-if="previewFileType === 'pdf'" 
            :src="previewFileUrl" 
            class="preview-iframe"
          ></iframe>
          <img 
            v-else 
            :src="previewFileUrl" 
            :alt="previewFileName"
            class="preview-image"
          />
        </div>
        <div class="preview-modal-footer">
          <a :href="previewFileUrl" :download="previewFileName" class="btn-download">
            Download
          </a>
          <button @click="closePreviewModal" class="btn-close-preview">Close</button>
        </div>
      </div>
    </div>

    <!-- Create Sub Area Confirmation Modal -->
    <div v-if="showCreateConfirmModal" class="confirmation-modal-overlay" @click.self="cancelCreateSubArea">
      <div class="confirmation-modal-content">
        <div class="confirmation-modal-header">
          <h3>Create New {{ createType === 'subArea1' ? 'Sub Area 1' : 'Sub Area 2' }}</h3>
          <button @click="cancelCreateSubArea" class="modal-close-btn">&times;</button>
        </div>
        <div class="confirmation-modal-body">
          <p class="confirmation-message">
            Enter the name for the new {{ createType === 'subArea1' ? 'Sub Area 1' : 'Sub Area 2' }}:
          </p>
          <input 
            v-model="newSubAreaName" 
            type="text" 
            :placeholder="createType === 'subArea1' ? 'e.g., Floor 2, Office Wing' : 'e.g., Room 201, Workstation A'"
            class="form-input"
            @keyup.enter="confirmCreateSubArea"
            autofocus
          >
          <p class="code-preview" v-if="newSubAreaName.trim()">
            Code will be: <strong>{{ newSubAreaName.trim() }}</strong>
          </p>
        </div>
        <div class="confirmation-modal-footer">
          <button @click="cancelCreateSubArea" class="btn-cancel">Cancel</button>
          <button @click="confirmCreateSubArea" class="btn-confirm">Create</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import LoadingOverlay from '@/components/ui/LoadingOverlay.vue'
import type { 
  ConstructionTask, 
  MainArea, 
  SubArea1,
  ConstructionSystem,
  ITRType,
  ITPDocument,
  MaterialDocument,
  ConstructionITR
} from '@/types/construction-project'
import { constructionITRService } from '@/services/constructionITRService'

interface Props {
  isOpen: boolean
  task: ConstructionTask | null
  projectId: string
  mainAreas: MainArea[]
  subAreasMap: Map<string, SubArea1[]>
  editITR?: ConstructionITR | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  submit: [data: any]
  update: [id: string, data: any]
}>()

// Form data
const formData = ref({
  itrNo: '',
  itrTitle: '',
  systemId: null as string | null,
  itrTypeId: null as string | null,
  itpNo: '',
  itpDocNo: '',
  itpTitle: '',
  mainAreaId: null as string | null,
  subArea1Id: null as string | null,
  subArea2Id: null as string | null,
  locationDetail: '',
  drawingNo: '',
  drawingFileUrl: '',
  materialNo: '',
  materialDocNo: '',
  materialTitle: '',
  note: ''
})

// Reference data
const systems = ref<ConstructionSystem[]>([])
const itrTypes = ref<ITRType[]>([])
const itpDocs = ref<ITPDocument[]>([])
const materialDocs = ref<MaterialDocument[]>([])

// Autocomplete
const itpSearch = ref('')
const materialSearch = ref('')
const showItpDropdown = ref(false)
const showMaterialDropdown = ref(false)
const filteredITPDocs = ref<ITPDocument[]>([])
const filteredMaterialDocs = ref<MaterialDocument[]>([])

// File upload
const uploadProgress = ref(0)

// Attachments - multiple files per type
type AttachmentType = 'drawing' | 'delivery_order' | 'photo'
interface AttachmentFile {
  type: AttachmentType
  file: File
  name: string
}
const attachments = ref<AttachmentFile[]>([])

// Submission state
const isSubmitting = ref(false)
const submitMessage = ref('Please wait while we create your ITR...')

// View/Edit mode
const isEditMode = ref(false)

// Sub Area 2 data
interface SubArea2 {
  id: string
  subArea2Name: string
  subArea1Id: string
}
const subArea2Map = ref<Map<string, SubArea2[]>>(new Map())

// Sub Area search and filtering
const subArea1Search = ref('')
const subArea2Search = ref('')
const showSubArea1Dropdown = ref(false)
const showSubArea2Dropdown = ref(false)

const filteredSubArea1List = computed(() => {
  if (!formData.value.mainAreaId) return []
  const subAreas = props.subAreasMap.get(formData.value.mainAreaId) || []
  if (!subArea1Search.value.trim()) return subAreas
  
  const search = subArea1Search.value.toLowerCase()
  return subAreas.filter(sa => 
    sa.subArea1Name.toLowerCase().includes(search)
  )
})

const filteredSubArea2List = computed(() => {
  if (!formData.value.subArea1Id) return []
  const subAreas = subArea2Map.value.get(formData.value.subArea1Id) || []
  if (!subArea2Search.value.trim()) return subAreas
  
  const search = subArea2Search.value.toLowerCase()
  return subAreas.filter(sa => 
    sa.subArea2Name.toLowerCase().includes(search)
  )
})

// Confirmation modal for creating new sub areas
const showCreateConfirmModal = ref(false)
const createType = ref<'subArea1' | 'subArea2'>('subArea1')
const newSubAreaName = ref('')

// Handle Sub Area 1 search
const handleSubArea1Search = () => {
  showSubArea1Dropdown.value = true
}

const hideSubArea1Dropdown = () => {
  setTimeout(() => {
    showSubArea1Dropdown.value = false
  }, 200)
}

// Select existing Sub Area 1
const selectSubArea1 = (subArea: SubArea1) => {
  formData.value.subArea1Id = subArea.id
  subArea1Search.value = subArea.subArea1Name
  showSubArea1Dropdown.value = false
  // Clear sub area 2
  formData.value.subArea2Id = null
  subArea2Search.value = ''
}

// Create new Sub Area 1
const createNewSubArea1 = () => {
  if (!subArea1Search.value.trim()) return
  createType.value = 'subArea1'
  newSubAreaName.value = subArea1Search.value.trim()
  showCreateConfirmModal.value = true
  showSubArea1Dropdown.value = false
}

// Handle Sub Area 2 search
const handleSubArea2Search = () => {
  showSubArea2Dropdown.value = true
}

const hideSubArea2Dropdown = () => {
  setTimeout(() => {
    showSubArea2Dropdown.value = false
  }, 200)
}

// Select existing Sub Area 2
const selectSubArea2 = (subArea: SubArea2) => {
  formData.value.subArea2Id = subArea.id
  subArea2Search.value = subArea.subArea2Name
  showSubArea2Dropdown.value = false
}

// Create new Sub Area 2
const createNewSubArea2 = () => {
  if (!subArea2Search.value.trim()) return
  createType.value = 'subArea2'
  newSubAreaName.value = subArea2Search.value.trim()
  showCreateConfirmModal.value = true
  showSubArea2Dropdown.value = false
}

// Handle sub area selection change (kept for compatibility)
const handleSubArea1Change = (event: Event) => {
  // Clear sub area 2 when sub area 1 changes
  formData.value.subArea2Id = null
  subArea2Search.value = ''
}

const handleSubArea2Change = (event: Event) => {
  // Placeholder for future use
}

// File preview modal
const showPreviewModal = ref(false)
const previewFileUrl = ref('')
const previewFileType = ref<'pdf' | 'image'>('image')
const previewFileName = ref('')

// Preview file function
const previewFile = (file: File) => {
  const url = URL.createObjectURL(file)
  previewFileUrl.value = url
  previewFileName.value = file.name
  previewFileType.value = file.type === 'application/pdf' ? 'pdf' : 'image'
  showPreviewModal.value = true
}

// Preview existing file from database
const previewExistingFile = (attachment: any) => {
  previewFileUrl.value = attachment.fileUrl
  previewFileName.value = attachment.fileName
  previewFileType.value = attachment.mimeType === 'application/pdf' ? 'pdf' : 'image'
  showPreviewModal.value = true
}

// Close preview modal
const closePreviewModal = () => {
  showPreviewModal.value = false
  // Clean up blob URL if it was created
  if (previewFileUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewFileUrl.value)
  }
  previewFileUrl.value = ''
  previewFileName.value = ''
}

// Get attachments by type
const attachmentsByType = (type: AttachmentType) => {
  return attachments.value.filter(a => a.type === type).map(a => a.file)
}

// Get existing attachments by type (for view mode)
const existingAttachmentsByType = (type: string) => {
  return existingAttachments.value.filter(a => a.attachmentType === type)
}

// Get display attachments based on mode
const displayAttachments = (type: AttachmentType) => {
  // Map attachment types
  const typeMap: Record<AttachmentType, string> = {
    'drawing': 'drawing',
    'delivery_order': 'delivery_order',
    'photo': 'photo'
  }
  
  // Get existing saved attachments
  const existingFiles = existingAttachmentsByType(typeMap[type]).map(att => ({
    fileName: att.fileName,
    fileUrl: att.fileUrl,
    mimeType: att.mimeType,
    isNew: false
  }))
  
  // Get new attachments being added (only in edit mode)
  const newFiles = isEditMode.value ? attachmentsByType(type).map(file => ({
    fileName: file.name,
    file: file,
    isNew: true
  })) : []
  
  // Combine both lists
  return [...existingFiles, ...newFiles]
}

// Handle attachment upload
const handleAttachmentUpload = (event: Event, type: AttachmentType) => {
  const input = event.target as HTMLInputElement
  if (!input.files) return

  Array.from(input.files).forEach(file => {
    attachments.value.push({
      type,
      file,
      name: file.name
    })
  })

  // Clear input to allow re-selecting same file
  input.value = ''
}

// Remove attachment
const removeAttachment = (type: AttachmentType, index: number) => {
  const files = attachments.value.filter(a => a.type === type)
  const fileToRemove = files[index]
  if (fileToRemove) {
    const globalIndex = attachments.value.indexOf(fileToRemove)
    if (globalIndex > -1) {
      attachments.value.splice(globalIndex, 1)
    }
  }
}

// Confirm create new sub area
const confirmCreateSubArea = async () => {
  if (!newSubAreaName.value.trim()) {
    alert('Please enter a name')
    return
  }

  try {
    if (createType.value === 'subArea1') {
      if (!formData.value.mainAreaId) {
        alert('Please select a main area first')
        return
      }
      // Create new Sub Area 1
      const newSubArea: SubArea1 = {
        id: `temp-${Date.now()}`,
        mainAreaId: formData.value.mainAreaId,
        subArea1Name: newSubAreaName.value.trim(),
        subArea1Code: ''
      }
      // Add to the map
      const existing = props.subAreasMap.get(formData.value.mainAreaId) || []
      props.subAreasMap.set(formData.value.mainAreaId, [...existing, newSubArea])
      // Set as selected
      formData.value.subArea1Id = newSubArea.id
      subArea1Search.value = newSubArea.subArea1Name
      console.log('Created new Sub Area 1:', newSubArea)
    } else {
      if (!formData.value.subArea1Id) {
        alert('Please select a sub area 1 first')
        return
      }
      // Create new Sub Area 2
      const newSubArea: SubArea2 = {
        id: `temp-${Date.now()}`,
        subArea1Id: formData.value.subArea1Id,
        subArea2Name: newSubAreaName.value.trim()
      }
      // Add to the map
      const existing = subArea2Map.value.get(formData.value.subArea1Id) || []
      subArea2Map.value.set(formData.value.subArea1Id, [...existing, newSubArea])
      // Set as selected
      formData.value.subArea2Id = newSubArea.id
      subArea2Search.value = newSubArea.subArea2Name
      console.log('Created new Sub Area 2:', newSubArea)
    }
    
    // Close modal and reset
    showCreateConfirmModal.value = false
    newSubAreaName.value = ''
  } catch (error) {
    console.error('Error creating sub area:', error)
    alert('Failed to create sub area')
  }
}

// Cancel create sub area
const cancelCreateSubArea = () => {
  showCreateConfirmModal.value = false
  newSubAreaName.value = ''
}

// Computed
const filteredSubAreas = computed(() => {
  if (!formData.value.mainAreaId) return []
  return props.subAreasMap.get(formData.value.mainAreaId) || []
})

// Load reference data
const loadReferenceData = async () => {
  console.log('Loading reference data, projectId:', props.projectId)
  
  if (!props.projectId) {
    console.error('No projectId provided to ITRRequestModal')
    return
  }
  
  try {
    console.log('Loading systems and ITR types...')
    
    // Load systems and ITR types
    systems.value = await constructionITRService.getSystemsByProject(props.projectId)
    console.log('Loaded systems:', systems.value.length)
    
    itrTypes.value = await constructionITRService.getITRTypesByProject(props.projectId)
    console.log('Loaded ITR types:', itrTypes.value.length)
    
    // If no systems exist, seed default ones
    if (systems.value.length === 0) {
      console.log('No systems found, seeding defaults...')
      await constructionITRService.seedDefaultSystems(props.projectId)
      systems.value = await constructionITRService.getSystemsByProject(props.projectId)
      console.log('After seeding, systems count:', systems.value.length)
    }
    
    // If no ITR types exist, seed default ones
    if (itrTypes.value.length === 0) {
      console.log('No ITR types found, seeding defaults...')
      await constructionITRService.seedDefaultITRTypes(props.projectId)
      itrTypes.value = await constructionITRService.getITRTypesByProject(props.projectId)
      console.log('After seeding, ITR types count:', itrTypes.value.length)
    }
    
    // Load ITP and Material documents from Google Sheets
    console.log('Loading Google Sheets data...')
    try {
      itpDocs.value = await constructionITRService.fetchITPDocuments()
      materialDocs.value = await constructionITRService.fetchMaterialDocuments()
      console.log('Loaded ITP docs:', itpDocs.value.length, 'Material docs:', materialDocs.value.length)
    } catch (error) {
      console.warn('Could not load Google Sheets data (optional):', error)
      // Continue without Google Sheets data - these fields are optional
    }
  } catch (error) {
    console.error('Error loading reference data:', error)
  }
}

// Load existing attachments for edit mode
const existingAttachments = ref<any[]>([])
const loadExistingAttachments = async (itrId: string) => {
  try {
    existingAttachments.value = await constructionITRService.getAttachments(itrId)
    console.log('Loaded existing attachments:', existingAttachments.value.length)
  } catch (error) {
    console.error('Error loading attachments:', error)
  }
}

// Load data when modal opens and projectId is available
watch(() => [props.isOpen, props.projectId, props.task], ([isOpen, projectId, task]) => {
  if (isOpen && projectId) {
    console.log('Modal opened with projectId:', projectId)
    loadReferenceData()
    // Reset form only if not editing
    if (!props.editITR) {
      resetForm()
      // Prefill location from task after reset
      if (task && typeof task === 'object' && 'location' in task && task.location) {
        console.log('Prefilling location from task:', task.location)
        formData.value.mainAreaId = task.location.mainAreaId || null
        formData.value.subArea1Id = task.location.subArea1Id || null
        formData.value.locationDetail = task.location.locationDetail || ''
      }
    }
  }
}, { immediate: true })

// Reset form to initial state
const resetForm = () => {
  formData.value = {
    itrNo: '',
    itrTitle: '',
    systemId: null,
    itrTypeId: null,
    itpNo: '',
    itpDocNo: '',
    itpTitle: '',
    mainAreaId: null,
    subArea1Id: null,
    subArea2Id: null,
    locationDetail: '',
    drawingNo: '',
    drawingFileUrl: '',
    materialNo: '',
    materialDocNo: '',
    materialTitle: '',
    note: ''
  }
  attachments.value = []
  itpSearch.value = ''
  materialSearch.value = ''
}

// Update location when task changes (if modal already open)
watch(() => props.task, (task) => {
  if (task && !props.editITR && props.isOpen) {
    // Only prefill location data from task if modal is already open
    if (task.location) {
      console.log('Task changed - Updating location:', task.location)
      formData.value.mainAreaId = task.location.mainAreaId || null
      formData.value.subArea1Id = task.location.subArea1Id || null
      formData.value.locationDetail = task.location.locationDetail || ''
    }
  }
})

// Populate form when editing existing ITR
watch(() => props.editITR, (itr) => {
  if (itr) {
    // Start in view mode when editing existing ITR
    isEditMode.value = false
    formData.value = {
      itrNo: itr.itrNo || '',
      itrTitle: itr.itrTitle || '',
      systemId: itr.systemId || null,
      itrTypeId: itr.itrTypeId || null,
      itpNo: itr.itpNo || '',
      itpDocNo: itr.itpDocNo || '',
      itpTitle: itr.itpTitle || '',
      mainAreaId: itr.mainAreaId || null,
      subArea1Id: itr.subArea1Id || null,
      subArea2Id: null,
      locationDetail: itr.locationDetail || '',
      drawingNo: itr.drawingNo || '',
      drawingFileUrl: itr.drawingFileUrl || '',
      materialNo: itr.materialNo || '',
      materialDocNo: itr.materialDocNo || '',
      materialTitle: itr.materialTitle || '',
      note: ''
    }
    // Load existing attachments
    if (itr.id) {
      loadExistingAttachments(itr.id)
    }
  } else {
    // Creating new ITR - enable edit mode
    isEditMode.value = true
  }
}, { immediate: true })

// Clear sub area when main area changes
watch(() => formData.value.mainAreaId, () => {
  formData.value.subArea1Id = null
})

// ITP Autocomplete
const searchITP = () => {
  const search = itpSearch.value.toLowerCase()
  
  // Show all docs if search is empty (when focused)
  if (search.length === 0) {
    filteredITPDocs.value = itpDocs.value.slice(0, 10)
    showItpDropdown.value = true
    return
  }
  
  // Filter by search term
  filteredITPDocs.value = itpDocs.value.filter(doc => 
    doc.docNo.toLowerCase().includes(search) ||
    doc.title.toLowerCase().includes(search)
  ).slice(0, 10)
  
  showItpDropdown.value = true
}

const selectITP = (doc: ITPDocument) => {
  formData.value.itpNo = doc.item
  formData.value.itpDocNo = doc.docNo
  formData.value.itpTitle = doc.title
  itpSearch.value = doc.docNo
  showItpDropdown.value = false
}

// Material Autocomplete
const searchMaterial = () => {
  const search = materialSearch.value.toLowerCase()
  
  // Show all docs if search is empty (when focused)
  if (search.length === 0) {
    filteredMaterialDocs.value = materialDocs.value.slice(0, 10)
    showMaterialDropdown.value = true
    return
  }
  
  // Filter by search term
  filteredMaterialDocs.value = materialDocs.value.filter(doc => 
    doc.docNo.toLowerCase().includes(search) ||
    doc.title.toLowerCase().includes(search)
  ).slice(0, 10)
  
  showMaterialDropdown.value = true
}

const selectMaterial = (doc: MaterialDocument) => {
  formData.value.materialNo = doc.item
  formData.value.materialDocNo = doc.docNo
  formData.value.materialTitle = doc.title
  materialSearch.value = doc.docNo
  showMaterialDropdown.value = false
}

// File upload
const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  if (file.type !== 'application/pdf') {
    alert('Please select a PDF file')
    return
  }
  
  try {
    uploadProgress.value = 50
    
    // For now, just set a placeholder - actual upload will happen on submit
    formData.value.drawingFileUrl = URL.createObjectURL(file)
    
    uploadProgress.value = 100
    
    // Store file for later upload
    ;(formData.value as any).drawingFile = file
  } catch (error) {
    console.error('Error handling file:', error)
    alert('Failed to process file')
    uploadProgress.value = 0
  }
}

// Save as draft
const saveAsDraft = async () => {
  if (!props.task) return
  
  isSubmitting.value = true
  submitMessage.value = 'Saving ITR as draft...'
  
  try {
    const itrData = {
      taskId: props.task.id,
      projectId: props.projectId,
      ...formData.value,
      attachments: attachments.value // Include all attachments
    }
    
    emit('submit', { ...itrData, status: 'draft' })
  } catch (error) {
    console.error('Error saving draft:', error)
    alert('Failed to save draft')
  } finally {
    setTimeout(() => {
      isSubmitting.value = false
    }, 500)
  }
}

// Submit ITR
const handleSubmit = async () => {
  if (!props.task && !props.editITR) return
  
  isSubmitting.value = true
  submitMessage.value = props.editITR ? 'Updating ITR...' : 'Creating ITR and uploading files...'
  
  try {
    const itrData = {
      taskId: props.task?.id || props.editITR?.taskId,
      projectId: props.projectId,
      ...formData.value,
      attachments: attachments.value // Include all new attachments
    }
    
    if (props.editITR) {
      // Emit update event with ITR id
      emit('update', props.editITR.id, { ...itrData, status: props.editITR.statusCode })
    } else {
      // Emit submit event for new ITR
      emit('submit', { ...itrData, status: 'submitted' })
    }
  } catch (error) {
    console.error('Error submitting ITR:', error)
    alert(`Failed to ${props.editITR ? 'update' : 'submit'} ITR`)
  } finally {
    // Keep spinner visible for a moment to let parent handle submission
    setTimeout(() => {
      isSubmitting.value = false
    }, 500)
  }
}

// Close dropdown when clicking outside
watch(() => [showItpDropdown.value, showMaterialDropdown.value], () => {
  if (showItpDropdown.value || showMaterialDropdown.value) {
    setTimeout(() => {
      document.addEventListener('click', closeDropdowns, { once: true })
    }, 100)
  }
})

const closeDropdowns = () => {
  showItpDropdown.value = false
  showMaterialDropdown.value = false
}

// Helper: Format file size
const formatFileSize = (bytes: number | undefined): string => {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
}

.itr-modal {
  background: white;
  border-radius: 12px;
  max-width: 800px;
  width: 95%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid #e5e7eb;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #6b7280;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
}

.section-title {
  font-weight: 600;
  font-size: 1rem;
  color: #374151;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.section-title:first-child {
  margin-top: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field.full-width {
  grid-column: 1 / -1;
}

.form-field label {
  font-weight: 500;
  font-size: 0.875rem;
  color: #374151;
}

.required {
  color: #ef4444;
}

.optional {
  color: #9ca3af;
  font-weight: 400;
}

.helper-text {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: -0.25rem;
  margin-bottom: 0.25rem;
  font-style: italic;
}

.create-option {
  color: #10b981;
  font-weight: 600;
}

.form-input,
.form-select {
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #3b82f6;
}

.input-disabled {
  padding: 0.625rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
  background-color: #f9fafb;
  color: #6b7280;
}

.autocomplete-wrapper {
  position: relative;
  width: 100%;
}

.autocomplete-wrapper .form-input {
  width: 100%;
}

.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.autocomplete-item {
  padding: 0.75rem;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
}

.autocomplete-item:hover {
  background-color: #f3f4f6;
}

.autocomplete-item:last-child {
  border-bottom: none;
}

.create-item {
  background-color: #f0fdf4;
  color: #10b981;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.create-item:hover {
  background-color: #dcfce7;
}

.create-icon {
  font-size: 1.25rem;
  font-weight: bold;
}

.autocomplete-empty {
  padding: 0.75rem;
  text-align: center;
  color: #9ca3af;
  font-size: 0.875rem;
  font-style: italic;
}

.doc-no {
  font-weight: 600;
  font-size: 0.875rem;
  color: #374151;
}

.doc-title {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.upload-progress {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #3b82f6;
}

.file-uploaded {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #10b981;
  font-weight: 500;
}

.file-list {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.file-list-box {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 60px;
  max-height: 200px;
  overflow-y: auto;
}

.attachment-section {
  margin-bottom: 1.25rem;
}

.attachment-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.attachment-header label {
  font-weight: 600;
  font-size: 0.95rem;
  color: #374151;
}

.choose-files-btn {
  background: #3b82f6;
  color: white;
  padding: 0.375rem 0.875rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.813rem;
  cursor: pointer;
  transition: background 0.2s;
  border: none;
  display: inline-block;
}

.choose-files-btn:hover {
  background: #2563eb;
}

.file-input-hidden {
  display: none;
}

.attachment-content {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.existing-attachments {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.existing-files-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.existing-file-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.file-icon {
  font-size: 1.25rem;
}

.file-link {
  flex: 1;
  color: #2563eb;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-link:hover {
  text-decoration: underline;
}

.file-size {
  font-size: 0.75rem;
  color: #6b7280;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.625rem;
  background: white;
  border-radius: 4px;
  font-size: 0.875rem;
}

.file-item .file-icon {
  font-size: 1.125rem;
  flex-shrink: 0;
  margin-right: 0.5rem;
}

.file-item .file-name-clickable {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #2563eb;
  cursor: pointer;
  text-decoration: none;
  text-align: left;
}

.file-item .file-name-clickable:hover {
  text-decoration: underline;
}

.file-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-name-clickable {
  cursor: pointer;
  color: #2563eb;
  transition: color 0.2s;
}

.file-name-clickable:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.remove-btn {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 0.5rem;
  margin-left: 0.5rem;
}

.remove-btn:hover {
  color: #dc2626;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel,
.btn-draft,
.btn-submit,
.btn-primary-action {
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-draft {
  background: #f59e0b;
  color: white;
}

.btn-draft:hover {
  background: #d97706;
}

.btn-submit {
  background: #10b981;
  color: white;
}

.btn-submit:hover {
  background: #059669;
}

.btn-primary-action {
  background: #3b82f6;
  color: white;
}

.btn-primary-action:hover {
  background: #2563eb;
}

/* Disabled input styling */
.form-input:disabled,
.form-select:disabled {
  background-color: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
  border-color: #e5e7eb;
}

/* Confirmation Modal */
.confirmation-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
}

.confirmation-modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
}

.confirmation-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}

.confirmation-modal-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 1.75rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: color 0.2s;
}

.modal-close-btn:hover {
  color: #111827;
}

.confirmation-modal-body {
  padding: 1.5rem;
}

.confirmation-message {
  margin-bottom: 1rem;
  color: #374151;
  font-size: 0.9375rem;
}

.code-preview {
  margin-top: 0.75rem;
  padding: 0.5rem;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #6b7280;
}

.code-preview strong {
  color: #111827;
}

.confirmation-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid #e5e7eb;
}

.btn-confirm {
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.875rem;
  background: #10b981;
  color: white;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-confirm:hover {
  background: #059669;
}

/* File Preview Modal */
.preview-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
}

.preview-modal-content {
  background: white;
  border-radius: 8px;
  width: 95%;
  max-width: 1200px;
  height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
}

.preview-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.preview-modal-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: color 0.2s;
}

.preview-close-btn:hover {
  color: #111827;
}

.preview-modal-body {
  flex: 1;
  overflow: auto;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 4px;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
}

.preview-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn-download {
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.875rem;
  background: #10b981;
  color: white;
  text-decoration: none;
  display: inline-block;
  transition: background 0.2s;
}

.btn-download:hover {
  background: #059669;
}

.btn-close-preview {
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.875rem;
  background: #f3f4f6;
  color: #374151;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-close-preview:hover {
  background: #e5e7eb;
}
</style>
