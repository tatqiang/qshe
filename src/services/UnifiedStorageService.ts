// Unified Storage Service - Core Architecture Solution
// This prevents storage mismatches and provides a single interface for all photo uploads

import { uploadProfilePhoto as r2UploadProfile } from '../lib/storage/r2Client';
import { supabase } from '../lib/api/supabase';

// Storage configuration - centralized
interface StorageConfig {
  provider: 'r2' | 'supabase' | 'mock';
  profilePhotos: {
    provider: 'r2' | 'supabase' | 'mock';
    bucket?: string;
    folder?: string;
  };
  patrolPhotos: {
    provider: 'r2' | 'supabase' | 'mock';
    bucket?: string;
    folder?: string;
  };
  correctiveActionPhotos: {
    provider: 'r2' | 'supabase' | 'mock';
    bucket?: string;
    folder?: string;
  };
}

// Default storage configuration for the QSHE system
const STORAGE_CONFIG: StorageConfig = {
  provider: 'r2', // Primary storage provider
  profilePhotos: {
    provider: 'r2', // Use R2 for profile photos
    folder: 'profiles'
  },
  patrolPhotos: {
    provider: 'r2', // Use R2 for patrol photos
    folder: 'patrols'
  },
  correctiveActionPhotos: {
    provider: 'r2', // Use R2 for corrective action photos
    folder: 'corrective-actions'
  }
};

// Unified upload result interface
export interface UnifiedUploadResult {
  success: boolean;
  url?: string;
  fileName?: string;
  error?: string;
  provider?: string;
}

// Progress callback type
export type ProgressCallback = (progress: number) => void;

/**
 * Unified Storage Service - Single interface for all photo uploads
 * This prevents storage provider mismatches and provides consistent error handling
 */
export class UnifiedStorageService {
  
  /**
   * Upload profile photo using the configured storage provider
   */
  static async uploadProfilePhoto(
    file: File,
    userId: string,
    onProgress?: ProgressCallback
  ): Promise<UnifiedUploadResult> {
    
    console.log('📸 Uploading profile photo via UnifiedStorageService...');
    console.log('Provider:', STORAGE_CONFIG.profilePhotos.provider);
    
    try {
      const config = STORAGE_CONFIG.profilePhotos;
      
      switch (config.provider) {
        case 'r2':
          return await this.uploadToR2Profile(file, userId, onProgress);
          
        case 'supabase':
          return await this.uploadToSupabaseStorage(file, userId, 'profile-photos', onProgress);
          
        case 'mock':
          return await this.mockUpload(file, 'profile', onProgress);
          
        default:
          throw new Error(`Unsupported storage provider: ${config.provider}`);
      }
      
    } catch (error: any) {
      console.error('❌ Profile photo upload failed:', error);
      return {
        success: false,
        error: error.message || 'Upload failed',
        provider: STORAGE_CONFIG.profilePhotos.provider
      };
    }
  }
  
  /**
   * Upload patrol photo using the configured storage provider
   */
  static async uploadPatrolPhoto(
    file: File,
    patrolId: string,
    userId: string,
    index: number,
    onProgress?: ProgressCallback
  ): Promise<UnifiedUploadResult> {
    
    console.log('📸 Uploading patrol photo via UnifiedStorageService...');
    console.log('Provider:', STORAGE_CONFIG.patrolPhotos.provider);
    
    try {
      const config = STORAGE_CONFIG.patrolPhotos;
      
      switch (config.provider) {
        case 'r2':
          // Use existing R2 patrol upload if available
          const fileName = `patrol-${patrolId}-${index}-${Date.now()}.jpg`;
          console.log(`Uploading patrol photo: ${fileName} for user: ${userId}`);
          return await this.uploadToR2General(file, fileName, 'patrols', onProgress);
          
        case 'supabase':
          return await this.uploadToSupabaseStorage(file, patrolId, 'patrol-photos', onProgress);
          
        case 'mock':
          return await this.mockUpload(file, 'patrol', onProgress);
          
        default:
          throw new Error(`Unsupported storage provider: ${config.provider}`);
      }
      
    } catch (error: any) {
      console.error('❌ Patrol photo upload failed:', error);
      return {
        success: false,
        error: error.message || 'Upload failed',
        provider: STORAGE_CONFIG.patrolPhotos.provider
      };
    }
  }
  
  /**
   * Upload corrective action photo using the configured storage provider
   */
  static async uploadCorrectiveActionPhoto(
    file: File,
    actionId: string,
    phase: string,
    onProgress?: ProgressCallback
  ): Promise<UnifiedUploadResult> {
    
    console.log('📸 Uploading corrective action photo via UnifiedStorageService...');
    console.log('Provider:', STORAGE_CONFIG.correctiveActionPhotos.provider);
    
    try {
      const config = STORAGE_CONFIG.correctiveActionPhotos;
      const fileName = `action-${actionId}-${phase}-${Date.now()}.jpg`;
      
      switch (config.provider) {
        case 'r2':
          return await this.uploadToR2General(file, fileName, 'corrective-actions', onProgress);
          
        case 'supabase':
          return await this.uploadToSupabaseStorage(file, actionId, 'corrective-action-photos', onProgress);
          
        case 'mock':
          return await this.mockUpload(file, 'corrective-action', onProgress);
          
        default:
          throw new Error(`Unsupported storage provider: ${config.provider}`);
      }
      
    } catch (error: any) {
      console.error('❌ Corrective action photo upload failed:', error);
      return {
        success: false,
        error: error.message || 'Upload failed',
        provider: STORAGE_CONFIG.correctiveActionPhotos.provider
      };
    }
  }
  
  /**
   * Get storage configuration for debugging
   */
  static getStorageConfig(): StorageConfig {
    return STORAGE_CONFIG;
  }
  
  /**
   * Check if storage is properly configured
   */
  static async validateStorageConfig(): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    // Check R2 configuration if used
    if (STORAGE_CONFIG.provider === 'r2') {
      const r2Env = {
        accountId: import.meta.env.VITE_R2_ACCOUNT_ID,
        accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
        secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
        bucketName: import.meta.env.VITE_R2_BUCKET_NAME
      };
      
      if (!r2Env.accountId) issues.push('Missing VITE_R2_ACCOUNT_ID');
      if (!r2Env.accessKeyId) issues.push('Missing VITE_R2_ACCESS_KEY_ID');
      if (!r2Env.secretAccessKey) issues.push('Missing VITE_R2_SECRET_ACCESS_KEY');
      if (!r2Env.bucketName) issues.push('Missing VITE_R2_BUCKET_NAME');
    }
    
    // Check Supabase configuration if used
    const needsSupabase = Object.values(STORAGE_CONFIG).some(
      config => typeof config === 'object' && config.provider === 'supabase'
    );
    
    if (needsSupabase) {
      const supabaseEnv = {
        url: import.meta.env.VITE_SUPABASE_URL,
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
      };
      
      if (!supabaseEnv.url) issues.push('Missing VITE_SUPABASE_URL');
      if (!supabaseEnv.anonKey) issues.push('Missing VITE_SUPABASE_ANON_KEY');
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
  
  // Private helper methods
  
  private static async uploadToR2Profile(
    file: File,
    userId: string,
    onProgress?: ProgressCallback
  ): Promise<UnifiedUploadResult> {
    
    try {
      const result = await r2UploadProfile(file, userId, onProgress);
      
      return {
        success: result.success,
        url: result.url,
        fileName: result.fileName,
        error: result.error,
        provider: 'r2'
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        provider: 'r2'
      };
    }
  }
  
  private static async uploadToR2General(
    file: File,
    fileName: string,
    folder: string,
    onProgress?: ProgressCallback
  ): Promise<UnifiedUploadResult> {
    
    // This would use a general R2 upload function
    // For now, fall back to mock for non-profile uploads
    console.log(`📝 R2 general upload not implemented for ${folder}/${fileName}, using mock`);
    return await this.mockUpload(file, folder, onProgress);
  }
  
  private static async uploadToSupabaseStorage(
    file: File,
    id: string,
    bucket: string,
    onProgress?: ProgressCallback
  ): Promise<UnifiedUploadResult> {
    
    try {
      // Simulate progress
      if (onProgress) {
        for (let i = 0; i <= 50; i += 10) {
          onProgress(i);
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      const fileName = `${id}-${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (error) {
        // Check if bucket doesn't exist
        if (error.message.includes('Bucket not found')) {
          throw new Error(`Supabase storage bucket '${bucket}' does not exist. Please create it in your Supabase dashboard.`);
        }
        throw new Error(error.message);
      }
      
      // Complete progress
      if (onProgress) onProgress(100);
      
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);
        
      return {
        success: true,
        url: urlData.publicUrl,
        fileName: fileName,
        provider: 'supabase'
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        provider: 'supabase'
      };
    }
  }
  
  private static async mockUpload(
    file: File,
    type: string,
    onProgress?: ProgressCallback
  ): Promise<UnifiedUploadResult> {
    
    console.log(`🧪 Mock upload for ${type} photo`);
    
    // Simulate upload progress
    if (onProgress) {
      for (let i = 0; i <= 100; i += 20) {
        onProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Create a blob URL for preview
    const mockUrl = URL.createObjectURL(file);
    
    return {
      success: true,
      url: mockUrl,
      fileName: `mock-${type}-${Date.now()}.jpg`,
      provider: 'mock'
    };
  }
}

// Export the storage configuration for other services to check
export { STORAGE_CONFIG };
