// Face-API Face Capture Component for Profile Completion and Face Scanning
// Replaces TensorFlow.js with face-api.js for face recognition

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { ProfileImage } from '../../common/ProfileImage';
import { CameraIcon, ArrowPathIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useAppSelector } from '../../../hooks/redux';
import type { User } from '../../../types';
import type { RootState } from '../../../store';

// Import face-api.js dynamically
declare global {
  interface Window {
    faceapi: any;
  }
}

export interface FaceDetectionData {
  detected: boolean;
  confidence: number;
  qualityScore: number;
  landmarks: number;
  age: number | null;
  gender: string | null;
  expressions: any;
  faceDescriptor: Float32Array | null;
  imageDataUrl: string;
}

export interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'outline';
  className?: string;
}

interface FaceMatchResult {
  user: User;
  similarity: number;
  confidence: 'high' | 'medium' | 'low';
}

interface FaceApiCaptureProps {
  onCapture: (faceData: FaceDetectionData) => void;
  onClose?: () => void;
  mode?: 'profile-completion' | 'face-scan';
  customActions?: ActionButton[];
  hideDefaultActions?: boolean;
  showComparison?: boolean; // Whether to show face comparison results
}

export const FaceApiCapture: React.FC<FaceApiCaptureProps> = ({ 
  onCapture, 
  onClose,
  mode = 'profile-completion',
  customActions,
  hideDefaultActions = false,
  showComparison = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [faceApiReady, setFaceApiReady] = useState(false);
  const [currentDetection, setCurrentDetection] = useState<FaceDetectionData | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  // Face comparison state (for face-scan mode)
  const [matchResults, setMatchResults] = useState<FaceMatchResult[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  
  // Redux state
  const { users } = useAppSelector((state: RootState) => state.users);
  
  // Load face-api.js models
  useEffect(() => {
    const loadFaceApi = async () => {
      try {
        console.log('Loading face-api.js for profile completion...');
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
        script.onload = async () => {
          try {
            const faceapi = window.faceapi;
            if (!faceapi) throw new Error('face-api.js not loaded');
            
            const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
            
            console.log('Loading face-api.js models...');
            await Promise.all([
              faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
              faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
              faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
              faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
              faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
            ]);
            
            console.log('✅ face-api.js models loaded successfully');
            setFaceApiReady(true);
            setError(null);
          } catch (error) {
            console.error('❌ Error loading face-api.js models:', error);
            setError('Failed to load face-api.js models');
          }
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('❌ Error loading face-api.js:', error);
        setError('Failed to load face-api.js');
      }
    };
    
    loadFaceApi();
  }, []);

  // Analyze face in real-time
  const analyzeFace = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const faceapi = window.faceapi;
    
    if (!video || !canvas || !faceapi || !faceApiReady) return;

    // Additional check to ensure video is ready
    if (video.readyState < 2) {
      // Video metadata not loaded yet
      return;
    }

    try {
      const detections = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor(); // Add descriptor generation for face recognition

      if (detections) {
        // Get the video element's displayed dimensions (not internal resolution)
        const videoElement = videoRef.current;
        if (!videoElement) {
          console.warn('Video element not found during face analysis');
          return;
        }
        
        const displaySize = {
          width: videoElement.clientWidth || 640,
          height: videoElement.clientHeight || 480
        };
        
        // Match canvas dimensions to video's displayed size
        canvas.width = displaySize.width;
        canvas.height = displaySize.height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        // Use face-api.js built-in methods for proper landmark drawing
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        
        // Draw proper face-api.js landmarks
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        
        const { detection: faceBox } = resizedDetections;
        
        // Draw face box with proper dimensions
        if (ctx) {
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 2;
          ctx.strokeRect(faceBox.box.x, faceBox.box.y, faceBox.box.width, faceBox.box.height);
        }

        // Create image data URL for capture
        const captureCanvas = captureCanvasRef.current;
        if (captureCanvas) {
          captureCanvas.width = video.videoWidth;
          captureCanvas.height = video.videoHeight;
          const captureCtx = captureCanvas.getContext('2d');
          if (captureCtx) {
            captureCtx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
          }
        }

        // Calculate quality score using original detection dimensions
        const box = detections.detection.box;
        let qualityScore = 0;
        
        // Size check (face should be reasonable size)
        const faceSize = Math.min(box.width, box.height);
        const sizeScore = Math.min(faceSize / 150, 1) * 25;
        qualityScore += sizeScore;
        
        // Position check (face should be centered)
        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;
        const videoCenterX = video.videoWidth / 2;
        const videoCenterY = video.videoHeight / 2;
        
        const distanceFromCenter = Math.sqrt(
          Math.pow(centerX - videoCenterX, 2) + 
          Math.pow(centerY - videoCenterY, 2)
        );
        const maxDistance = Math.sqrt(
          Math.pow(video.videoWidth / 2, 2) + 
          Math.pow(video.videoHeight / 2, 2)
        );
        const positionScore = (1 - distanceFromCenter / maxDistance) * 25;
        qualityScore += positionScore;
        
        // Landmark confidence (using detection confidence)
        const confidenceScore = detections.detection.score * 25;
        qualityScore += confidenceScore;
        
        // Symmetry check (compare left and right landmark distances)
        const landmarks = detections.landmarks;
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

        const faceData: FaceDetectionData = {
          detected: true,
          confidence: Math.round(detections.detection.score * 100),
          qualityScore: Math.round(qualityScore),
          landmarks: landmarks._positions.length,
          age: null,
          gender: null,
          expressions: null,
          faceDescriptor: detections.descriptor,
          imageDataUrl: captureCanvas?.toDataURL() || ''
        };

        setCurrentDetection(faceData);
        
        // Auto-capture logic removed as requested
      } else {
        setCurrentDetection({
          detected: false,
          confidence: 0,
          qualityScore: 0,
          landmarks: 0,
          age: null,
          gender: null,
          expressions: null,
          faceDescriptor: null,
          imageDataUrl: ''
        });
      }
    } catch (error) {
      console.error('Error analyzing face:', error);
      // Set a safe default state on error to prevent crashes
      setCurrentDetection({
        detected: false,
        confidence: 0,
        qualityScore: 0,
        landmarks: 0,
        age: null,
        gender: null,
        expressions: null,
        faceDescriptor: null,
        imageDataUrl: ''
      });
    }
  }, [faceApiReady]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      console.log('🎥 Starting camera...');

      const constraints = {
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsStreaming(true);
          
          // Start real-time analysis with a small delay to ensure video is fully ready
          setTimeout(() => {
            if (analysisIntervalRef.current) {
              clearInterval(analysisIntervalRef.current);
            }
            analysisIntervalRef.current = setInterval(analyzeFace, 100);
          }, 500);
        };
      }
    } catch (error) {
      console.error('❌ Camera error:', error);
      setError('Failed to access camera. Please check permissions.');
    }
  }, [facingMode, analyzeFace]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    
    setIsStreaming(false);
    setCurrentDetection(null);
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Face comparison functions (for face-scan mode)
  const calculateSimilarity = useCallback((descriptor1: Float32Array, descriptor2: Float32Array): number => {
    if (!descriptor1 || !descriptor2 || descriptor1.length !== descriptor2.length) {
      return 0;
    }

    let sum = 0;
    for (let i = 0; i < descriptor1.length; i++) {
      sum += Math.pow(descriptor1[i] - descriptor2[i], 2);
    }
    
    const distance = Math.sqrt(sum);
    // Convert distance to similarity percentage (lower distance = higher similarity)
    // Typical face-api.js distances: 0.4-0.6 for same person, 0.8+ for different people
    const similarity = Math.max(0, Math.min(100, (1 - distance) * 100));
    return similarity;
  }, []);

  const getConfidenceLevel = useCallback((similarity: number): 'high' | 'medium' | 'low' => {
    if (similarity >= 70) return 'high';
    if (similarity >= 50) return 'medium';
    return 'low';
  }, []);

  const performFaceComparison = useCallback(async (faceData: FaceDetectionData) => {
    if (!showComparison || !faceData.detected || !faceData.faceDescriptor) {
      return;
    }

    setIsComparing(true);
    
    try {
      const matches: FaceMatchResult[] = [];
      
      console.log('🔍 Face scan comparison starting...');
      console.log(`Total users to check: ${users.length}`);
      
      const usersWithFaceData = users.filter(u => u.faceDescriptors);
      console.log(`Users with face data: ${usersWithFaceData.length}`);

      for (const user of users) {
        if (user.faceDescriptors) {
          try {
            let userDescriptor: Float32Array | null = null;
            
            // Handle different face data formats (same logic as FaceScanModal)
            if (Array.isArray(user.faceDescriptors) && user.faceDescriptors.length > 0) {
              userDescriptor = user.faceDescriptors[0];
            } else if (typeof user.faceDescriptors === 'object' && user.faceDescriptors !== null) {
              const faceDataObj = user.faceDescriptors as any;
              
              if (faceDataObj.descriptor) {
                userDescriptor = new Float32Array(faceDataObj.descriptor);
              } else if (faceDataObj.face_descriptor) {
                userDescriptor = new Float32Array(faceDataObj.face_descriptor);
              } else if (Array.isArray(faceDataObj) && faceDataObj.length > 0 && faceDataObj[0].descriptor) {
                userDescriptor = new Float32Array(faceDataObj[0].descriptor);
              }
            }
            
            if (userDescriptor) {
              const similarity = calculateSimilarity(faceData.faceDescriptor, userDescriptor);
              
              if (similarity > 30) { // Only show matches above 30% similarity
                matches.push({
                  user,
                  similarity: Math.round(similarity),
                  confidence: getConfidenceLevel(similarity)
                });
              }
            }
          } catch (error) {
            console.warn(`Error comparing with user ${user.id}:`, error);
          }
        }
      }

      // Sort by similarity (highest first) and limit to top 5
      matches.sort((a, b) => b.similarity - a.similarity);
      setMatchResults(matches.slice(0, 5));
      
    } catch (error) {
      console.error('Error during face comparison:', error);
    } finally {
      setIsComparing(false);
    }
  }, [showComparison, users, calculateSimilarity, getConfidenceLevel]);

  // Capture face
  const capturePhoto = useCallback(() => {
    if (!currentDetection || !currentDetection.detected) {
      setError('Please position your face properly and ensure good lighting before capturing.');
      return;
    }

    setIsCapturing(true);
    setCapturedImage(currentDetection.imageDataUrl);
    
    // Stop real-time analysis
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }

    setTimeout(async () => {
      setIsCapturing(false);
      
      // If in face-scan mode with comparison enabled, perform face comparison
      if (mode === 'face-scan' && showComparison) {
        await performFaceComparison(currentDetection);
      }
      
      // Always call onCapture to notify parent component
      onCapture(currentDetection);
    }, 1000);
  }, [currentDetection, onCapture, mode, showComparison, performFaceComparison]);

  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    if (isStreaming) {
      stopCamera();
      setTimeout(startCamera, 100);
    }
  }, [isStreaming, startCamera, stopCamera]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    setIsCapturing(false);
    
    // Reset face comparison results
    setMatchResults([]);
    setIsComparing(false);
    
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
    }
    analysisIntervalRef.current = setInterval(analyzeFace, 100);
  }, [analyzeFace]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Face Recognition Setup</h2>
        <p className="text-gray-600">Position your face in the frame for face-api.js analysis</p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 flex items-center gap-2">
            <XCircleIcon className="w-5 h-5" />
            {error}
          </p>
        </div>
      )}
      
      {faceApiReady && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5" />
            face-api.js models loaded successfully
          </p>
        </div>
      )}

      {/* Camera View */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          {capturedImage ? (
            <div className="text-center">
              <img
                src={capturedImage}
                alt="Captured face"
                className="w-full max-w-md mx-auto rounded-lg"
              />
              <div className="mt-4 space-y-3">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">✅ Face Captured Successfully!</h3>
                  <p className="text-green-700">Your face has been captured and analyzed with face-api.js</p>
                </div>
                
                {/* Action buttons based on mode and customization */}
                {!hideDefaultActions && (
                  <div className="flex space-x-3">
                    {mode === 'profile-completion' ? (
                      <>
                        <Button onClick={retake} variant="outline" className="flex-1">
                          Take Another Photo
                        </Button>
                        <Button onClick={() => onCapture(currentDetection!)} className="flex-1">
                          Use This Photo
                        </Button>
                      </>
                    ) : mode === 'face-scan' ? (
                      <>
                        <Button onClick={retake} variant="outline" className="flex-1">
                          Scan Another Face
                        </Button>
                        <Button onClick={onClose || (() => {})} className="flex-1">
                          Close
                        </Button>
                      </>
                    ) : null}
                  </div>
                )}
                
                {/* Custom action buttons */}
                {customActions && customActions.length > 0 && (
                  <div className="flex space-x-3">
                    {customActions.map((action, index) => (
                      <Button
                        key={index}
                        onClick={action.onClick}
                        variant={action.variant || 'primary'}
                        className={`flex-1 ${action.className || ''}`}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Face comparison results (for face-scan mode) */}
                {mode === 'face-scan' && showComparison && (
                  <div className="mt-6 space-y-4">
                    {/* Loading State */}
                    {isComparing && (
                      <Card padding="md">
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-3"></div>
                          <p className="text-gray-600">Comparing against registered users...</p>
                        </div>
                      </Card>
                    )}

                    {/* Match Results */}
                    {!isComparing && (
                      <Card padding="md">
                        <h3 className="font-semibold text-gray-900 mb-4">
                          Match Results ({matchResults.length} found)
                        </h3>
                        
                        {matchResults.length === 0 ? (
                          <div className="text-center py-6">
                            <div className="text-gray-400 mb-2">😔</div>
                            <p className="text-gray-600">No matching users found</p>
                            <p className="text-sm text-gray-500 mt-1">
                              The scanned face doesn't match any registered users in the system
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {matchResults.map((match, index) => (
                              <div 
                                key={match.user.id}
                                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                              >
                                <div className="flex items-center space-x-3">
                                  <ProfileImage
                                    src={match.user.profilePhotoUrl}
                                    alt={`${match.user.firstName} ${match.user.lastName}`}
                                    size="sm"
                                    fallbackInitials={`${match.user.firstName?.[0] || ''}${match.user.lastName?.[0] || ''}`}
                                  />
                                  <div>
                                    <h4 className="font-medium text-gray-900 text-sm">
                                      {match.user.firstName} {match.user.lastName}
                                    </h4>
                                    <p className="text-xs text-gray-600">{match.user.email}</p>
                                    {match.user.positionTitle && (
                                      <p className="text-xs text-gray-500">{match.user.positionTitle}</p>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="text-right">
                                  <div className="text-lg font-semibold text-gray-900">
                                    {match.similarity}%
                                  </div>
                                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                    match.confidence === 'high' ? 'text-green-600 bg-green-100' :
                                    match.confidence === 'medium' ? 'text-yellow-600 bg-yellow-100' :
                                    'text-red-600 bg-red-100'
                                  }`}>
                                    {match.confidence === 'high' ? 'High Match' :
                                     match.confidence === 'medium' ? 'Possible Match' :
                                     'Low Match'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full max-w-md mx-auto rounded-lg"
                autoPlay
                muted
                playsInline
              />
              {/* Canvas overlay for landmarks - EXACT COPY from FaceApiDemo.tsx line 334 */}
              <canvas 
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover rounded-lg pointer-events-none"
                style={{ display: isStreaming ? 'block' : 'none' }}
              />
              <canvas
                ref={captureCanvasRef}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Face Detection Status */}
        {currentDetection && isStreaming && !capturedImage && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">🤖 face-api.js Live Analysis</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Face:</span> {currentDetection.detected ? 'Detected' : 'Not detected'}
              </div>
              <div>
                <span className="font-medium">Confidence:</span> {currentDetection.confidence}%
              </div>
              <div>
                <span className="font-medium">Quality:</span> {currentDetection.qualityScore}%
              </div>
              <div>
                <span className="font-medium">Landmarks:</span> {currentDetection.landmarks}/68
              </div>
            </div>
            
            {currentDetection.detected && (
              <div className={`mt-3 p-3 rounded-lg ${
                currentDetection.qualityScore >= 95 ? 'bg-green-50 text-green-800' :
                currentDetection.qualityScore >= 80 ? 'bg-blue-50 text-blue-800' :
                currentDetection.qualityScore >= 60 ? 'bg-yellow-50 text-yellow-800' :
                'bg-red-50 text-red-800'
              }`}>
                {currentDetection.qualityScore >= 95 ? '🎯 Excellent quality - Ready to capture!' :
                 currentDetection.qualityScore >= 80 ? '✓ Very good quality' :
                 currentDetection.qualityScore >= 60 ? '✓ Good quality - You can capture manually' :
                 '⚠️ Please improve lighting and face position'}
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        {!capturedImage && (
          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <Button
              onClick={isStreaming ? stopCamera : startCamera}
              disabled={!faceApiReady}
              className={isStreaming ? 'bg-red-500 hover:bg-red-600' : ''}
            >
              <CameraIcon className="w-4 h-4" />
              {isStreaming ? 'Stop Camera' : 'Start Camera'}
            </Button>

            {isStreaming && (
              <>
                <Button onClick={toggleCamera} variant="outline">
                  <ArrowPathIcon className="w-4 h-4" />
                  {facingMode === 'user' ? 'Rear' : 'Front'}
                </Button>

                <Button
                  onClick={capturePhoto}
                  disabled={!currentDetection?.detected || currentDetection.qualityScore < 60}
                  className="bg-green-600 hover:bg-green-700"
                >
                  📸 Capture Face
                </Button>
              </>
            )}

            {onClose && (
              <Button onClick={onClose} variant="outline">
                Cancel
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceApiCapture;
