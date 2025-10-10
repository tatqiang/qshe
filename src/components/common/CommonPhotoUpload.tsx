import React, { useState, useRef, useEffect } from 'react';
import { CameraIcon, PhotoIcon, XMarkIcon, EyeIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';
import { CameraModal } from './CameraModal';
import { ImagePreviewModal } from './ImagePreviewModal';
import { uploadPatrolPhotos, isR2Configured } from '../../lib/storage/r2Client';
import { useUserId } from '../../hooks/useGlobalState';

interface CommonPhotoUploadProps {
  onPhotosUploaded: (photoUrls: string[]) => void;
  contextId?: string; // For existing patrols or corrective actions
  contextType?: 'patrol' | 'corrective-action'; // Type of context
  maxPhotos?: number;
  showPreview?: boolean;
  className?: string;
  accept?: string;
  disabled?: boolean;
  initialPhotos?: string[];
  label?: string;
  placeholder?: string;
}

export function CommonPhotoUpload({
  onPhotosUploaded,
  contextId,
  contextType = 'patrol',
  maxPhotos = 5,
  showPreview = true,
  className = '',
  accept = 'image/*',
  disabled = false,
  initialPhotos = [],
  label = 'Photos',
  placeholder = 'Upload photos...'
}: CommonPhotoUploadProps) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userId = useUserId();

  console.log('[COMMON_PHOTO] Component initialized:', {
    contextId,
    contextType,
    userId,
    initialPhotos: initialPhotos.length,
    r2Configured: isR2Configured()
  });

  // Update photos when initialPhotos changes
  useEffect(() => {
    if (initialPhotos.length > 0 && photos.length === 0) {
      console.log('[COMMON_PHOTO] Setting initial photos:', initialPhotos.length);
      setPhotos(initialPhotos);
    }
  }, [initialPhotos, photos.length]);

  // Notify parent when photos change
  useEffect(() => {
    onPhotosUploaded(photos);
  }, [photos, onPhotosUploaded]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    if (!userId) {
      console.error('[COMMON_PHOTO] No user ID available');
      alert('Please log in to upload photos');
      return;
    }

    if (photos.length + files.length > maxPhotos) {
      alert(`Maximum ${maxPhotos} photos allowed. You can add ${maxPhotos - photos.length} more.`);
      return;
    }

    console.log('[COMMON_PHOTO] Selected files for R2 upload:', files.length);
    setUploading(true);

    try {
      const uploadContextId = contextId || `temp-${contextType}-${Date.now()}`;
      
      const uploadResults = await uploadPatrolPhotos(
        files,
        uploadContextId,
        userId,
        (photoIndex, progress) => {
          setUploadProgress(prev => ({ ...prev, [photoIndex]: progress }));
        }
      );

      console.log('[COMMON_PHOTO] Upload results:', uploadResults);

      const successfulUploads = uploadResults
        .filter(result => result.success && result.url)
        .map(result => result.url!);

      if (successfulUploads.length > 0) {
        const newPhotos = [...photos, ...successfulUploads];
        setPhotos(newPhotos);
        console.log('[COMMON_PHOTO] Photos uploaded to R2:', successfulUploads.length);
      }

      const failures = uploadResults.filter(result => !result.success);
      if (failures.length > 0) {
        console.error('[COMMON_PHOTO] Upload failures:', failures);
        alert(`${failures.length} photo(s) failed to upload. Please try again.`);
      }

    } catch (error) {
      console.error('[COMMON_PHOTO] Upload error:', error);
      alert('Failed to upload photos. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const handleCameraCapture = async (file: File) => {
    if (!userId) {
      console.error('[COMMON_PHOTO] No user ID for camera capture');
      return;
    }

    setIsCameraOpen(false);
    
    if (photos.length >= maxPhotos) {
      alert(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    console.log('[COMMON_PHOTO] Processing camera capture for R2 upload');
    setUploading(true);

    try {
      const uploadContextId = contextId || `temp-${contextType}-${Date.now()}`;
      
      const uploadResult = await uploadPatrolPhotos(
        [file],
        uploadContextId,
        userId,
        (photoIndex, progress) => {
          setUploadProgress({ [photoIndex]: progress });
        }
      );

      if (uploadResult[0]?.success && uploadResult[0].url) {
        const newPhotos = [...photos, uploadResult[0].url];
        setPhotos(newPhotos);
        console.log('[COMMON_PHOTO] Camera capture uploaded to R2:', uploadResult[0].url);
      } else {
        throw new Error(uploadResult[0]?.error || 'Upload failed');
      }

    } catch (error) {
      console.error('[COMMON_PHOTO] Camera capture error:', error);
      alert('Failed to capture photo. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const removePhoto = (index: number) => {
    if (disabled) return;
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    console.log('[COMMON_PHOTO] Photo removed, remaining:', newPhotos.length);
  };

  const openPreview = (index: number) => {
    setPreviewIndex(index);
    setIsPreviewOpen(true);
  };

  const handleChooseFiles = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleTakePhoto = () => {
    if (disabled) return;
    setIsCameraOpen(true);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        {/* Upload Controls */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleChooseFiles}
            disabled={disabled || uploading || photos.length >= maxPhotos}
            className="flex items-center"
          >
            <PhotoIcon className="h-4 w-4 mr-2" />
            Choose Photos
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTakePhoto}
            disabled={disabled || uploading || photos.length >= maxPhotos}
            className="flex items-center"
          >
            <CameraIcon className="h-4 w-4 mr-2" />
            Take Photo
          </Button>
          
          {isR2Configured() && (
            <div className="flex items-center text-xs text-green-600">
              <CloudArrowUpIcon className="h-4 w-4 mr-1" />
              R2 Storage
            </div>
          )}
        </div>

        {/* Progress Indicators */}
        {uploading && Object.keys(uploadProgress).length > 0 && (
          <div className="mb-4 space-y-2">
            {Object.entries(uploadProgress).map(([index, progress]) => (
              <div key={index} className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
                <div className="text-xs text-gray-600 mt-1">
                  Uploading photo {Number(index) + 1}: {progress}%
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Photo Grid */}
        {photos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((photo, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay Controls */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => openPreview(index)}
                        className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                        title="View full size"
                      >
                        <EyeIcon className="h-4 w-4 text-gray-600" />
                      </button>
                      
                      {!disabled && (
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                          title="Remove photo"
                        >
                          <XMarkIcon className="h-4 w-4 text-red-600" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">{placeholder}</p>
            <p className="text-xs text-gray-500 mt-1">
              {disabled ? "Photos from this context (view only)" : `You can add up to ${maxPhotos} photos.`}
            </p>
          </div>
        )}

        {/* Photo Count */}
        <div className="text-center mt-3">
          <span className="text-xs text-gray-500">
            {photos.length} of {maxPhotos} photos
          </span>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Modals */}
      {isCameraOpen && (
        <CameraModal
          isOpen={isCameraOpen}
          onCapture={handleCameraCapture}
          onClose={() => setIsCameraOpen(false)}
        />
      )}

      {isPreviewOpen && photos.length > 0 && (
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
