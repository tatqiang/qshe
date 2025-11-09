// API Endpoints
export const API_ENDPOINTS = {
  PROJECTS: 'projects',
  USERS: 'users',
  PATROLS: 'safety_patrols',
  RISK_ASSESSMENTS: 'risk_assessments',
  SAFETY_AUDITS: 'safety_audits',
  TOOLBOX_TALKS: 'toolbox_talks',
  PERMITS: 'permit_to_work'
}

// User Roles
export const USER_ROLES = {
  SYSTEM_ADMIN: 'system_admin',
  PROJECT_MANAGER: 'project_manager',
  SAFETY_OFFICER: 'safety_officer',
  WORKER: 'worker'
}

// Project Status
export const PROJECT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  INACTIVE: 'inactive'
}

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'QSHE',
  VERSION: '1.0.0',
  THEME_STORAGE_KEY: 'qshe-theme',
  PROJECT_STORAGE_KEY: 'selectedProject',
  USER_STORAGE_KEY: 'qshe-user'
}
