import { MultiPhotoUpload } from './MultiPhotoUpload';

interface PhotoData {
  photos: string[];
  count: number;
}

interface PhotoInputProps {
  // Current photos
  photos: string[];
  
  // Handlers
  onPhotosChange: (photoData: PhotoData) => void;
  
  // Configuration
  maxPhotos?: number;
  disabled?: boolean;
  className?: string;
  
  // Labels and text (customizable for different features)
  labels?: {
    title?: string;
    description?: string;
    cameraButton?: string;
    galleryButton?: string;
  };
  
  // Feature-specific settings
  settings?: {
    allowCompression?: boolean;
    showProgress?: boolean;
    showPreview?: boolean;
    photoType?: 'issue' | 'evidence' | 'before' | 'after' | 'general';
  };
}

export function PhotoInput({
  photos,
  onPhotosChange,
  maxPhotos = 5,
  disabled = false,
  className = '',
  labels = {},
  settings = {}
}: PhotoInputProps) {
  const defaultLabels = {
    title: 'Photos',
    description: 'Take photos showing the issue clearly. You can add up to {maxPhotos} photos.',
    cameraButton: 'Camera',
    galleryButton: 'Gallery',
    ...labels
  };

  const defaultSettings = {
    allowCompression: true,
    showProgress: true,
    showPreview: true,
    photoType: 'general' as const,
    ...settings
  };

  const handlePhotosUploaded = (photoUrls: string[]) => {
    const photoData: PhotoData = {
      photos: photoUrls,
      count: photoUrls.length
    };
    onPhotosChange(photoData);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Title */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {defaultLabels.title}
        </h3>
        
        {/* Description */}
        <p className="text-sm text-gray-600 mb-4">
          {defaultLabels.description.replace('{maxPhotos}', maxPhotos.toString())}
        </p>
      </div>

      {/* Photo Upload Component */}
      <MultiPhotoUpload
        onPhotosUploaded={handlePhotosUploaded}
        maxPhotos={maxPhotos}
        showPreview={defaultSettings.showPreview}
        disabled={disabled}
        className="border-2 border-dashed border-gray-300 rounded-lg p-4"
      />

      {/* Progress Info */}
      {defaultSettings.showProgress && (
        <div className="text-sm text-gray-500">
          {photos.length} of {maxPhotos} photos added
          {defaultSettings.allowCompression && (
            <span className="block text-xs text-gray-400 mt-1">
              💎 Original resolution for testing - compression will be added later
            </span>
          )}
        </div>
      )}

      {/* Feature-specific messages */}
      {defaultSettings.photoType === 'issue' && photos.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            📷 <strong>Tip:</strong> Take clear photos from multiple angles showing the full context of the issue.
          </p>
        </div>
      )}

      {defaultSettings.photoType === 'evidence' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            📋 <strong>Evidence Photos:</strong> Include photos that support your safety assessment findings.
          </p>
        </div>
      )}
    </div>
  );
}

// Export the interface for use in other components
export type { PhotoData, PhotoInputProps };
