// ============================================
// SAFETY AUDIT MODULE - TYPESCRIPT TYPES
// ============================================
// Generated from safety_audit_schema_v3_multi_category.sql
// Version: 3.0 - Multi-Category Support
// Date: October 16, 2025
// ============================================

// ============================================
// ENUMS & CONSTANTS
// ============================================

export const AuditStatus = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  REVIEWED: 'reviewed',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type AuditStatus = typeof AuditStatus[keyof typeof AuditStatus];

export const ScoreValue = {
  NON_COMPLIANT: 0,
  MINIMAL: 1,
  PARTIAL: 2,
  COMPLIANT: 3,
  NA: null,
} as const;

export type ScoreValue = typeof ScoreValue[keyof typeof ScoreValue];

export const ScoreLabel = {
  NON_COMPLIANT: 'non_compliant',
  MINIMAL: 'minimal',
  PARTIAL: 'partial',
  COMPLIANT: 'compliant',
  NA: 'n/a',
} as const;

export type ScoreLabel = typeof ScoreLabel[keyof typeof ScoreLabel];

export const SCORE_OPTIONS = [
  { value: 3, label: 'Compliant', label_th: 'เป็นไปตามข้อกำหนด', color: 'green' },
  { value: 2, label: 'Partial', label_th: 'เป็นไปตามข้อกำหนดบางส่วน', color: 'yellow' },
  { value: 1, label: 'Minimal', label_th: 'เป็นไปตามข้อกำหนดเล็กน้อย', color: 'orange' },
  { value: 0, label: 'Non-Compliant', label_th: 'ไม่เป็นไปตามข้อกำหนด', color: 'red' },
  { value: null, label: 'N/A', label_th: 'ไม่เกี่ยวข้อง', color: 'gray' },
] as const;

export const AUDIT_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', label_th: 'ร่าง', color: 'gray' },
  { value: 'submitted', label: 'Submitted', label_th: 'ส่งแล้ว', color: 'blue' },
  { value: 'reviewed', label: 'Reviewed', label_th: 'ตรวจสอบแล้ว', color: 'purple' },
  { value: 'approved', label: 'Approved', label_th: 'อนุมัติ', color: 'green' },
  { value: 'rejected', label: 'Rejected', label_th: 'ไม่อนุมัติ', color: 'red' },
] as const;

// ============================================
// DATABASE TABLE TYPES
// ============================================

export type SafetyAuditCategory = {
  id: string;
  category_code: string;
  category_id: string;
  name_th: string;
  name_en: string | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SafetyAuditRequirementRevision = {
  id: string;
  category_id: string;
  revision_number: number;
  effective_date: string;
  is_active: boolean;
  approved_by: string | null;
  approval_date: string | null;
  change_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SafetyAuditRequirement = {
  id: string;
  revision_id: string;
  item_number: number;
  description_th: string;
  description_en: string | null;
  criteria_th: string;
  criteria_en: string | null;
  weight: number; // 1-5
  display_order: number;
  is_optional: boolean;
  created_at: string;
  updated_at: string;
};

// ============================================
// V3: Category Score Structure
// ============================================
export type CategoryScore = {
  total_score: number;
  max_score: number;
  weighted_avg: number;
  percentage: number;
  item_count: number;
  na_count: number;
};

export type SafetyAudit = {
  id: string;
  audit_number: string;
  
  // Location
  project_id: string | null;
  main_area_id: string | null;
  sub_area1_id: string | null;
  sub_area2_id: string | null;
  main_area: string | null;
  sub_area1: string | null;
  sub_area2: string | null;
  specific_location: string | null;
  area_info: Record<string, any> | null; // JSONB
  
  // Audit Info (V3 CHANGES)
  // REMOVED: category_id (one audit = all categories)
  // REMOVED: revision_id (moved to audit_criteria_rev)
  audit_date: string;
  auditor_id: string | null;
  activity: string | null; // Activity being audited in the area
  number_of_personnel: number | null;
  
  // V3 NEW: Track revision per category
  audit_criteria_rev: Record<string, number>; // {"cat01": 0, "cat02": 1}
  
  // V3 NEW: Per-category scores
  category_scores: Record<string, CategoryScore>; // {"cat01": {...}, "cat02": {...}}
  
  // Scores (Overall)
  total_score: number | null;
  max_possible_score: number | null;
  weighted_average: number | null;
  percentage_score: number | null;
  
  // Status
  status: AuditStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  
  // Metadata
  created_by: string | null; // Flexible identifier: UUID | email | azure:id | username
  created_by_name: string | null; // Display name (cached)
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
};

export type SafetyAuditCompany = {
  id: string;
  audit_id: string;
  company_id: string;
  personnel_count: number | null;
  primary_company: boolean;
  notes: string | null;
  created_at: string;
};

export type SafetyAuditResult = {
  id: string;
  audit_id: string;
  category_id: string; // V3 NEW: For filtering by category tabs
  requirement_id: string;
  score: number | null; // 0, 1, 2, 3, or null
  score_label: ScoreLabel;
  comment: string | null;
  weighted_score: number | null;
  created_at: string;
  updated_at: string;
};

export type SafetyAuditPhoto = {
  id: string;
  audit_id: string;
  category_id: string | null; // V3 NEW: Photos organized per category
  requirement_id: string | null;
  photo_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  latitude: number | null;
  longitude: number | null;
  taken_at: string;
  uploaded_by: string | null;
  display_order: number;
  created_at: string;
};

// ============================================
// EXTENDED TYPES (WITH RELATIONS)
// ============================================

export type SafetyAuditRequirementWithDetails = SafetyAuditRequirement & {
  revision?: SafetyAuditRequirementRevision;
  category?: SafetyAuditCategory;
};

export type SafetyAuditResultWithRequirement = SafetyAuditResult & {
  requirement?: SafetyAuditRequirementWithDetails;
};

export type SafetyAuditWithRelations = SafetyAudit & {
  // V3 REMOVED: category, revision (one audit = all categories)
  auditor?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
  project?: {
    id: string;
    name: string;
  };
  companies?: Array<{
    id: string;
    audit_id: string;
    company_id: string;
    personnel_count: number | null;
    primary_company: boolean;
    company?: {
      id: string;
      name: string;
      name_th: string | null;
    };
  }>;
  results?: SafetyAuditResultWithRequirement[];
  photos?: SafetyAuditPhoto[];
  
  // V3 NEW: Helper to get results by category
  resultsByCategory?: Record<string, SafetyAuditResultWithRequirement[]>;
  photosByCategory?: Record<string, SafetyAuditPhoto[]>;
};

export type SafetyAuditSummary = {
  id: string;
  audit_number: string;
  audit_date: string;
  number_of_personnel: number | null;
  status: AuditStatus;
  
  // V3 REMOVED: category_code, category_name (one audit = all categories)
  
  // Project
  project_name: string | null;
  
  // Companies
  company_names: string[];
  companies_text: string;
  
  // V3 NEW: Multi-category scores
  category_scores: Record<string, CategoryScore>;
  audit_criteria_rev: Record<string, number>;
  categories_audited: number; // Count of categories with results
  
  // Scores (Overall)
  weighted_average: number | null;
  percentage_score: number | null;
  total_score: number | null;
  max_possible_score: number | null;
  requirements_scored: number; // Total across all categories
  
  // Auditor
  auditor_name: string | null;
  auditor_first_name: string | null;
  auditor_last_name: string | null;
  
  // Timestamps
  created_at: string;
  submitted_at: string | null;
};

// ============================================
// FORM & UI TYPES (V3)
// ============================================

export type SafetyAuditFormData = {
  // Basic Info (Header Section)
  audit_date: string;
  project_id: string;
  // V3 REMOVED: category_id (form covers all categories)
  
  // Location
  main_area_id: string | null;
  sub_area1_id: string | null;
  sub_area2_id: string | null;
  main_area: string | null;
  sub_area1: string | null;
  sub_area2: string | null;
  specific_location: string | null;
  
  // Audit Details
  activity: string | null; // Activity being audited in the area
  number_of_personnel: number | null;
  company_ids: string[]; // Multiple companies
  
  // User Info (who created this audit)
  created_by: string | null; // User ID (UUID, email, or Azure AD ID)
  created_by_name: string | null; // Display name for caching
  
  // V3 NEW: Results per category
  // Format: { "cat01": [...], "cat02": [...] }
  resultsByCategory: Record<string, {
    requirement_id: string;
    category_id: string;
    score: number | null;
    comment: string | null;
  }[]>;
  
  // V3 NEW: Track which revision was used per category
  audit_criteria_rev: Record<string, number>;
  
  // V3 NEW: Photos per category
  photosByCategory: Record<string, (File | string)[]>;
};

export type AuditScoreCalculation = {
  total_score: number;
  max_possible_score: number;
  weighted_average: number;
  percentage_score: number;
  scored_items: number;
  total_items: number;
  na_items: number;
};

export type CategoryWithRevision = SafetyAuditCategory & {
  active_revision?: SafetyAuditRequirementRevision & {
    requirements?: SafetyAuditRequirement[];
  };
};

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export type CreateAuditRequest = {
  audit_date: string;
  project_id: string;
  // V3 REMOVED: category_id, revision_id (handled per category)
  main_area_id?: string | null;
  sub_area1_id?: string | null;
  sub_area2_id?: string | null;
  main_area?: string | null;
  sub_area1?: string | null;
  sub_area2?: string | null;
  specific_location?: string | null;
  activity?: string | null; // V3: Activity description
  number_of_personnel?: number | null;
  company_ids: string[];
  auditor_id?: string;
  // V3 NEW: Track revision per category
  audit_criteria_rev: Record<string, number>;
  // Calculated scores
  total_score?: number;
  max_possible_score?: number;
  weighted_average?: number;
  percentage_score?: number;
  category_scores?: Record<string, any>;
};

export type CreateAuditResponse = {
  audit: SafetyAudit;
  audit_number: string;
};

export type UpdateAuditResultRequest = {
  audit_id: string;
  requirement_id: string;
  score: number | null;
  comment?: string | null;
};

export type SubmitAuditRequest = {
  audit_id: string;
  results: {
    requirement_id: string;
    score: number | null;
    comment?: string | null;
  }[];
};

export type UploadAuditPhotoRequest = {
  audit_id: string;
  requirement_id?: string | null;
  file: File;
  caption?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

// ============================================
// FILTER & QUERY TYPES
// ============================================

export type SafetyAuditFilters = {
  project_id?: string;
  category_id?: string;
  status?: AuditStatus | AuditStatus[];
  auditor_id?: string;
  company_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string; // Search audit_number or location
  min_score?: number;
  max_score?: number;
};

export type SafetyAuditSortField = 
  | 'audit_date' 
  | 'audit_number' 
  | 'percentage_score' 
  | 'created_at' 
  | 'status';

export type SafetyAuditSortOrder = 'asc' | 'desc';

export type SafetyAuditQueryOptions = {
  filters?: SafetyAuditFilters;
  sort_by?: SafetyAuditSortField;
  sort_order?: SafetyAuditSortOrder;
  page?: number;
  page_size?: number;
};

// ============================================
// UTILITY TYPES
// ============================================

export type ScoreColor = 'green' | 'yellow' | 'orange' | 'red' | 'gray';

export type RequirementScore = {
  requirement: SafetyAuditRequirement;
  score: number | null;
  score_label: ScoreLabel;
  weighted_score: number | null;
  comment: string | null;
};

// CategoryScore moved to line 103 (v3 version)

// ============================================
// V3: ACTIVE REQUIREMENTS VIEW TYPE
// ============================================

export type ActiveAuditRequirement = {
  category_id: string; // UUID
  category_code: string; // 'A', 'B', 'C', etc.
  category_identifier: string; // 'cat01', 'cat02', etc.
  category_name_th: string;
  category_name_en: string | null;
  revision_id: string;
  revision_number: number;
  effective_date: string;
  requirement_id: string;
  item_number: number;
  description_th: string;
  description_en: string | null;
  criteria_th: string;
  criteria_en: string | null;
  weight: number;
  display_order: number;
  is_optional: boolean;
};

// Helper to group requirements by category
export type RequirementsByCategory = Record<string, ActiveAuditRequirement[]>;

// ============================================
// HELPER FUNCTIONS TYPE
// ============================================

export type CalculateScoresFn = (
  requirements: SafetyAuditRequirement[],
  results: Map<string, { score: number | null; comment: string | null }>
) => AuditScoreCalculation;

export type GetScoreColorFn = (score: number | null) => ScoreColor;

export type GetScoreLabelFn = (score: number | null) => string;

export type GenerateAuditNumberFn = () => Promise<string>;

// ============================================
// EXPORTS
// ============================================
// Database type removed - not needed for current implementation
