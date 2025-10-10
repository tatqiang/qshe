import { useState, useRef, useEffect } from 'react';
import { CameraIcon, PhotoIcon, XMarkIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';
import { CameraModal } from './CameraModal';
import { ImagePreviewModal } from './ImagePreviewModal';
import { getFileSizeInfo } from '../../utils/photoCompression';
import { PhotoDebugUtils } from '../../utils/photoDebug';

interface MultiPhotoUploadProps {
  onPhotosUploaded: (photoUrls: string[]) => void;
  maxPhotos?: number;
  showPreview?: boolean;
  className?: string;
  accept?: string;
  disabled?: boolean;
  initialPhotos?: string[];
}

export function MultiPhotoUpload({
  onPhotosUploaded,
  maxPhotos = 5,
  showPreview = true,
  className = '',
  accept = 'image/*',
  disabled = false,
  initialPhotos = []
}: MultiPhotoUploadProps) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Log initial photos for debugging
  console.log('[MULTI_PHOTO] Component initialized with photos:', initialPhotos.length);
  console.log('[MULTI_PHOTO] Initial photos data:', initialPhotos.map((photo, i) => ({
    index: i,
    length: photo.length,
    prefix: photo.substring(0, 50),
    isValidDataUrl: photo.startsWith('data:image/')
  })));

  // Update photos when initialPhotos changes (for edit mode)
  useEffect(() => {
    if (initialPhotos.length > 0 && photos.length === 0) {
      console.log('[MULTI_PHOTO] Updating photos from initialPhotos:', initialPhotos.length);
      setPhotos(initialPhotos);
    }
  }, [initialPhotos]);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newPhotos: string[] = [];
    setUploading(true);

    try {
      for (let i = 0; i < Math.min(files.length, maxPhotos - photos.length); i++) {
        const file = files[i];
        
        console.log(`[PHOTO] Original: ${file.name} (${getFileSizeInfo(file)})`);
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          console.error(`[PHOTO] Invalid file type: ${file.type}`);
          continue;
        }
        
        // Use FileReader to create data URL directly for now (no compression)
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            console.log(`[PHOTO] FileReader success: ${result.substring(0, 50)}...`);
            resolve(result);
          };
          reader.onerror = () => {
            console.error(`[PHOTO] FileReader error:`, reader.error);
            reject(new Error('Failed to read file'));
          };
          reader.readAsDataURL(file);
        });
        
        console.log(`[PHOTO] Data URL created, length:`, dataUrl.length);
        console.log(`[PHOTO] Data URL prefix:`, dataUrl.substring(0, 50));
        
        // Validate the data URL
        if (dataUrl.startsWith('data:image/')) {
          newPhotos.push(dataUrl);
          console.log(`[PHOTO] Valid data URL added for ${file.name}`);
          console.log(`[PHOTO] Data URL info:`, PhotoDebugUtils.getDataUrlInfo(dataUrl));
          
          // Test if the image can actually be loaded
          PhotoDebugUtils.testImageLoad(dataUrl).then(canLoad => {
            console.log(`[PHOTO] Image load test for ${file.name}:`, canLoad ? 'SUCCESS' : 'FAILED');
          });
        } else {
          console.error(`[PHOTO] Invalid data URL generated for ${file.name}:`, dataUrl.substring(0, 100));
        }
      }

      const updatedPhotos = [...photos, ...newPhotos];
      setPhotos(updatedPhotos);
      onPhotosUploaded(updatedPhotos);
    } catch (error) {
      console.error('Error processing photos:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleCameraCapture = async (file: File) => {
    if (photos.length >= maxPhotos) return;

    try {
      console.log(`[CAMERA] Original: ${file.name} (${getFileSizeInfo(file)})`);
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.error(`[CAMERA] Invalid file type: ${file.type}`);
        return;
      }
      
      // Use FileReader to create data URL directly for now (no compression)
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          console.log(`[CAMERA] FileReader success: ${result.substring(0, 50)}...`);
          resolve(result);
        };
        reader.onerror = () => {
          console.error(`[CAMERA] FileReader error:`, reader.error);
          reject(new Error('Failed to read file'));
        };
        reader.readAsDataURL(file);
      });
      
      console.log(`[CAMERA] Data URL created, length:`, dataUrl.length);
      console.log(`[CAMERA] Data URL prefix:`, dataUrl.substring(0, 50));
      
      // Validate the data URL
      if (dataUrl.startsWith('data:image/')) {
        const updatedPhotos = [...photos, dataUrl];
        setPhotos(updatedPhotos);
        onPhotosUploaded(updatedPhotos);
        setIsCameraOpen(false);
        console.log(`[CAMERA] Valid data URL added for ${file.name}`);
      } else {
        console.error(`[CAMERA] Invalid data URL generated for ${file.name}:`, dataUrl.substring(0, 100));
      }
    } catch (error) {
      console.error('Error processing camera photo:', error);
    }
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    setPhotos(updatedPhotos);
    onPhotosUploaded(updatedPhotos);
  };

  const addTestPhoto = () => {
    const testDataUrl = PhotoDebugUtils.createTestDataUrl();
    console.log('[TEST_PHOTO] Adding test photo:', PhotoDebugUtils.getDataUrlInfo(testDataUrl));
    
    const updatedPhotos = [...photos, testDataUrl];
    setPhotos(updatedPhotos);
    onPhotosUploaded(updatedPhotos);
    
    // Also test the image loading directly
    setTimeout(() => {
      const imgElements = document.querySelectorAll('[alt*="Photo"]');
      console.log('[TEST_PHOTO] Found image elements:', imgElements.length);
      imgElements.forEach((img, index) => {
        const imageEl = img as HTMLImageElement;
        console.log(`[TEST_PHOTO] Image ${index + 1}:`, {
          src: imageEl.src.substring(0, 50) + '...',
          naturalWidth: imageEl.naturalWidth,
          naturalHeight: imageEl.naturalHeight,
          clientWidth: imageEl.clientWidth,
          clientHeight: imageEl.clientHeight,
          complete: imageEl.complete,
          computedStyle: window.getComputedStyle(imageEl)
        });
      });
    }, 1000);
  };

  const openPreview = (index: number) => {
    setPreviewIndex(index);
    setIsPreviewOpen(true);
  };

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Controls */}
      <div className="flex flex-wrap gap-2">
        {/* Camera Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsCameraOpen(true)}
          disabled={disabled || !canAddMore || uploading}
          className="flex items-center space-x-2"
        >
          <CameraIcon className="w-4 h-4" />
          <span>Camera</span>
        </Button>

        {/* File Upload Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || !canAddMore || uploading}
          className="flex items-center space-x-2"
        >
          <PhotoIcon className="w-4 h-4" />
          <span>Gallery</span>
        </Button>

        {/* Debug Test Button - Only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTestPhoto}
              disabled={disabled || !canAddMore || uploading}
              className="flex items-center space-x-2 bg-yellow-50 border-yellow-200 text-yellow-700"
            >
              <span>🧪</span>
              <span>Test Photo</span>
            </Button>
            
            {photos.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  // Force refresh all photo thumbnails with aggressive styling
                  setTimeout(() => {
                    const containers = document.querySelectorAll('.photo-thumbnail-container');
                    const images = document.querySelectorAll('.photo-thumbnail-container img');
                    
                    console.log('[DEBUG] Found containers:', containers.length, 'images:', images.length);
                    
                    containers.forEach((container: any, index) => {
                      container.style.backgroundColor = '#ffffff';
                      container.style.padding = '8px';
                      container.style.borderRadius = '8px';
                      container.style.border = '2px solid #e5e7eb';
                      console.log(`[DEBUG] Fixed container ${index + 1}`);
                    });
                    
                    images.forEach((img: any, index) => {
                      img.style.backgroundColor = '#ffffff';
                      img.style.objectFit = 'contain';
                      img.style.objectPosition = 'center';
                      img.style.width = '100%';
                      img.style.height = '96px';
                      img.style.display = 'block';
                      img.style.border = '1px solid #d1d5db';
                      img.style.borderRadius = '6px';
                      console.log(`[DEBUG] Fixed image ${index + 1}, src length:`, img.src.length);
                    });
                    
                    console.log('[DEBUG] Force refreshed photo backgrounds aggressively');
                  }, 100);
                }}
                disabled={disabled}
                className="flex items-center space-x-2 bg-green-50 border-green-200 text-green-700"
              >
                <span>🔄</span>
                <span>Fix Backgrounds</span>
              </Button>
            )}
            
            {photos.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setPhotos([]);
                  onPhotosUploaded([]);
                  console.log('[DEBUG] All photos cleared');
                }}
                disabled={disabled}
                className="flex items-center space-x-2 bg-red-50 border-red-200 text-red-700"
              >
                <span>🗑️</span>
                <span>Clear All</span>
              </Button>
            )}
          </>
        )}

        {uploading && (
          <div className="flex items-center text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            Processing...
          </div>
        )}
      </div>

      {/* Photo Count */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500">
          {photos.length} of {maxPhotos} photos added
        </span>
        <span className="text-gray-400 text-xs">
          � Original resolution for testing - compression will be added later
        </span>
      </div>

      {/* Photo Previews */}
      {showPreview && photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <div 
                className="photo-thumbnail-container relative cursor-pointer bg-white p-1 rounded"
                style={{
                  backgroundColor: '#ffffff',
                  padding: '4px',
                  borderRadius: '8px',
                  display: 'block',
                  width: '100%',
                  height: '104px',
                  minHeight: '104px'
                }}
                onClick={() => openPreview(index)}
              >
                <img
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-24 rounded border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all object-cover bg-white cursor-pointer"
                  style={{
                    backgroundColor: '#ffffff',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    display: 'block',
                    width: '100%',
                    height: '96px',
                    minHeight: '96px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                  onLoad={(e) => {
                    console.log(`[THUMBNAIL] Photo ${index + 1} loaded successfully`);
                    const img = e.target as HTMLImageElement;
                    img.style.backgroundColor = '#ffffff';
                    img.style.objectFit = 'cover';
                    img.style.objectPosition = 'center';
                    img.style.opacity = '1';
                    img.style.visibility = 'visible';
                    img.style.display = 'block';
                    const container = img.parentElement;
                    if (container) {
                      container.style.backgroundColor = '#ffffff';
                      container.style.padding = '4px';
                    }
                  }}
                  onError={(e) => {
                    console.error(`[THUMBNAIL] Photo ${index + 1} failed to load`);
                    const img = e.target as HTMLImageElement;
                    img.style.backgroundColor = '#ef4444';
                    img.style.border = '2px dashed #dc2626';
                    img.alt = '❌ Failed';
                  }}
                />
              </div>
              
              {/* Remove Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removePhoto(index);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="Remove photo"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
              
              {/* Photo Number */}
              <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {photos.length === 0 && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No photos added yet</p>
          <p className="text-sm text-gray-400">
            Use camera or gallery to add evidence photos of defects
          </p>
        </div>
      )}

      {/* Instructions */}
      {photos.length > 0 && (
        <div className="text-xs text-gray-500 text-center">
          💡 Click on any photo to view full-size with zoom and navigation
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Camera Modal */}
      {isCameraOpen && (
        <CameraModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={handleCameraCapture}
        />
      )}

      {/* Image Preview Modal */}
      <ImagePreviewModal
        images={photos}
        initialIndex={previewIndex}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Punch List Evidence Photos"
      />
    </div>
  );
}
