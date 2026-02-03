<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-container">
        <div class="modal-header">
          <h2>{{ itr?.itrNo || 'Draft' }} - {{ itr?.itrTitle }}</h2>
          <div class="header-actions">
            <button v-if="!isEditMode" @click="isEditMode = true" class="btn-edit">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Edit
            </button>
            <button @click="$emit('close')" class="btn-close">&times;</button>
          </div>
        </div>

        <div class="modal-body">
          <!-- Status Badge -->
          <div class="status-section">
            <div class="status-badge-large" :class="`status-${itr?.statusCode}`">
              {{ getStatusLabel(itr?.statusCode) }}
            </div>
          </div>

          <!-- ITR Information -->
          <div class="form-section">
            <h3>ITR Information</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>ITR Title</label>
                <input 
                  v-model="formData.itrTitle" 
                  type="text" 
                  :disabled="!isEditMode"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>System</label>
                <select v-model="formData.systemId" :disabled="!isEditMode" class="form-input">
                  <option value="">Select System</option>
                  <option v-for="system in systems" :key="system.id" :value="system.id">
                    {{ system.systemCode }} - {{ system.description }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label>ITR Type</label>
                <select v-model="formData.itrTypeId" :disabled="!isEditMode" class="form-input">
                  <option value="">Select Type</option>
                  <option v-for="type in itrTypes" :key="type.id" :value="type.id">
                    {{ type.typeName }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label>Location</label>
                <div class="location-display">
                  <span v-if="itr?.mainArea" class="location-tag">{{ itr.mainArea.mainAreaName }}</span>
                  <span v-if="itr?.subArea1" class="location-tag">{{ itr.subArea1.subArea1Name }}</span>
                  <span v-if="itr?.locationDetail" class="location-detail">{{ itr.locationDetail }}</span>
                </div>
              </div>

              <div class="form-group">
                <label>Drawing No</label>
                <input 
                  v-model="formData.drawingNo" 
                  type="text" 
                  :disabled="!isEditMode"
                  class="form-input"
                />
              </div>
            </div>
          </div>

          <!-- ITP Information -->
          <div class="form-section" v-if="formData.itpDocNo || isEditMode">
            <h3>ITP Information</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>ITP Doc No</label>
                <input 
                  v-model="formData.itpDocNo" 
                  type="text" 
                  :disabled="!isEditMode"
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label>ITP Title</label>
                <input 
                  v-model="formData.itpTitle" 
                  type="text" 
                  :disabled="!isEditMode"
                  class="form-input"
                />
              </div>
            </div>
          </div>

          <!-- Attachments -->
          <div class="form-section">
            <h3>Attachments</h3>
            
            <!-- Loading State -->
            <div v-if="loadingAttachments" class="loading-attachments">
              <div class="spinner"></div>
              <p>Loading attachments...</p>
            </div>

            <!-- Read Mode - Display attachments by type -->
            <div v-else-if="!isEditMode && !loadingAttachments">
              <!-- Existing Files Summary (if any) -->
              <div v-if="attachments.length > 0" class="existing-files-summary">
                <h4 class="text-sm font-semibold mb-3 text-gray-700">Existing Files</h4>
                <div class="existing-files-grid">
                  <div v-for="att in attachments" :key="att.id" class="existing-file-item">
                    <span class="file-icon">
                      {{ att.attachmentType === 'drawing' ? '📄' : att.attachmentType === 'delivery_order' ? '📋' : '🖼️' }}
                    </span>
                    <a :href="att.fileUrl" target="_blank" class="file-link" @click.prevent="downloadAttachment(att)">
                      {{ att.fileName }}
                    </a>
                    <span class="file-size">{{ formatFileSize(att.fileSize) }}</span>
                  </div>
                </div>
              </div>

              <!-- Drawing Files Section -->
              <div class="attachment-section">
                <div class="form-group">
                  <label>Drawing No</label>
                  <input 
                    v-model="formData.drawingNo" 
                    type="text" 
                    disabled
                    class="form-input"
                    :placeholder="formData.drawingNo || 'No drawing number'"
                  />
                </div>
                <div class="form-group">
                  <label>Drawing Files (PDF or Images)</label>
                  <div v-if="attachmentsByType('drawing').length > 0" class="readonly-file-list">
                    <div v-for="att in attachmentsByType('drawing')" :key="att.id" class="readonly-file-item">
                      <span class="file-icon">📄</span>
                      <a :href="att.fileUrl" target="_blank" class="file-name" @click.prevent="downloadAttachment(att)">
                        {{ att.fileName }}
                      </a>
                      <span class="file-size">{{ formatFileSize(att.fileSize) }}</span>
                    </div>
                  </div>
                  <div v-else class="no-files-message">No drawing files</div>
                </div>
              </div>

              <!-- Delivery Order Files Section -->
              <div class="attachment-section">
                <div class="form-group">
                  <label>Delivery Order (DO) Files</label>
                  <div v-if="attachmentsByType('delivery_order').length > 0" class="readonly-file-list">
                    <div v-for="att in attachmentsByType('delivery_order')" :key="att.id" class="readonly-file-item">
                      <span class="file-icon">📋</span>
                      <a :href="att.fileUrl" target="_blank" class="file-name" @click.prevent="downloadAttachment(att)">
                        {{ att.fileName }}
                      </a>
                      <span class="file-size">{{ formatFileSize(att.fileSize) }}</span>
                    </div>
                  </div>
                  <div v-else class="no-files-message">No delivery order files</div>
                </div>
              </div>

              <!-- Photos Section -->
              <div class="attachment-section">
                <div class="form-group">
                  <label>Photos</label>
                  <div v-if="attachmentsByType('photo').length > 0" class="readonly-file-list">
                    <div v-for="att in attachmentsByType('photo')" :key="att.id" class="readonly-file-item">
                      <span class="file-icon">🖼️</span>
                      <a :href="att.fileUrl" target="_blank" class="file-name" @click.prevent="downloadAttachment(att)">
                        {{ att.fileName }}
                      </a>
                      <span class="file-size">{{ formatFileSize(att.fileSize) }}</span>
                    </div>
                  </div>
                  <div v-else class="no-files-message">No photos</div>
                </div>
              </div>

              <!-- Note Section -->
              <div class="form-group full-width">
                <label>Note</label>
                <textarea 
                  v-model="formData.note" 
                  rows="3"
                  disabled
                  class="form-input"
                  :placeholder="formData.note || 'No notes'"
                ></textarea>
              </div>
            </div>

            <!-- Edit Mode - File Upload -->
            <div v-if="isEditMode" class="attachments-edit">
              <p class="text-sm text-gray-600 mb-2">Note: File management in edit mode coming soon</p>
            </div>
          </div>

          <!-- Material Reference -->
          <div class="form-section" v-if="formData.materialDocNo || formData.materialNo">
            <h3>Material Reference</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Material No</label>
                <input 
                  v-model="formData.materialNo" 
                  type="text" 
                  :disabled="!isEditMode"
                  class="form-input"
                />
              </div>
              <div class="form-group" v-if="formData.materialDocNo">
                <label>Material Doc No</label>
                <input 
                  v-model="formData.materialDocNo" 
                  type="text" 
                  :disabled="!isEditMode"
                  class="form-input"
                />
              </div>
              <div class="form-group full-width" v-if="formData.materialTitle">
                <label>Material Title</label>
                <input 
                  v-model="formData.materialTitle" 
                  type="text" 
                  :disabled="!isEditMode"
                  class="form-input"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="$emit('close')" class="btn-secondary">
            {{ isEditMode ? 'Cancel' : 'Close' }}
          </button>
          <button v-if="isEditMode" @click="handleSave" class="btn-primary">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { ConstructionITR, ConstructionSystem, ITRType } from '@/types/construction-project'
import { constructionITRService } from '@/services/constructionITRService'

interface Props {
  show: boolean
  itr: ConstructionITR | null
  systems: ConstructionSystem[]
  itrTypes: ITRType[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  save: [data: any]
}>()

const isEditMode = ref(false)
const attachments = ref<any[]>([])
const loadingAttachments = ref(false)

const formData = ref({
  itrTitle: '',
  systemId: '',
  itrTypeId: '',
  itpDocNo: '',
  itpTitle: '',
  drawingNo: '',
  materialNo: '',
  materialDocNo: '',
  materialTitle: '',
  note: ''
})

watch(() => props.itr, (newItr) => {
  if (newItr) {
    formData.value = {
      itrTitle: newItr.itrTitle || '',
      systemId: newItr.systemId || '',
      itrTypeId: newItr.itrTypeId || '',
      itpDocNo: newItr.itpDocNo || '',
      itpTitle: newItr.itpTitle || '',
      drawingNo: newItr.drawingNo || '',
      materialNo: newItr.materialNo || '',
      materialDocNo: newItr.materialDocNo || '',
      materialTitle: newItr.materialTitle || '',
      note: newItr.note || ''
    }
    loadAttachments()
  }
  isEditMode.value = false
}, { immediate: true })

const loadAttachments = async () => {
  if (!props.itr?.id) {
    console.log('[ITRDetailModal] No ITR ID, skipping attachment load')
    return
  }
  
  console.log('[ITRDetailModal] Loading attachments for ITR:', props.itr.id)
  loadingAttachments.value = true
  try {
    attachments.value = await constructionITRService.getAttachments(props.itr.id)
    console.log('[ITRDetailModal] Loaded attachments:', attachments.value)
  } catch (error) {
    console.error('[ITRDetailModal] Failed to load attachments:', error)
    // Show error but don't throw - allow user to see rest of ITR details
  } finally {
    loadingAttachments.value = false
  }
}

// Filter attachments by type
const attachmentsByType = (type: string) => {
  return attachments.value.filter(att => att.attachmentType === type)
}

const getStatusLabel = (statusCode: string | undefined): string => {
  const labels: Record<string, string> = {
    draft: 'Draft',
    internal_requested: 'Internal Requested',
    confirm_requested: 'Confirm Requested',
    approved: 'Approved',
    rejected: 'Rejected'
  }
  return labels[statusCode || ''] || statusCode || ''
}

const formatAttachmentType = (type: string): string => {
  const types: Record<string, string> = {
    drawing: 'Drawing',
    delivery_order: 'Delivery Order',
    photo: 'Photo'
  }
  return types[type] || type
}

const formatFileSize = (bytes: number | undefined): string => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

const downloadAttachment = (attachment: any) => {
  window.open(attachment.fileUrl, '_blank')
}

const handleSave = () => {
  emit('save', {
    ...formData.value,
    id: props.itr?.id
  })
  isEditMode.value = false
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid #e5e7eb;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-edit {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-edit:hover {
  background: #2563eb;
}

.btn-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #e5e7eb;
  color: #374151;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.status-section {
  margin-bottom: 1.5rem;
}

.status-badge-large {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
}

.status-draft {
  background: #f3f4f6;
  color: #374151;
}

.status-internal_requested {
  background: #fef3c7;
  color: #92400e;
}

.status-confirm_requested {
  background: #fed7aa;
  color: #7c2d12;
}

.status-approved {
  background: #d1fae5;
  color: #065f46;
}

.status-rejected {
  background: #fee2e2;
  color: #991b1b;
}

.form-section {
  margin-bottom: 2rem;
}

.form-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
}

.form-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-input:not(:disabled):hover {
  border-color: #9ca3af;
}

.form-input:not(:disabled):focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input:disabled {
  background: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.location-display {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.location-tag {
  padding: 0.25rem 0.75rem;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
}

.location-detail {
  color: #6b7280;
  font-size: 0.875rem;
}

.attachments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.attachment-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s;
}

.attachment-card:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.attachment-icon {
  flex-shrink: 0;
  color: #6b7280;
}

.attachment-info {
  flex: 1;
  min-width: 0;
}

.attachment-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-meta {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

.attachment-desc {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.btn-download {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
  transition: background 0.2s;
  flex-shrink: 0;
}

.btn-download:hover {
  background: #2563eb;
}

.empty-attachments {
  text-align: center;
  padding: 2rem;
  color: #9ca3af;
  font-size: 0.875rem;
}

.loading-attachments {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.loading-attachments .spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  margin: 0 auto 1rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-attachments p {
  font-size: 0.875rem;
  color: #6b7280;
}

.attachments-edit {
  padding: 1rem;
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 8px;
}

/* New styles for read-only attachments by type */
.existing-files-summary {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.existing-files-grid {
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
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  transition: all 0.2s;
}

.existing-file-item:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.existing-file-item .file-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.existing-file-item .file-link {
  flex: 1;
  color: #3b82f6;
  text-decoration: none;
  font-size: 0.875rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.existing-file-item .file-link:hover {
  text-decoration: underline;
}

.existing-file-item .file-size {
  font-size: 0.75rem;
  color: #9ca3af;
  flex-shrink: 0;
}

.attachment-section {
  margin-bottom: 1rem;
}

.readonly-file-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.readonly-file-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  transition: all 0.2s;
}

.readonly-file-item:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.readonly-file-item .file-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.readonly-file-item .file-name {
  flex: 1;
  color: #3b82f6;
  text-decoration: none;
  font-size: 0.875rem;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.readonly-file-item .file-name:hover {
  text-decoration: underline;
}

.readonly-file-item .file-size {
  font-size: 0.75rem;
  color: #9ca3af;
  flex-shrink: 0;
}

.no-files-message {
  padding: 1rem;
  text-align: center;
  color: #9ca3af;
  font-size: 0.875rem;
  background: #f9fafb;
  border: 1px dashed #e5e7eb;
  border-radius: 6px;
  margin-top: 0.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 2px solid #e5e7eb;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  background: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-primary {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #2563eb;
}
</style>
