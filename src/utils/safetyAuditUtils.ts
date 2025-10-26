// ============================================
// SAFETY AUDIT UTILITIES
// ============================================
// Helper functions for score calculations, colors, labels
// Date: October 16, 2025
// ============================================

import type {
  SafetyAuditRequirement,
  AuditScoreCalculation,
  ScoreColor,
} from '../types/safetyAudit';

// ============================================
// SCORE CALCULATIONS
// ============================================

export const calculateAuditScores = (
  requirements: SafetyAuditRequirement[],
  results: Map<string, { score: number | null; comment: string | null }>
): AuditScoreCalculation => {
  let totalWeightedScore = 0;
  let maxPossibleScore = 0;
  let totalWeight = 0;
  let scoredItems = 0;
  let naItems = 0;

  requirements.forEach((req) => {
    const result = results.get(req.id);
    const score = result?.score;

    if (score !== null && score !== undefined) {
      totalWeightedScore += score * req.weight;
      maxPossibleScore += 3 * req.weight; // Max score is 3
      totalWeight += req.weight;
      scoredItems++;
    } else {
      naItems++;
    }
  });

  const weightedAverage = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  const percentageScore = (weightedAverage / 3) * 100;

  return {
    total_score: Number(totalWeightedScore.toFixed(2)),
    max_possible_score: maxPossibleScore,
    weighted_average: Number(weightedAverage.toFixed(2)),
    percentage_score: Number(percentageScore.toFixed(2)),
    scored_items: scoredItems,
    total_items: requirements.length,
    na_items: naItems,
  };
};

// ============================================
// SCORE DISPLAY
// ============================================

export const getScoreColor = (score: number | null): ScoreColor => {
  if (score === null) return 'gray';
  if (score === 0) return 'red';
  if (score === 1) return 'orange';
  if (score === 2) return 'yellow';
  if (score === 3) return 'green';
  return 'gray';
};

export const getScoreLabel = (score: number | null): string => {
  if (score === null) return 'N/A';
  if (score === 0) return 'Non-Compliant';
  if (score === 1) return 'Minimal';
  if (score === 2) return 'Partial';
  if (score === 3) return 'Compliant';
  return 'N/A';
};

export const getScoreLabelThai = (score: number | null): string => {
  if (score === null) return 'ไม่เกี่ยวข้อง';
  if (score === 0) return 'ไม่เป็นไปตามข้อกำหนด';
  if (score === 1) return 'เป็นไปตามข้อกำหนดเล็กน้อย';
  if (score === 2) return 'เป็นไปตามข้อกำหนดบางส่วน';
  if (score === 3) return 'เป็นไปตามข้อกำหนด';
  return 'ไม่เกี่ยวข้อง';
};

export const getPercentageColor = (percentage: number | null): ScoreColor => {
  if (percentage === null) return 'gray';
  if (percentage >= 80) return 'green';
  if (percentage >= 60) return 'yellow';
  if (percentage >= 40) return 'orange';
  return 'red';
};

export const getPercentageGrade = (percentage: number | null): string => {
  if (percentage === null) return 'N/A';
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
};

// ============================================
// SCORE FORMATTING
// ============================================

export const formatScore = (score: number | null): string => {
  if (score === null) return 'N/A';
  return score.toFixed(2);
};

export const formatPercentage = (percentage: number | null): string => {
  if (percentage === null) return 'N/A';
  return `${percentage.toFixed(1)}%`;
};

export const formatWeightedAverage = (average: number | null): string => {
  if (average === null) return 'N/A';
  return `${average.toFixed(2)} / 3.00`;
};

// ============================================
// AUDIT NUMBER GENERATION
// ============================================

export const generateAuditNumber = (year?: number): string => {
  const currentYear = year || new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000);
  return `SA-${currentYear}-${String(random).padStart(4, '0')}`;
};

// ============================================
// STATUS UTILITIES
// ============================================

export const getStatusColor = (status: string): ScoreColor => {
  switch (status) {
    case 'draft':
      return 'gray';
    case 'submitted':
      return 'yellow';
    case 'reviewed':
      return 'orange';
    case 'approved':
      return 'green';
    case 'rejected':
      return 'red';
    default:
      return 'gray';
  }
};

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'submitted':
      return 'Submitted';
    case 'reviewed':
      return 'Reviewed';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    default:
      return status;
  }
};

export const getStatusLabelThai = (status: string): string => {
  switch (status) {
    case 'draft':
      return 'ร่าง';
    case 'submitted':
      return 'ส่งแล้ว';
    case 'reviewed':
      return 'ตรวจสอบแล้ว';
    case 'approved':
      return 'อนุมัติ';
    case 'rejected':
      return 'ไม่อนุมัติ';
    default:
      return status;
  }
};

export const canEditAudit = (status: string): boolean => {
  return status === 'draft';
};

export const canSubmitAudit = (status: string): boolean => {
  return status === 'draft';
};

export const canApproveAudit = (status: string): boolean => {
  return status === 'submitted' || status === 'reviewed';
};

export const canRejectAudit = (status: string): boolean => {
  return status === 'submitted' || status === 'reviewed';
};

// ============================================
// VALIDATION
// ============================================

export const validateAuditForSubmission = (
  requirements: SafetyAuditRequirement[],
  results: Map<string, { score: number | null; comment: string | null }>
): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  // Check if all required requirements have scores
  const unscored = requirements.filter((req) => {
    if (req.is_optional) return false; // Optional items can be N/A
    const result = results.get(req.id);
    return !result || result.score === null;
  });

  if (unscored.length > 0) {
    errors.push(
      `${unscored.length} required item(s) not scored: ${unscored
        .map((r) => `#${r.item_number}`)
        .join(', ')}`
    );
  }

  // Check if at least one item is scored
  const hasAnyScore = Array.from(results.values()).some(
    (r) => r.score !== null
  );

  if (!hasAnyScore) {
    errors.push('At least one item must be scored');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ============================================
// DATA TRANSFORMERS
// ============================================

export const groupRequirementsByCategory = (
  requirements: SafetyAuditRequirement[]
): Map<string, SafetyAuditRequirement[]> => {
  const grouped = new Map<string, SafetyAuditRequirement[]>();

  requirements.forEach((req) => {
    const category = req.revision_id; // Or could be by actual category
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(req);
  });

  return grouped;
};

export const sortRequirementsByItemNumber = (
  requirements: SafetyAuditRequirement[]
): SafetyAuditRequirement[] => {
  return [...requirements].sort((a, b) => a.item_number - b.item_number);
};

// ============================================
// DATE UTILITIES
// ============================================

export const formatAuditDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const formatAuditDateThai = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('th-TH', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

export const isAuditOverdue = (
  auditDate: string,
  status: string
): boolean => {
  if (status !== 'draft') return false;
  const audit = new Date(auditDate);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - audit.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diffDays > 7; // Overdue if draft is more than 7 days old
};

// ============================================
// EXPORT UTILITIES
// ============================================

export const prepareAuditForExport = (audit: any) => {
  return {
    'Audit Number': audit.audit_number,
    'Audit Date': formatAuditDate(audit.audit_date),
    'Project': audit.project_name || 'N/A',
    'Category': audit.category_name_en || audit.category_name_th,
    'Companies': audit.companies_text || 'N/A',
    'Personnel Count': audit.number_of_personnel || 'N/A',
    'Status': getStatusLabel(audit.status),
    'Score (%)': formatPercentage(audit.percentage_score),
    'Weighted Average': formatWeightedAverage(audit.weighted_average),
    'Auditor': audit.auditor_name || 'N/A',
    'Created': formatAuditDate(audit.created_at),
    'Submitted': audit.submitted_at
      ? formatAuditDate(audit.submitted_at)
      : 'N/A',
  };
};
