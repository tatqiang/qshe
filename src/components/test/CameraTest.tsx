import React, { useState } from 'react';
import { CameraModal } from '../common/CameraModal';
import { Button } from '../common/Button';

export const CameraTest: React.FC = () => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const handleOpenCamera = () => {
    setIsCameraOpen(true);
  };

  const handleCloseCamera = () => {
    setIsCameraOpen(false);
  };

  const handleCapturePhoto = (file: File) => {
    setCapturedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    console.log('Captured file:', {
      name: file.name,
      size: file.size,
      type: file.type,
    });
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Camera Test
      </h2>

      {/* Camera Button */}
      <div className="text-center mb-6">
        <Button
          onClick={handleOpenCamera}
          className="px-6 py-3 text-lg"
        >
          Open Camera
        </Button>
      </div>

      {/* Preview */}
      {previewUrl && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Captured Photo:</h3>
          <img
            src={previewUrl}
            alt="Captured"
            className="w-full h-64 object-cover rounded-lg border"
          />
        </div>
      )}

      {/* File Info */}
      {capturedFile && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">File Details:</h3>
          <div className="text-sm space-y-1">
            <div><strong>Name:</strong> {capturedFile.name}</div>
            <div><strong>Size:</strong> {(capturedFile.size / 1024).toFixed(1)} KB</div>
            <div><strong>Type:</strong> {capturedFile.type}</div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold text-blue-800 mb-2">Camera Features:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Live Preview:</strong> See yourself in real-time</li>
          <li>• <strong>Switch Cameras:</strong> Tap rotate button to switch front/rear</li>
          <li>• <strong>Capture:</strong> Tap large white circle to take photo</li>
          <li>• <strong>Auto Close:</strong> Modal closes after capture</li>
        </ul>
      </div>

      {/* Camera Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={handleCloseCamera}
        onCapture={handleCapturePhoto}
      />
    </div>
  );
};
