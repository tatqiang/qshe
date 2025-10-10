// Enhanced Corrective Actions Service with Approval Workflow and Photo Support
import { supabase } from '../lib/api/supabase';
import type {
  CorrectiveActionEnhanced,
  CorrectiveActionFormDataEnhanced,
  CorrectiveActionCreationResult,
  ApprovalFormData,
  ApprovalResult,
  PhotoUploadData,
  PhotoUploadResult,
  CorrectiveActionDashboardData,
  CorrectiveActionFilters,
  ActionStatusEnhanced,
  ApprovalLevel,
  ActionPhotoType,
  CorrectiveActionApproval,
  CorrectiveActionPhoto,
  CorrectiveActionWorkflow
} from '../types/correctiveActionsEnhanced';

export class CorrectiveActionServiceEnhanced {
  
  // =============================================================================
  // CORRECTIVE ACTION CRUD OPERATIONS
  // =============================================================================
  
  /**
   * Create a new corrective action with automatic approval workflow setup
   */
  static async createCorrectiveAction(
    patrolId: string,
    formData: CorrectiveActionFormDataEnhanced,
    userId: string
  ): Promise<CorrectiveActionCreationResult> {
    console.log('📝 Creating corrective action with approval workflow...', { patrolId, formData });

    try {
      const actionNumber = `CA-${new Date().getFullYear()}${String(Date.now()).slice(-6)}`;
      
      // 1. Create the main corrective action record
      const { data: actionData, error: actionError } = await (supabase
        .from('corrective_actions') as any)
        .insert([{
          patrol_id: patrolId,
          action_number: actionNumber,
          description: formData.description,
          action_type: formData.actionType,
          root_cause_analysis: formData.rootCauseAnalysis,
          assigned_to: formData.assignedTo,
          due_date: formData.dueDate,
          status: 'draft',
          estimated_cost: formData.estimatedCost,
          resources_required: formData.resourcesRequired,
          created_by: userId
        }])
        .select()
        .single();

      if (actionError) {
        console.error('❌ Error creating corrective action:', actionError);
        return {
          success: false,
          errors: [`Database error: ${actionError.message}`]
        };
      }

      console.log('✅ Corrective action created:', actionData.id);

      // 2. Setup approval workflow automatically
      const { data: workflowSetup, error: workflowError } = await (supabase as any)
        .rpc('submit_corrective_action_for_approval', {
          p_action_id: actionData.id,
          p_submitted_by: userId
        });

      if (workflowError) {
        console.warn('⚠️ Error setting up approval workflow:', workflowError);
      }

      // 3. Upload planning photos if provided
      let uploadedPhotos: CorrectiveActionPhoto[] = [];
      if (formData.planningPhotos && formData.planningPhotos.length > 0) {
        const photoUploadResult = await this.uploadPhotos({
          actionId: actionData.id,
          photoType: 'planning',
          files: formData.planningPhotos,
          phase: 'planning'
        });
        
        if (photoUploadResult.success && photoUploadResult.uploadedPhotos) {
          uploadedPhotos = photoUploadResult.uploadedPhotos;
        }
      }

      // 4. Get the complete action with workflow details
      const completeAction = await this.getCorrectiveActionById(actionData.id);

      return {
        success: true,
        action: completeAction || undefined,
        workflowId: actionData.id,
        warnings: workflowError ? [`Approval workflow setup incomplete: ${workflowError.message}`] : undefined
      };

    } catch (error) {
      console.error('❌ Failed to create corrective action:', error);
      return {
        success: false,
        errors: [`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Get corrective action by ID with full workflow details
   */
  static async getCorrectiveActionById(actionId: string): Promise<CorrectiveActionEnhanced | null> {
    console.log('🔍 Fetching corrective action with workflow details...', { actionId });

    try {
      const { data: actionData, error: actionError } = await supabase
        .from('corrective_actions')
        .select(`
          *,
          corrective_action_workflow(*),
          corrective_action_approvals(
            *,
            approver:users(id, email, full_name, role)
          ),
          corrective_action_photos(*),
          assigned_to_user:users!assigned_to(id, email, full_name, role),
          created_by_user:users!created_by(id, email, full_name, role),
          verified_by_user:users!verified_by(id, email, full_name, role)
        `)
        .eq('id', actionId)
        .single();

      if (actionError) {
        console.error('❌ Error fetching corrective action:', actionError);
        return null;
      }

      // Transform to CorrectiveActionEnhanced
      return this.transformToEnhancedAction(actionData);

    } catch (error) {
      console.error('❌ Failed to fetch corrective action:', error);
      return null;
    }
  }

  /**
   * Get corrective actions with filters and pagination
   */
  static async getCorrectiveActions(
    filters?: CorrectiveActionFilters,
    limit: number = 50,
    offset: number = 0
  ): Promise<CorrectiveActionEnhanced[]> {
    console.log('📋 Fetching corrective actions with filters...', { filters, limit, offset });

    try {
      let query = supabase
        .from('corrective_actions')
        .select(`
          *,
          corrective_action_workflow(*),
          corrective_action_approvals(
            *,
            approver:users(id, email, full_name, role)
          ),
          corrective_action_photos(*),
          assigned_to_user:users!assigned_to(id, email, full_name, role),
          created_by_user:users!created_by(id, email, full_name, role)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (filters) {
        if (filters.status && filters.status.length > 0) {
          query = query.in('status', filters.status);
        }
        
        if (filters.assignedTo && filters.assignedTo.length > 0) {
          query = query.in('assigned_to', filters.assignedTo);
        }
        
        if (filters.projectId) {
          // Filter by project through patrol relationship
          query = (query as any).in('patrol_id', 
            (supabase
              .from('safety_patrols') as any)
              .select('id')
              .eq('project_id', filters.projectId)
          );
        }
        
        if (filters.dueDate?.from) {
          query = query.gte('due_date', filters.dueDate.from);
        }
        
        if (filters.dueDate?.to) {
          query = query.lte('due_date', filters.dueDate.to);
        }
        
        if (filters.isOverdue !== undefined) {
          if (filters.isOverdue) {
            query = query.lt('due_date', new Date().toISOString().split('T')[0]);
          }
        }
      }

      const { data: actionsData, error: actionsError } = await query;

      if (actionsError) {
        console.error('❌ Error fetching corrective actions:', actionsError);
        return [];
      }

      // Transform all actions
      return actionsData.map(action => this.transformToEnhancedAction(action));

    } catch (error) {
      console.error('❌ Failed to fetch corrective actions:', error);
      return [];
    }
  }

  // =============================================================================
  // APPROVAL WORKFLOW OPERATIONS
  // =============================================================================

  /**
   * Submit corrective action for approval
   */
  static async submitForApproval(
    actionId: string,
    submittedBy: string
  ): Promise<ApprovalResult> {
    console.log('📤 Submitting corrective action for approval...', { actionId, submittedBy });

    try {
      const { data: result, error } = await (supabase as any)
        .rpc('submit_corrective_action_for_approval', {
          p_action_id: actionId,
          p_submitted_by: submittedBy
        });

      if (error) {
        console.error('❌ Error submitting for approval:', error);
        return {
          success: false,
          errors: [`Database error: ${error.message}`]
        };
      }

      // Get updated approval workflow
      const { data: approvals } = await supabase
        .from('corrective_action_approvals')
        .select('*')
        .eq('action_id', actionId)
        .order('sequence_order');

      const nextApproval = (approvals as any)?.find((a: any) => a.approval_status === 'pending');

      return {
        success: true,
        nextApprovalLevel: nextApproval?.approval_level as ApprovalLevel,
        workflowUpdated: true
      };

    } catch (error) {
      console.error('❌ Failed to submit for approval:', error);
      return {
        success: false,
        errors: [`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Process approval or rejection
   */
  static async processApproval(
    actionId: string,
    approvalLevel: ApprovalLevel,
    approverId: string,
    formData: ApprovalFormData
  ): Promise<ApprovalResult> {
    console.log('✅ Processing approval decision...', { actionId, approvalLevel, decision: formData.decision });

    try {
      const { data: result, error } = await (supabase as any)
        .rpc('process_corrective_action_approval', {
          p_action_id: actionId,
          p_approver_id: approverId,
          p_approval_level: approvalLevel,
          p_decision: formData.decision,
          p_notes: formData.notes,
          p_conditions: formData.conditions,
          p_rejection_reason: formData.rejectionReason
        });

      if (error) {
        console.error('❌ Error processing approval:', error);
        return {
          success: false,
          errors: [`Database error: ${error.message}`]
        };
      }

      // Get updated approval status
      const { data: approvals } = await supabase
        .from('corrective_action_approvals')
        .select('*')
        .eq('action_id', actionId)
        .order('sequence_order');

      const pendingApprovals = (approvals as any)?.filter((a: any) => a.approval_status === 'pending') || [];
      const nextApproval = pendingApprovals[0];
      const isCompletelyApproved = pendingApprovals.length === 0 && formData.decision === 'approved';

      return {
        success: true,
        nextApprovalLevel: nextApproval?.approval_level as ApprovalLevel,
        isCompletelyApproved,
        workflowUpdated: true
      };

    } catch (error) {
      console.error('❌ Failed to process approval:', error);
      return {
        success: false,
        errors: [`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Get pending approvals for a user
   */
  static async getPendingApprovalsForUser(
    userId: string,
    userRole: string
  ): Promise<CorrectiveActionEnhanced[]> {
    console.log('📋 Fetching pending approvals for user...', { userId, userRole });

    try {
      // Map user roles to approval levels
      const roleToApprovalLevel: Record<string, ApprovalLevel[]> = {
        'supervisor': ['supervisor'],
        'manager': ['manager'],
        'safety_officer': ['safety_officer'],
        'admin': ['supervisor', 'manager', 'safety_officer'],
        'system_admin': ['supervisor', 'manager', 'safety_officer', 'executive']
      };

      const allowedLevels = roleToApprovalLevel[userRole] || [];
      
      if (allowedLevels.length === 0) {
        return [];
      }

      const { data: pendingApprovals, error } = await supabase
        .from('corrective_action_approvals')
        .select(`
          action_id,
          approval_level,
          corrective_actions!action_id (
            *,
            corrective_action_workflow(*),
            assigned_to_user:users!assigned_to(id, email, full_name, role),
            created_by_user:users!created_by(id, email, full_name, role)
          )
        `)
        .eq('approval_status', 'pending')
        .in('approval_level', allowedLevels);

      if (error) {
        console.error('❌ Error fetching pending approvals:', error);
        return [];
      }

      // Transform to enhanced actions
      return (pendingApprovals as any)
        .filter((pa: any) => pa.corrective_actions)
        .map((pa: any) => this.transformToEnhancedAction(pa.corrective_actions));

    } catch (error) {
      console.error('❌ Failed to fetch pending approvals:', error);
      return [];
    }
  }

  // =============================================================================
  // PHOTO MANAGEMENT
  // =============================================================================

  /**
   * Upload photos for corrective action at different workflow phases
   */
  static async uploadPhotos(photoData: PhotoUploadData): Promise<PhotoUploadResult> {
    console.log('📸 Uploading corrective action photos...', { 
      actionId: photoData.actionId, 
      photoType: photoData.photoType,
      fileCount: photoData.files.length 
    });

    const uploadedPhotos: CorrectiveActionPhoto[] = [];
    const failedUploads: Array<{ filename: string; error: string }> = [];

    try {
      for (let i = 0; i < photoData.files.length; i++) {
        const file = photoData.files[i];
        const caption = photoData.captions?.[i];

        try {
          // Generate unique filename
          const fileExtension = file.name.split('.').pop();
          const uniqueFilename = `${photoData.actionId}_${photoData.photoType}_${Date.now()}_${i}.${fileExtension}`;
          const r2Key = `corrective-actions/${photoData.actionId}/${photoData.phase || photoData.photoType}/${uniqueFilename}`;

          // Convert file to base64 for R2 upload (simplified for demo)
          const base64Data = await this.fileToBase64(file);
          
          // In a real implementation, you would upload to Cloudflare R2 here
          // For now, we'll store the base64 data directly
          const mockR2Url = `https://qshe-corrective-actions.r2.dev/${r2Key}`;

          // Store photo record in database
          const { data: photoRecord, error: photoError } = await (supabase
            .from('corrective_action_photos') as any)
            .insert([{
              action_id: photoData.actionId,
              r2_bucket: 'qshe-corrective-actions',
              r2_key: r2Key,
              r2_url: mockR2Url,
              filename: uniqueFilename,
              original_filename: file.name,
              file_size: file.size,
              mime_type: file.type,
              photo_type: photoData.photoType,
              phase: photoData.phase,
              caption: caption,
              location_description: photoData.locationDescription,
              sequence_order: i,
              taken_by: '00000000-0000-0000-0001-000000000001', // Current user ID
              taken_at: new Date().toISOString()
            }])
            .select()
            .single();

          if (photoError) {
            failedUploads.push({
              filename: file.name,
              error: photoError.message
            });
          } else {
            uploadedPhotos.push(this.transformToPhotoType(photoRecord));
          }

        } catch (fileError) {
          failedUploads.push({
            filename: file.name,
            error: fileError instanceof Error ? fileError.message : 'Unknown error'
          });
        }
      }

      return {
        success: uploadedPhotos.length > 0,
        uploadedPhotos,
        failedUploads,
        totalUploaded: uploadedPhotos.length,
        totalFailed: failedUploads.length
      };

    } catch (error) {
      console.error('❌ Failed to upload photos:', error);
      return {
        success: false,
        failedUploads: photoData.files.map(f => ({
          filename: f.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        })),
        totalUploaded: 0,
        totalFailed: photoData.files.length
      };
    }
  }

  /**
   * Get photos by action ID and phase
   */
  static async getPhotosByActionAndPhase(
    actionId: string,
    photoType?: ActionPhotoType,
    phase?: string
  ): Promise<CorrectiveActionPhoto[]> {
    console.log('📸 Fetching corrective action photos...', { actionId, photoType, phase });

    try {
      let query = supabase
        .from('corrective_action_photos')
        .select('*')
        .eq('action_id', actionId)
        .order('sequence_order');

      if (photoType) {
        query = query.eq('photo_type', photoType);
      }

      if (phase) {
        query = query.eq('phase', phase);
      }

      const { data: photos, error } = await query;

      if (error) {
        console.error('❌ Error fetching photos:', error);
        return [];
      }

      return photos.map(photo => this.transformToPhotoType(photo));

    } catch (error) {
      console.error('❌ Failed to fetch photos:', error);
      return [];
    }
  }

  // =============================================================================
  // DASHBOARD AND REPORTING
  // =============================================================================

  /**
   * Get dashboard data for corrective actions
   */
  static async getDashboardData(
    userId: string,
    userRole: string,
    projectId?: string
  ): Promise<CorrectiveActionDashboardData> {
    console.log('📊 Fetching corrective actions dashboard data...', { userId, userRole, projectId });

    try {
      // Get basic statistics
      let baseQuery = supabase.from('corrective_actions').select('*');
      
      if (projectId) {
        baseQuery = (baseQuery as any).in('patrol_id', 
          (supabase.from('safety_patrols') as any).select('id').eq('project_id', projectId)
        );
      }

      const { data: allActions, error: actionsError } = await baseQuery;

      if (actionsError) {
        console.error('❌ Error fetching dashboard data:', actionsError);
        return this.getEmptyDashboardData();
      }

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Calculate statistics
      const totalActions = (allActions as any)?.length || 0;
      const pendingApproval = (allActions as any)?.filter((a: any) => a.status === 'submitted').length || 0;
      const inProgress = (allActions as any)?.filter((a: any) => a.status === 'in_progress').length || 0;
      const overdue = (allActions as any)?.filter((a: any) => 
        new Date(a.due_date) < now && !['completed', 'cancelled'].includes(a.status)
      ).length || 0;
      const completedThisMonth = (allActions as any)?.filter((a: any) => 
        a.status === 'completed' && new Date(a.updated_at) >= thisMonth
      ).length || 0;

      // Get recent actions
      const recentActions = await this.getCorrectiveActions(undefined, 10, 0);

      // Get user-specific data
      const pendingMyApproval = await this.getPendingApprovalsForUser(userId, userRole);
      const myAssignedActions = (allActions as any)
        ?.filter((a: any) => a.assigned_to === userId && !['completed', 'cancelled'].includes(a.status))
        .slice(0, 10) || [];

      // Status distribution
      const statusCounts = (allActions as any)?.reduce((acc: any, action: any) => {
        acc[action.status] = (acc[action.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        status: status as ActionStatusEnhanced,
        count: Number(count) || 0,
        percentage: totalActions > 0 ? (Number(count) / totalActions) * 100 : 0
      }));

      return {
        totalActions,
        pendingApproval,
        inProgress,
        overdue,
        completedThisMonth,
        averageApprovalTime: 2.5, // Mock data - calculate from actual approval times
        rejectionRate: 15, // Mock data
        escalationRate: 8, // Mock data
        recentActions,
        pendingMyApproval,
        myAssignedActions: await Promise.all(
          myAssignedActions.map((a: any) => this.getCorrectiveActionById(a.id))
        ).then(actions => actions.filter(Boolean) as CorrectiveActionEnhanced[]),
        statusDistribution,
        completionTrends: [] // Mock data - implement based on requirements
      };

    } catch (error) {
      console.error('❌ Failed to fetch dashboard data:', error);
      return this.getEmptyDashboardData();
    }
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  private static transformToEnhancedAction(data: any): CorrectiveActionEnhanced {
    const photos = (data.corrective_action_photos || []).map(this.transformToPhotoType);
    
    return {
      id: data.id,
      patrolId: data.patrol_id,
      actionNumber: data.action_number,
      description: data.description,
      actionType: data.action_type,
      rootCauseAnalysis: data.root_cause_analysis,
      assignedTo: data.assigned_to,
      assignedToUser: data.assigned_to_user,
      assignedDate: data.assigned_date,
      dueDate: data.due_date,
      status: data.status,
      workflow: data.corrective_action_workflow?.[0],
      progressPercentage: data.progress_percentage || 0,
      progressUpdates: [], // TODO: Implement progress updates
      approvals: (data.corrective_action_approvals || []).map(this.transformToApprovalType),
      currentApprovalLevel: data.corrective_action_approvals?.find((a: any) => a.approval_status === 'pending')?.approval_level,
      pendingApprovals: (data.corrective_action_approvals || []).filter((a: any) => a.approval_status === 'pending'),
      verifiedBy: data.verified_by,
      verifiedByUser: data.verified_by_user,
      verificationDate: data.verification_date,
      verificationNotes: data.verification_notes,
      estimatedCost: data.estimated_cost,
      actualCost: data.actual_cost,
      resourcesRequired: data.resources_required,
      photos,
      planningPhotos: photos.filter((p: any) => p.photoType === 'planning'),
      beforePhotos: photos.filter((p: any) => p.photoType === 'before'),
      duringPhotos: photos.filter((p: any) => p.photoType === 'during'),
      afterPhotos: photos.filter((p: any) => p.photoType === 'after'),
      evidencePhotos: photos.filter((p: any) => p.photoType === 'evidence'),
      verificationPhotos: photos.filter((p: any) => p.photoType === 'verification'),
      notifications: [], // TODO: Implement notifications
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
      createdByUser: data.created_by_user
    };
  }

  private static transformToApprovalType(data: any): CorrectiveActionApproval {
    return {
      id: data.id,
      actionId: data.action_id,
      approvalLevel: data.approval_level,
      requiredApproverRole: data.required_approver_role,
      approverId: data.approver_id,
      approver: data.approver,
      approvalStatus: data.approval_status,
      approvalDate: data.approval_date,
      rejectionReason: data.rejection_reason,
      approvalNotes: data.approval_notes,
      conditions: data.conditions,
      sequenceOrder: data.sequence_order,
      isFinalApproval: data.is_final_approval,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private static transformToPhotoType(data: any): CorrectiveActionPhoto {
    return {
      id: data.id,
      actionId: data.action_id,
      r2Bucket: data.r2_bucket,
      r2Key: data.r2_key,
      r2Url: data.r2_url,
      filename: data.filename,
      originalFilename: data.original_filename,
      fileSize: data.file_size,
      mimeType: data.mime_type,
      photoType: data.photo_type,
      phase: data.phase,
      caption: data.caption,
      locationDescription: data.location_description,
      sequenceOrder: data.sequence_order,
      takenBy: data.taken_by,
      takenAt: data.taken_at,
      approvedBy: data.approved_by,
      approvedAt: data.approved_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  private static getEmptyDashboardData(): CorrectiveActionDashboardData {
    return {
      totalActions: 0,
      pendingApproval: 0,
      inProgress: 0,
      overdue: 0,
      completedThisMonth: 0,
      averageApprovalTime: 0,
      rejectionRate: 0,
      escalationRate: 0,
      recentActions: [],
      pendingMyApproval: [],
      myAssignedActions: [],
      statusDistribution: [],
      completionTrends: []
    };
  }
}
