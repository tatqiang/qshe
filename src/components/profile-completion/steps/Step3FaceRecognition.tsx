import React, { useRef, useState, useCallback, useEffect } from 'react';
import { CameraIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import type { StepProps } from '../types/profile-completion.types';

// Declare face-api.js types
declare global {
  interface Window {
    faceapi: any;
  }
}

interface FaceDetectionData {
  detected: boolean;
  confidence: number;
  qualityScore: number;
  landmarks: number;
  faceDescriptor?: Float32Array;
}

export const Step3FaceRecognition: React.FC<StepProps> = ({ state, onNext, onBack, onError, mode = 'completion', hideTitle = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [faceApiReady, setFaceApiReady] = useState(false);
  const [faceDetection, setFaceDetection] = useState<FaceDetectionData | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [hasExistingFaceData, setHasExistingFaceData] = useState(false);

  // Check for existing face recognition data in edit mode
  useEffect(() => {
    if (mode === 'edit' && state.userData && 'face_descriptors' in state.userData) {
      const existingFaceData = state.userData.face_descriptors;
      if (existingFaceData && existingFaceData.length > 0) {
        console.log('✅ Found existing face recognition data for user');
        setHasExistingFaceData(true);
        
        // DON'T display any photo - face recognition data doesn't store photos
        // Only create the face detection metrics for display
        setFaceDetection({
          detected: true,
          confidence: 95, // High confidence for existing data
          qualityScore: 90, // Good quality assumption
          landmarks: 68, // Full landmarks assumed
          faceDescriptor: new Float32Array(existingFaceData[0] || []) // Use existing descriptor
        });
        
        console.log('📊 Displaying existing face recognition metrics without photo');
      }
    }
  }, [mode, state.userData, state.photoData]);

  // Load face-api.js models (using exact code from working demo)
  useEffect(() => {
    const loadFaceApi = async () => {
      try {
        console.log('Loading face-api.js models...');
        
        // Load face-api.js script
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
        script.onload = async () => {
          try {
            console.log('face-api.js script loaded, loading models...');
            
            // Use a reliable CDN that has the models available (exact copy from working demo)
            const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
            
            // Load face-api.js models for full face recognition (TensorFlow.js removed)
            await Promise.all([
              window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
              window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
              window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)  // Essential for face descriptors!
            ]);
            
            console.log('✅ All face-api.js models loaded successfully');
            setFaceApiReady(true);
          } catch (error) {
            console.error('Error loading face-api.js models:', error);
            setError('Failed to load face recognition models. Some features may not work.');
            setFaceApiReady(true); // Allow basic camera functionality
          }
        };
        
        script.onerror = () => {
          console.error('Failed to load face-api.js script');
          setError('Failed to load face recognition library.');
        };
        
        document.head.appendChild(script);
        
        return () => {
          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }
        };
      } catch (error) {
        console.error('Error in loadFaceApi:', error);
        setError('Failed to initialize face recognition.');
      }
    };

    loadFaceApi();
  }, []);

  // Face analysis function (exact implementation from working demo)
  const analyzeFace = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !window.faceapi || !faceApiReady) return;

    try {
      // Use face-api.js detection WITH descriptors for duplicate detection (TensorFlow.js removed)
      const detection = await window.faceapi
        .detectSingleFace(videoRef.current, new window.faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();  // Generate face descriptors for comparison

      if (detection) {
        const canvas = canvasRef.current;
        const displaySize = {
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight
        };
        
        // Clear canvas and resize
        window.faceapi.matchDimensions(canvas, displaySize);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        // Draw landmarks (simplified - just the key points)
        const resizedDetection = window.faceapi.resizeResults(detection, displaySize);
        window.faceapi.draw.drawFaceLandmarks(canvas, resizedDetection);

        // Calculate quality score (exact logic from working demo)
        const landmarks = detection.landmarks;
        const box = detection.detection.box;
        
        let qualityScore = 0;
        
        // Size check (face should be reasonable size)
        const faceSize = Math.min(box.width, box.height);
        const sizeScore = Math.min(faceSize / 150, 1) * 25;
        qualityScore += sizeScore;
        
        // Position check (face should be centered)
        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;
        const videoCenterX = displaySize.width / 2;
        const videoCenterY = displaySize.height / 2;
        
        const distanceFromCenter = Math.sqrt(
          Math.pow(centerX - videoCenterX, 2) + 
          Math.pow(centerY - videoCenterY, 2)
        );
        const maxDistance = Math.sqrt(
          Math.pow(displaySize.width / 2, 2) + 
          Math.pow(displaySize.height / 2, 2)
        );
        const positionScore = (1 - distanceFromCenter / maxDistance) * 25;
        qualityScore += positionScore;
        
        // Landmark confidence (using detection confidence)
        const confidenceScore = detection.detection.score * 25;
        qualityScore += confidenceScore;
        
        // Landmark count bonus
        const landmarkScore = Math.min(landmarks._positions.length / 68, 1) * 25;
        qualityScore += landmarkScore;
        
        const finalQuality = Math.min(100, Math.round(qualityScore));
        const finalConfidence = Math.round(detection.detection.score * 100);

        setFaceDetection({
          detected: true,
          confidence: finalConfidence,
          qualityScore: finalQuality,
          landmarks: landmarks._positions.length,
          faceDescriptor: detection.descriptor // Use the actual face descriptor
        });
      } else {
        // Clear canvas if no face detected
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        
        setFaceDetection({
          detected: false,
          confidence: 0,
          qualityScore: 0,
          landmarks: 0
        });
      }
    } catch (error) {
      console.error('Face analysis error:', error);
    }
  }, [faceApiReady]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      console.log('🎥 Starting camera with facingMode:', facingMode);
      setError(null);
      
      // Try with exact facingMode first, fallback to ideal
      let stream;
      try {
        const exactConstraints = {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: { exact: facingMode }
          }
        };
        stream = await navigator.mediaDevices.getUserMedia(exactConstraints);
        console.log('✅ Got stream with exact facingMode');
      } catch (exactError) {
        console.log('⚠️ Exact facingMode failed, trying ideal...', exactError);
        const idealConstraints = {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: facingMode
          }
        };
        stream = await navigator.mediaDevices.getUserMedia(idealConstraints);
        console.log('✅ Got stream with ideal facingMode');
      }
      
      console.log('🎥 Camera stream obtained with tracks:', stream.getVideoTracks().map(track => ({
        label: track.label,
        facingMode: track.getSettings().facingMode
      })));
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          console.log('🎥 Video metadata loaded, starting analysis...');
          setIsStreaming(true);
          
          // Start face analysis
          if (analysisIntervalRef.current) {
            clearInterval(analysisIntervalRef.current);
          }
          analysisIntervalRef.current = setInterval(analyzeFace, 500); // Analyze every 500ms
        };
      }
    } catch (error) {
      console.error('Camera error:', error);
      setError('Failed to access camera. Please allow camera permissions.');
    }
  }, [facingMode, analyzeFace]);

  // Stop camera with option to preserve face detection data
  const stopCamera = useCallback((clearDetection = true) => {
    console.log('🛑 Stopping camera, clearDetection:', clearDetection);
    
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setIsStreaming(false);
    
    // Only clear face detection if explicitly requested
    if (clearDetection) {
      setFaceDetection(null);
    }
  }, []);

  // Switch camera
  const switchCamera = useCallback(() => {
    console.log('🔄 Switching camera from', facingMode, 'to', facingMode === 'user' ? 'environment' : 'user');
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    if (isStreaming) {
      stopCamera(true); // Clear detection when switching cameras
      setTimeout(() => startCamera(), 500);
    }
  }, [isStreaming, stopCamera, startCamera]);

  // Capture photo
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !faceDetection?.detected) return;

    try {
      console.log('📸 Capturing photo with face detection data:', faceDetection);
      
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageDataUrl);
        
        console.log('✅ Photo captured successfully, preserving face detection data');
        
        // IMPORTANT: Do NOT call stopCamera() here to preserve faceDetection state
        // Just stop the analysis interval but keep the detection data
        if (analysisIntervalRef.current) {
          clearInterval(analysisIntervalRef.current);
          analysisIntervalRef.current = null;
        }
        
        // Stop camera stream but preserve faceDetection state
        if (videoRef.current?.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
        }
        setIsStreaming(false);
        
        console.log('📸 Capture complete. Face detection preserved:', faceDetection);
      }
    } catch (error) {
      console.error('Capture error:', error);
      setError('Failed to capture photo.');
    }
  }, [faceDetection]);

  // Continue to next step
  const handleContinue = useCallback(() => {
    console.log('🚀 Continue clicked. faceDetection:', faceDetection, 'capturedImage:', !!capturedImage, 'hasExistingFaceData:', hasExistingFaceData);
    
    // For existing face data, we don't need a captured image - just the face detection metrics
    if (!faceDetection || (!capturedImage && !hasExistingFaceData)) {
      console.error('❌ Missing data for continue:', { faceDetection: !!faceDetection, capturedImage: !!capturedImage, hasExistingFaceData });
      return;
    }
    
    // Check if we're using existing face data (edit mode)
    const isUsingExistingData = mode === 'edit' && hasExistingFaceData && 
      state.userData && 'face_descriptors' in state.userData;
    
    const nextStepData = {
      descriptor: faceDetection.faceDescriptor || null,
      confidence: faceDetection.confidence,
      quality: faceDetection.qualityScore,
      landmarks: [],
      detected: faceDetection.detected,
      photoUrl: capturedImage, // Will be null for existing data - that's fine
      isExistingFaceData: isUsingExistingData, // Flag to indicate existing data
      existingFaceDescriptors: isUsingExistingData ? (state.userData as any).face_descriptors : null
    };
    
    console.log('✅ Proceeding to next step with data:', nextStepData);
    onNext(nextStepData);
  }, [faceDetection, capturedImage, onNext, mode, hasExistingFaceData, state.userData]);

  // Retake photo
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setFaceDetection(null); // Clear detection when retaking
    setHasExistingFaceData(false); // Clear existing face data flag
    startCamera();
  }, [startCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera(true); // Clear detection on unmount
    };
  }, [stopCamera]);

  // Show captured/existing face data screen
  if (capturedImage || (hasExistingFaceData && faceDetection)) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {mode === 'edit' && hasExistingFaceData 
            ? 'Current Face Recognition Data' 
            : 'Face Recognition Complete'
          }
        </h2>
        
        <div className="max-w-md mx-auto">
          {/* Only show image if we have one (new captures) */}
          {capturedImage && (
            <img 
              src={capturedImage} 
              alt="Captured face" 
              className="w-full rounded-lg shadow-lg mb-4"
            />
          )}
          
          {/* For existing data, show metrics directly without placeholder box */}
          {hasExistingFaceData && !capturedImage && (
            <div className="mb-6">
              {/* No placeholder box - just spacing */}
            </div>
          )}
          
          {faceDetection && (
            <div className={`p-4 rounded-lg mb-6 ${
              mode === 'edit' && hasExistingFaceData 
                ? 'bg-blue-50' 
                : 'bg-green-50'
            }`}>
              <h3 className={`font-semibold mb-2 ${
                mode === 'edit' && hasExistingFaceData 
                  ? 'text-blue-800' 
                  : 'text-green-800'
              }`}>
                {mode === 'edit' && hasExistingFaceData 
                  ? '📊 Existing Face Recognition Data' 
                  : '✅ Face Analyzed Successfully!'
                }
              </h3>
              <div className={`space-y-1 ${
                mode === 'edit' && hasExistingFaceData 
                  ? 'text-blue-700' 
                  : 'text-green-700'
              }`}>
                <p>Quality: {faceDetection.qualityScore}%</p>
                <p>Confidence: {faceDetection.confidence}%</p>
                <p>Landmarks: {faceDetection.landmarks}/68</p>
                {mode === 'edit' && hasExistingFaceData && (
                  <p className="text-sm mt-2 text-blue-600">
                    💡 Click "Update Face Data" to recapture face recognition
                  </p>
                )}
              </div>
            </div>
          )}
          
          <div className="flex space-x-4 justify-center">
            <button
              onClick={retakePhoto}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              {mode === 'edit' && hasExistingFaceData ? 'Update Face Data' : 'Retake'}
            </button>
            <button
              onClick={handleContinue}
              disabled={!faceDetection?.detected}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: !faceDetection?.detected ? '#9CA3AF' : '#2563EB',
                cursor: !faceDetection?.detected ? 'not-allowed' : 'pointer'
              }}
            >
              {mode === 'edit' && hasExistingFaceData 
                ? 'Continue with Current Data' 
                : `Continue ${!faceDetection?.detected ? '(Face not detected)' : ''}`
              }
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      {!hideTitle && (
        <>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {mode === 'edit' ? 'Update Face Recognition Data' : 'Face Recognition'}
          </h2>
          <p className="text-gray-600 mb-6">Position your face in front of the camera for quality analysis</p>
        </>
      )}
      
      <div className="max-w-md mx-auto">
        {/* Camera View */}
        <div className="relative mb-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 object-cover rounded-lg border-2 border-blue-300"
            style={{ display: isStreaming ? 'block' : 'none' }}
          />
          
          {/* Canvas overlay for landmarks */}
          <canvas 
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover rounded-lg pointer-events-none"
            style={{ display: isStreaming ? 'block' : 'none' }}
          />
          
          {/* Start Camera placeholder */}
          {!isStreaming && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg h-64 flex items-center justify-center">
              <div className="text-center">
                <CameraIcon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <p className="text-blue-600 mb-4">Click to start face recognition</p>
              </div>
            </div>
          )}
          
          {/* Quality indicator overlay - SIMPLIFIED as requested */}
          {isStreaming && faceDetection && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-80 text-white px-3 py-2 rounded-lg text-sm">
              <div className="font-bold">
                Quality: <span className={`${
                  faceDetection.qualityScore > 85 ? 'text-green-400' : 
                  faceDetection.qualityScore > 70 ? 'text-yellow-400' : 'text-red-400'
                }`}>{faceDetection.qualityScore}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Models status */}
        <div className="mb-4">
          <div className={`p-2 rounded text-sm ${
            faceApiReady ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {faceApiReady ? '✅ face-api.js models loaded' : '🔄 Loading face-api.js models...'}
          </div>
        </div>

        {/* Status display */}
        {isStreaming && (
          <div className="text-center mb-4">
            {faceDetection ? (
              <div className="space-y-1">
                {!faceDetection.detected && (
                  <p className="text-sm text-red-600">❌ No face detected</p>
                )}
                {faceDetection.detected && faceDetection.qualityScore < 70 && (
                  <p className="text-sm text-yellow-600">⚠️ Move closer or improve lighting</p>
                )}
                {faceDetection.detected && faceDetection.qualityScore >= 70 && (
                  <p className="text-sm text-green-600">✅ Good quality - ready to capture!</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600">Analyzing face quality...</p>
            )}
          </div>
        )}

        {/* Controls */}
        {!isStreaming ? (
          <div className="space-y-4">
            <button 
              onClick={startCamera} 
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={!faceApiReady}
            >
              {faceApiReady ? 'Start Camera' : 'Loading...'}
            </button>
            
            <div className="flex space-x-4 justify-center">
              <button
                onClick={onBack}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => onNext({ faceRecognitionSkipped: true })}
                className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Skip
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Capture Button - Simplified as requested */}
            <button 
              onClick={capturePhoto}
              disabled={!faceDetection?.detected || faceDetection.qualityScore < 70}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CameraIcon className="h-5 w-5" />
              Capture Face
            </button>
            
            <div className="flex space-x-3">
              <button
                onClick={onBack}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button 
                onClick={() => {
                  stopCamera(true);
                  onNext({ faceRecognitionSkipped: true });
                }}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Skip
              </button>
              <button 
                onClick={() => stopCamera(true)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Stop Camera
              </button>
              <button 
                onClick={switchCamera} 
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <ArrowPathIcon className="h-4 w-4" />
                {facingMode === 'user' ? 'Rear' : 'Front'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
