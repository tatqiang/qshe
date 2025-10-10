import React, { useState } from 'react';
import { PhotoUpload } from '../common/PhotoUpload';

export const PhotoUploadTest: React.FC = () => {
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoFileName, setPhotoFileName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handlePhotoUploaded = (url: string, fileName: string) => {
    setPhotoUrl(url);
    setPhotoFileName(fileName);
    setSuccess(`Photo uploaded successfully! File: ${fileName}`);
    setError('');
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setSuccess('');
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Photo Upload Test
      </h2>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Photo Upload Component */}
      <PhotoUpload
        userId="test-user-123"
        currentPhotoUrl={photoUrl}
        onPhotoUploaded={handlePhotoUploaded}
        onError={handleError}
        className="mb-6"
      />

      {/* Upload Status */}
      <div className="space-y-2 text-sm text-gray-600">
        <div>
          <strong>Photo URL:</strong> {photoUrl || 'None'}
        </div>
        <div>
          <strong>File Name:</strong> {photoFileName || 'None'}
        </div>
      </div>

      {/* Test Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold text-blue-800 mb-2">Test Instructions:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Camera Button:</strong> Opens live camera view with front/rear switching</li>
          <li>• <strong>Upload Button:</strong> Opens file picker for existing photos</li>
          <li>• <strong>Live Preview:</strong> Camera shows real-time view with capture controls</li>
          <li>• <strong>Switch Cameras:</strong> Use rotate button to switch between front/rear cameras</li>
          <li>• Check browser console for any errors</li>
        </ul>
      </div>

      {/* Additional Test Links */}
      <div className="mt-4 text-center">
        <a 
          href="/test/camera" 
          className="text-blue-600 underline text-sm"
          target="_blank"
        >
          Open Dedicated Camera Test →
        </a>
      </div>
    </div>
  );
};
