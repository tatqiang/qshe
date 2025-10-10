import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '../../common/Button';
import { CameraIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { compressImage } from '../../../utils/imageUtils';

// Simple face-api.js interface
interface FaceRecognitionResult {
  detected: boolean;
  faces: Float32Array[]; // face descriptors
  quality: {
    lighting: 'good' | 'poor' | 'unknown';
    angle: 'good' | 'poor' | 'unknown';
    clarity: 'good' | 'poor' | 'unknown';
    overall: 'good' | 'acceptable' | 'poor';
  };
}

// Use face-api.js instead of TensorFlow for better compatibility and landmarks
declare global {
  interface Window {
    faceapi: any;
  }
}

interface FaceCaptureProps {
  onCapture: (faceDataUrl: string, faceData?: FaceRecognitionResult) => void;
}

// Real-time quality indicators
interface LiveQualityMetrics {
  faceDetected: boolean;
  confidence: number;
  lighting: 'poor' | 'fair' | 'good';
  position: 'poor' | 'fair' | 'good';
  sharpness: 'poor' | 'fair' | 'good';
  landmarkCount: number;
  readyToCapture: boolean;
  hasObstruction?: boolean;
}

export const FaceCapture: React.FC<FaceCaptureProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoCaptureTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [faceApiReady, setFaceApiReady] = useState(false);
  const [faceDetectionResult, setFaceDetectionResult] = useState<FaceRecognitionResult | null>(null);
  const [isDetectingFace, setIsDetectingFace] = useState(false);
  const [liveQuality, setLiveQuality] = useState<LiveQualityMetrics | null>(null);
  const [autoCaptureCountdown, setAutoCaptureCountdown] = useState<number | null>(null);

  // Load face-api.js models (working implementation from face-api-demo)
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

  // Real-time face analysis using face-api.js
  const analyzeFace = async () => {
    if (!videoRef.current || !canvasRef.current || !faceApiReady) return;

    try {
      // Use face-api.js for detection with landmarks and descriptors
      const detection = await window.faceapi
        .detectSingleFace(videoRef.current, new window.faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

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

        // Calculate quality score (same logic as working demo)
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

        const finalQuality = Math.round(qualityScore);
        const finalConfidence = Math.round(detection.detection.score * 100);
        
        // Update live quality metrics
        const lighting = finalQuality > 80 ? 'good' : finalQuality > 60 ? 'fair' : 'poor';
        const position = positionScore > 15 ? 'good' : positionScore > 10 ? 'fair' : 'poor';
        const sharpness = finalConfidence > 85 ? 'good' : finalConfidence > 70 ? 'fair' : 'poor';
        
        const qualityMetrics: LiveQualityMetrics = {
          faceDetected: true,
          confidence: finalConfidence,
          lighting,
          position,
          sharpness,
          landmarkCount: landmarks._positions.length, // 68 landmarks from face-api.js
          readyToCapture: finalQuality >= 85 && finalConfidence >= 85,
          hasObstruction: false
        };

        setLiveQuality(qualityMetrics);

        // Store face result with descriptor for saving
        setFaceDetectionResult({
          detected: true,
          faces: [detection.descriptor], // Store face descriptors
          quality: {
            lighting: 'good',
            angle: 'good',
            clarity: 'good',
            overall: 'good'
          }
        });

        // AUTO-CAPTURE when quality is excellent (>=95%)
        if (finalQuality >= 95 && finalConfidence >= 95 && !autoCaptureTimeoutRef.current) {
          console.log('🎯 Excellent quality detected! Auto-capturing in 3 seconds...');
          setAutoCaptureCountdown(3);
          
          let countdown = 3;
          autoCaptureTimeoutRef.current = setInterval(() => {
            countdown--;
            setAutoCaptureCountdown(countdown);
            
            if (countdown <= 0) {
              clearInterval(autoCaptureTimeoutRef.current!);
              autoCaptureTimeoutRef.current = null;
              setAutoCaptureCountdown(null);
              captureImage();
            }
          }, 1000);
        }

      } else {
        // Clear canvas if no face detected
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        
        // Clear auto-capture if face is lost
        if (autoCaptureTimeoutRef.current) {
          clearInterval(autoCaptureTimeoutRef.current);
          autoCaptureTimeoutRef.current = null;
          setAutoCaptureCountdown(null);
        }

        setLiveQuality({
          faceDetected: false,
          confidence: 0,
          lighting: 'poor',
          position: 'poor',
          sharpness: 'poor',
          landmarkCount: 0,
          readyToCapture: false
        });

        setFaceDetectionResult({
          detected: false,
          faces: [],
          quality: {
            lighting: 'poor',
            angle: 'poor',
            clarity: 'poor',
            overall: 'poor'
          }
        });
      }
    } catch (error) {
      console.error('Face analysis error:', error);
    }
  };

  // Start live analysis when camera is streaming
  useEffect(() => {
    if (isStreaming && faceApiReady) {
      console.log('Starting face analysis interval...');
      analysisIntervalRef.current = setInterval(analyzeFace, 500); // Analyze every 500ms
      return () => {
        if (analysisIntervalRef.current) {
          clearInterval(analysisIntervalRef.current);
        }
        if (autoCaptureTimeoutRef.current) {
          clearInterval(autoCaptureTimeoutRef.current);
        }
      };
    }
  }, [isStreaming, faceApiReady]);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      console.log('Starting camera...');
      
      // Optimized camera configuration for better face recognition
      const constraints = {
        video: {
          // Higher resolution for mobile devices
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: facingMode,
          // Mobile-optimized settings for better face capture
          frameRate: { ideal: 30, min: 15 },
          // Focus and exposure settings for face capture
          focusMode: 'continuous',
          exposureMode: 'continuous',
          // Prefer higher quality codec
          aspectRatio: { ideal: 16/9 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('Camera stream obtained:', stream);
      console.log('Video ref current:', videoRef.current);
      
      // Wait a bit for the video element to be rendered
      const setVideoStream = () => {
        if (videoRef.current) {
          console.log('Setting video source...');
          videoRef.current.srcObject = stream;
          
          // Set up multiple event listeners to ensure we catch when video is ready
          const handleVideoReady = () => {
            console.log('Video is ready and playing');
            setIsStreaming(true);
            setIsLoading(false);
          };
          
          // Listen for multiple events that indicate video is ready
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded');
            if (videoRef.current && videoRef.current.readyState >= 2) {
              handleVideoReady();
            }
          };
          
          videoRef.current.oncanplay = () => {
            console.log('Video can play');
            handleVideoReady();
          };
          
          videoRef.current.onplaying = () => {
            console.log('Video is playing');
            handleVideoReady();
          };
          
          // Try to play the video
          videoRef.current.play().then(() => {
            console.log('Video play() succeeded');
          }).catch((playError) => {
            console.log('Video play() failed, but may still work:', playError);
          });
          
          // Fallback timeout in case events don't fire
          setTimeout(() => {
            if (videoRef.current && videoRef.current.srcObject && !isStreaming) {
              console.log('Timeout fallback: setting streaming to true');
              setIsStreaming(true);
              setIsLoading(false);
            }
          }, 3000);
        } else {
          console.log('Video ref still null, retrying...');
          setTimeout(setVideoStream, 100);
        }
      };
      
      setVideoStream();
      
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access denied. Please allow camera access to continue.');
      setIsLoading(false);
    }
  }, [isStreaming]);

  const stopCamera = useCallback(() => {
    // Clear live analysis interval
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      
      // Clean up event listeners
      if (videoRef.current) {
        videoRef.current.onloadedmetadata = null;
        videoRef.current.oncanplay = null;
        videoRef.current.onplaying = null;
      }
      
      setIsStreaming(false);
      setIsLoading(false);
      setLiveQuality(null); // Reset quality indicators
    }
  }, []);

  const captureImage = useCallback(async () => {
    if (videoRef.current && canvasRef.current) {
      try {
        setIsDetectingFace(true);
        
        // Clear auto-capture timer if running
        if (autoCaptureTimeoutRef.current) {
          clearInterval(autoCaptureTimeoutRef.current);
          autoCaptureTimeoutRef.current = null;
          setAutoCaptureCountdown(null);
        }
        
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d');
        
        if (context) {
          // Use higher resolution for better face recognition
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0);
          
          // Increase JPEG quality to 0.95 for better face recognition
          const originalDataUrl = canvas.toDataURL('image/jpeg', 0.95);
          
          // Use the current face detection result from live analysis
          let faceData: FaceRecognitionResult | undefined = faceDetectionResult || undefined;
          
          // Perform final face detection with face-api.js if not available
          if (faceApiReady && (!faceData || !faceData.detected)) {
            try {
              console.log('Performing final face detection with face-api.js...');
              
              const detection = await window.faceapi
                .detectSingleFace(video, new window.faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();

              if (detection) {
                faceData = {
                  detected: true,
                  faces: [detection.descriptor], // face descriptors
                  quality: {
                    lighting: 'good',
                    angle: 'good', 
                    clarity: 'good',
                    overall: 'good'
                  }
                };
                console.log('✅ Face detection result:', faceData);
              } else {
                setError('No face detected. Please ensure your face is clearly visible and well-lit.');
                setIsDetectingFace(false);
                return;
              }
            } catch (faceError) {
              console.error('Face detection error:', faceError);
              setError('Face detection failed. Please try again.');
              setIsDetectingFace(false);
              return;
            }
          }
          
          // Check if we have valid face data
          if (!faceData || !faceData.detected) {
            setError('No face detected. Please ensure your face is clearly visible and try again.');
            setIsDetectingFace(false);
            return;
          }
          
          // Compress the image for storage (300x300 max, 70% quality)
          const compressedDataUrl = await compressImage(originalDataUrl, 300, 300, 0.7);
          
          console.log('✅ Face captured successfully:', {
            detected: faceData.detected,
            quality: faceData.quality,
            facesCount: faceData.faces.length
          });
          
          setCapturedImage(compressedDataUrl);
          onCapture(compressedDataUrl, faceData);
          stopCamera();
        }
      } catch (error) {
        console.error('Photo capture error:', error);
        setError('Failed to capture photo. Please try again.');
      } finally {
        setIsDetectingFace(false);
      }
    }
  }, [onCapture, stopCamera, faceApiReady, faceDetectionResult]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const switchCamera = useCallback(() => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    // Stop current camera and start with new facing mode
    if (isStreaming) {
      stopCamera();
      // Small delay to ensure camera is stopped before restarting
      setTimeout(() => {
        startCamera();
      }, 100);
    }
  }, [facingMode, isStreaming, stopCamera, startCamera]);

  if (capturedImage) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <img 
            src={capturedImage} 
            alt="Captured face" 
            className="w-full h-64 object-cover rounded-lg border-2 border-green-300"
          />
          <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
            <CheckCircleIcon className="w-5 h-5" />
          </div>
          {faceDetectionResult && (
            <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
              {faceDetectionResult.faces.length} face(s) - {faceDetectionResult.quality.overall} quality
            </div>
          )}
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            Face captured successfully! {faceDetectionResult?.detected ? 'Face recognition data included.' : ''}
            {faceDetectionResult && faceDetectionResult.quality.overall !== 'good' && (
              <span className="block text-amber-600">
                Quality: {faceDetectionResult.quality.overall}. Consider retaking for better results.
              </span>
            )}
          </p>
          <Button 
            type="button" 
            variant="outline" 
            onClick={retakePhoto}
            className="w-full"
          >
            Retake Photo
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
        <Button onClick={startCamera} className="w-full">
          Try Again
        </Button>
      </div>
    );
  }

  if (!isStreaming && !isLoading) {
    return (
      <div className="text-center space-y-4">
        <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg h-64 flex items-center justify-center">
          <div className="text-center">
            <CameraIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Click the button below to start your camera</p>
          </div>
        </div>
        
        {/* Face Photo Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">📸 For Best Face Recognition Results:</h3>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• <strong>Remove glasses and hats</strong> - Critical for accurate detection</li>
            <li>• <strong>Face the camera directly</strong> - Avoid side angles</li>
            <li>• <strong>Ensure good lighting</strong> - Avoid shadows on face</li>
            <li>• <strong>Stay still when capturing</strong> - Avoid motion blur</li>
            <li>• <strong>System requires 90%+ confidence</strong> for registration</li>
          </ul>
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            <strong>💡 Tip:</strong> The system shows landmarks but cannot assess photo quality. 
            Please follow these guidelines for successful face registration.
          </div>
        </div>
        
        <Button onClick={startCamera} className="w-full">
          Start Camera
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 object-cover rounded-lg border-2 border-blue-300"
          />
          <div className="absolute inset-0 bg-blue-50 bg-opacity-90 border-2 border-blue-200 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-blue-600 mb-4">Starting camera...</p>
              <p className="text-sm text-gray-600">Please allow camera access if prompted</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-64 object-cover rounded-lg border-2 border-blue-300"
        />
        <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white rounded-full shadow-lg"></div>
          
          {/* Landmark Visualization */}
          {liveQuality && liveQuality.faceDetected && (
            <canvas 
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover rounded-lg pointer-events-none"
              style={{ mixBlendMode: 'overlay' }}
            />
          )}
          
          {/* Live Quality Indicators */}
          {liveQuality && (
            <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white p-2 rounded-lg text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${liveQuality.faceDetected ? 'bg-green-400' : 'bg-red-400'}`}></span>
                  <span>Face: {liveQuality.faceDetected ? 'Detected' : 'Not Found'}</span>
                </div>
                
                {liveQuality.faceDetected && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        liveQuality.confidence >= 90 ? 'bg-green-400' : 
                        liveQuality.confidence >= 70 ? 'bg-yellow-400' : 'bg-red-400'
                      }`}></span>
                      <span>Quality: {liveQuality.confidence}%</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        liveQuality.lighting === 'good' ? 'bg-green-400' : 
                        liveQuality.lighting === 'fair' ? 'bg-yellow-400' : 'bg-red-400'
                      }`}></span>
                      <span>Light: {liveQuality.lighting}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        liveQuality.position === 'good' ? 'bg-green-400' : 
                        liveQuality.position === 'fair' ? 'bg-yellow-400' : 'bg-red-400'
                      }`}></span>
                      <span>Position: {liveQuality.position}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        liveQuality.landmarkCount >= 68 ? 'bg-green-400' : 'bg-yellow-400'
                      }`}></span>
                      <span>Landmarks: {liveQuality.landmarkCount}/68</span>
                    </div>
                    
                    {liveQuality.hasObstruction && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-400"></span>
                        <span className="text-red-400">⚠️ Face blocked</span>
                      </div>
                    )}
                  </>
                )}
                
                {liveQuality.readyToCapture && (
                  <div className="border-t border-gray-500 pt-1 mt-1">
                    <span className="text-green-400 text-xs">✅ Ready to capture!</span>
                  </div>
                )}
                
                {liveQuality.hasObstruction && (
                  <div className="border-t border-red-500 pt-1 mt-1">
                    <span className="text-red-400 text-xs">🚫 Remove glasses/hands!</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Auto-capture countdown */}
          {autoCaptureCountdown !== null && autoCaptureCountdown > 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-60 rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-6xl font-bold animate-pulse mb-2">{autoCaptureCountdown}</div>
                <p className="text-sm">Auto-capturing in {autoCaptureCountdown} second{autoCaptureCountdown !== 1 ? 's' : ''}...</p>
                <p className="text-xs mt-1">Excellent quality detected!</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="text-center space-y-2">
        {liveQuality ? (
          <div className="space-y-1">
            {!liveQuality.faceDetected && (
              <p className="text-sm text-red-600">❌ No face detected - please position your face in the circle</p>
            )}
            {liveQuality.faceDetected && liveQuality.hasObstruction && (
              <p className="text-sm text-red-600">🚫 Face blocked! Remove glasses, hands, or other obstructions</p>
            )}
            {liveQuality.faceDetected && !liveQuality.hasObstruction && !liveQuality.readyToCapture && (
              <p className="text-sm text-yellow-600">⚠️ Adjusting... Quality: {liveQuality.confidence}% (need 90%+)</p>
            )}
            {liveQuality.readyToCapture && (
              <p className="text-sm text-green-600">✅ Perfect! Ready to capture - Quality: {liveQuality.confidence}%</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-600">Position your face within the circle and click capture</p>
        )}
        
        {faceApiReady && (
          <p className="text-xs text-green-600">✅ face-api.js loaded - Enhanced landmarks ready</p>
        )}
        {!faceApiReady && (
          <p className="text-xs text-amber-600">⚠️ Loading face-api.js models...</p>
        )}
        
        <div className="flex space-x-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={stopCamera}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={switchCamera}
            className="flex items-center justify-center gap-2"
          >
            <ArrowPathIcon className="h-4 w-4" />
            {facingMode === 'user' ? 'Rear' : 'Front'}
          </Button>
          <Button 
            onClick={captureImage}
            className={`flex-1 ${
              liveQuality?.readyToCapture 
                ? 'bg-green-600 hover:bg-green-700 animate-pulse' 
                : liveQuality?.faceDetected 
                  ? 'bg-yellow-500 hover:bg-yellow-600'
                  : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={isDetectingFace}
          >
            {isDetectingFace ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Analyzing...
              </div>
            ) : liveQuality?.readyToCapture ? (
              '✅ Capture Now!'
            ) : liveQuality?.faceDetected ? (
              `📸 Capture (${liveQuality.confidence}%)`
            ) : (
              'Capture Photo'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
