// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'QSHE',
  VERSION: '1.0.0',
  THEME_STORAGE_KEY: 'qshe-theme',
  PROJECT_STORAGE_KEY: 'selectedProject',
  USER_STORAGE_KEY: 'qshe-user'
} as const

// User Roles
export const USER_ROLES = {
  SYSTEM_ADMIN: 'system_admin',
  ADMIN: 'admin',
  MEMBER: 'member',
  REGISTRANT: 'registrant'
} as const

// Project Status
export const PROJECT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  INACTIVE: 'inactive'
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]
export type ProjectStatus = typeof PROJECT_STATUS[keyof typeof PROJECT_STATUS]
