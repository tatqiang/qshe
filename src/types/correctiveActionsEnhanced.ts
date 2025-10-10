// Enhanced Corrective Action Types with Approval Workflow and Photos
import type { User } from './index';
import type { ActionType, ProgressUpdate } from './safetyPatrol';

// =============================================================================
// ENHANCED ENUMS AND STATUS TYPES
// =============================================================================

export type ActionStatusEnhanced = 
  | 'draft'           // Initial creation
  | 'submitted'       // Submitted for approval
  | 'approved'        // Approved, ready for execution
  | 'rejected'        // Rejected, needs revision
  | 'in_progress'     // Being worked on
  | 'pending_review'  // Work completed, pending verification
  | 'completed'       // Verified and completed
  | 'overdue'         // Past due date
  | 'cancelled';      // Cancelled action

export type ApprovalLevel = 
  | 'supervisor'      // Direct supervisor approval
  | 'manager'         // Department manager approval
  | 'safety_officer'  // Safety officer approval
  | 'executive';      // Executive level approval

export type ActionPhotoType = 
  | 'planning'        // Planning phase photos
  | 'before'          // Before implementation
  | 'during'          // During implementation
  | 'after'           // After implementation
  | 'evidence'        // Evidence of completion
  | 'verification';   // Verification photos

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationType = 
  | 'approval_request'
  | 'approval_reminder'
  | 'escalation'
  | 'work_assignment'
  | 'due_date_reminder'
  | 'completion_request'
  | 'verification_request';

// =============================================================================
// CORRECTIVE ACTION APPROVAL WORKFLOW
// =============================================================================

export interface CorrectiveActionApproval {
  id: string;
  actionId: string;
  
  // Approval Flow
  approvalLevel: ApprovalLevel;
  requiredApproverRole: string;
  approverId?: string;
  approver?: User;
  approvalStatus: ApprovalStatus;
  
  // Approval Details
  approvalDate?: string;
  rejectionReason?: string;
  approvalNotes?: string;
  conditions?: string;
  
  // Workflow Order
  sequenceOrder: number;
  isFinalApproval: boolean;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// CORRECTIVE ACTION PHOTOS WITH WORKFLOW PHASES
// =============================================================================

export interface CorrectiveActionPhoto {
  id: string;
  actionId: string;
  
  // R2 Storage information
  r2Bucket: string;
  r2Key: string;
  r2Url: string;
  
  // File metadata
  filename: string;
  originalFilename?: string;
  fileSize?: number;
  mimeType?: string;
  
  // Photo classification
  photoType: ActionPhotoType;
  phase?: string;
  
  // Photo information
  caption?: string;
  locationDescription?: string;
  
  // Workflow context
  sequenceOrder: number;
  takenBy?: string;
  takenByUser?: User;
  takenAt: string;
  approvedBy?: string;
  approvedByUser?: User;
  approvedAt?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// WORKFLOW TRACKING
// =============================================================================

export interface CorrectiveActionWorkflow {
  id: string;
  actionId: string;
  
  // Current Status
  currentStatus: ActionStatusEnhanced;
  currentStage: string;
  nextRequiredAction: string;
  
  // Workflow Progress
  submissionDate?: string;
  approvalStartedDate?: string;
  approvalCompletedDate?: string;
  workStartedDate?: string;
  workCompletedDate?: string;
  verificationDate?: string;
  
  // Automated Flags
  requiresSafetyApproval: boolean;
  requiresManagerApproval: boolean;
  requiresExecutiveApproval: boolean;
  highRiskAction: boolean;
  
  // SLA Tracking
  daysInApproval: number;
  daysInProgress: number;
  isOverdue: boolean;
  escalationLevel: number;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// NOTIFICATIONS AND ESCALATIONS
// =============================================================================

export interface CorrectiveActionNotification {
  id: string;
  actionId: string;
  
  // Notification Details
  notificationType: NotificationType;
  recipientId: string;
  recipient?: User;
  recipientRole?: string;
  
  // Message Content
  title: string;
  message: string;
  priority: NotificationPriority;
  
  // Delivery Status
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  acknowledgedAt?: string;
  
  // Scheduling
  scheduledFor?: string;
  autoEscalateAfter?: string; // ISO duration
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// ENHANCED CORRECTIVE ACTION INTERFACE
// =============================================================================

export interface CorrectiveActionEnhanced {
  id: string;
  patrolId: string;
  actionNumber: string;
  
  // Action Details
  description: string;
  actionType: ActionType;
  rootCauseAnalysis?: string;
  
  // Responsibility & Timeline
  assignedTo: string;
  assignedToUser?: User;
  assignedDate: string;
  dueDate: string;
  
  // Enhanced Status with Workflow
  status: ActionStatusEnhanced;
  workflow?: CorrectiveActionWorkflow;
  
  // Progress Tracking
  progressPercentage: number;
  progressUpdates: ProgressUpdate[];
  
  // Approval Workflow
  approvals: CorrectiveActionApproval[];
  currentApprovalLevel?: ApprovalLevel;
  pendingApprovals: CorrectiveActionApproval[];
  
  // Verification
  verifiedBy?: string;
  verifiedByUser?: User;
  verificationDate?: string;
  verificationNotes?: string;
  
  // Cost & Resources
  estimatedCost?: number;
  actualCost?: number;
  resourcesRequired?: string[];
  
  // Enhanced Photos with Workflow Phases
  photos: CorrectiveActionPhoto[];
  planningPhotos: CorrectiveActionPhoto[];
  beforePhotos: CorrectiveActionPhoto[];
  duringPhotos: CorrectiveActionPhoto[];
  afterPhotos: CorrectiveActionPhoto[];
  evidencePhotos: CorrectiveActionPhoto[];
  verificationPhotos: CorrectiveActionPhoto[];
  
  // Notifications
  notifications: CorrectiveActionNotification[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByUser?: User;
}

// =============================================================================
// FORM DATA INTERFACES
// =============================================================================

export interface CorrectiveActionFormDataEnhanced {
  description: string;
  actionType: ActionType;
  rootCauseAnalysis?: string;
  
  // Assignment
  assignedTo: string;
  dueDate: string;
  
  // Cost and Resources
  estimatedCost?: number;
  resourcesRequired?: string[];
  
  // Initial photos (planning phase)
  planningPhotos?: File[];
  
  // Risk assessment for approval workflow
  riskLevel?: 'low' | 'medium' | 'high' | 'extremely_high';
  requiresImmediateAction?: boolean;
}

export interface ApprovalFormData {
  decision: 'approved' | 'rejected';
  notes?: string;
  conditions?: string;
  rejectionReason?: string;
}

export interface PhotoUploadData {
  actionId: string;
  photoType: ActionPhotoType;
  phase?: string;
  files: File[];
  captions?: string[];
  locationDescription?: string;
}

// =============================================================================
// WORKFLOW MANAGEMENT INTERFACES
// =============================================================================

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'skipped';
  approvalLevel?: ApprovalLevel;
  estimatedDuration?: number; // in hours
  actualDuration?: number;
  assigneeRole?: string;
  isRequired: boolean;
  canSkip: boolean;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  riskLevel: string;
  costThreshold?: number;
  steps: WorkflowStep[];
  autoApprovalRules?: Array<{
    condition: string;
    action: string;
  }>;
}

export interface ApprovalMatrix {
  riskLevel: string;
  costRange: {
    min: number;
    max: number;
  };
  requiredApprovals: ApprovalLevel[];
  autoEscalationDays: number;
  skipWeekends: boolean;
}

// =============================================================================
// API RESPONSE INTERFACES
// =============================================================================

export interface CorrectiveActionCreationResult {
  success: boolean;
  action?: CorrectiveActionEnhanced;
  workflowId?: string;
  approvalWorkflow?: CorrectiveActionApproval[];
  errors?: string[];
  warnings?: string[];
}

export interface ApprovalResult {
  success: boolean;
  nextApprovalLevel?: ApprovalLevel;
  isCompletelyApproved?: boolean;
  workflowUpdated?: boolean;
  notificationsSent?: number;
  errors?: string[];
}

export interface PhotoUploadResult {
  success: boolean;
  uploadedPhotos?: CorrectiveActionPhoto[];
  failedUploads?: Array<{
    filename: string;
    error: string;
  }>;
  totalUploaded: number;
  totalFailed: number;
}

// =============================================================================
// DASHBOARD AND REPORTING INTERFACES
// =============================================================================

export interface CorrectiveActionDashboardData {
  totalActions: number;
  pendingApproval: number;
  inProgress: number;
  overdue: number;
  completedThisMonth: number;
  
  // Approval Statistics
  averageApprovalTime: number; // in days
  rejectionRate: number; // percentage
  escalationRate: number; // percentage
  
  // Recent Activity
  recentActions: CorrectiveActionEnhanced[];
  pendingMyApproval: CorrectiveActionEnhanced[];
  myAssignedActions: CorrectiveActionEnhanced[];
  
  // Charts Data
  statusDistribution: Array<{
    status: ActionStatusEnhanced;
    count: number;
    percentage: number;
  }>;
  
  completionTrends: Array<{
    period: string;
    completed: number;
    created: number;
  }>;
}

export interface CorrectiveActionFilters {
  status?: ActionStatusEnhanced[];
  actionType?: ActionType[];
  assignedTo?: string[];
  approvalLevel?: ApprovalLevel[];
  riskLevel?: string[];
  dueDate?: {
    from?: string;
    to?: string;
  };
  createdDate?: {
    from?: string;
    to?: string;
  };
  hasPhotos?: boolean;
  isOverdue?: boolean;
  projectId?: string;
}

// Re-export common types from safetyPatrol.ts that are still needed
// export type { ActionType, ProgressUpdate } from './safetyPatrol';
