// Multi-Company Role Management Types
// Types for the enhanced RBAC system supporting different roles per company

// Basic permission structure
export interface Permission {
  id: string;
  permission_key: string;
  permission_name: string;
  description?: string;
  category: 'patrol' | 'issue' | 'project' | 'user' | 'company' | 'risk' | 'document' | 'system' | 'general';
  is_sensitive: boolean;
  created_at: string;
}

// Company-specific role definition
export interface CompanyRole {
  id: string;
  company_id: string;
  role_name: string;
  role_description?: string;
  permissions: string[]; // Array of permission keys
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Enhanced user-company association with role details
export interface UserCompanyAssociation {
  id: string;
  user_id: string;
  company_id: string;
  role_in_company: string;
  company_role_id: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  approval_status: 'pending' | 'approved' | 'rejected';
  start_date: string;
  end_date?: string;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Combined view of user with company role details
export interface UserCompanyRoleDetails {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  worker_type: 'internal' | 'contractor' | 'consultant' | 'temporary' | 'visitor';
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  company_id: string;
  company_name: string;
  role_in_company: string;
  role_description?: string;
  permissions: string[];
  association_status: string;
  approval_status: string;
  start_date: string;
  end_date?: string;
  is_primary_company: boolean;
}

// User's companies with their roles
export interface UserCompanyWithRole {
  company_id: string;
  company_name: string;
  role_name: string;
  role_description?: string;
  permissions: string[];
  is_primary: boolean;
  association_status: string;
}

// Permission check context
export interface PermissionContext {
  user_id: string;
  company_id?: string;
  permission_key: string;
}

// Role assignment request
export interface RoleAssignmentRequest {
  user_id: string;
  company_id: string;
  role_name: string;
  assigned_by?: string;
  auto_approve?: boolean;
  notes?: string;
}

// Standard role definitions for companies
export const STANDARD_COMPANY_ROLES = {
  COMPANY_ADMIN: {
    name: 'company_admin',
    label: 'Company Administrator',
    description: 'Full administrative access within the company',
    level: 5,
    permissions: [
      'user.create', 'user.edit', 'user.delete', 'user.view_all', 'user.manage_roles',
      'project.create', 'project.edit', 'project.delete', 'project.view_all', 'project.manage_members',
      'patrol.create', 'patrol.edit', 'patrol.delete', 'patrol.view_all', 'patrol.approve',
      'issue.create', 'issue.assign', 'issue.resolve', 'issue.view_all',
      'risk.create', 'risk.edit', 'risk.approve', 'risk.view_all',
      'company.edit', 'company.manage_external_workers', 'company.view_analytics',
      'document.upload', 'document.delete', 'document.view_sensitive'
    ]
  },
  PROJECT_MANAGER: {
    name: 'project_manager',
    label: 'Project Manager',
    description: 'Manages specific projects and their teams',
    level: 4,
    permissions: [
      'project.edit', 'project.view_all', 'project.manage_members',
      'patrol.create', 'patrol.edit', 'patrol.view_all', 'patrol.approve',
      'issue.create', 'issue.assign', 'issue.resolve', 'issue.view_all',
      'risk.create', 'risk.edit', 'risk.view_all',
      'user.view_all', 'document.upload'
    ]
  },
  SAFETY_OFFICER: {
    name: 'safety_officer',
    label: 'Safety Officer',
    description: 'Responsible for safety compliance and patrol oversight',
    level: 4,
    permissions: [
      'patrol.create', 'patrol.edit', 'patrol.view_all', 'patrol.approve',
      'issue.create', 'issue.assign', 'issue.resolve', 'issue.view_all',
      'risk.create', 'risk.edit', 'risk.approve', 'risk.view_all',
      'document.upload', 'document.view_sensitive'
    ]
  },
  SUPERVISOR: {
    name: 'supervisor',
    label: 'Supervisor',
    description: 'Supervises teams and basic project operations',
    level: 3,
    permissions: [
      'patrol.create', 'patrol.edit', 'patrol.view_all',
      'issue.create', 'issue.assign', 'issue.resolve', 'issue.view_all',
      'risk.create', 'risk.edit', 'risk.view_all',
      'user.view_all', 'document.upload'
    ]
  },
  EXTERNAL_WORKER: {
    name: 'external_worker',
    label: 'External Worker',
    description: 'External contractor or consultant with limited access',
    level: 2,
    permissions: [
      'patrol.create', 'patrol.edit',
      'issue.create',
      'risk.create',
      'document.upload'
    ]
  },
  MEMBER: {
    name: 'member',
    label: 'Member',
    description: 'Basic member with read access and limited actions',
    level: 1,
    permissions: [
      'patrol.create',
      'issue.create',
      'risk.create',
      'document.upload'
    ]
  },
  GUEST: {
    name: 'guest',
    label: 'Guest',
    description: 'Guest access with view-only permissions',
    level: 0,
    permissions: [
      'document.upload'
    ]
  }
} as const;

// Permission categories for UI organization
export const PERMISSION_CATEGORIES = {
  PATROL: {
    key: 'patrol',
    label: 'Safety Patrol',
    description: 'Manage safety patrol reports and inspections',
    icon: 'shield-check'
  },
  ISSUE: {
    key: 'issue',
    label: 'Issue Management',
    description: 'Create and manage safety issues',
    icon: 'exclamation-triangle'
  },
  PROJECT: {
    key: 'project',
    label: 'Project Management',
    description: 'Manage projects and team assignments',
    icon: 'folder'
  },
  USER: {
    key: 'user',
    label: 'User Management',
    description: 'Manage user accounts and permissions',
    icon: 'users'
  },
  COMPANY: {
    key: 'company',
    label: 'Company Management',
    description: 'Manage company settings and external workers',
    icon: 'building'
  },
  RISK: {
    key: 'risk',
    label: 'Risk Management',
    description: 'Create and approve risk assessments',
    icon: 'alert-triangle'
  },
  DOCUMENT: {
    key: 'document',
    label: 'Document Management',
    description: 'Upload and manage documents',
    icon: 'file-text'
  },
  SYSTEM: {
    key: 'system',
    label: 'System Administration',
    description: 'System-level administrative functions',
    icon: 'settings'
  }
} as const;

// Helper type for role level comparison
export type RoleLevel = 0 | 1 | 2 | 3 | 4 | 5;

// Company context for multi-company operations
export interface CompanyContext {
  company_id: string;
  company_name: string;
  user_role: string;
  permissions: string[];
  is_primary: boolean;
}

// Multi-company user session
export interface MultiCompanyUserSession {
  user_id: string;
  current_company_context?: CompanyContext;
  available_companies: UserCompanyWithRole[];
  global_permissions: string[]; // System-level permissions
}

// External worker invitation
export interface ExternalWorkerInvitation {
  id: string;
  company_id: string;
  email: string;
  role_name: string;
  invited_by: string;
  invitation_token: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  notes?: string;
  created_at: string;
}

// Company member management
export interface CompanyMemberManagement {
  user_id: string;
  email: string;
  full_name: string;
  worker_type: string;
  current_role: string;
  available_roles: CompanyRole[];
  association_status: string;
  verification_status: string;
  start_date: string;
  end_date?: string;
  last_active?: string;
}

// Role change history
export interface RoleChangeHistory {
  id: string;
  user_id: string;
  company_id: string;
  old_role?: string;
  new_role: string;
  changed_by: string;
  change_reason?: string;
  effective_date: string;
  created_at: string;
}

// API Response types
export interface PermissionCheckResponse {
  has_permission: boolean;
  user_id: string;
  company_id: string;
  permission_key: string;
  role_name?: string;
}

export interface UserPermissionsResponse {
  user_id: string;
  company_id: string;
  permissions: Permission[];
  role_name: string;
  role_description?: string;
}

export interface RoleAssignmentResponse {
  association_id: string;
  user_id: string;
  company_id: string;
  role_name: string;
  status: string;
  approval_status: string;
  message: string;
}

// Error types for role management
export interface RoleManagementError {
  code: 'INSUFFICIENT_PERMISSIONS' | 'ROLE_NOT_FOUND' | 'USER_NOT_FOUND' | 'COMPANY_NOT_FOUND' | 'DUPLICATE_ASSIGNMENT' | 'INVALID_ROLE' | 'APPROVAL_REQUIRED';
  message: string;
  details?: any;
}

// Form types for role management UI
export interface CreateCompanyRoleForm {
  role_name: string;
  role_description: string;
  permissions: string[];
  is_system_role: boolean;
}

export interface AssignUserRoleForm {
  user_email: string;
  role_name: string;
  start_date: string;
  end_date?: string;
  auto_approve: boolean;
  notes?: string;
}

export interface InviteExternalWorkerForm {
  email: string;
  role_name: string;
  worker_type: 'contractor' | 'consultant' | 'temporary' | 'visitor';
  start_date: string;
  end_date?: string;
  notes?: string;
}

// Utility types for role hierarchies
export type RoleName = keyof typeof STANDARD_COMPANY_ROLES;
export type PermissionKey = string;
export type CategoryKey = keyof typeof PERMISSION_CATEGORIES;

// Enhanced auth context with multi-company support
export interface MultiCompanyAuthContext {
  user: UserCompanyRoleDetails | null;
  currentCompany: CompanyContext | null;
  availableCompanies: UserCompanyWithRole[];
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  switchCompany: (companyId: string) => Promise<void>;
  hasPermission: (permission: string, companyId?: string) => boolean;
  hasAnyPermission: (permissions: string[], companyId?: string) => boolean;
  hasRole: (role: string, companyId?: string) => boolean;
  getRoleLevel: (companyId?: string) => RoleLevel;
  refresh: () => Promise<void>;
}

