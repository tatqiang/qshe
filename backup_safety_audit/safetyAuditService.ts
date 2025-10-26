// ============================================
// SAFETY AUDIT SERVICE - SUPABASE METHODS
// ============================================
// Handles all database operations for Safety Audits
// Date: October 16, 2025
// ============================================

import { supabase } from '../lib/api/supabase';
import type {
  SafetyAudit,
  SafetyAuditCategory,
  SafetyAuditRequirement,
  SafetyAuditRequirementRevision,
  SafetyAuditResult,
  SafetyAuditPhoto,
  SafetyAuditCompany,
  SafetyAuditWithRelations,
  SafetyAuditSummary,
  SafetyAuditFilters,
  SafetyAuditQueryOptions,
  CreateAuditRequest,
  UpdateAuditResultRequest,
  CategoryWithRevision,
  AuditScoreCalculation,
} from '../types/safetyAudit';

// ============================================
// CATEGORIES
// ============================================

export const getAuditCategories = async (): Promise<SafetyAuditCategory[]> => {
  const { data, error } = await supabase
    .from('safety_audit_categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const getAuditCategoryById = async (id: string): Promise<SafetyAuditCategory | null> => {
  const { data, error } = await supabase
    .from('safety_audit_categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

// ============================================
// REVISIONS
// ============================================

export const getActiveRevisionByCategory = async (
  categoryId: string
): Promise<SafetyAuditRequirementRevision | null> => {
  const { data, error } = await supabase
    .from('safety_audit_requirement_revisions')
    .select('*')
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .single();

  if (error) throw error;
  return data;
};

export const getRevisionsByCategory = async (
  categoryId: string
): Promise<SafetyAuditRequirementRevision[]> => {
  const { data, error } = await supabase
    .from('safety_audit_requirement_revisions')
    .select('*')
    .eq('category_id', categoryId)
    .order('revision_number', { ascending: false });

  if (error) throw error;
  return data || [];
};

// ============================================
// REQUIREMENTS
// ============================================

export const getRequirementsByRevision = async (
  revisionId: string
): Promise<SafetyAuditRequirement[]> => {
  const { data, error } = await supabase
    .from('safety_audit_requirements')
    .select('*')
    .eq('revision_id', revisionId)
    .order('display_order', { ascending: true })
    .order('item_number', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const getActiveRequirementsByCategory = async (
  categoryId: string
): Promise<SafetyAuditRequirement[]> => {
  // First get active revision
  const revision = await getActiveRevisionByCategory(categoryId);
  if (!revision) throw new Error('No active revision found for this category');

  // Then get requirements
  return getRequirementsByRevision(revision.id);
};

export const getCategoryWithActiveRevision = async (
  categoryId: string
): Promise<CategoryWithRevision | null> => {
  const { data, error } = await supabase
    .from('safety_audit_categories')
    .select(`
      *,
      active_revision:safety_audit_requirement_revisions!inner(
        *,
        requirements:safety_audit_requirements(*)
      )
    `)
    .eq('id', categoryId)
    .eq('safety_audit_requirement_revisions.is_active', true)
    .single();

  if (error) throw error;
  return data as any;
};

// V3 NEW: Get all active requirements from view
export const getAllActiveRequirements = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('v_active_audit_requirements')
    .select('*')
    .order('category_identifier, display_order, item_number');

  if (error) throw error;
  return data || [];
};

// ============================================
// AUDITS - CREATE
// ============================================

export const createAudit = async (
  request: CreateAuditRequest
): Promise<SafetyAudit> => {
  // Generate audit number
  const auditNumber = await generateAuditNumber();

  console.log('🔧 createAudit service received:', {
    total_score: request.total_score,
    max_possible_score: request.max_possible_score,
    weighted_average: request.weighted_average,
    percentage_score: request.percentage_score,
  });

  const insertData = {
    audit_number: auditNumber,
    audit_date: request.audit_date,
    project_id: request.project_id,
    main_area_id: request.main_area_id,
    sub_area1_id: request.sub_area1_id,
    sub_area2_id: request.sub_area2_id,
    main_area: request.main_area,
    sub_area1: request.sub_area1,
    sub_area2: request.sub_area2,
    specific_location: request.specific_location,
    number_of_personnel: request.number_of_personnel,
    auditor_id: request.auditor_id, // Use app-level user ID
    activity: request.activity, // V3: Added activity field
    audit_criteria_rev: request.audit_criteria_rev || {}, // V3: Per-category revisions
    // Save calculated scores
    total_score: request.total_score || 0,
    max_possible_score: request.max_possible_score || 0,
    weighted_average: request.weighted_average || 0,
    percentage_score: request.percentage_score || 0,
    category_scores: request.category_scores || {},
    status: 'draft',
    created_by: request.auditor_id, // Use app-level user ID
  };

  console.log('💾 Inserting into database:', insertData);

  const { data: audit, error: auditError } = await supabase
    .from('safety_audits')
    .insert(insertData)
    .select()
    .single();

  if (auditError) {
    console.error('❌ Database insert error:', auditError);
    throw auditError;
  }

  console.log('✅ Database returned audit:', audit);

  // Add companies
  if (request.company_ids.length > 0) {
    const companyRecords = request.company_ids.map((companyId, index) => ({
      audit_id: audit.id,
      company_id: companyId,
      primary_company: index === 0, // First company is primary
    }));

    const { error: companyError } = await supabase
      .from('safety_audit_companies')
      .insert(companyRecords);

    if (companyError) throw companyError;
  }

  return audit;
};

// ============================================
// AUDITS - READ
// ============================================

export const getAuditById = async (
  auditId: string
): Promise<SafetyAuditWithRelations | null> => {
  const { data, error } = await supabase
    .from('safety_audits')
    .select(`
      *,
      category:safety_audit_categories(*),
      revision:safety_audit_requirement_revisions(*),
      auditor:users(id, first_name, last_name, email),
      project:projects(id, name),
      companies:safety_audit_companies(
        *,
        company:companies(id, name, name_th)
      ),
      results:safety_audit_results(
        *,
        requirement:safety_audit_requirements(*)
      ),
      photos:safety_audit_photos(*)
    `)
    .eq('id', auditId)
    .single();

  if (error) throw error;
  return data as any;
};

export const getAudits = async (
  options?: SafetyAuditQueryOptions
): Promise<{ data: SafetyAuditSummary[]; count: number }> => {
  let query = supabase
    .from('safety_audit_summary')
    .select('*', { count: 'exact' });

  // Apply filters
  if (options?.filters) {
    const filters = options.filters;

    if (filters.project_id) {
      // Note: View doesn't expose project_id directly, need to join or adjust view
      query = query.eq('project_id', filters.project_id);
    }

    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    if (filters.auditor_id) {
      query = query.eq('auditor_id', filters.auditor_id);
    }

    if (filters.date_from) {
      query = query.gte('audit_date', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('audit_date', filters.date_to);
    }

    if (filters.search) {
      query = query.or(
        `audit_number.ilike.%${filters.search}%,specific_location.ilike.%${filters.search}%`
      );
    }

    if (filters.min_score !== undefined) {
      query = query.gte('percentage_score', filters.min_score);
    }

    if (filters.max_score !== undefined) {
      query = query.lte('percentage_score', filters.max_score);
    }
  }

  // Apply sorting
  const sortBy = options?.sort_by || 'audit_date';
  const sortOrder = options?.sort_order || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Apply pagination
  if (options?.page !== undefined && options?.page_size !== undefined) {
    const from = options.page * options.page_size;
    const to = from + options.page_size - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;

  if (error) throw error;
  return { data: data || [], count: count || 0 };
};

// ============================================
// AUDITS - UPDATE
// ============================================

export const updateAudit = async (
  auditId: string,
  updates: Partial<SafetyAudit>
): Promise<SafetyAudit> => {
  const { data, error } = await supabase
    .from('safety_audits')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', auditId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const submitAudit = async (auditId: string): Promise<SafetyAudit> => {
  const { data, error } = await supabase
    .from('safety_audits')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', auditId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const approveAudit = async (
  auditId: string,
  reviewerId: string,
  notes?: string
): Promise<SafetyAudit> => {
  const { data, error } = await supabase
    .from('safety_audits')
    .update({
      status: 'approved',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      review_notes: notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', auditId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const rejectAudit = async (
  auditId: string,
  reviewerId: string,
  notes: string
): Promise<SafetyAudit> => {
  const { data, error } = await supabase
    .from('safety_audits')
    .update({
      status: 'rejected',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      review_notes: notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', auditId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ============================================
// AUDITS - DELETE
// ============================================

export const deleteAudit = async (auditId: string): Promise<void> => {
  const { error } = await supabase
    .from('safety_audits')
    .delete()
    .eq('id', auditId);

  if (error) throw error;
};

// ============================================
// AUDIT RESULTS
// ============================================

export const upsertAuditResult = async (
  request: UpdateAuditResultRequest
): Promise<SafetyAuditResult> => {
  // Calculate weighted score
  const { data: requirement } = await supabase
    .from('safety_audit_requirements')
    .select('weight')
    .eq('id', request.requirement_id)
    .single();

  const weighted_score =
    request.score !== null && requirement
      ? request.score * requirement.weight
      : null;

  const score_label = getScoreLabel(request.score);

  const { data, error } = await supabase
    .from('safety_audit_results')
    .upsert(
      {
        audit_id: request.audit_id,
        requirement_id: request.requirement_id,
        score: request.score,
        score_label,
        comment: request.comment,
        weighted_score,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'audit_id,requirement_id',
      }
    )
    .select()
    .single();

  if (error) throw error;

  // Trigger will auto-calculate audit scores
  return data;
};

export const getAuditResults = async (
  auditId: string
): Promise<SafetyAuditResult[]> => {
  const { data, error } = await supabase
    .from('safety_audit_results')
    .select('*, requirement:safety_audit_requirements(*)')
    .eq('audit_id', auditId)
    .order('requirement.item_number', { ascending: true });

  if (error) throw error;
  return data || [];
};

// ============================================
// AUDIT COMPANIES
// ============================================

export const addCompanyToAudit = async (
  auditId: string,
  companyId: string,
  isPrimary = false
): Promise<SafetyAuditCompany> => {
  const { data, error } = await supabase
    .from('safety_audit_companies')
    .insert({
      audit_id: auditId,
      company_id: companyId,
      primary_company: isPrimary,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const removeCompanyFromAudit = async (
  auditId: string,
  companyId: string
): Promise<void> => {
  const { error } = await supabase
    .from('safety_audit_companies')
    .delete()
    .eq('audit_id', auditId)
    .eq('company_id', companyId);

  if (error) throw error;
};

export const getAuditCompanies = async (
  auditId: string
): Promise<SafetyAuditCompany[]> => {
  const { data, error } = await supabase
    .from('safety_audit_companies')
    .select('*, company:companies(id, name, name_th)')
    .eq('audit_id', auditId)
    .order('primary_company', { ascending: false });

  if (error) throw error;
  return data || [];
};

// ============================================
// PHOTOS
// ============================================

export const uploadAuditPhoto = async (
  auditId: string,
  file: File,
  options?: {
    category_id?: string;
    requirement_id?: string;
    caption?: string;
    latitude?: number;
    longitude?: number;
    uploaded_by?: string;
    display_order?: number;
  }
): Promise<SafetyAuditPhoto> => {
  // Import R2 upload function
  const { uploadAuditPhoto: uploadToR2 } = await import('../lib/storage/r2Client');
  
  const userId = options?.uploaded_by || '';
  const photoIndex = options?.display_order || 0;
  
  // Upload to R2 storage
  const uploadResult = await uploadToR2(
    file,
    auditId,
    userId,
    photoIndex,
    options?.category_id
  );
  
  if (!uploadResult.success || !uploadResult.url) {
    throw new Error(uploadResult.error || 'Failed to upload photo');
  }

  // Create photo record in database
  const { data, error } = await supabase
    .from('safety_audit_photos')
    .insert({
      audit_id: auditId,
      category_id: options?.category_id || null, // Use actual category UUID
      requirement_id: options?.requirement_id || null,
      photo_url: uploadResult.url,
      caption: options?.caption || null,
      latitude: options?.latitude || null,
      longitude: options?.longitude || null,
      uploaded_by: options?.uploaded_by || null,
      display_order: options?.display_order || 0,
      taken_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Photo insert error:', error);
    console.error('❌ Audit ID:', auditId);
    console.error('❌ Category ID:', options?.category_id);
    console.error('❌ Uploaded by:', options?.uploaded_by);
    throw error;
  }
  return data;
};

export const getAuditPhotos = async (
  auditId: string
): Promise<SafetyAuditPhoto[]> => {
  const { data, error } = await supabase
    .from('safety_audit_photos')
    .select('*')
    .eq('audit_id', auditId)
    .order('display_order', { ascending: true })
    .order('taken_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const deleteAuditPhoto = async (photoId: string): Promise<void> => {
  // Get photo to extract file path
  const { data: photo, error: fetchError } = await supabase
    .from('safety_audit_photos')
    .select('photo_url')
    .eq('id', photoId)
    .single();

  if (fetchError) throw fetchError;
  if (!photo) throw new Error('Photo not found');

  // Delete from R2 storage
  const photoUrl = (photo as any).photo_url as string;
  
  // Extract filename from URL
  // R2 URL format: https://{bucket}.{account}.r2.cloudflarestorage.com/safety-audits/{auditId}/photo-...
  // or custom domain: https://your-domain.com/safety-audits/{auditId}/photo-...
  const urlParts = photoUrl.split('/');
  const auditIndex = urlParts.indexOf('safety-audits');
  
  if (auditIndex > -1) {
    const fileName = urlParts.slice(auditIndex).join('/');
    
    // Import delete function from R2 client
    const { deleteAuditPhoto: deleteFromR2 } = await import('../lib/storage/r2Client');
    const deleted = await deleteFromR2(fileName);
    
    if (!deleted) {
      console.error('Error deleting file from R2:', fileName);
    }
  }

  // Delete record from database
  const { error } = await supabase
    .from('safety_audit_photos')
    .delete()
    .eq('id', photoId);

  if (error) throw error;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

async function generateAuditNumber(): Promise<string> {
  const { data, error } = await supabase.rpc('generate_audit_number');

  if (error) {
    // Fallback if function doesn't exist
    console.error('generate_audit_number function error:', error);
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000);
    return `SA-${year}-${String(random).padStart(3, '0')}`;
  }

  return data;
}

function getScoreLabel(score: number | null): string {
  if (score === null) return 'n/a';
  if (score === 0) return 'non_compliant';
  if (score === 1) return 'minimal';
  if (score === 2) return 'partial';
  if (score === 3) return 'compliant';
  return 'n/a';
}

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
      maxPossibleScore += 3 * req.weight;
      totalWeight += req.weight;
      scoredItems++;
    } else {
      naItems++;
    }
  });

  const weightedAverage = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  const percentageScore = (weightedAverage / 3) * 100;

  return {
    total_score: totalWeightedScore,
    max_possible_score: maxPossibleScore,
    weighted_average: Number(weightedAverage.toFixed(2)),
    percentage_score: Number(percentageScore.toFixed(2)),
    scored_items: scoredItems,
    total_items: requirements.length,
    na_items: naItems,
  };
};
