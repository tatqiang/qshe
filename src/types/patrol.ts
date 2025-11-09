/**
 * Safety Patrol Types
 */

export type PatrolType = 'scheduled' | 'random' | 'incident_followup'
export type PatrolStatus = 'open' | 'pending_verification' | 'closed' | 'rejected'
export type PatrolPriority = 'immediate' | 'high' | 'medium' | 'low'
export type RiskLevel = 'low' | 'medium' | 'high' | 'extremely_high'
export type RecommendedAction = 'monitor' | 'control' | 'mitigate' | 'stop_work'
export type PhotoType = 'issue' | 'before' | 'after' | 'evidence'
export type ActionType = 'immediate' | 'short_term' | 'long_term' | 'preventive'
export type ActionStatus = 'assigned' | 'in_progress' | 'completed' | 'verified' | 'overdue'

export interface Patrol {
  id: string
  patrol_number: string
  patrol_date: string
  patrol_type: PatrolType
  
  // Project & Location
  project_id: string
  project?: {
    id: string
    name: string
    project_code: string
  }
  main_area?: string
  sub_area1?: string
  sub_area2?: string
  specific_location?: string
  
  // Issue Details
  title: string
  description: string
  remark?: string
  
  // Risk Assessment (4x4 Matrix)
  likelihood: 1 | 2 | 3 | 4
  severity: 1 | 2 | 3 | 4
  risk_score: number
  risk_level: RiskLevel
  recommended_action: RecommendedAction
  
  // Flags
  immediate_hazard: boolean
  work_stopped: boolean
  legal_requirement: boolean
  regulation_reference?: string
  
  // People
  inspector_id: string
  inspector?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  contractor_id?: string
  contractor?: {
    id: string
    name: string
  }
  
  // Status & Priority
  status: PatrolStatus
  priority: PatrolPriority
  due_date?: string
  
  // Metadata
  created_at: string
  updated_at: string
  created_by: string
  created_by_user?: {
    id: string
    first_name: string
    last_name: string
  }
}

export interface PatrolPhoto {
  id: string
  patrol_id?: string
  action_id?: string
  file_path: string
  file_name: string
  file_size: number
  photo_type: PhotoType
  caption?: string
  uploaded_by: string
  created_at: string
}

export interface CorrectiveAction {
  id: string
  patrol_id: string
  action_number: string
  
  // Action Details
  description: string
  action_type: ActionType
  root_cause_analysis?: string
  
  // Responsibility & Timeline
  assigned_to: string
  assigned_to_user?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  assigned_date: string
  due_date: string
  
  // Progress
  status: ActionStatus
  progress_percentage: number
  
  // Verification
  verified_by?: string
  verified_by_user?: {
    id: string
    first_name: string
    last_name: string
  }
  verification_date?: string
  verification_notes?: string
  approved_at?: string
  rejected_at?: string
  rejection_reason?: string
  
  // Cost & Resources
  estimated_cost?: number
  actual_cost?: number
  resources_required?: string[]
  
  // Metadata
  created_at: string
  updated_at: string
  created_by: string
}

export interface ProgressUpdate {
  id: string
  action_id: string
  update_text: string
  progress_percentage: number
  update_date: string
  updated_by: string
  updated_by_user?: {
    id: string
    first_name: string
    last_name: string
  }
  created_at: string
}

export interface PatrolFormData {
  patrol_type: PatrolType
  patrol_date: string
  project_id: string
  main_area?: string
  sub_area1?: string
  sub_area2?: string
  specific_location?: string
  title: string
  description: string
  remark?: string
  likelihood: 1 | 2 | 3 | 4
  severity: 1 | 2 | 3 | 4
  immediate_hazard: boolean
  work_stopped: boolean
  legal_requirement: boolean
  regulation_reference?: string
  contractor_id?: string
  priority?: PatrolPriority
  due_date?: string
}

export interface CorrectiveActionFormData {
  description: string
  action_type: ActionType
  root_cause_analysis?: string
  assigned_to: string
  due_date: string
  estimated_cost?: number
  resources_required?: string[]
}

export interface PatrolFilters {
  status?: PatrolStatus[]
  risk_level?: RiskLevel[]
  priority?: PatrolPriority[]
  date_from?: string
  date_to?: string
  project_id?: string
  search?: string
}
