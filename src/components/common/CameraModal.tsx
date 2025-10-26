import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Circle } from 'lucide-react';
import { Button } from './Button';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      setError('');
      
      // Stop any existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(newStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setError('Cannot access camera. Please check permissions and try again.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !stream) return;

    setIsCapturing(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob and create file
    canvas.toBlob((blob) => {
      if (blob) {
        const timestamp = Date.now();
        const file = new File([blob], `camera-${timestamp}.jpg`, { 
          type: 'image/jpeg' 
        });
        
        onCapture(file);
        handleClose();
      }
      setIsCapturing(false);
    }, 'image/jpeg', 0.9);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => stopCamera();
  }, [isOpen, facingMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="relative w-full h-full max-w-lg mx-auto flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 text-white">
          <h2 className="text-lg font-semibold">Take Photo</h2>
        </div>

        {/* Camera View */}
        <div className="flex-1 relative overflow-hidden">
          {error ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center text-white">
                <Camera size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-red-400 mb-4">{error}</p>
                <Button
                  onClick={startCamera}
                  variant="outline"
                  className="text-white border-white hover:bg-white hover:text-black"
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                autoPlay
              />
              
              {/* Overlay for better UI */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Corner guides */}
                <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-white opacity-50"></div>
                <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-white opacity-50"></div>
                <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-white opacity-50"></div>
                <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-white opacity-50"></div>
              </div>
            </>
          )}
        </div>

        {/* Controls */}
        {!error && (
          <div className="p-6">
            {/* Camera Info Banner */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center space-x-2 bg-black bg-opacity-30 text-white px-3 py-1 rounded-full text-sm">
                <Camera size={16} />
                <span>{facingMode === 'user' ? 'Front Camera' : 'Rear Camera'}</span>
              </div>
            </div>
            
            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              {/* Switch Camera Button */}
              <button
                onClick={switchCamera}
                disabled={isCapturing}
                className="flex flex-col items-center space-y-1 p-3 rounded-xl bg-black bg-opacity-40 text-white hover:bg-opacity-60 transition-colors disabled:opacity-50 border border-white border-opacity-30"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 4v6h6M23 20v-6h-6"/>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                  </svg>
                </div>
                <span className="text-xs font-medium">Switch</span>
              </button>

              {/* Capture Button */}
              <button
                onClick={capturePhoto}
                disabled={isCapturing || !stream}
                className={`relative p-4 rounded-full border-4 border-white transition-all ${
                  isCapturing 
                    ? 'bg-red-500 scale-95' 
                    : 'bg-white bg-opacity-20 hover:bg-opacity-30 active:scale-95'
                }`}
              >
                {isCapturing ? (
                  <div className="w-8 h-8 rounded-full bg-red-600 animate-pulse" />
                ) : (
                  <Circle 
                    size={32} 
                    className="text-white"
                    fill="currentColor"
                  />
                )}
              </button>

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="flex flex-col items-center space-y-1 p-3 rounded-xl bg-black bg-opacity-40 text-white hover:bg-opacity-60 transition-colors border border-white border-opacity-30"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <X size={20} className="text-white stroke-2" />
                </div>
                <span className="text-xs font-medium">Close</span>
              </button>
            </div>
          </div>
        )}

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};
