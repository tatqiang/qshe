/**
 * Photo compression utilities for punch list evidence
 * Recommended resolutions for construction defect documentation
 */

export interface CompressionOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: 'jpeg' | 'webp';
}

// Recommended photo resolutions for punch list evidence
export const PUNCH_LIST_PHOTO_SETTINGS: CompressionOptions = {
  maxWidth: 1200,    // Good for detailed defect documentation
  maxHeight: 1200,   // Square aspect maintains quality
  quality: 0.85,     // High quality for evidence photos
  format: 'jpeg'     // Universal compatibility
};

// Alternative settings for different use cases
export const PHOTO_PRESETS = {
  // For detailed close-up defects
  HIGH_DETAIL: {
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.9,
    format: 'jpeg' as const
  },
  
  // Standard punch list documentation (recommended)
  STANDARD: PUNCH_LIST_PHOTO_SETTINGS,
  
  // For overview/context shots
  OVERVIEW: {
    maxWidth: 1000,
    maxHeight: 1000,
    quality: 0.8,
    format: 'jpeg' as const
  },
  
  // For quick mobile uploads (faster processing)
  MOBILE_QUICK: {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.75,
    format: 'jpeg' as const
  }
};

/**
 * Compress and resize image for punch list evidence
 */
export function compressImageForPunchList(
  file: File,
  options: CompressionOptions = PUNCH_LIST_PHOTO_SETTINGS
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate dimensions maintaining aspect ratio
        const { width, height } = calculateDimensions(
          img.width,
          img.height,
          options.maxWidth,
          options.maxHeight
        );

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          
          const mimeType = options.format === 'webp' ? 'image/webp' : 'image/jpeg';
          const compressedDataUrl = canvas.toDataURL(mimeType, options.quality);
          
          // Validate the data URL
          if (!compressedDataUrl || compressedDataUrl === 'data:,') {
            reject(new Error('Failed to generate valid data URL'));
            return;
          }
          
          console.log(`[PHOTO] Compressed ${file.name}: ${img.width}x${img.height} → ${width}x${height}, Quality: ${options.quality * 100}%`);
          console.log(`[PHOTO] Generated data URL: ${compressedDataUrl.substring(0, 100)}...`);
          resolve(compressedDataUrl);
        } else {
          reject(new Error('Canvas context not available'));
        }
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));

    // Convert file to data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Calculate optimal dimensions maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight };

  // Scale down if needed
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  return {
    width: Math.round(width),
    height: Math.round(height)
  };
}

/**
 * Get file size information for display
 */
export function getFileSizeInfo(file: File): string {
  const sizeInMB = file.size / (1024 * 1024);
  if (sizeInMB > 1) {
    return `${sizeInMB.toFixed(1)} MB`;
  }
  const sizeInKB = file.size / 1024;
  return `${sizeInKB.toFixed(0)} KB`;
}

/**
 * Estimate compressed file size
 */
export function estimateCompressedSize(
  originalSize: number,
  options: CompressionOptions
): string {
  // Rough estimation based on quality and resolution reduction
  const qualityReduction = options.quality;
  const estimatedSize = originalSize * qualityReduction * 0.7; // Additional compression factor
  
  if (estimatedSize > 1024 * 1024) {
    return `~${(estimatedSize / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `~${(estimatedSize / 1024).toFixed(0)} KB`;
}
