// Safety Joint Patrol Types
import type { User, Project, Company } from './index';

// Area interface (for project areas)
export interface Area {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RiskCategory {
  id: number;
  name: string;
  description?: string;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export interface RiskItem {
  id: number;
  name: string;
  category: 'equipment' | 'procedure' | 'environmental';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type PatrolType = 'scheduled' | 'random' | 'incident_followup';
export type RiskLevel = 'low' | 'medium' | 'high' | 'extremely_high';
export type RecommendedAction = 'monitor' | 'control' | 'mitigate' | 'stop_work';
export type PatrolStatus = 'open' | 'pending_verification' | 'closed' | 'rejected';
export type PatrolPriority = 'immediate' | 'high' | 'medium' | 'low';

export interface RiskAssessment {
  likelihood: 1 | 2 | 3 | 4;
  severity: 1 | 2 | 3 | 4;
  riskScore: number;
  riskLevel: RiskLevel;
  recommendedAction: RecommendedAction;
}

export interface SafetyPatrol {
  id: string;
  patrolNumber: string;
  patrolDate: string;
  patrolType: PatrolType;
  
  // Location & Context (Normalized Schema)
  project_id: string;        // Always required
  main_area_id: string;      // Always required
  sub_area1_id?: string;     // Optional
  sub_area2_id?: string;     // Optional
  
  // Legacy compatibility - can be populated via joins
  projectId?: string;
  project?: Project;
  areaId?: string;
  area?: Area;
  location?: string;
  specificLocation?: string; // Add specific location field
  
  // Issue Details
  title: string;
  description: string;
  remark?: string; // Additional remarks or notes about the observation
  
  // Risk Assessment (4x4 Matrix)
  likelihood: 1 | 2 | 3 | 4;
  severity: 1 | 2 | 3 | 4;
  riskScore: number;
  riskLevel: RiskLevel;
  recommendedAction: RecommendedAction;
  
  // Multi-select associations
  riskCategories: RiskCategory[];
  riskItems: RiskItem[];
  
  // Actions & Status
  immediateHazard: boolean;
  workStopped: boolean;
  
  // People & Companies
  inspectorId: string;
  inspector?: User;
  contractorId?: string;
  contractor?: Company;
  witnesses?: string[];
  
  // Compliance
  regulationReference?: string;
  legalRequirement: boolean;
  
  // Tracking
  status: PatrolStatus;
  priority: PatrolPriority;
  dueDate?: string;
  
  // Photos and Actions
  photos: SafetyPatrolPhoto[];
  correctiveActions: CorrectiveAction[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByUser?: User;
}

export type ActionType = 'immediate' | 'short_term' | 'long_term' | 'preventive';
export type ActionStatus = 'assigned' | 'in_progress' | 'completed' | 'verified' | 'overdue';

export interface CorrectiveAction {
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
  
  // Progress Tracking
  status: ActionStatus;
  progressPercentage: number;
  progressUpdates: ProgressUpdate[];
  
  // Verification
  verifiedBy?: string;
  verifiedByUser?: User;
  verificationDate?: string;
  verificationNotes?: string;
  
  // Cost & Resources
  estimatedCost?: number;
  actualCost?: number;
  resourcesRequired?: string[];
  
  // Photos
  completionPhotos: SafetyPatrolPhoto[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ProgressUpdate {
  id: string;
  actionId: string;
  updateText: string;
  description?: string; // For backward compatibility
  progressPercentage: number;
  updateDate: string;
  date?: string; // For backward compatibility
  updatedBy: string;
  updatedByUser?: User;
}

export type PhotoType = 'issue' | 'before' | 'after' | 'evidence';

export interface SafetyPatrolPhoto {
  id: string;
  patrolId?: string;
  actionId?: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  photoType: PhotoType;
  caption?: string;
  takenAt: string;
  takenBy: string;
  takenByUser?: User;
}

// Risk Matrix Configuration
export interface RiskMatrixCell {
  likelihood: 1 | 2 | 3 | 4;
  severity: 1 | 2 | 3 | 4;
  riskLevel: RiskLevel;
  color: string;
  action: string;
  escalationLevel: 'none' | 'supervisor' | 'manager' | 'executive';
  maxResponseTime: number; // hours
}

export const RISK_MATRIX: RiskMatrixCell[] = [
  // Green - Low Risk
  { likelihood: 1, severity: 1, riskLevel: 'low', color: '#22C55E', action: 'Monitor', escalationLevel: 'none', maxResponseTime: 168 },
  { likelihood: 1, severity: 2, riskLevel: 'low', color: '#22C55E', action: 'Monitor', escalationLevel: 'none', maxResponseTime: 168 },
  { likelihood: 2, severity: 1, riskLevel: 'low', color: '#22C55E', action: 'Monitor', escalationLevel: 'none', maxResponseTime: 168 },
  
  // Yellow - Medium Risk
  { likelihood: 1, severity: 3, riskLevel: 'medium', color: '#EAB308', action: 'Control', escalationLevel: 'supervisor', maxResponseTime: 72 },
  { likelihood: 2, severity: 2, riskLevel: 'medium', color: '#EAB308', action: 'Control', escalationLevel: 'supervisor', maxResponseTime: 72 },
  { likelihood: 3, severity: 1, riskLevel: 'medium', color: '#EAB308', action: 'Control', escalationLevel: 'supervisor', maxResponseTime: 72 },
  { likelihood: 1, severity: 4, riskLevel: 'medium', color: '#EAB308', action: 'Control', escalationLevel: 'supervisor', maxResponseTime: 72 },
  { likelihood: 4, severity: 1, riskLevel: 'medium', color: '#EAB308', action: 'Control', escalationLevel: 'supervisor', maxResponseTime: 72 },
  { likelihood: 2, severity: 3, riskLevel: 'medium', color: '#EAB308', action: 'Control', escalationLevel: 'supervisor', maxResponseTime: 72 }, // Score 6 - M
  { likelihood: 3, severity: 2, riskLevel: 'medium', color: '#EAB308', action: 'Control', escalationLevel: 'supervisor', maxResponseTime: 72 }, // Score 6 - M
  
  // Orange - High Risk  
  { likelihood: 2, severity: 4, riskLevel: 'high', color: '#F97316', action: 'Mitigate', escalationLevel: 'manager', maxResponseTime: 24 }, // Score 8 - H
  { likelihood: 4, severity: 2, riskLevel: 'high', color: '#F97316', action: 'Mitigate', escalationLevel: 'manager', maxResponseTime: 24 }, // Score 8 - H
  { likelihood: 3, severity: 3, riskLevel: 'high', color: '#F97316', action: 'Mitigate', escalationLevel: 'manager', maxResponseTime: 24 }, // Score 9 - H
  
  // Red - Extremely High Risk (12, 16)
  { likelihood: 3, severity: 4, riskLevel: 'extremely_high', color: '#EF4444', action: 'Stop Work', escalationLevel: 'executive', maxResponseTime: 1 }, // Score 12 - EH
  { likelihood: 4, severity: 3, riskLevel: 'extremely_high', color: '#EF4444', action: 'Stop Work', escalationLevel: 'executive', maxResponseTime: 1 }, // Score 12 - EH
  { likelihood: 4, severity: 4, riskLevel: 'extremely_high', color: '#EF4444', action: 'Stop Work', escalationLevel: 'executive', maxResponseTime: 1 }, // Score 16 - EH
];

// Utility functions
export const getRiskMatrixCell = (likelihood: number, severity: number): RiskMatrixCell | undefined => {
  return RISK_MATRIX.find(cell => cell.likelihood === likelihood && cell.severity === severity);
};

export const calculateRiskLevel = (likelihood: number, severity: number): RiskLevel => {
  const score = likelihood * severity;
  if (score >= 12) return 'extremely_high';  // 12, 16 are extremely high
  if (score >= 9) return 'high';   // 9 is high
  if (score >= 3) return 'medium'; // 3, 4, 6, 8 are medium
  return 'low';
};

export const getRecommendedAction = (likelihood: number, severity: number): RecommendedAction => {
  const score = likelihood * severity;
  if (score >= 12) return 'stop_work';   // 12, 16 need stop work
  if (score >= 9) return 'mitigate';     // 9 needs mitigation
  if (score >= 3) return 'control';   // Changed from 4 to 3
  return 'monitor';
};

// Form interfaces
export interface SafetyPatrolFormData {
  title: string;
  description: string;
  remark?: string; // Additional remarks or notes about the observation
  patrolType: PatrolType;
  projectId?: string;
  areaId?: string;
  
  // Normalized location IDs (new schema)
  project_id?: string;
  main_area_id?: string;
  sub_area1_id?: string;
  sub_area2_id?: string;
  
  // Legacy area fields (backward compatibility)
  mainArea: string;
  subArea1?: string;
  subArea2?: string;
  specificLocation?: string;
  
  // Area information object for proper storage
  areaInfo?: {
    selectedArea?: any;
    mainArea: string;
    subArea1: string;
    subArea2: string;
    fullAreaName: string;
  };
  
  likelihood: 1 | 2 | 3 | 4;
  severity: 1 | 2 | 3 | 4;
  riskCategoryIds: number[];
  riskItemIds: number[];
  immediateHazard: boolean;
  workStopped: boolean;
  contractorId?: string;
  witnesses?: string[];
  regulationReference?: string;
  legalRequirement: boolean;
}

export interface CorrectiveActionFormData {
  description: string;
  actionType: ActionType;
  rootCauseAnalysis?: string;
  assignedTo: string;
  dueDate: string;
  estimatedCost?: number;
  resourcesRequired?: string[];
}

// Filter and sort options
export interface SafetyPatrolFilters {
  status?: PatrolStatus[];
  riskLevel?: RiskLevel[];
  riskCategories?: number[];
  riskItems?: number[];
  projects?: string[];
  areas?: string[];
  dateFrom?: string;
  dateTo?: string;
  inspectors?: string[];
}

export type SafetyPatrolSortField = 'patrolDate' | 'riskLevel' | 'status' | 'area' | 'title';
export type SortDirection = 'asc' | 'desc';

export interface SafetyPatrolSort {
  field: SafetyPatrolSortField;
  direction: SortDirection;
}

// Safety Patrol Record for list displays
export interface SafetyPatrolRecord {
  id: string;
  patrolNumber: string;
  title: string;
  patrolDate: string;
  status: string;
  riskLevel: RiskLevel;
  area: string;
  inspectorName: string;
  issuesFound: number;
  correctiveActions: number;
  createdAt: string;
  updatedAt: string;
}
