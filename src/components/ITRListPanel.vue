<template>
  <div class="itr-list-panel">
    <div class="panel-header">
      <h3>ITRs</h3>
      <div class="header-actions">
        <!-- Task Filter Badge -->
        <div v-if="filteredTaskId" class="task-filter-badge">
          <span>Filtered by Task</span>
          <button @click="$emit('clear-filter')" class="clear-btn" title="Clear filter">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <select v-model="filterStatus" class="status-filter">
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="internal_requested">Internal Requested</option>
          <option value="confirm_requested">Confirm Requested</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading ITRs...</p>
    </div>

    <!-- ITR List -->
    <div v-else-if="filteredITRs.length > 0" class="itr-list">
      <div 
        v-for="itr in filteredITRs" 
        :key="itr.id"
        class="itr-card"
        :class="{ 'active': selectedITR?.id === itr.id }"
        @click.stop="$emit('select', itr)"
      >
        <div class="itr-header">
          <div class="itr-no">{{ itr.itrNo || 'Draft' }}</div>
          <div class="status-badge" :class="`status-${itr.statusCode}`">
            {{ getStatusLabel(itr.statusCode) }}
          </div>
        </div>
        <div class="itr-title">{{ itr.itrTitle }}</div>
        <div class="itr-details">
          <div class="details-column">
            <div class="detail-row">
              <span class="label">Task:</span>
              <span class="value">{{ itr.task?.name || '-' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">System:</span>
              <span class="value">{{ itr.system?.systemCode || '-' }}</span>
            </div>
          </div>
          <div class="details-column">
            <div class="detail-row">
              <span class="label">Type:</span>
              <span class="value">{{ itr.itrType?.typeName || '-' }}</span>
            </div>
            <div class="detail-row" v-if="itr.mainArea">
              <span class="label">Area:</span>
              <span class="value">{{ itr.mainArea?.mainAreaName || '-' }}</span>
            </div>
          </div>
        </div>
        <div class="itr-footer">
          <span class="itr-date">{{ formatDate(itr.createdDate) }}</span>
          <span v-if="itr.createdBy" class="itr-creator">Created by {{ itr.createdBy }}</span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <svg class="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      <p>No ITRs yet</p>
      <p class="empty-hint">Click 📋 on a task to create an ITR</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ConstructionITR } from '@/types/construction-project'

interface Props {
  itrs: ConstructionITR[]
  loading?: boolean
  selectedITR?: ConstructionITR | null
  filteredTaskId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  selectedITR: null,
  filteredTaskId: null
})

defineEmits<{
  select: [itr: ConstructionITR]
  'clear-filter': []
}>()

const filterStatus = ref('')

const filteredITRs = computed(() => {
  let result = props.itrs
  
  // Filter by task
  if (props.filteredTaskId) {
    result = result.filter(itr => itr.taskId === props.filteredTaskId)
  }
  
  // Filter by status
  if (filterStatus.value) {
    result = result.filter(itr => itr.statusCode === filterStatus.value)
  }
  
  return result
})

const getStatusLabel = (statusCode: string): string => {
  const labels: Record<string, string> = {
    draft: 'Draft',
    internal_requested: 'Internal',
    confirm_requested: 'Requested',
    approved: 'Approved',
    rejected: 'Rejected',
    cancelled: 'Cancelled'
  }
  return labels[statusCode] || statusCode
}

const formatDate = (date: Date | string | undefined): string => {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<style scoped>
.itr-list-panel {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.panel-header {
  padding: 1rem;
  border-bottom: 2px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.task-filter-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.task-filter-badge .clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.125rem;
  background: transparent;
  border: none;
  color: #1e40af;
  cursor: pointer;
  border-radius: 4px;
}

.task-filter-badge .clear-btn:hover {
  background: #bfdbfe;
}

.status-filter {
  padding: 0.375rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
}

.status-filter:hover {
  border-color: #3b82f6;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: #6b7280;
}

.spinner {
  border: 3px solid #f3f4f6;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.itr-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.itr-card {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.itr-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.itr-card.active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.itr-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.itr-no {
  font-weight: 600;
  font-size: 0.875rem;
  color: #111827;
}

.status-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
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
  background: #fde68a;
  color: #78350f;
}

.status-approved {
  background: #d1fae5;
  color: #065f46;
}

.status-rejected {
  background: #fee2e2;
  color: #991b1b;
}

.status-cancelled {
  background: #f3f4f6;
  color: #6b7280;
}

.itr-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
  margin-bottom: 0.625rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.itr-details {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
  margin-bottom: 0.625rem;
}

@media (min-width: 768px) {
  .itr-details {
    grid-template-columns: repeat(2, 1fr);
  }
}

.details-column {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.detail-row {
  display: flex;
  align-items: center;
  font-size: 0.75rem;
}

.detail-row .label {
  color: #6b7280;
  font-weight: 500;
  min-width: 60px;
  margin-right: 0.5rem;
}

.detail-row .value {
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.itr-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.5rem;
  border-top: 1px solid #f3f4f6;
}

.itr-meta {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.system-code {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  background: #f3f4f6;
  border-radius: 4px;
  color: #374151;
}

.itr-type {
  font-size: 0.75rem;
  color: #6b7280;
}

.itr-date {
  font-size: 0.75rem;
  color: #9ca3af;
}

.itr-creator {
  font-size: 0.7rem;
  color: #9ca3af;
  font-style: italic;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: #9ca3af;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 1rem;
  color: #d1d5db;
}

.empty-state p {
  margin: 0.25rem 0;
}

.empty-hint {
  font-size: 0.875rem;
  color: #6b7280;
}
</style>
