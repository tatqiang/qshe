// Storage Architecture Validator
// This helps prevent storage mismatches and validates configuration at startup

import { UnifiedStorageService, STORAGE_CONFIG } from './UnifiedStorageService';

/**
 * Storage Architecture Health Check
 * Call this at application startup to validate storage configuration
 */
export class StorageArchitectureValidator {
  
  /**
   * Perform comprehensive storage validation
   */
  static async validateStorageArchitecture(): Promise<{
    valid: boolean;
    warnings: string[];
    errors: string[];
    recommendations: string[];
  }> {
    
    console.log('🔍 Validating Storage Architecture...');
    
    const warnings: string[] = [];
    const errors: string[] = [];
    const recommendations: string[] = [];
    
    // 1. Check storage configuration
    const configCheck = await UnifiedStorageService.validateStorageConfig();
    if (!configCheck.valid) {
      errors.push(...configCheck.issues.map(issue => `Configuration: ${issue}`));
    }
    
    // 2. Check for mixed storage usage
    const providers = new Set([
      STORAGE_CONFIG.profilePhotos.provider,
      STORAGE_CONFIG.patrolPhotos.provider,
      STORAGE_CONFIG.correctiveActionPhotos.provider
    ]);
    
    if (providers.size > 1) {
      warnings.push('Mixed storage providers detected. Consider standardizing on one provider.');
      recommendations.push('Update STORAGE_CONFIG to use consistent providers for better maintainability.');
    }
    
    // 3. Check environment variables
    const envCheck = this.checkEnvironmentVariables();
    warnings.push(...envCheck.warnings);
    errors.push(...envCheck.errors);
    
    // 4. Check for legacy code patterns
    const legacyCheck = this.checkForLegacyPatterns();
    warnings.push(...legacyCheck.warnings);
    recommendations.push(...legacyCheck.recommendations);
    
    // 5. Performance recommendations
    const perfCheck = this.checkPerformanceOptimizations();
    recommendations.push(...perfCheck.recommendations);
    
    const valid = errors.length === 0;
    
    console.log('📋 Storage Architecture Validation Results:');
    console.log('Valid:', valid);
    console.log('Warnings:', warnings.length);
    console.log('Errors:', errors.length);
    console.log('Recommendations:', recommendations.length);
    
    return {
      valid,
      warnings,
      errors,
      recommendations
    };
  }
  
  /**
   * Check environment variables for completeness
   */
  private static checkEnvironmentVariables(): {
    warnings: string[];
    errors: string[];
  } {
    
    const warnings: string[] = [];
    const errors: string[] = [];
    
    // Check Supabase configuration
    if (!import.meta.env.VITE_SUPABASE_URL) {
      errors.push('Missing VITE_SUPABASE_URL environment variable');
    }
    
    if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
      errors.push('Missing VITE_SUPABASE_ANON_KEY environment variable');
    }
    
    // Check R2 configuration (if using R2)
    const usingR2 = Object.values(STORAGE_CONFIG).some(
      config => typeof config === 'object' && config.provider === 'r2'
    );
    
    if (usingR2) {
      if (!import.meta.env.VITE_R2_ACCOUNT_ID) {
        warnings.push('Missing VITE_R2_ACCOUNT_ID - R2 uploads will use mock mode');
      }
      
      if (!import.meta.env.VITE_R2_ACCESS_KEY_ID) {
        warnings.push('Missing VITE_R2_ACCESS_KEY_ID - R2 uploads will use mock mode');
      }
      
      if (!import.meta.env.VITE_R2_SECRET_ACCESS_KEY) {
        warnings.push('Missing VITE_R2_SECRET_ACCESS_KEY - R2 uploads will use mock mode');
      }
      
      if (!import.meta.env.VITE_R2_BUCKET_NAME) {
        warnings.push('Missing VITE_R2_BUCKET_NAME - R2 uploads will use mock mode');
      }
    }
    
    return { warnings, errors };
  }
  
  /**
   * Check for legacy storage patterns that should be updated
   */
  private static checkForLegacyPatterns(): {
    warnings: string[];
    recommendations: string[];
  } {
    
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    // This would ideally scan the codebase, but for now we'll provide guidance
    recommendations.push('Replace direct supabase.storage calls with UnifiedStorageService methods');
    recommendations.push('Replace direct r2Client calls with UnifiedStorageService methods');
    recommendations.push('Update all photo upload functions to use unified interface');
    
    return { warnings, recommendations };
  }
  
  /**
   * Check for performance optimization opportunities
   */
  private static checkPerformanceOptimizations(): {
    recommendations: string[];
  } {
    
    const recommendations: string[] = [];
    
    recommendations.push('Consider implementing image compression before upload');
    recommendations.push('Add retry logic for failed uploads');
    recommendations.push('Implement upload progress caching for large files');
    recommendations.push('Consider CDN configuration for faster image delivery');
    
    return { recommendations };
  }
  
  /**
   * Get storage architecture summary
   */
  static getArchitectureSummary(): {
    providers: string[];
    configuration: typeof STORAGE_CONFIG;
    recommendations: string[];
  } {
    
    const providers = Array.from(new Set([
      STORAGE_CONFIG.profilePhotos.provider,
      STORAGE_CONFIG.patrolPhotos.provider,
      STORAGE_CONFIG.correctiveActionPhotos.provider
    ]));
    
    const recommendations = [
      'Use UnifiedStorageService for all photo uploads',
      'Validate storage configuration at application startup',
      'Monitor upload success rates and performance',
      'Implement fallback strategies for upload failures'
    ];
    
    return {
      providers,
      configuration: STORAGE_CONFIG,
      recommendations
    };
  }
  
  /**
   * Quick validation check for development
   */
  static async quickCheck(): Promise<boolean> {
    try {
      const result = await this.validateStorageArchitecture();
      
      if (!result.valid) {
        console.error('❌ Storage Architecture Issues:');
        result.errors.forEach(error => console.error('  -', error));
      }
      
      if (result.warnings.length > 0) {
        console.warn('⚠️ Storage Architecture Warnings:');
        result.warnings.forEach(warning => console.warn('  -', warning));
      }
      
      return result.valid;
      
    } catch (error) {
      console.error('❌ Storage validation failed:', error);
      return false;
    }
  }
}
