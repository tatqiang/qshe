import React, { useState, useRef } from 'react';
import { Camera, Upload, Check } from 'lucide-react';
import { Button } from './Button';
import { CameraModal } from './CameraModal';
import { uploadProfilePhoto, type UploadResult, type UploadProgressCallback } from '../../lib/storage/r2Client';

interface PhotoUploadProps {
  userId: string;
  currentPhotoUrl?: string;
  onPhotoUploaded: (photoUrl: string, fileName: string) => void;
  onError: (error: string) => void;
  className?: string;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  userId,
  currentPhotoUrl,
  onPhotoUploaded,
  onError,
  className = '',
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      onError('Image must be smaller than 5MB');
      return;
    }

    // Show preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    setUploading(true);
    setUploadProgress(0);

    try {
      const progressCallback: UploadProgressCallback = (progress: number) => {
        setUploadProgress(progress);
      };

      const result: UploadResult = await uploadProfilePhoto(file, userId, progressCallback);

      if (result.success && result.url && result.fileName) {
        // Keep the blob URL for immediate preview since R2 URL might take time to be accessible
        // Don't revoke the objectUrl immediately - let it display while R2 URL loads
        setPreviewUrl(objectUrl); // Keep showing the blob URL
        onPhotoUploaded(result.url, result.fileName);
        
        // Try to load the R2 URL in background
        const img = new Image();
        img.onload = () => {
          // R2 URL is accessible, switch to it
          if (result.url) {
            setPreviewUrl(result.url);
          }
          if (objectUrl.startsWith('blob:')) {
            URL.revokeObjectURL(objectUrl);
          }
        };
        img.onerror = () => {
          // R2 URL not accessible yet, keep blob URL
          console.log('R2 URL not yet accessible, keeping blob preview');
        };
        img.src = result.url;
      } else {
        onError(result.error || 'Upload failed');
        setPreviewUrl(currentPhotoUrl || null);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      onError(error.message || 'Upload failed');
      setPreviewUrl(currentPhotoUrl || null);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleCameraInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleCameraCapture = () => {
    // Check if device supports camera API
    if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
      setIsCameraOpen(true);
    } else {
      // Fallback to file input with camera capture
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      }
    }
  };

  const handleCameraClose = () => {
    setIsCameraOpen(false);
  };

  const handleCameraPhoto = (file: File) => {
    handleFileSelect(file);
  };

  const handleUploadClick = () => {
    // Open file input for file selection
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Hidden file input for file selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Hidden file input for camera capture */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment" // Use back camera by default
        onChange={handleCameraInputChange}
        className="hidden"
      />

      {/* Photo Preview */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          {previewUrl ? (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
              />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                  <div className="text-white text-sm font-medium">
                    {uploadProgress}%
                  </div>
                </div>
              )}
              {!uploading && (
                <div className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full p-1">
                  <Check size={16} />
                </div>
              )}
            </div>
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
              <Camera className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="w-full max-w-xs">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 text-center mt-1">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}

        {/* Upload Buttons */}
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleCameraCapture}
            disabled={uploading}
            className="flex items-center space-x-2"
          >
            <Camera size={16} />
            <span>Camera</span>
          </Button>
          
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleUploadClick}
            disabled={uploading}
            className="flex items-center space-x-2"
          >
            <Upload size={16} />
            <span>Upload</span>
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-gray-500 text-center max-w-xs">
          Take a clear photo of your face or upload from your device. 
          Image will be resized and compressed automatically.
        </p>
      </div>

      {/* Camera Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={handleCameraClose}
        onCapture={handleCameraPhoto}
      />
    </div>
  );
};
