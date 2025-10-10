//src/pages/FaceApiDemo.tsx

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '../components/common/Button';
import { CameraIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

// Import face-api.js dynamically to avoid build issues
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
  age: number | null;
  gender: string | null;
  expressions: any;
}

export const FaceApiDemo: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [faceApiReady, setFaceApiReady] = useState(false);
  const [faceDetection, setFaceDetection] = useState<FaceDetectionData | null>(null);

  // Load face-api.js models
  useEffect(() => {
    const loadFaceApi = async () => {
      try {
        console.log('Loading face-api.js...');
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
        script.onload = async () => {
          try {
            const faceapi = window.faceapi;
            if (!faceapi) throw new Error('face-api.js not loaded');
            
            // Use a reliable CDN that has the models available
            const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
            
            await Promise.all([
              faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
              faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
              faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
              faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
              faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)
            ]);
            
            setFaceApiReady(true);
            console.log('✅ face-api.js loaded and ready');
          } catch (modelError) {
            console.error('❌ Failed to load face-api.js models:', modelError);
            setError('Failed to load face-api.js models. Some features may be limited.');
          }
        };
        script.onerror = () => {
          console.error('❌ Failed to load face-api.js script');
          setError('Failed to load face-api.js. Please check your internet connection.');
        };
        document.head.appendChild(script);
        
      } catch (error) {
        console.error('❌ Failed to initialize face-api.js:', error);
        setError('Failed to load face recognition. Some features may be limited.');
      }
    };

    loadFaceApi();
  }, []);

  // Real-time face analysis function
  const analyzeFace = async () => {
    if (!videoRef.current || !canvasRef.current || !faceApiReady) return;

    try {
      // Simplified detection to avoid TensorFlow.js conflicts
      const detection = await window.faceapi
        .detectSingleFace(videoRef.current, new window.faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

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

        // Draw landmarks
        const resizedDetection = window.faceapi.resizeResults(detection, displaySize);
        window.faceapi.draw.drawFaceLandmarks(canvas, resizedDetection);

        // Calculate quality score
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
        
        // Symmetry check (compare left and right landmark distances)
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        const nose = landmarks.getNose();
        
        if (leftEye.length > 0 && rightEye.length > 0 && nose.length > 0) {
          const leftEyeCenter = leftEye.reduce((acc: any, p: any) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
          leftEyeCenter.x /= leftEye.length;
          leftEyeCenter.y /= leftEye.length;
          
          const rightEyeCenter = rightEye.reduce((acc: any, p: any) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
          rightEyeCenter.x /= rightEye.length;
          rightEyeCenter.y /= rightEye.length;
          
          const noseCenter = nose[Math.floor(nose.length / 2)];
          
          const leftDistance = Math.sqrt(Math.pow(leftEyeCenter.x - noseCenter.x, 2) + Math.pow(leftEyeCenter.y - noseCenter.y, 2));
          const rightDistance = Math.sqrt(Math.pow(rightEyeCenter.x - noseCenter.x, 2) + Math.pow(rightEyeCenter.y - noseCenter.y, 2));
          
          const symmetryRatio = Math.min(leftDistance, rightDistance) / Math.max(leftDistance, rightDistance);
          const symmetryScore = symmetryRatio * 25;
          qualityScore += symmetryScore;
        }
        
        setFaceDetection({
          detected: true,
          confidence: Math.round(detection.detection.score * 100),
          qualityScore: Math.round(qualityScore),
          landmarks: landmarks._positions.length,
          age: null, // Disabled for compatibility
          gender: null, // Disabled for compatibility
          expressions: null // Disabled for compatibility
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
          landmarks: 0,
          age: null,
          gender: null,
          expressions: null
        });
      }
    } catch (error) {
      console.error('Face analysis error:', error);
      
      // If we get TensorFlow errors, stop the analysis to prevent spam
      if (error instanceof Error && error.message && error.message.includes('forwardFunc')) {
        console.warn('TensorFlow.js compatibility error detected, stopping analysis');
        if (analysisIntervalRef.current) {
          clearInterval(analysisIntervalRef.current);
          analysisIntervalRef.current = null;
        }
        setError('Face analysis disabled due to compatibility issue. Camera still works.');
      }
    }
  };

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      console.log('🎥 Starting camera...');
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: facingMode
        }
      });
      
      console.log('🎥 Camera stream obtained:', stream);
      
      if (videoRef.current) {
        console.log('🎥 Setting video srcObject...');
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = async () => {
          try {
            console.log('Video metadata loaded, attempting to play...');
            await videoRef.current?.play();
            console.log('Video started successfully');
            setIsStreaming(true);
            
            // Re-enable real-time analysis now that TensorFlow conflicts are resolved
            if (faceApiReady) {
              console.log('Starting face analysis interval...');
              setTimeout(() => {
                if (analysisIntervalRef.current === null) {
                  analysisIntervalRef.current = setInterval(analyzeFace, 500); // Moderate interval
                }
              }, 1000);
            }
          } catch (playError) {
            console.error('Video play error:', playError);
          }
        };
      } else {
        console.error('🎥 videoRef.current is null!');
        stream.getTracks().forEach(track => track.stop());
        setError('Video element not ready. Please try again.');
      }
      
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access denied. Please allow camera access to continue.');
    }
  }, [facingMode, faceApiReady]);

  // Stop camera
  const stopCamera = useCallback(() => {
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
    setFaceDetection(null);
  }, []);

  // Manual face detection test (safer version)
  const testFaceDetection = useCallback(async () => {
    if (!videoRef.current || !faceApiReady) {
      setError('Face detection not ready');
      return;
    }
    
    setError('Testing face detection...');
    
    try {
      console.log('Testing manual face detection...');
      
      // Try the simplest possible detection first
      const detection = await window.faceapi
        .detectSingleFace(videoRef.current, new window.faceapi.TinyFaceDetectorOptions());
      
      if (detection) {
        console.log('✅ Face detected successfully!', {
          confidence: Math.round(detection.score * 100),
          box: detection.box
        });
        setError(`✅ Face detected! Confidence: ${Math.round(detection.score * 100)}%`);
      } else {
        console.log('❌ No face detected');
        setError('❌ No face detected - try moving closer to camera');
      }
    } catch (error) {
      console.error('Manual face detection error:', error);
      setError('❌ Face detection failed - TensorFlow.js compatibility issue. Camera works fine for video calls.');
    }
  }, [faceApiReady]);

  // Switch camera
  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    if (isStreaming) {
      stopCamera();
      setTimeout(() => startCamera(), 500);
    }
  }, [isStreaming, stopCamera, startCamera]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">🎭 face-api.js Live Quality Analysis</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Video container - always present */}
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
                  <p className="text-blue-600 mb-4">Click to start face-api.js demo</p>
                </div>
              </div>
            )}
            
            {/* Quality indicators overlay */}
            {isStreaming && faceDetection && (
              <div className="absolute top-2 left-2 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs max-w-xs">
                <div className="font-bold mb-2">🎭 face-api.js Analysis</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${faceDetection.detected ? 'bg-green-400' : 'bg-red-400'}`}></span>
                    <span>Face: {faceDetection.detected ? 'Detected' : 'Not Found'}</span>
                  </div>
                  
                  {faceDetection.detected && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          faceDetection.confidence > 85 ? 'bg-green-400' : 
                          faceDetection.confidence > 70 ? 'bg-yellow-400' : 'bg-red-400'
                        }`}></span>
                        <span>Confidence: {faceDetection.confidence}%</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          faceDetection.qualityScore > 85 ? 'bg-green-400' : 
                          faceDetection.qualityScore > 70 ? 'bg-yellow-400' : 'bg-red-400'
                        }`}></span>
                        <span>Quality: {faceDetection.qualityScore}%</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          faceDetection.landmarks > 60 ? 'bg-green-400' : 'bg-yellow-400'
                        }`}></span>
                        <span>Landmarks: {faceDetection.landmarks}/68</span>
                      </div>
                    </>
                  )}
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
                    <p className="text-sm text-yellow-600">⚠️ Quality: {faceDetection.qualityScore}% - Move closer or improve lighting</p>
                  )}
                  {faceDetection.detected && faceDetection.qualityScore >= 70 && (
                    <p className="text-sm text-green-600">✅ Good quality: {faceDetection.qualityScore}% - {faceDetection.confidence}% confidence</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-600">Analyzing face quality...</p>
              )}
            </div>
          )}
          
          {/* Controls */}
          {!isStreaming ? (
            <Button 
              onClick={startCamera} 
              className="w-full"
              disabled={!faceApiReady}
            >
              {faceApiReady ? 'Start Camera' : 'Loading...'}
            </Button>
          ) : (
            <div className="flex space-x-3">
              <Button variant="outline" onClick={stopCamera} className="flex-1">
                Stop Camera
              </Button>
              <Button variant="outline" onClick={switchCamera} className="flex items-center justify-center gap-2">
                <ArrowPathIcon className="h-4 w-4" />
                {facingMode === 'user' ? 'Rear' : 'Front'}
              </Button>
              <Button variant="outline" onClick={testFaceDetection} className="flex-1 text-sm">
                Test Detection
              </Button>
            </div>
          )}
          
          {/* Database Test Link */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button 
              onClick={() => window.location.href = '/face-db-test'}
              variant="outline" 
              className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              🔍 Test Against Database Users
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};