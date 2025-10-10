// Improved Profile Completion Service
// Handles the final database update with all user data

import { supabase } from '../lib/api/supabase';
import { UnifiedStorageService } from './UnifiedStorageService';
import type { ProfileCompletionState } from '../components/profile-completion/types/profile-completion.types';

interface ProfileCompletionData {
  firstName: string;
  lastName: string;
  firstNameThai?: string;
  lastNameThai?: string;
  nationality?: string;
  positionId?: string;
  companyId?: string;
  password?: string;
  profilePhotoFile?: File | null;
  faceDescriptor?: Float32Array | null;
  faceConfidence?: number;
  faceQuality?: number;
  duplicatesConfirmed?: boolean;
}

interface ProfileCompletionResult {
  success: boolean;
  user?: any;
  error?: string;
  message?: string;
}

export class ImprovedProfileCompletionService {
  
  /**
   * Complete user profile with all collected data
   */
  static async completeProfile(
    userId: string, 
    profileData: ProfileCompletionData
  ): Promise<ProfileCompletionResult> {
    
    console.log('🔄 Starting improved profile completion for user:', userId);
    console.log('📋 Profile data:', {
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      hasPassword: !!profileData.password,
      hasPhoto: !!profileData.profilePhotoFile,
      hasFaceData: !!profileData.faceDescriptor,
      duplicatesConfirmed: profileData.duplicatesConfirmed
    });
    
    try {
      let photoUrl: string | null = null;
      let faceDescriptors: number[][] | null = null;
      
      // STEP 1: Upload profile photo (if provided)
      if (profileData.profilePhotoFile) {
        console.log('📸 Uploading profile photo via UnifiedStorageService...');
        
        // Use unified storage service
        const uploadResult = await UnifiedStorageService.uploadProfilePhoto(
          profileData.profilePhotoFile,
          userId,
          (progress: number) => console.log(`Upload progress: ${progress}%`)
        );
        
        if (!uploadResult.success) {
          throw new Error(`Photo upload failed: ${uploadResult.error}`);
        }
        
        photoUrl = uploadResult.url || null;
        console.log('✅ Profile photo uploaded via', uploadResult.provider, ':', photoUrl);
      }
      
      // STEP 2: Prepare face descriptors (if available)
      if (profileData.faceDescriptor) {
        faceDescriptors = [Array.from(profileData.faceDescriptor)];
        console.log('✅ Face descriptor prepared, length:', faceDescriptors[0].length);
      }
      
      // STEP 3: Single comprehensive database update
      console.log('💾 Updating user record in database...');
      
      const { data: updatedUser, error: updateError } = await (supabase as any)
        .from('users')
        .update({
          // User info (editable during profile completion)
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          first_name_thai: profileData.firstNameThai || null,
          last_name_thai: profileData.lastNameThai || null,
          nationality: profileData.nationality || null,
          position_id: profileData.positionId || null,
          company_id: profileData.companyId || null,
          
          // Profile completion data
          profile_photo_url: photoUrl,
          face_descriptors: faceDescriptors,
          
          // Status and timestamps  
          status: 'active',
          profile_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          
          // Security: Invalidate token to prevent reuse
          invitation_token: null,
          invitation_expires_at: null
        })
        .eq('id', userId)
        .eq('status', 'invited') // Security: only update invited users
        .select()
        .single();
        
      if (updateError) {
        console.error('❌ Database update failed:', updateError);
        
        // Specific error handling
        if (updateError.code === '23505') {
          throw new Error('Data conflict detected. Please try again.');
        } else if (updateError.code === '42501') {
          throw new Error('Permission denied. User may not exist or already active.');
        } else if (updateError.message.includes('no rows')) {
          throw new Error('User not found or profile already completed.');
        } else {
          throw new Error(`Database error: ${updateError.message}`);
        }
      }
      
      if (!updatedUser) {
        throw new Error('User not found or profile already completed.');
      }
      
      console.log('✅ Database update successful:', {
        userId: updatedUser.id,
        status: updatedUser.status,
        profileCompletedAt: updatedUser.profile_completed_at,
        hasPhoto: !!updatedUser.profile_photo_url,
        hasFaceData: !!updatedUser.face_descriptors
      });
      
      // STEP 4: Password handling note
      if (profileData.password) {
        console.log('� Password handling: Password should be set during user creation/invitation process');
        console.log('🔐 User authentication will be available after profile completion');
        // Note: Password is typically set during the invitation/user creation process
        // The user will be able to log in with their username and password after profile completion
        // No need to update password here as it should already be configured
      }
      
      console.log('🎉 Profile completion successful!');
      
      return {
        success: true,
        user: updatedUser,
        message: 'Profile completed successfully! Your account is now active.'
      };
      
    } catch (error: any) {
      console.error('❌ Profile completion failed:', error);
      
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        message: `Profile completion failed: ${error.message}`
      };
    }
  }
  
  /**
   * Update user profile using wizard state data (edit mode)
   */
  static async updateUserProfile(state: ProfileCompletionState): Promise<ProfileCompletionResult> {
    if (!state.userData?.id) {
      return {
        success: false,
        error: 'Missing user ID',
        message: 'Invalid user data'
      };
    }
    
    console.log('🔄 Starting profile update for user:', state.userData.id);
    
    try {
      let photoUrl: string | null = null;
      let faceDescriptors: number[][] | null = null;
      
      // STEP 1: Upload new profile photo (if provided)
      if (state.photoData?.file) {
        console.log('📸 Uploading new profile photo...');
        
        const uploadResult = await UnifiedStorageService.uploadProfilePhoto(
          state.photoData.file,
          state.userData.id
        );
        
        if (uploadResult.success && uploadResult.url) {
          photoUrl = uploadResult.url;
          console.log('✅ Profile photo uploaded:', photoUrl);
        } else {
          console.error('❌ Photo upload failed:', uploadResult.error);
          return {
            success: false,
            error: uploadResult.error || 'Photo upload failed',
            message: 'Failed to upload profile photo'
          };
        }
      }
      
      // STEP 2: Process face recognition data (if provided)
      if (state.faceData?.descriptor) {
        console.log('🎯 Processing face recognition data...');
        
        try {
          // Convert Float32Array to regular array for storage
          faceDescriptors = [Array.from(state.faceData.descriptor)];
          console.log('✅ Face descriptor processed');
        } catch (faceError) {
          console.error('❌ Face processing error:', faceError);
          return {
            success: false,
            error: 'Face recognition processing failed',
            message: 'Failed to process face recognition data'
          };
        }
      }
      
      // STEP 3: Update user record in database
      console.log('💾 Updating user profile in database...');
      
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString()
      };
      
      // Only update fields that were changed
      // Note: Password updates should be handled through Supabase Auth, not the users table
      // if (state.passwordData?.password) {
      //   // Password updates need to be handled via Supabase Auth API, not users table
      // }
      
      if (photoUrl) {
        updateData.profile_photo_url = photoUrl;
      }
      
      if (faceDescriptors) {
        updateData.face_descriptors = faceDescriptors;
        // Note: face_confidence and face_quality are not part of current schema
        // If needed, these could be stored within the face_descriptors JSONB field
      }
      
      // Update names if they were changed (from passwordData if step 1 was completed)
      if (state.passwordData?.firstName || state.userData.firstName) {
        updateData.first_name = state.passwordData?.firstName || state.userData.firstName;
      }
      if (state.passwordData?.lastName || state.userData.lastName) {
        updateData.last_name = state.passwordData?.lastName || state.userData.lastName;
      }
      
      // Update Thai names if provided
      if (state.passwordData?.firstNameThai !== undefined) {
        updateData.first_name_thai = state.passwordData.firstNameThai || null;
      }
      if (state.passwordData?.lastNameThai !== undefined) {
        updateData.last_name_thai = state.passwordData.lastNameThai || null;
      }
      
      // Update nationality if provided
      if (state.passwordData?.nationality !== undefined) {
        updateData.nationality = state.passwordData.nationality || null;
      }
      
      // Update position if provided
      if (state.passwordData?.positionId !== undefined) {
        updateData.position_id = state.passwordData.positionId ? parseInt(state.passwordData.positionId) : null;
      }
      
      // Update company if provided
      if (state.passwordData?.companyId !== undefined) {
        updateData.company_id = state.passwordData.companyId || null;
      }
      
      const { data: updatedUser, error: updateError } = await (supabase as any)
        .from('users')
        .update(updateData)
        .eq('id', state.userData.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Database update error:', updateError);
        return {
          success: false,
          error: updateError.message,
          message: 'Failed to update user profile'
        };
      }
      
      console.log('✅ Profile update successful!');
      
      return {
        success: true,
        user: updatedUser,
        message: 'Profile updated successfully'
      };
      
    } catch (error: any) {
      console.error('❌ Profile update error:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        message: `Profile update failed: ${error.message}`
      };
    }
  }

  /**
   * Complete profile using wizard state data
   */
  static async completeProfileFromWizardState(state: ProfileCompletionState): Promise<ProfileCompletionResult> {
    if (!state.userData?.id) {
      return {
        success: false,
        error: 'Missing user ID',
        message: 'Invalid user data'
      };
    }
    
    // Extract data from wizard state
    const profileData: ProfileCompletionData = {
      firstName: state.passwordData?.firstName || state.userData.firstName, // Use updated name from step 1 if available
      lastName: state.passwordData?.lastName || state.userData.lastName,   // Use updated name from step 1 if available
      firstNameThai: state.passwordData?.firstNameThai || state.userData.firstNameThai,
      lastNameThai: state.passwordData?.lastNameThai || state.userData.lastNameThai,
      nationality: state.passwordData?.nationality || state.userData.nationality,
      positionId: state.passwordData?.positionId || state.userData.positionId,
      companyId: state.passwordData?.companyId || state.userData.companyId,
      password: state.passwordData?.password,
      profilePhotoFile: state.photoData?.file || null,
      faceDescriptor: state.faceData?.descriptor || null,
      faceConfidence: state.faceData?.confidence || 0,
      faceQuality: state.faceData?.quality || 0,
      duplicatesConfirmed: state.duplicateCheck?.confirmed || false
    };
    
    return this.completeProfile(state.userData.id, profileData);
  }
}
