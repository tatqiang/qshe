import { useState, useRef, useEffect } from 'react';
import { CameraIcon, PhotoIcon, XMarkIcon, EyeIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';
import { CameraModal } from './CameraModal';
import { ImagePreviewModal } from './ImagePreviewModal';
import { uploadPatrolPhotos, isR2Configured } from '../../lib/storage/r2Client';
import { useUserId } from '../../hooks/useGlobalState';

interface PatrolPhotoUploadProps {
  onPhotosUploaded: (photoUrls: string[]) => void;
  patrolId?: string; // For existing patrols
  maxPhotos?: number;
  showPreview?: boolean;
  className?: string;
  accept?: string;
  disabled?: boolean;
  initialPhotos?: string[];
}

export function PatrolPhotoUpload({
  onPhotosUploaded,
  patrolId,
  maxPhotos = 5,
  showPreview = true,
  className = '',
  accept = 'image/*',
  disabled = false,
  initialPhotos = []
}: PatrolPhotoUploadProps) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userId = useUserId();

  console.log('[PATROL_PHOTO] Component initialized:', {
    patrolId,
    userId,
    initialPhotos: initialPhotos.length,
    r2Configured: isR2Configured()
  });

  // Update photos when initialPhotos changes
  useEffect(() => {
    if (initialPhotos.length > 0 && photos.length === 0) {
      console.log('[PATROL_PHOTO] Setting initial photos:', initialPhotos.length);
      setPhotos(initialPhotos);
    }
  }, [initialPhotos]);

  // Notify parent when photos change
  useEffect(() => {
    onPhotosUploaded(photos);
  }, [photos, onPhotosUploaded]);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!userId) {
      console.error('[PATROL_PHOTO] No user ID available');
      return;
    }

    const filesToUpload = Array.from(files).slice(0, maxPhotos - photos.length);
    console.log(`[PATROL_PHOTO] Uploading ${filesToUpload.length} files to R2`);

    setUploading(true);
    setUploadProgress({});

    try {
      // For new patrols (no patrolId yet), we'll use a temporary ID
      const uploadPatrolId = patrolId || `temp-${Date.now()}`;
      
      const uploadResults = await uploadPatrolPhotos(
        filesToUpload,
        uploadPatrolId,
        userId,
        (photoIndex, progress) => {
          setUploadProgress(prev => ({
            ...prev,
            [photoIndex]: progress
          }));
        }
      );

      // Process successful uploads
      const successfulUploads = uploadResults
        .filter(result => result.success && result.url)
        .map(result => result.url!);

      if (successfulUploads.length > 0) {
        const newPhotos = [...photos, ...successfulUploads];
        setPhotos(newPhotos);
        console.log(`[PATROL_PHOTO] Successfully uploaded ${successfulUploads.length} photos to R2`);
      }

      // Report any failures
      const failures = uploadResults.filter(result => !result.success);
      if (failures.length > 0) {
        console.error('[PATROL_PHOTO] Upload failures:', failures);
        alert(`${failures.length} photo(s) failed to upload. Please try again.`);
      }

    } catch (error) {
      console.error('[PATROL_PHOTO] Upload error:', error);
      alert('Failed to upload photos. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const handleCameraCapture = async (file: File) => {
    if (!userId) {
      console.error('[PATROL_PHOTO] No user ID for camera capture');
      return;
    }

    setIsCameraOpen(false);
    
    if (photos.length >= maxPhotos) {
      alert(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    console.log('[PATROL_PHOTO] Processing camera capture for R2 upload');
    setUploading(true);

    try {
      const uploadPatrolId = patrolId || `temp-${Date.now()}`;
      
      const uploadResult = await uploadPatrolPhotos(
        [file],
        uploadPatrolId,
        userId,
        (photoIndex, progress) => {
          setUploadProgress({ [photoIndex]: progress });
        }
      );

      if (uploadResult[0]?.success && uploadResult[0].url) {
        const newPhotos = [...photos, uploadResult[0].url];
        setPhotos(newPhotos);
        console.log('[PATROL_PHOTO] Camera capture uploaded to R2:', uploadResult[0].url);
      } else {
        throw new Error(uploadResult[0]?.error || 'Upload failed');
      }

    } catch (error) {
      console.error('[PATROL_PHOTO] Camera capture upload failed:', error);
      alert('Failed to upload camera photo. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    
    // Reset file input to allow re-uploading
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    console.log(`[PATROL_PHOTO] Removed photo at index ${index}, remaining: ${newPhotos.length}`);
  };

  const openPreview = (index: number) => {
    setPreviewIndex(index);
    setIsPreviewOpen(true);
  };

  const canAddMore = photos.length < maxPhotos && !disabled;

  return (
    <div className={`patrol-photo-upload ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple
        {...(accept.includes('image/') && { capture: 'environment' as any })}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Upload Controls */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={!canAddMore || uploading}
          className="flex items-center gap-2"
        >
          <PhotoIcon className="h-4 w-4" />
          Choose File
        </Button>

        {isR2Configured() && (
          <div className="flex items-center gap-1 text-xs text-green-600">
            <CloudArrowUpIcon className="h-4 w-4" />
            R2 Storage
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {uploading && Object.keys(uploadProgress).length > 0 && (
        <div className="mb-4 space-y-2">
          {Object.entries(uploadProgress).map(([index, progress]) => (
            <div key={index} className="bg-gray-100 rounded-lg p-2">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Uploading photo {parseInt(index) + 1}...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo Grid */}
      {showPreview && photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error(`[PATROL_PHOTO] Failed to load image: ${photo}`);
                    
                    // Try fallback URL by removing /qshe/ if it exists
                    const currentSrc = e.currentTarget.src;
                    if (currentSrc.includes('/qshe/patrols/') && !currentSrc.includes('fallback-attempted')) {
                      const fallbackUrl = currentSrc.replace('/qshe/patrols/', '/patrols/') + '?fallback-attempted=true';
                      console.log(`[PATROL_PHOTO] Trying fallback URL: ${fallbackUrl}`);
                      e.currentTarget.src = fallbackUrl;
                    } else {
                      // Final fallback to placeholder
                      e.currentTarget.src = '/placeholder-image.svg';
                    }
                  }}
                />
              </div>

              {/* Always Visible Corner Buttons */}
              <div className="absolute top-2 left-2 right-2 flex justify-between items-start pointer-events-none">
                {/* View Button - Top Left */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openPreview(index);
                  }}
                  className="pointer-events-auto p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all shadow-lg"
                  title="View photo"
                >
                  <EyeIcon className="h-5 w-5" />
                </button>
                
                {/* Delete Button - Top Right */}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhoto(index);
                    }}
                    className="pointer-events-auto p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg"
                    title="Remove photo"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo Counter */}
      <div className="text-sm text-gray-500 text-center">
        {photos.length} of {maxPhotos} photos
        {!isR2Configured() && (
          <div className="text-xs text-amber-600 mt-1">
            ⚠️ R2 not configured - using mock storage
          </div>
        )}
      </div>

      {/* Camera Modal */}
      {isCameraOpen && (
        <CameraModal
          isOpen={isCameraOpen}
          onCapture={handleCameraCapture}
          onClose={() => setIsCameraOpen(false)}
        />
      )}

      {/* Image Preview Modal */}
      {isPreviewOpen && (
        <ImagePreviewModal
          images={photos}
          initialIndex={previewIndex}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </div>
  );
}
