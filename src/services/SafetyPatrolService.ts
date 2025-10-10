/**
 * Real Safety Patrol Service - Supabase Integration
 * 
 * This service works with the complete safety patrol database schema
 * and handles all CRUD operations for patrol management.
 */

import { supabase } from '../lib/api/supabase';
import type { SafetyPatrolFormData, SafetyPatrol, SafetyPatrolRecord } from '../types/safetyPatrol';

export interface PatrolCreationResult {
  success: boolean;
  patrolId?: string;
  patrolNumber?: string;
  error?: string;
  stats?: {
    categoriesAdded: number;
    itemsAdded: number;
    photosUploaded: number;
  };
}

export interface PatrolUpdateResult {
  success: boolean;
  patrolId?: string;
  patrolNumber?: string;
  error?: string;
}

// Additional interfaces needed for functionality
export interface PatrolCreationData {
  title: string;
  description: string;
  patrolType: 'scheduled' | 'random' | 'incident_followup';
  projectCode: string;
  projectId?: string;
  location?: string;
  likelihood: 1 | 2 | 3 | 4;
  severity: 1 | 2 | 3 | 4;
  immediateHazard: boolean;
  workStopped: boolean;
  workersPresent?: number;
  witnesses?: string[];
  legalRequirement?: boolean;
  regulationReference?: string;
}

export interface PhotoUploadData {
  file: File;
  caption?: string;
  photoType: 'issue' | 'evidence' | 'before' | 'after' | 'general';
}

export class SafetyPatrolService {
  /**
   * Create a new safety patrol with full database integration
   */
  static async createPatrol(
    patrolData: SafetyPatrolFormData,
    photos: string[] = []
  ): Promise<PatrolCreationResult> {
    console.log('🚀 Creating safety patrol...', { 
      title: patrolData.title, 
      photoCount: photos.length,
      photos: photos 
    });

    try {
      const { data: patrol, error: patrolError } = await (supabase
        .from('safety_patrols') as any)
        .insert({
          // Basic Information
          title: patrolData.title,
          description: patrolData.description,
          remark: patrolData.remark || null,
          patrol_type: patrolData.patrolType,
          project_id: patrolData.projectId || null,
          
          // Location fields
          main_area: patrolData.mainArea,
          sub_area1: patrolData.subArea1,
          sub_area2: patrolData.subArea2,
          specific_location: patrolData.specificLocation,
          
          // Risk Assessment
          likelihood: patrolData.likelihood,
          severity: patrolData.severity,
          
          // Safety Flags
          immediate_hazard: patrolData.immediateHazard,
          work_stopped: patrolData.workStopped,
          legal_requirement: patrolData.legalRequirement,
          
          // References
          regulation_reference: patrolData.regulationReference,
          
          // Status - Set as 'open' for new lifecycle
          status: 'open',
          
          // Metadata
          created_by: (await supabase.auth.getUser()).data.user?.id || null
        })
        .select('id, patrol_number')
        .single();

      if (patrolError) {
        console.error('❌ Error creating patrol:', patrolError);
        return {
          success: false,
          error: `Failed to create patrol: ${patrolError.message}`
        };
      }

      const patrolId = patrol.id;
      const patrolNumber = patrol.patrol_number;
      console.log('✅ Patrol created:', { patrolId, patrolNumber });

      // Add risk categories if provided
      let categoriesAdded = 0;
      if (patrolData.riskCategoryIds && patrolData.riskCategoryIds.length > 0) {
        const categoryInserts = patrolData.riskCategoryIds.map(categoryId => ({
          patrol_id: patrolId,
          risk_category_id: categoryId
        }));

        const { error: categoryError } = await (supabase
          .from('patrol_risk_categories') as any)
          .insert(categoryInserts);

        if (categoryError) {
          console.warn('⚠️ Error adding risk categories:', categoryError);
        } else {
          categoriesAdded = patrolData.riskCategoryIds.length;
          console.log(`✅ Added ${categoriesAdded} risk categories`);
        }
      }

      // Add risk items if provided
      let itemsAdded = 0;
      if (patrolData.riskItemIds && patrolData.riskItemIds.length > 0) {
        const itemInserts = patrolData.riskItemIds.map(itemId => ({
          patrol_id: patrolId,
          risk_item_id: itemId
        }));

        const { error: itemError } = await (supabase
          .from('patrol_risk_items') as any)
          .insert(itemInserts);

        if (itemError) {
          console.warn('⚠️ Error adding risk items:', itemError);
        } else {
          itemsAdded = patrolData.riskItemIds.length;
          console.log(`✅ Added ${itemsAdded} risk items`);
        }
      }

      // Add witnesses if provided
      if (patrolData.witnesses && patrolData.witnesses.length > 0) {
        const witnessInserts = patrolData.witnesses.map(witness => ({
          patrol_id: patrolId,
          witness_name: witness,
          witness_role: '',
          witness_company: ''
        }));

        const { error: witnessError } = await (supabase
          .from('patrol_witnesses') as any)
          .insert(witnessInserts);

        if (witnessError) {
          console.warn('⚠️ Error adding witnesses:', witnessError);
        } else {
          console.log(`✅ Added ${patrolData.witnesses.length} witnesses`);
        }
      }

      // Add photos if provided (R2 URLs)
      let photosUploaded = 0;
      if (photos.length > 0) {
        console.log(`📸 Storing ${photos.length} R2 photo URLs in database`);
        
        const photoInserts = photos.map((photoUrl) => {
          // Extract filename from R2 URL
          const fileName = photoUrl.split('/').pop() || `photo-${Date.now()}.jpg`;
          
          return {
            patrol_id: patrolId,
            file_path: photoUrl, // Store R2 URL in file_path column
            file_name: fileName, // Required field that was missing
            action_id: null // Optional field based on the schema
          };
        });

        console.log('📸 Photo inserts data:', photoInserts);

        const { error: photoError } = await (supabase
          .from('patrol_photos') as any)
          .insert(photoInserts);

        if (photoError) {
          console.warn('⚠️ Error storing photo URLs:', photoError);
          console.error('Photo insert error details:', photoError);
        } else {
          photosUploaded = photos.length;
          console.log(`✅ Stored ${photosUploaded} R2 photo URLs in database`);
        }
      }

      return {
        success: true,
        patrolId,
        patrolNumber,
        stats: {
          categoriesAdded,
          itemsAdded,
          photosUploaded
        }
      };

    } catch (error) {
      console.error('❌ Unexpected error creating patrol:', error);
      return {
        success: false,
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get patrols from the database
   */
  static async getPatrols(projectId?: string): Promise<SafetyPatrol[]> {
    console.log('📋 Fetching patrols from Supabase...', { projectId });

    try {
      let query = supabase
        .from('safety_patrols')
        .select(`
          *,
          patrol_risk_categories (
            risk_category_id,
            risk_categories (id, name, color)
          ),
          patrol_risk_items (
            risk_item_id,
            risk_items (id, name, category)
          ),
          patrol_witnesses (
            witness_name,
            witness_role,
            witness_company
          ),
          patrol_photos (
            id,
            file_name,
            file_path,
            file_size,
            photo_type,
            caption,
            photo_data,
            taken_at,
            taken_by
          )
        `)
        .order('created_at', { ascending: false });

      // Filter by project if specified
      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data: patrols, error } = await query;

      if (error) {
        console.error('❌ Error fetching patrols:', error);
        return [];
      }

      console.log('✅ Patrols fetched:', patrols?.length || 0);

      // Transform data to SafetyPatrol format
      return patrols?.map(patrol => this.transformToSafetyPatrol(patrol)) || [];

    } catch (error) {
      console.error('❌ Unexpected error fetching patrols:', error);
      return [];
    }
  }

  /**
   * Get a single patrol by ID with full details
   */
  static async getPatrolById(patrolId: string): Promise<SafetyPatrol | null> {
    console.log('🔍 Fetching patrol by ID...', { patrolId });

    try {
      const { data: patrol, error } = await supabase
        .from('safety_patrols')
        .select(`
          *,
          patrol_risk_categories (
            risk_category_id,
            risk_categories (id, name, color, icon)
          ),
          patrol_risk_items (
            risk_item_id,
            risk_items (id, name, category)
          ),
          patrol_witnesses (
            witness_name,
            witness_role,
            witness_company
          ),
          patrol_photos (
            id,
            file_name,
            file_path,
            file_size,
            photo_type,
            caption,
            photo_data,
            taken_at,
            taken_by
          )
        `)
        .eq('id', patrolId)
        .single();

      if (error) {
        console.error('❌ Error fetching patrol:', error);
        return null;
      }

      if (!patrol) {
        console.error('❌ No patrol data returned');
        return null;
      }

      console.log('✅ Patrol fetched');
      return this.transformToSafetyPatrol(patrol);

    } catch (error) {
      console.error('❌ Unexpected error fetching patrol:', error);
      return null;
    }
  }

  /**
   * Update an existing patrol
   */
  static async updatePatrol(
    patrolId: string,
    updateData: Partial<SafetyPatrolFormData>,
    photos?: string[]
  ): Promise<PatrolUpdateResult> {
    console.log('📝 Updating patrol...', { patrolId, updateData });

    try {
      const { error } = await (supabase
        .from('safety_patrols') as any)
        .update({
          title: updateData.title,
          description: updateData.description,
          remark: updateData.remark,
          main_area: updateData.mainArea,
          sub_area1: updateData.subArea1,
          sub_area2: updateData.subArea2,
          specific_location: updateData.specificLocation,
          likelihood: updateData.likelihood,
          severity: updateData.severity,
          immediate_hazard: updateData.immediateHazard,
          work_stopped: updateData.workStopped,
          legal_requirement: updateData.legalRequirement,
          regulation_reference: updateData.regulationReference,
          updated_at: new Date().toISOString()
        })
        .eq('id', patrolId);

      if (error) {
        console.error('❌ Error updating patrol:', error);
        return {
          success: false,
          error: `Failed to update patrol: ${error.message}`
        };
      }

      // Update risk categories if provided
      if (updateData.riskCategoryIds) {
        // Remove existing categories
        await supabase
          .from('patrol_risk_categories')
          .delete()
          .eq('patrol_id', patrolId);

        // Add new categories
        if (updateData.riskCategoryIds.length > 0) {
          const categoryInserts = updateData.riskCategoryIds.map(categoryId => ({
            patrol_id: patrolId,
            risk_category_id: categoryId
          }));

          const { error: categoryError } = await (supabase
            .from('patrol_risk_categories') as any)
            .insert(categoryInserts);

          if (categoryError) {
            console.warn('⚠️ Error updating risk categories:', categoryError);
          }
        }
      }

      // Update risk items if provided
      if (updateData.riskItemIds) {
        // Remove existing items
        await supabase
          .from('patrol_risk_items')
          .delete()
          .eq('patrol_id', patrolId);

        // Add new items
        if (updateData.riskItemIds.length > 0) {
          const itemInserts = updateData.riskItemIds.map(itemId => ({
            patrol_id: patrolId,
            risk_item_id: itemId
          }));

          const { error: itemError } = await (supabase
            .from('patrol_risk_items') as any)
            .insert(itemInserts);

          if (itemError) {
            console.warn('⚠️ Error updating risk items:', itemError);
          }
        }
      }

      // Update photos if provided
      if (photos !== undefined) {
        console.log(`📸 Updating patrol photos: ${photos.length} photos`);
        
        // Remove existing photos
        await supabase
          .from('patrol_photos')
          .delete()
          .eq('patrol_id', patrolId);

        // Add new photos
        if (photos.length > 0) {
          const photoInserts = photos.map((photoUrl) => {
            // Extract filename from R2 URL
            const fileName = photoUrl.split('/').pop() || `photo-${Date.now()}.jpg`;
            
            return {
              patrol_id: patrolId,
              file_path: photoUrl,
              file_name: fileName,
              action_id: null
            };
          });

          const { error: photoError } = await (supabase
            .from('patrol_photos') as any)
            .insert(photoInserts);

          if (photoError) {
            console.warn('⚠️ Error updating photos:', photoError);
          } else {
            console.log(`✅ Updated ${photos.length} patrol photos`);
          }
        }
      }

      console.log('✅ Patrol updated successfully');
      return {
        success: true,
        patrolId
      };

    } catch (error) {
      console.error('❌ Unexpected error updating patrol:', error);
      return {
        success: false,
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Delete a patrol
   */
  static async deletePatrol(patrolId: string): Promise<{ success: boolean; error?: string }> {
    console.log('🗑️ Deleting patrol...', { patrolId });

    try {
      const { error } = await supabase
        .from('safety_patrols')
        .delete()
        .eq('id', patrolId);

      if (error) {
        console.error('❌ Error deleting patrol:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Patrol deleted successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Unexpected error deleting patrol:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Transform database record to SafetyPatrolRecord
   */
  private static transformToSafetyPatrolRecord(dbRecord: any): SafetyPatrolRecord {
    return {
      id: dbRecord.id,
      patrolNumber: dbRecord.patrol_number,
      title: dbRecord.title,
      patrolDate: dbRecord.patrol_date || dbRecord.created_at,
      status: dbRecord.status,
      riskLevel: dbRecord.risk_level,
      area: `${dbRecord.main_area}${dbRecord.sub_area1 ? ` > ${dbRecord.sub_area1}` : ''}${dbRecord.sub_area2 ? ` > ${dbRecord.sub_area2}` : ''}`,
      inspectorName: 'Current User', // TODO: Get from user relationship
      issuesFound: 1, // TODO: Calculate from actual issues
      correctiveActions: 0, // TODO: Count from corrective_actions table
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at
    };
  }

  /**
   * Transform database record to SafetyPatrol
   */
  private static transformToSafetyPatrol(dbRecord: any): SafetyPatrol {
    return {
      id: dbRecord.id,
      patrolNumber: dbRecord.patrol_number,
      title: dbRecord.title,
      description: dbRecord.description,
      remark: dbRecord.remark, // Add remark field
      patrolType: dbRecord.patrol_type,
      patrolDate: dbRecord.patrol_date || dbRecord.created_at,
      status: dbRecord.status,
      
      // Required fields for SafetyPatrol interface
      project_id: dbRecord.project_id,
      main_area_id: dbRecord.main_area_id,
      priority: 'medium' as const, // Default priority
      
      // Location
      location: `${dbRecord.main_area}${dbRecord.sub_area1 ? ` > ${dbRecord.sub_area1}` : ''}${dbRecord.sub_area2 ? ` > ${dbRecord.sub_area2}` : ''}`,
      specificLocation: dbRecord.specific_location, // Add specific location mapping
      
      // Risk assessment
      likelihood: dbRecord.likelihood,
      severity: dbRecord.severity,
      riskScore: (dbRecord.likelihood || 1) * (dbRecord.severity || 1), // Calculate risk score
      riskLevel: dbRecord.risk_level,
      recommendedAction: dbRecord.recommended_action,
      
      // Safety flags
      immediateHazard: dbRecord.immediate_hazard,
      workStopped: dbRecord.work_stopped,
      legalRequirement: dbRecord.legal_requirement,
      
      // Risk categories and items
      riskCategories: dbRecord.patrol_risk_categories?.map((prc: any) => prc.risk_categories) || [],
      riskItems: dbRecord.patrol_risk_items?.map((pri: any) => pri.risk_items) || [],
      
      // Witnesses
      witnesses: dbRecord.patrol_witnesses?.map((pw: any) => pw.witness_name) || [],
      
      // Photos (R2 URLs stored in file_path)
      photos: dbRecord.patrol_photos?.map((photo: any) => {
        let filePath = photo.file_path || photo.photo_data;
        
        // Fix old URL format that included bucket name in path
        if (filePath && filePath.includes('/qshe/patrols/')) {
          filePath = filePath.replace('/qshe/patrols/', '/patrols/');
          console.log(`[PATROL_SERVICE] Fixed photo URL format: ${filePath}`);
        }
        
        return {
          id: photo.id,
          fileName: photo.file_name,
          filePath: filePath, // Prefer file_path (R2 URL) over photo_data (base64)
          photoType: photo.photo_type,
          caption: photo.caption,
          takenAt: photo.taken_at,
          takenBy: photo.taken_by || '',
          takenByUser: undefined,
          fileSize: photo.file_size || 0
        };
      }) || [],
      
      correctiveActions: [], // TODO: Load from corrective_actions table
      
      // Metadata
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at,
      createdBy: dbRecord.created_by || '',
      createdByUser: undefined, // TODO: Load user details
      
      // Inspector fields
      inspectorId: dbRecord.created_by || '',
      inspector: dbRecord.created_by ? {
        id: dbRecord.created_by,
        firstName: 'Inspector', // TODO: Load from users table
        lastName: '',
        email: '',
        userType: 'internal' as const,
        status: 'active' as const,
        role: 'member' as const, // Use valid UserRole
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } : undefined
    };
  }

  /**
   * Create a simple corrective action linked to a patrol
   */
  static async createCorrectiveAction(
    patrolId: string,
    description: string,
    photoUrls?: string[]
  ): Promise<{ success: boolean; actionId?: string; error?: string }> {
    console.log('📝 Creating corrective action...', { patrolId, description, photoCount: photoUrls?.length || 0 });

    try {
      const currentUser = await supabase.auth.getUser();
      const userId = currentUser.data.user?.id;

      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      const actionNumber = `CA-${new Date().getFullYear()}${String(Date.now()).slice(-6)}`;
      
      // Use .from() with manual typing for now since corrective_actions isn't in Database type
      const { data: actionData, error: actionError } = await (supabase as any)
        .from('corrective_actions')
        .insert({
          patrol_id: patrolId,
          action_number: actionNumber,
          description: description,
          action_type: 'immediate',
          assigned_to: userId,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
          status: 'assigned',
          created_by: userId
        })
        .select()
        .single();

      if (actionError) {
        console.error('❌ Error creating corrective action:', actionError);
        return { success: false, error: actionError.message };
      }

      const actionId = (actionData as any)?.id;
      console.log('✅ Corrective action created:', actionId);

      // Save photos if provided
      if (photoUrls && photoUrls.length > 0) {
        console.log('📸 Saving corrective action photos:', photoUrls.length);
        const photoResult = await this.saveCorrectiveActionPhotos(actionId, photoUrls);
        if (!photoResult.success) {
          console.warn('⚠️ Photos failed to save but action was created:', photoResult.error);
        }
      }

      // Update patrol status after creating corrective action 
      // Creating action means patrol now has actions and needs verification (should be 'pending_verification')
      const statusUpdate = await SafetyPatrolService.updatePatrolStatus(patrolId);
      if (!statusUpdate.success) {
        console.warn('⚠️ Failed to update patrol status, but action was created:', statusUpdate.error);
      } else {
        console.log('📋 Patrol status updated to:', statusUpdate.status);
      }

      return { success: true, actionId };

    } catch (error) {
      console.error('❌ Unexpected error creating corrective action:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get corrective actions for a patrol
   */
  static async getCorrectiveActionsByPatrol(patrolId: string): Promise<any[]> {
    console.log('📋 Fetching corrective actions for patrol...', { patrolId });

    try {
      const { data: actions, error } = await (supabase as any)
        .from('corrective_actions')
        .select(`
          id,
          action_number,
          description,
          action_type,
          assigned_to,
          due_date,
          status,
          progress_percentage,
          verified_by,
          verification_date,
          verification_notes,
          created_at,
          updated_at
        `)
        .eq('patrol_id', patrolId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching corrective actions:', error);
        return [];
      }

      // Now fetch user data for each action
      if (actions && actions.length > 0) {
        const userIds = [...new Set([
          ...actions.map(action => action.assigned_to).filter(Boolean),
          ...actions.map(action => action.verified_by).filter(Boolean)
        ])];

        if (userIds.length > 0) {
          const { data: users, error: userError } = await (supabase as any)
            .from('users')
            .select('id, first_name, last_name, email')
            .in('id', userIds);

          if (!userError && users) {
            // Create a user lookup map
            const userMap = users.reduce((map: any, user: any) => {
              map[user.id] = user;
              return map;
            }, {});

            // Add user data to actions
            const actionsWithUsers = actions.map(action => ({
              ...action,
              assignedToUser: action.assigned_to ? userMap[action.assigned_to] : null,
              verifiedByUser: action.verified_by ? userMap[action.verified_by] : null
            }));

            console.log('✅ Corrective actions fetched with user data:', actionsWithUsers.length);
            console.log('📊 First action user data:', actionsWithUsers[0]?.assignedToUser);
            return actionsWithUsers;
          } else {
            console.error('❌ Error fetching user data:', userError);
          }
        }
      }

      console.log('✅ Corrective actions fetched:', actions?.length || 0);
      return actions || [];

    } catch (error) {
      console.error('❌ Unexpected error fetching corrective actions:', error);
      return [];
    }
  }

  /**
   * Update a corrective action
   */
  static async updateCorrectiveAction(
    actionId: string, 
    updates: { description?: string; photos?: string[]; status?: string }
  ): Promise<{ success: boolean; error?: string }> {
    console.log('🔄 Updating corrective action...', { actionId, updates });

    try {
      // Update the main corrective action record (without photos)
      const { data: actionData, error: actionError } = await (supabase as any)
        .from('corrective_actions')
        .update({
          description: updates.description,
          status: updates.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', actionId)
        .select();

      if (actionError) {
        console.error('❌ Error updating corrective action:', actionError);
        return { success: false, error: actionError.message };
      }

      // Handle photos if provided (stored separately in corrective_action_photos table)
      if (updates.photos && updates.photos.length > 0) {
        console.log('📸 Saving corrective action photos:', updates.photos.length);
        const photoResult = await this.saveCorrectiveActionPhotos(actionId, updates.photos);
        if (!photoResult.success) {
          console.warn('⚠️ Photos failed to save but action was updated');
        }
      }

      console.log('✅ Corrective action updated:', actionData);
      return { success: true };

    } catch (error) {
      console.error('❌ Unexpected error updating corrective action:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Get photos for a corrective action
   */
  static async getCorrectiveActionPhotos(actionId: string): Promise<{ success: boolean; photos?: any[]; error?: string }> {
    try {
      const { data, error } = await (supabase as any)
        .from('corrective_action_photos')
        .select('*')
        .eq('action_id', actionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching corrective action photos:', error);
        return { success: false, error: error.message };
      }

      return { success: true, photos: data || [] };
    } catch (error) {
      console.error('❌ Unexpected error fetching photos:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Save photos for a corrective action
   */
  static async saveCorrectiveActionPhotos(actionId: string, photoUrls: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      // For now, we'll store the photo URLs as mock data
      // In a real implementation, this would handle R2 storage
      const photoRecords = photoUrls.map((url, index) => ({
        action_id: actionId,
        r2_bucket: 'qshe-corrective-actions',
        r2_key: `corrective-action-${actionId}-${Date.now()}-${index}`,
        r2_url: url,
        filename: `photo-${index + 1}.jpg`,
        original_filename: `corrective_action_photo_${index + 1}.jpg`,
        file_size: 0,
        mime_type: 'image/jpeg',
        photo_type: 'evidence',
        phase: 'execution'
      }));

      const { error } = await (supabase as any)
        .from('corrective_action_photos')
        .insert(photoRecords);

      if (error) {
        console.error('❌ Error saving corrective action photos:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Unexpected error saving photos:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Approve a corrective action with verification data
   */
  static async approveCorrectiveAction(
    actionId: string,
    verificationData: {
      reviewDescription: string;
      photos: string[];
      verifiedBy: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    console.log('✅ Approving corrective action...', { actionId, verificationData });

    try {
      const currentUser = await supabase.auth.getUser();
      const userId = currentUser.data.user?.id;

      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      // Update the corrective action status using existing columns
      const { data: actionData, error: actionError } = await (supabase as any)
        .from('corrective_actions')
        .update({
          status: 'completed', // Use 'completed' as approved status
          verified_by: userId, // Use existing verified_by column
          verification_date: new Date().toISOString(), // Store full timestamp with time
          verification_notes: `APPROVED: ${verificationData.reviewDescription}`, // Use existing verification_notes
          updated_at: new Date().toISOString()
        })
        .eq('id', actionId)
        .select();

      if (actionError) {
        console.error('❌ Error approving corrective action:', actionError);
        return { success: false, error: actionError.message };
      }

      // Save verification photos if provided
      if (verificationData.photos && verificationData.photos.length > 0) {
        console.log('📸 Saving verification photos:', verificationData.photos.length);
        const verificationPhotoRecords = verificationData.photos.map((url, index) => ({
          action_id: actionId,
          r2_bucket: 'qshe-corrective-actions',
          r2_key: `verification-${actionId}-${Date.now()}-${index}`,
          r2_url: url,
          filename: `verification-photo-${index + 1}.jpg`,
          original_filename: `verification_photo_${index + 1}.jpg`,
          file_size: 0,
          mime_type: 'image/jpeg',
          photo_type: 'verification',
          phase: 'verification',
          caption: 'Verification photo'
        }));

        const { error: photoError } = await (supabase as any)
          .from('corrective_action_photos')
          .insert(verificationPhotoRecords);

        if (photoError) {
          console.warn('⚠️ Verification photos failed to save but action was approved:', photoError);
        }
      }

      console.log('✅ Corrective action approved successfully:', actionData);
      
      // Get patrol ID from the corrective action and update patrol status
      if (actionData && actionData.length > 0) {
        const patrolId = actionData[0].patrol_id;
        const statusUpdate = await SafetyPatrolService.updatePatrolStatus(patrolId);
        if (!statusUpdate.success) {
          console.warn('⚠️ Failed to update patrol status after approval:', statusUpdate.error);
        } else {
          console.log('📋 Patrol status updated to:', statusUpdate.status);
        }
      }

      return { success: true };

    } catch (error) {
      console.error('❌ Unexpected error approving corrective action:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Reject a corrective action with verification data
   */
  static async rejectCorrectiveAction(
    actionId: string,
    verificationData: {
      reviewDescription: string;
      photos: string[];
      verifiedBy: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    console.log('❌ Rejecting corrective action...', { actionId, verificationData });

    try {
      const currentUser = await supabase.auth.getUser();
      const userId = currentUser.data.user?.id;

      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      // Update the corrective action status using existing columns
      const { data: actionData, error: actionError } = await (supabase as any)
        .from('corrective_actions')
        .update({
          status: 'assigned', // Keep as assigned since rejected is not in enum, use verification_notes to track rejection
          verified_by: userId, // Use existing verified_by column
          verification_date: new Date().toISOString(), // Store full timestamp with time
          verification_notes: `REJECTED: ${verificationData.reviewDescription}`, // Use existing verification_notes with rejection prefix
          updated_at: new Date().toISOString()
        })
        .eq('id', actionId)
        .select();

      if (actionError) {
        console.error('❌ Error rejecting corrective action:', actionError);
        return { success: false, error: actionError.message };
      }

      // Save verification photos if provided
      if (verificationData.photos && verificationData.photos.length > 0) {
        console.log('📸 Saving rejection verification photos:', verificationData.photos.length);
        const verificationPhotoRecords = verificationData.photos.map((url, index) => ({
          action_id: actionId,
          r2_bucket: 'qshe-corrective-actions',
          r2_key: `rejection-verification-${actionId}-${Date.now()}-${index}`,
          r2_url: url,
          filename: `rejection-verification-photo-${index + 1}.jpg`,
          original_filename: `rejection_verification_photo_${index + 1}.jpg`,
          file_size: 0,
          mime_type: 'image/jpeg',
          photo_type: 'verification',
          phase: 'rejection',
          caption: 'Rejection verification photo'
        }));

        const { error: photoError } = await (supabase as any)
          .from('corrective_action_photos')
          .insert(verificationPhotoRecords);

        if (photoError) {
          console.warn('⚠️ Rejection verification photos failed to save but action was rejected:', photoError);
        }
      }

      console.log('✅ Corrective action rejected successfully:', actionData);
      
      // Get patrol ID from the corrective action and update patrol status
      if (actionData && actionData.length > 0) {
        const patrolId = actionData[0].patrol_id;
        const statusUpdate = await SafetyPatrolService.updatePatrolStatus(patrolId);
        if (!statusUpdate.success) {
          console.warn('⚠️ Failed to update patrol status after rejection:', statusUpdate.error);
        } else {
          console.log('📋 Patrol status updated to:', statusUpdate.status);
        }
      }
      
      return { success: true };

    } catch (error) {
      console.error('❌ Unexpected error rejecting corrective action:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Update patrol status based on simplified 4-state lifecycle:
   * 1. 'open' - When patrol is first created (actions need response)
   * 2. 'pending_verification' - When actions need verification
   * 3. 'closed' - Verification approved
   * 4. 'rejected' - Verification rejected
   */
  static async updatePatrolStatus(patrolId: string): Promise<{ success: boolean; status?: string; error?: string }> {
    console.log('🔄 Updating patrol status for patrol:', patrolId);
    
    try {
      // Get all corrective actions for this patrol
      const { data: actions, error: actionsError } = await (supabase as any)
        .from('corrective_actions')
        .select('id, status, verification_notes')
        .eq('patrol_id', patrolId);

      if (actionsError) {
        console.error('❌ Error fetching corrective actions:', actionsError);
        return { success: false, error: actionsError.message };
      }

      let newStatus = 'open'; // Default: no actions yet
      
      if (actions && actions.length > 0) {
        const totalActions = actions.length;
        
        // Check verification results
        const approvedActions = actions.filter(a => 
          a.verification_notes && a.verification_notes.startsWith('APPROVED:')
        ).length;
        const rejectedActions = actions.filter(a => 
          a.verification_notes && a.verification_notes.startsWith('REJECTED:')
        ).length;
        const unverifiedActions = actions.filter(a => 
          !a.verification_notes || (!a.verification_notes.startsWith('APPROVED:') && !a.verification_notes.startsWith('REJECTED:'))
        ).length;
        
        // Determine status with priority: unverified > approved > rejected
        if (unverifiedActions > 0) {
          newStatus = 'pending_verification'; // Priority: Any unverified actions need verification
        } else if (approvedActions === totalActions && totalActions > 0) {
          newStatus = 'closed'; // All actions approved
        } else if (rejectedActions > 0) {
          newStatus = 'rejected'; // Only if all actions are verified and some rejected
        }
      }

      // Update patrol status
      const { error: updateError } = await (supabase as any)
        .from('safety_patrols')
        .update({ status: newStatus })
        .eq('id', patrolId);

      if (updateError) {
        console.error('❌ Error updating patrol status:', updateError);
        return { success: false, error: updateError.message };
      }

      console.log('✅ Patrol status updated to:', newStatus);
      return { success: true, status: newStatus };

    } catch (error) {
      console.error('❌ Error updating patrol status:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }
}
