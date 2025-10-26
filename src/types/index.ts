// Database Types (matching your improved Supabase schema)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string | null;
          first_name: string | null;
          last_name: string | null;
          first_name_thai: string | null;
          last_name_thai: string | null;
          nationality: string | null; // Added nationality field
          user_type: 'internal' | 'external'; // Removed 'worker' - only organizational types
          status: 'invited' | 'pending_completion' | 'active' | 'inactive' | 'suspended' | 'expired';
          role: 'system_admin' | 'admin' | 'member' | 'registrant'; // Changed 'worker' to 'registrant'
          position_id: number | null;
          face_descriptors: any | null;
          profile_photo_url: string | null;
          company_id: string | null;
          invitation_token: string | null;
          invited_by: string | null;
          invitation_expires_at: string | null;
          profile_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          username?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          first_name_thai?: string | null;
          last_name_thai?: string | null;
          nationality?: string | null; // Added nationality field
          user_type?: 'internal' | 'external'; // Removed 'worker' - only organizational types
          status?: 'invited' | 'pending_completion' | 'active' | 'inactive' | 'suspended' | 'expired';
          role?: 'system_admin' | 'admin' | 'member' | 'registrant'; // Changed 'worker' to 'registrant'
          position_id?: number | null;
          face_descriptors?: any | null;
          profile_photo_url?: string | null;
          company_id?: string | null;
          invitation_token?: string | null;
          invited_by?: string | null;
          invitation_expires_at?: string | null;
          profile_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          first_name_thai?: string | null;
          last_name_thai?: string | null;
          nationality?: string | null; // Added nationality field
          user_type?: 'internal' | 'external'; // Removed 'worker' - only organizational types
          status?: 'invited' | 'pending_completion' | 'active' | 'inactive' | 'suspended' | 'expired';
          role?: 'system_admin' | 'admin' | 'member' | 'registrant'; // Changed 'worker' to 'registrant'
          position_id?: number | null;
          face_descriptors?: any | null;
          profile_photo_url?: string | null;
          company_id?: string | null;
          invitation_token?: string | null;
          invited_by?: string | null;
          invitation_expires_at?: string | null;
          profile_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      companies: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          contact_person: string | null;
          contact_email: string | null;
          status: 'active' | 'inactive';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          contact_person?: string | null;
          contact_email?: string | null;
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          contact_person?: string | null;
          contact_email?: string | null;
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
        };
      };
      pre_registrations: {
        Row: {
          id: string;
          email: string;
          user_type: 'internal' | 'external';
          invited_by: string;
          status: 'pending' | 'registered' | 'expired';
          invitation_token: string;
          expires_at: string;
          created_at: string;
          registered_at: string | null;
          registered_user_id: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          user_type: 'internal' | 'external';
          invited_by: string;
          status?: 'pending' | 'registered' | 'expired';
          invitation_token: string;
          expires_at: string;
          created_at?: string;
          registered_at?: string | null;
          registered_user_id?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          user_type?: 'internal' | 'external';
          invited_by?: string;
          status?: 'pending' | 'registered' | 'expired';
          invitation_token?: string;
          expires_at?: string;
          created_at?: string;
          registered_at?: string | null;
          registered_user_id?: string | null;
        };
      };
      projects: {
        Row: {
          id: string;
          project_code: string;
          name: string;
          description: string | null;
          project_start: string | null;
          project_end: string | null;
          status: 'active' | 'completed' | 'on_hold' | 'extended' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_code: string;
          name: string;
          description?: string | null;
          project_start?: string | null;
          project_end?: string | null;
          status?: 'active' | 'completed' | 'on_hold' | 'extended' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_code?: string;
          name?: string;
          description?: string | null;
          project_start?: string | null;
          project_end?: string | null;
          status?: 'active' | 'completed' | 'on_hold' | 'extended' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
      };
      project_areas: {
        Row: {
          id: string;
          project_id: string;
          area_code: string;
          area_name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
          created_by: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          area_code: string;
          area_name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          area_code?: string;
          area_name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string;
        };
      };
      punch_list: {
        Row: {
          id: string;
          project_id: string;
          area_id: string | null;
          punch_list_number: string;
          title: string;
          description: string | null;
          location: string | null;
          severity: 'high' | 'medium' | 'low';
          status: 'open' | 'in_progress' | 'closed';
          assignee_id: string | null;
          reporter_id: string;
          created_at: string;
          updated_at: string;
          closed_at: string | null;
          closed_by: string | null;
          correction_note: string | null;
          correction_completed_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          area_id?: string | null;
          punch_list_number?: string;
          title: string;
          description?: string | null;
          location?: string | null;
          severity?: 'high' | 'medium' | 'low';
          status?: 'open' | 'in_progress' | 'closed';
          assignee_id?: string | null;
          reporter_id: string;
          created_at?: string;
          updated_at?: string;
          closed_at?: string | null;
          closed_by?: string | null;
          correction_note?: string | null;
          correction_completed_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          area_id?: string | null;
          punch_list_number?: string;
          title?: string;
          description?: string | null;
          location?: string | null;
          severity?: 'high' | 'medium' | 'low';
          status?: 'open' | 'in_progress' | 'closed';
          assignee_id?: string | null;
          reporter_id?: string;
          created_at?: string;
          updated_at?: string;
          closed_at?: string | null;
          closed_by?: string | null;
          correction_note?: string | null;
          correction_completed_at?: string | null;
        };
      };
      punch_list_photos: {
        Row: {
          id: string;
          punch_list_id: string;
          photo_type: 'issue' | 'correction';
          file_name: string;
          file_path: string;
          file_size: number | null;
          original_name: string | null;
          annotations: any | null;
          created_at: string;
          created_by: string;
        };
        Insert: {
          id?: string;
          punch_list_id: string;
          photo_type?: 'issue' | 'correction';
          file_name: string;
          file_path: string;
          file_size?: number | null;
          original_name?: string | null;
          annotations?: any | null;
          created_at?: string;
          created_by?: string;
        };
        Update: {
          id?: string;
          punch_list_id?: string;
          photo_type?: 'issue' | 'correction';
          file_name?: string;
          file_path?: string;
          file_size?: number | null;
          original_name?: string | null;
          annotations?: any | null;
          created_at?: string;
          created_by?: string;
        };
      };
      form_templates: {
        Row: {
          id: string;
          code: string;
          name: string;
          name_th: string | null;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          name_th?: string | null;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          name_th?: string | null;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
      };
      member_application_tokens: {
        Row: {
          id: string;
          token: string;
          project_id: string;
          form_template_id: string;
          company_id: string;
          expires_at: string;
          max_uses: number;
          current_uses: number;
          is_active: boolean;
          revoked_at: string | null;
          revoked_by: string | null;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          token: string;
          project_id: string;
          form_template_id: string;
          company_id: string;
          expires_at: string;
          max_uses?: number;
          current_uses?: number;
          is_active?: boolean;
          revoked_at?: string | null;
          revoked_by?: string | null;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          token?: string;
          project_id?: string;
          form_template_id?: string;
          company_id?: string;
          expires_at?: string;
          max_uses?: number;
          current_uses?: number;
          is_active?: boolean;
          revoked_at?: string | null;
          revoked_by?: string | null;
          created_at?: string;
          created_by?: string | null;
        };
      };
      member_applications: {
        Row: {
          id: string;
          token_id: string | null;
          submission_number: string;
          form_template_id: string;
          project_id: string;
          company_id: string;
          status: 'draft' | 'submitted' | 'approved' | 'rejected';
          form_data: any; // JSONB
          submitted_at: string | null;
          approved_at: string | null;
          approved_by: string | null;
          rejected_at: string | null;
          rejected_by: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          token_id?: string | null;
          submission_number?: string;
          form_template_id: string;
          project_id: string;
          company_id: string;
          status?: 'draft' | 'submitted' | 'approved' | 'rejected';
          form_data?: any;
          submitted_at?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          token_id?: string | null;
          submission_number?: string;
          form_template_id?: string;
          project_id?: string;
          company_id?: string;
          status?: 'draft' | 'submitted' | 'approved' | 'rejected';
          form_data?: any;
          submitted_at?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Role levels for system permissions (simplified to 4 core roles)
export type UserRole = 
  | 'system_admin'
  | 'admin' 
  | 'member'
  | 'worker'
  | 'qshe_manager'; // Add this for backward compatibility

// Authority levels for approvals and permissions
export type AuthorityLevel = 
  | 'supervisor'
  | 'project_manager'
  | 'site_manager'
  | 'qshe_manager';

// Position information from positions table
export interface Position {
  id: number;
  level: number;
  positionTitle: string;
  code: string;
  type: 'internal' | 'external';
  createdAt: string;
  updatedAt: string;
}

// User Management Types  
export interface User {
  id: string;
  email: string;
  username?: string; // Required for internal users, optional for external users
  firstName: string | null;
  lastName: string | null;
  full_name?: string; // Computed property for backward compatibility
  displayName?: string; // Computed property for backward compatibility
  userType: 'internal' | 'external'; // Removed 'worker' - now only organizational types
  status: 'invited' | 'pending_completion' | 'active' | 'inactive' | 'suspended' | 'expired';
  role: UserRole;
  positionId?: number;
  positionTitle?: string; // From join with positions table
  positionCode?: string;  // From join with positions table
  positionLevel?: number; // From join with positions table
  faceDescriptors?: Float32Array[];
  profilePhotoUrl?: string;
  companyId?: string;
  invitationToken?: string;
  invitedBy?: string;
  invitationExpiresAt?: string;
  profileCompletedAt?: string; // Renamed from registrationCompletedAt
  createdAt: string;
  updatedAt: string;
}

export interface UserRegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username?: string; // Optional - will be generated from email if not provided
  positionId: number;
  userType: 'internal' | 'external'; // Removed 'worker' - now only organizational types
  role?: UserRole; // Optional, defaults to 'member'
  companyId?: string;
}

// New interface for admin user creation (replaces pre-registration)
export interface AdminUserCreationData {
  email: string;
  username?: string; // Required for internal users
  firstName?: string;
  lastName?: string;
  firstNameThai?: string;
  lastNameThai?: string;
  nationality?: string; // Added nationality field
  userType: 'internal' | 'external'; // Removed 'worker' - now only organizational types
  role?: UserRole;
  positionId?: number;
  companyId?: string;
  phone?: string;
}

// Interface for user self-service profile completion
export interface UserProfileCompletionData {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  password: string;
  confirmPassword: string;
  profilePhotoUrl?: string;
  faceDescriptors?: Float32Array[];
}

// Project Member with position-specific info
export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  positionId: number;
  role: UserRole;
  assignedAt: string;
  assignedBy?: string;
  status: 'active' | 'inactive' | 'removed';
  createdAt: string;
  updatedAt: string;
  // Populated from joins
  user?: User;
  position?: Position;
}

// Project Management Types
export interface Project {
  id: string;
  project_code: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'inactive';
  project_manager_id?: string;
  created_at: string;
  updated_at: string;
}

// Company Management Types
export interface Company {
  id: string;
  name: string;
  address?: string;
  contactPerson?: string;
  contactEmail?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// Safety Patrol Types
export interface Patrol {
  id: string;
  projectId: string;
  title: string;
  date: string;
  status: 'draft' | 'submitted' | 'completed';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  creator?: User;
}

export interface PatrolIssue {
  id: string;
  patrolId: string;
  title: string;
  description?: string;
  location?: string;
  severity: 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'closed';
  assigneeId?: string;
  reporterId: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  closedBy?: string;
  assignee?: User;
  reporter?: User;
  photos?: IssuePhoto[];
}

export interface IssuePhoto {
  id: string;
  issueId: string;
  type: 'before' | 'after';
  fileName: string;
  filePath: string;
  annotations?: string; // JSON string of annotation data
  createdAt: string;
  createdBy: string;
}

// File Management Types
export interface FileMetadata {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  entityType: 'user' | 'patrol' | 'meeting';
  entityId: string;
  createdAt: string;
  createdBy: string;
  url?: string; // Presigned URL for access
}

// Project Areas Types (Normalized Schema)
export interface MainArea {
  id: string;
  project_id: string;
  name: string;
  code?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface SubArea1 {
  id: string;
  project_id: string;        // Redundant for performance
  main_area_id: string;
  name: string;
  code?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  // Related data (populated via joins when needed)
  main_area?: MainArea;
}

export interface SubArea2 {
  id: string;
  project_id: string;        // Redundant for performance
  main_area_id: string;      // Redundant for performance
  sub_area1_id: string;
  name: string;
  code?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  // Related data (populated via joins when needed)
  main_area?: MainArea;
  sub_area1?: SubArea1;
}

// Legacy interface for backward compatibility during migration
export interface ProjectArea {
  id: string;
  projectId: string;
  areaCode: string;
  areaName: string;
  subArea1Code?: string;     // Optional sub area (e.g., room number)
  subArea1Name?: string;     // Optional sub area name
  subArea2Code?: string;     // Optional deeper sub area
  subArea2Name?: string;     // Optional deeper sub area name
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Punch List Types (QC focused, separate from safety patrol)
export interface PunchListItem {
  id: string;
  projectId: string;
  areaId?: string;
  area?: ProjectArea;
  punchListNumber: string; // Auto-generated number like "PL-001"
  title: string;
  description?: string;
  location?: string;
  severity: 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'closed';
  assigneeId?: string;
  issuedBy: string;       // Who reported/issued this defect (logged in user)
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  closedBy?: string;
  correctionNote?: string;
  correctionCompletedAt?: string;
  assignee?: User;
  issuedByUser?: User;    // User who issued the defect with name and avatar
  photos?: PunchListPhoto[];
}

export interface PunchListPhoto {
  id: string;
  punchListId: string;
  photoType: 'issue' | 'correction';
  fileName: string;
  filePath: string;
  fileSize?: number;
  originalName?: string;
  annotations?: string; // JSON string of annotation data
  createdAt: string;
  createdBy: string;
}

// Authentication Types
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  userDetails?: User;
}

export interface LoginCredentials {
  username?: string;
  email?: string;
  password: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  registrationSuccess: boolean;
}

// Pre-registration Types
export interface PreRegistration {
  id: string;
  email: string;
  userType: 'internal' | 'external';
  invitedBy: string;
  status: 'pending' | 'registered' | 'expired';
  invitationToken: string;
  expiresAt: string;
  createdAt: string;
  registeredAt?: string;
  invitedByUser?: User;
}

export interface PreRegistrationData {
  email: string;
  userType: 'internal' | 'external';
}

// Sync Types
export interface SyncQueueItem {
  id: number;
  entityType: string;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retries: number;
  error?: string;
}

export interface MediaQueueItem {
  id: number;
  entityType: string;
  entityId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadStatus: 'pending' | 'processing' | 'completed' | 'failed';
  remoteUrl?: string;
  retries: number;
  error?: string;
  createdAt: string;
}

// UI Types
export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  children?: NavigationItem[];
}

export interface UIState {
  isDesktop: boolean;
  sidebarOpen: boolean;
  currentProject: Project | null;
  isOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'error';
  pendingSyncCount: number;
}

// Face Recognition Types
export interface FaceDetection {
  detection: any; // TensorFlow.js detection result
  landmarks: any; // Face landmarks
  descriptor: Float32Array; // Face descriptor for comparison
}

export interface FaceRegistrationStep {
  angle: 'front' | 'left' | 'right' | 'up' | 'down';
  completed: boolean;
  descriptor?: Float32Array;
}

// Form Types
export interface FormErrors {
  [key: string]: string | undefined;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}
