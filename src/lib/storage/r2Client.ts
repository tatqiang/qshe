// Cloudflare R2 Configuration and Upload Utilities
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
}

// R2 configuration from environment variables
const getR2Config = (): R2Config => {
  const config = {
    accountId: import.meta.env.VITE_R2_ACCOUNT_ID,
    accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
    bucketName: import.meta.env.VITE_R2_BUCKET_NAME || 'qshe',
    publicUrl: import.meta.env.VITE_R2_PUBLIC_URL || '',
  };

  // Validate required environment variables
  const missing = Object.entries(config)
    .filter(([key, value]) => !value && key !== 'publicUrl')
    .map(([key]) => `VITE_${key.toUpperCase()}`);

  if (missing.length > 0) {
    console.warn('Missing R2 environment variables:', missing.join(', '));
    console.warn('Falling back to mock upload mode');
    return null as any;
  }

  return config;
};

// Initialize S3 client for R2
const createR2Client = () => {
  const config = getR2Config();
  if (!config) return null;

  return new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
};

// Image processing utilities
const resizeImage = (file: File, maxWidth: number = 800, maxHeight: number = 800, quality: number = 0.8): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Generate unique filename for patrol photos
const generatePatrolPhotoFileName = (patrolId: string, userId: string, index: number, fileExtension: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  return `patrols/${patrolId}/photo-${index + 1}-${timestamp}-${random}.${fileExtension}`;
};

// Upload patrol photo to R2
export const uploadPatrolPhoto = async (
  file: File,
  patrolId: string,
  userId: string,
  index: number,
  onProgress?: UploadProgressCallback
): Promise<UploadResult> => {
  try {
    const client = createR2Client();
    const config = getR2Config();

    // Generate filename for patrol photo
    const fileName = generatePatrolPhotoFileName(patrolId, userId, index, 'jpg');

    // Use mock upload if R2 not configured
    if (!client || !config) {
      console.log('Using mock upload for patrol photo - R2 not configured');
      return await mockUpload(file, fileName, onProgress);
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'Please select an image file' };
    }

    // Validate file size (10MB limit for patrol photos)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { success: false, error: 'Image must be smaller than 10MB' };
    }

    onProgress?.(10);

    // Resize/compress image for patrol photos (higher quality than profile photos)
    const compressedBlob = await resizeImage(file, 1200, 1200, 0.85);
    onProgress?.(40);

    try {
      // Convert blob to ArrayBuffer
      const arrayBuffer = await compressedBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Upload to R2
      const uploadCommand = new PutObjectCommand({
        Bucket: config.bucketName,
        Key: fileName,
        Body: uint8Array,
        ContentType: 'image/jpeg',
        Metadata: {
          patrolId: patrolId,
          userId: userId,
          photoIndex: index.toString(),
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          photoType: 'patrol-issue'
        },
      });

      await client.send(uploadCommand);
      onProgress?.(90);

      // Generate public URL (bucket-specific domain doesn't need bucket name in path)
      const publicUrl = config.publicUrl 
        ? `${config.publicUrl}/${fileName}`
        : `https://${config.bucketName}.${config.accountId}.r2.cloudflarestorage.com/${fileName}`;

      onProgress?.(100);

      console.log(`✅ Patrol photo uploaded successfully: ${fileName}`);

      return {
        success: true,
        url: publicUrl,
        fileName: fileName,
      };

    } catch (error: any) {
      console.error('R2 Upload failed for patrol photo:', error);
      return {
        success: false,
        error: error.message || 'Upload failed',
      };
    }
  } catch (error: any) {
    console.error('Patrol photo upload preparation failed:', error);
    return {
      success: false,
      error: error.message || 'Upload preparation failed',
    };
  }
};

// Upload multiple patrol photos
export const uploadPatrolPhotos = async (
  files: File[],
  patrolId: string,
  userId: string,
  onProgress?: (photoIndex: number, progress: number) => void
): Promise<UploadResult[]> => {
  const results: UploadResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`📸 Uploading patrol photo ${i + 1}/${files.length}: ${file.name}`);
    
    const result = await uploadPatrolPhoto(
      file,
      patrolId,
      userId,
      i,
      (progress) => onProgress?.(i, progress)
    );
    
    results.push(result);
    
    if (!result.success) {
      console.error(`❌ Failed to upload photo ${i + 1}: ${result.error}`);
    }
  }
  
  return results;
};

// Delete patrol photo from R2
export const deletePatrolPhoto = async (fileName: string): Promise<boolean> => {
  try {
    const client = createR2Client();
    const config = getR2Config();

    if (!client || !config) {
      console.log('Mock delete for patrol photo - R2 not configured');
      return true; // Mock success
    }

    const deleteCommand = new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: fileName,
    });

    await client.send(deleteCommand);
    console.log(`✅ Patrol photo deleted: ${fileName}`);
    return true;

  } catch (error) {
    console.error('Failed to delete patrol photo:', error);
    return false;
  }
};

// ==================== SAFETY AUDIT PHOTOS ====================

// Generate unique filename for safety audit photos
const generateAuditPhotoFileName = (auditId: string, userId: string, index: number, fileExtension: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  return `safety-audits/${auditId}/photo-${index + 1}-${timestamp}-${random}.${fileExtension}`;
};

// Upload safety audit photo to R2
export const uploadAuditPhoto = async (
  file: File,
  auditId: string,
  userId: string,
  index: number,
  categoryId?: string,
  onProgress?: UploadProgressCallback
): Promise<UploadResult> => {
  try {
    const client = createR2Client();
    const config = getR2Config();

    // Generate filename for audit photo
    const fileName = generateAuditPhotoFileName(auditId, userId, index, 'jpg');

    // Use mock upload if R2 not configured
    if (!client || !config) {
      console.log('Using mock upload for audit photo - R2 not configured');
      return await mockUpload(file, fileName, onProgress);
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'Please select an image file' };
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { success: false, error: 'Image must be smaller than 10MB' };
    }

    onProgress?.(10);

    // Resize/compress image
    const compressedBlob = await resizeImage(file, 1200, 1200, 0.85);
    onProgress?.(40);

    try {
      // Convert blob to ArrayBuffer
      const arrayBuffer = await compressedBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Upload to R2
      const uploadCommand = new PutObjectCommand({
        Bucket: config.bucketName,
        Key: fileName,
        Body: uint8Array,
        ContentType: 'image/jpeg',
        Metadata: {
          auditId: auditId,
          userId: userId,
          photoIndex: index.toString(),
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          photoType: 'safety-audit',
          ...(categoryId && { categoryId })
        },
      });

      await client.send(uploadCommand);
      onProgress?.(90);

      // Generate public URL
      const publicUrl = config.publicUrl 
        ? `${config.publicUrl}/${fileName}`
        : `https://${config.bucketName}.${config.accountId}.r2.cloudflarestorage.com/${fileName}`;

      onProgress?.(100);

      console.log(`✅ Audit photo uploaded successfully: ${fileName}`);

      return {
        success: true,
        url: publicUrl,
        fileName: fileName,
      };

    } catch (error: any) {
      console.error('R2 Upload failed for audit photo:', error);
      return {
        success: false,
        error: error.message || 'Upload failed',
      };
    }
  } catch (error: any) {
    console.error('Audit photo upload preparation failed:', error);
    return {
      success: false,
      error: error.message || 'Upload preparation failed',
    };
  }
};

// Upload multiple safety audit photos
export const uploadAuditPhotos = async (
  files: File[],
  auditId: string,
  userId: string,
  categoryId?: string,
  onProgress?: (photoIndex: number, progress: number) => void
): Promise<UploadResult[]> => {
  const results: UploadResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`📸 Uploading audit photo ${i + 1}/${files.length}: ${file.name}`);
    
    const result = await uploadAuditPhoto(
      file,
      auditId,
      userId,
      i,
      categoryId,
      (progress) => onProgress?.(i, progress)
    );
    
    results.push(result);
    
    if (!result.success) {
      console.error(`❌ Failed to upload photo ${i + 1}: ${result.error}`);
    }
  }
  
  return results;
};

// Delete safety audit photo from R2
export const deleteAuditPhoto = async (fileName: string): Promise<boolean> => {
  try {
    const client = createR2Client();
    const config = getR2Config();

    if (!client || !config) {
      console.log('Mock delete for audit photo - R2 not configured');
      return true; // Mock success
    }

    const deleteCommand = new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: fileName,
    });

    await client.send(deleteCommand);
    console.log(`✅ Audit photo deleted: ${fileName}`);
    return true;

  } catch (error) {
    console.error('Failed to delete audit photo:', error);
    return false;
  }
};

// Generate unique filename
const generateFileName = (userId: string, fileExtension: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `profiles/${userId}/${timestamp}-${random}.${fileExtension}`;
};

// Upload progress callback type
export type UploadProgressCallback = (progress: number) => void;

// Upload result interface
export interface UploadResult {
  success: boolean;
  url?: string;
  fileName?: string;
  error?: string;
}

// Mock upload for development/fallback
const mockUpload = async (file: File, fileName: string, onProgress?: UploadProgressCallback): Promise<UploadResult> => {
  console.log('Using mock upload - R2 not configured');
  
  // Simulate upload progress
  if (onProgress) {
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      onProgress(i);
    }
  }

  // Create a blob URL for preview (temporary)
  const mockUrl = URL.createObjectURL(file);
  
  return {
    success: true,
    url: mockUrl,
    fileName: fileName,
  };
};

// Main upload function
export const uploadProfilePhoto = async (
  file: File,
  userId: string,
  onProgress?: UploadProgressCallback
): Promise<UploadResult> => {
  try {
    const client = createR2Client();
    const config = getR2Config();

    // Use mock upload if R2 not configured
    if (!client || !config) {
      const fileName = generateFileName(userId, 'jpg');
      return await mockUpload(file, fileName, onProgress);
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'Please select an image file' };
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { success: false, error: 'Image must be smaller than 5MB' };
    }

    onProgress?.(10);

    // Resize/compress image
    const compressedBlob = await resizeImage(file);
    onProgress?.(30);

    // Generate filename
    const fileName = generateFileName(userId, 'jpg');
    
    onProgress?.(50);

    try {
      // Convert blob to ArrayBuffer for better browser compatibility
      const arrayBuffer = await compressedBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Upload to R2
      const uploadCommand = new PutObjectCommand({
        Bucket: config.bucketName,
        Key: fileName,
        Body: uint8Array,
        ContentType: 'image/jpeg',
        Metadata: {
          userId: userId,
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });

      await client.send(uploadCommand);
      onProgress?.(90);

      // Note: R2 buckets are private by default
      // For public access, bucket needs to be configured as public or use custom domain
      const publicUrl = config.publicUrl 
        ? `${config.publicUrl}/${fileName}`
        : `https://${config.bucketName}.${config.accountId}.r2.cloudflarestorage.com/${fileName}`;

      onProgress?.(100);

      return {
        success: true,
        url: publicUrl,
        fileName: fileName,
      };

    } catch (error: any) {
      console.error('R2 Upload failed:', error);
      return {
        success: false,
        error: error.message || 'Upload failed',
      };
    }
  } catch (error: any) {
    console.error('Upload preparation failed:', error);
    return {
      success: false,
      error: error.message || 'Upload preparation failed',
    };
  }
};

// Delete photo from R2
export const deleteProfilePhoto = async (fileName: string): Promise<boolean> => {
  try {
    const client = createR2Client();
    const config = getR2Config();

    if (!client || !config) {
      console.log('Mock delete - R2 not configured');
      return true; // Mock success
    }

    const deleteCommand = new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: fileName,
    });

    await client.send(deleteCommand);
    return true;

  } catch (error) {
    console.error('Delete failed:', error);
    return false;
  }
};

// Utility to check if R2 is configured
export const isR2Configured = (): boolean => {
  const config = getR2Config();
  return !!(config?.accountId && config?.accessKeyId && config?.secretAccessKey);
};

// Get public URL for a filename
export const getPhotoUrl = (fileName: string): string => {
  const config = getR2Config();
  if (!config) return fileName; // Return as-is for mock URLs

  return config.publicUrl 
    ? `${config.publicUrl}/${fileName}`
    : `https://${config.bucketName}.${config.accountId}.r2.cloudflarestorage.com/${fileName}`;
};

// Generate signed URL for private R2 objects (valid for 1 hour)
export const getSignedPhotoUrl = async (fileName: string): Promise<string> => {
  const client = createR2Client();
  const config = getR2Config();
  
  if (!client || !config) {
    console.warn('R2 not configured, returning original filename');
    return fileName;
  }

  try {
    // Extract just the filename from full URLs
    const key = fileName.includes('/') ? fileName.split('/').pop() || fileName : fileName;
    
    const command = new GetObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    });

    // Generate signed URL valid for 1 hour
    const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return fileName; // Fallback to original
  }
};

// Helper to check if URL needs signing (for private buckets)
export const needsSignedUrl = (url: string): boolean => {
  const config = getR2Config();
  if (!config) return false;
  
  // If we have a custom public URL configured, photos are public
  if (config.publicUrl) return false;
  
  // Otherwise, assume private bucket needs signed URLs
  return url.includes('.r2.cloudflarestorage.com');
};

// Convert old private R2 URLs to new public format
export const convertToPublicUrl = (url: string): string => {
  const config = getR2Config();
  
  // If no config or no public URL, return as-is
  if (!config || !config.publicUrl) return url;
  
  // If URL is already using the public URL, return as-is
  if (url.includes(config.publicUrl)) return url;
  
  // Extract the file path from old private URLs
  const privateUrlPattern = new RegExp(`https://${config.bucketName}\\.${config.accountId}\\.r2\\.cloudflarestorage\\.com/(.+)`);
  const match = url.match(privateUrlPattern);
  
  if (match && match[1]) {
    // Convert to public URL format
    return `${config.publicUrl}/${match[1]}`;
  }
  
  // If it doesn't match the pattern, return original URL
  return url;
};
