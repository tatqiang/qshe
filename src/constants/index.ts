/**
 * Global Constants and Configuration
 * 
 * Central place for app-wide constants, configuration values,
 * and other global variables that don't change during runtime.
 */

// App Configuration
export const APP_CONFIG = {
  NAME: 'QSHE Management System',
  VERSION: '1.0.0',
  ENVIRONMENT: import.meta.env.MODE || 'development',
} as const;

// API Configuration
export const API_CONFIG = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  BASE_URL: import.meta.env.VITE_API_BASE_URL || '',
} as const;

// Storage Keys (used by AppContext and other components)
export const STORAGE_KEYS = {
  USER: 'app-user',
  PROJECT: 'selected-project',
  ORGANIZATION: 'organization-id',
  AUTH_TOKEN: 'auth-token',
  USER_PREFERENCES: 'user-preferences',
  THEME: 'app-theme',
} as const;

// Default Values
export const DEFAULT_VALUES = {
  PROJECT_ID: null, // No default project
  USER_ID: null,    // No default user
  ORGANIZATION_ID: null,
  PAGE_SIZE: 20,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
} as const;

// Safety Patrol Constants
export const SAFETY_PATROL = {
  PATROL_TYPES: [
    { value: 'scheduled', label: 'Scheduled Patrol' },
    { value: 'unscheduled', label: 'Unscheduled Patrol' },
    { value: 'follow_up', label: 'Follow-up Patrol' },
    { value: 'inspection', label: 'Safety Inspection' },
  ] as const,
  
  RISK_LEVELS: [
    { value: 'low', label: 'Low', color: 'green' },
    { value: 'medium', label: 'Medium', color: 'yellow' },
    { value: 'high', label: 'High', color: 'orange' },
    { value: 'extremely_high', label: 'Extremely High', color: 'red' },
  ] as const,
  
  LIKELIHOOD_SCALE: [1, 2, 3, 4] as const,
  SEVERITY_SCALE: [1, 2, 3, 4] as const,
  
  PHOTO_TYPES: [
    { value: 'issue', label: 'Issue/Problem' },
    { value: 'before', label: 'Before Action' },
    { value: 'after', label: 'After Action' },
    { value: 'evidence', label: 'Evidence' },
  ] as const,
} as const;

// User Roles and Permissions
export const USER_ROLES = {
  ADMIN: 'admin',
  PROJECT_MANAGER: 'project_manager',
  SAFETY_OFFICER: 'safety_officer',
  SUPERVISOR: 'supervisor',
  WORKER: 'worker',
  CONTRACTOR: 'contractor',
} as const;

export const PERMISSIONS = {
  // Safety Patrol Permissions
  CREATE_PATROL: 'create_patrol',
  VIEW_PATROL: 'view_patrol',
  EDIT_PATROL: 'edit_patrol',
  DELETE_PATROL: 'delete_patrol',
  APPROVE_PATROL: 'approve_patrol',
  
  // Project Permissions
  CREATE_PROJECT: 'create_project',
  VIEW_PROJECT: 'view_project',
  EDIT_PROJECT: 'edit_project',
  DELETE_PROJECT: 'delete_project',
  MANAGE_PROJECT_MEMBERS: 'manage_project_members',
  
  // User Management
  CREATE_USER: 'create_user',
  VIEW_USERS: 'view_users',
  EDIT_USER: 'edit_user',
  DELETE_USER: 'delete_user',
  ASSIGN_ROLES: 'assign_roles',
  
  // System Administration
  SYSTEM_ADMIN: 'system_admin',
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_DATA: 'export_data',
} as const;

// UI Constants
export const UI_CONFIG = {
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    '2XL': 1536,
  } as const,
  
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  } as const,
  
  Z_INDEX: {
    DROPDOWN: 1000,
    MODAL: 1100,
    TOOLTIP: 1200,
    NOTIFICATION: 1300,
  } as const,
} as const;

// Date and Time Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  TIMESTAMP: 'yyyy-MM-dd HH:mm:ss',
  ISO: 'iso', // For API calls
} as const;

// Validation Rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PROJECT_CODE_PATTERN: /^[A-Z0-9-]{2,10}$/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_PATTERN: /^\+?[\d\s-()]+$/,
  
  // File Upload
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_UPLOAD: 10,
  ALLOWED_IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'] as const,
  ALLOWED_DOCUMENT_EXTENSIONS: ['.pdf', '.doc', '.docx', '.xls', '.xlsx'] as const,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PASSWORD: `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`,
  INVALID_PROJECT_CODE: 'Project code must be 2-10 characters (A-Z, 0-9, hyphens only)',
  FILE_TOO_LARGE: `File size cannot exceed ${VALIDATION.MAX_FILE_SIZE / 1024 / 1024}MB`,
  INVALID_FILE_TYPE: 'Invalid file type',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  PROJECT_REQUIRED: 'Please select a project first',
  USER_NOT_FOUND: 'User not found',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  PATROL_CREATED: 'Safety patrol record created successfully',
  PATROL_UPDATED: 'Safety patrol record updated successfully',
  PATROL_DELETED: 'Safety patrol record deleted successfully',
  PROJECT_SELECTED: 'Project selected successfully',
  FILE_UPLOADED: 'File uploaded successfully',
  SETTINGS_SAVED: 'Settings saved successfully',
} as const;

// Development/Debug Configuration
export const DEBUG_CONFIG = {
  ENABLE_CONSOLE_LOGS: import.meta.env.MODE === 'development',
  ENABLE_PERFORMANCE_MONITORING: import.meta.env.MODE === 'production',
  MOCK_API_DELAY: 500, // milliseconds
} as const;

// Export commonly used values as standalone constants
export const { PROJECT_ID, USER_ID, ORGANIZATION_ID } = DEFAULT_VALUES;
export const { ADMIN, PROJECT_MANAGER, SAFETY_OFFICER } = USER_ROLES;
