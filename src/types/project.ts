export interface Project {
  id: string
  project_code: string
  name?: string
  description?: string
  status?: 'active' | 'completed' | 'on_hold' | 'cancelled' | 'inactive'
  project_start?: string
  project_end?: string
  is_test_project?: boolean
  created_at?: string
  updated_at?: string
}

export interface ProjectFormData {
  project_code: string
  name: string
  description: string
  status: 'active' | 'completed' | 'on_hold' | 'cancelled'
  project_start: string
  project_end: string
}

export interface ProjectFormErrors {
  project_code?: string
  name?: string
  project_end?: string
}
