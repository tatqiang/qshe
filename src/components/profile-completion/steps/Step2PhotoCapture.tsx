import React, { useState, useRef, useEffect } from 'react';
import { CameraIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { CameraModal } from '../../common/CameraModal';
import type { StepProps } from '../types/profile-completion.types';

export const Step2PhotoCapture: React.FC<StepProps> = ({ state, onNext, onBack, onError, mode = 'completion' }) => {
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing profile photo in edit mode
  useEffect(() => {
    if (mode === 'edit' && state.userData && 'profile_photo_url' in state.userData) {
      const existingPhotoUrl = state.userData.profile_photo_url;
      if (existingPhotoUrl) {
        setCapturedPhoto(existingPhotoUrl);
      }
    }
  }, [mode, state.userData]);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        onError('Please select a valid image file.');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        onError('File size must be less than 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedPhoto(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle camera capture
  const handleCameraCapture = (file: File) => {
    console.log('Camera photo captured:', file.name, `${(file.size / 1024).toFixed(1)}KB`);
    const reader = new FileReader();
    reader.onload = (e) => {
      setCapturedPhoto(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    setIsCameraOpen(false);
  };

  // Retake photo
  const retakePhoto = () => {
    setCapturedPhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Continue to next step
  const handleContinue = () => {
    if (!capturedPhoto) {
      onError('Please capture or upload a photo to continue.');
      return;
    }

    // Check if this is an existing photo (URL) or a new photo (data URL)
    const isExistingPhoto = mode === 'edit' && 
      state.userData && 
      'profile_photo_url' in state.userData && 
      capturedPhoto === state.userData.profile_photo_url;

    if (isExistingPhoto) {
      // User kept the existing photo - no file needed
      onNext({
        file: null, // No new file to upload
        preview: capturedPhoto,
        processed: true,
        isExistingPhoto: true,
        existingPhotoUrl: capturedPhoto
      });
      return;
    }

    // Convert data URL to File object for the next step (new photo)
    fetch(capturedPhoto)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' });
        
        onNext({
          file,
          preview: capturedPhoto,
          processed: true,
          isExistingPhoto: false
        });
      })
      .catch(error => {
        console.error('Error processing photo:', error);
        onError('Error processing photo. Please try again.');
      });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {mode === 'edit' ? 'Update Profile Photo' : 'Profile Photo'}
        </h2>
        <p className="text-gray-600">
          {mode === 'edit' 
            ? 'Upload a new photo to update your profile picture'
            : 'Please upload or take a photo for your profile'
          }
        </p>
      </div>

      {/* Photo Preview */}
      {capturedPhoto && (
        <div className="text-center">
          <div className="inline-block relative">
            <img 
              src={capturedPhoto} 
              alt="Profile preview" 
              className="w-48 h-48 object-cover rounded-full border-4 border-gray-200 shadow-lg"
            />
            <button
              onClick={retakePhoto}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
              title={mode === 'edit' ? 'Change photo' : 'Retake photo'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Status message for edit mode */}
          {mode === 'edit' && (
            <div className="mt-4 text-center">
              <p className="text-sm text-blue-600 bg-blue-50 px-4 py-2 rounded-lg inline-block">
                📸 Current profile photo - Click ✕ to change
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons - Only show if no photo captured */}
      {!capturedPhoto && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Take Photo Button */}
          <button
            onClick={() => setIsCameraOpen(true)}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <CameraIcon className="w-12 h-12 text-gray-400 mb-3" />
            <span className="text-lg font-medium text-gray-700">Take Photo</span>
            <span className="text-sm text-gray-500">Use your camera</span>
          </button>

          {/* Upload Photo Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <ArrowUpTrayIcon className="w-12 h-12 text-gray-400 mb-3" />
            <span className="text-lg font-medium text-gray-700">Upload Photo</span>
            <span className="text-sm text-gray-500">Choose from files</span>
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Navigation Buttons */}
      <div className="flex space-x-4 justify-center pt-6">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!capturedPhoto}
          className={`px-6 py-3 rounded-md font-medium text-white transition-colors ${
            capturedPhoto
              ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Continue to Face Recognition
        </button>
      </div>

      {/* Camera Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
};
