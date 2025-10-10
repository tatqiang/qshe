// Database Face Detection Test
// Test face detection and matching against real users in the database

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '../components/common/Button';
import { CameraIcon, ArrowPathIcon, UserGroupIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { DatabaseFaceTestingService } from '../services/databaseFaceTestingService';

// Import face-api.js dynamically
declare global {
  interface Window {
    faceapi: any;
  }
}

interface DatabaseUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  user_type: string;
  status: string;
  face_descriptors: any;
  profile_photo_url: string | null;
  created_at: string;
  updated_at: string;
}

interface FaceMatchResult {
  user: DatabaseUser;
  similarity: number;
  confidence: number;
}

interface FaceDetectionData {
  detected: boolean;
  confidence: number;
  qualityScore: number;
  landmarks: number;
  age: number | null;
  gender: string | null;
  expressions: any;
  faceDescriptor: Float32Array | null;
}

export const DatabaseFaceDetectionTest: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [faceApiReady, setFaceApiReady] = useState(false);
  const [faceDetection, setFaceDetection] = useState<FaceDetectionData | null>(null);
  const [databaseUsers, setDatabaseUsers] = useState<DatabaseUser[]>([]);
  const [matchResults, setMatchResults] = useState<FaceMatchResult[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [databaseStatus, setDatabaseStatus] = useState({ connected: false, totalUsers: 0, usersWithFaces: 0 });

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

  // Load database users
  const loadDatabaseUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      console.log('📁 Loading users from database...');
      const result = await DatabaseFaceTestingService.getAllUsersWithFaceData();
      
      if (result.success) {
        const users = result.data as DatabaseUser[];
        setDatabaseUsers(users);
        
        const usersWithFaces = users.filter(u => u.face_descriptors);
        setDatabaseStatus({
          connected: true,
          totalUsers: users.length,
          usersWithFaces: usersWithFaces.length
        });
        
        console.log(`✅ Loaded ${users.length} users, ${usersWithFaces.length} with face data`);
      } else {
        setError(`Database error: ${result.error}`);
        setDatabaseStatus({ connected: false, totalUsers: 0, usersWithFaces: 0 });
      }
    } catch (error) {
      console.error('❌ Error loading database users:', error);
      setError('Failed to load database users');
      setDatabaseStatus({ connected: false, totalUsers: 0, usersWithFaces: 0 });
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  // Load database users on component mount
  useEffect(() => {
    loadDatabaseUsers();
  }, [loadDatabaseUsers]);

  // Compare face descriptor with database users
  const compareWithDatabaseUsers = useCallback((faceDescriptor: Float32Array) => {
    if (!databaseUsers.length || !faceDescriptor) return;

    const matches: FaceMatchResult[] = [];
    const faceapi = window.faceapi;
    
    databaseUsers.forEach(user => {
      if (user.face_descriptors && user.face_descriptors.face_descriptor) {
        try {
          const storedDescriptor = new Float32Array(user.face_descriptors.face_descriptor);
          const distance = faceapi.euclideanDistance(faceDescriptor, storedDescriptor);
          const similarity = Math.max(0, (1 - distance) * 100);
          
          if (similarity > 50) { // Only show matches above 50%
            matches.push({
              user,
              similarity: Math.round(similarity),
              confidence: Math.round(similarity)
            });
          }
        } catch (error) {
          console.warn(`Error comparing with user ${user.email}:`, error);
        }
      }
    });

    // Sort by similarity (highest first)
    matches.sort((a, b) => b.similarity - a.similarity);
    setMatchResults(matches.slice(0, 5)); // Show top 5 matches
    
    console.log(`🔍 Found ${matches.length} potential matches`);
  }, [databaseUsers]);

  // Analyze face in real-time
  const analyzeFace = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const faceapi = window.faceapi;
    
    if (!video || !canvas || !faceapi || !faceApiReady) return;

    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    canvas.width = displaySize.width;
    canvas.height = displaySize.height;

    try {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors()
        .withFaceExpressions()
        .withAgeAndGender();

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (detections.length > 0) {
          const detection = detections[0];
          const { detection: faceBox, landmarks, descriptor, expressions, age, gender } = detection;
          
          // Calculate quality score
          const qualityScore = Math.min(100, Math.round(detection.detection.score * 100));
          
          // Draw face box
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 2;
          ctx.strokeRect(faceBox.box.x, faceBox.box.y, faceBox.box.width, faceBox.box.height);
          
          // Draw landmarks
          ctx.fillStyle = '#ff00ff';
          landmarks.positions.forEach((point: any) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI);
            ctx.fill();
          });

          const faceData: FaceDetectionData = {
            detected: true,
            confidence: Math.round(detection.detection.score * 100),
            qualityScore,
            landmarks: landmarks.positions.length,
            age: Math.round(age),
            gender: gender,
            expressions,
            faceDescriptor: descriptor
          };

          setFaceDetection(faceData);
          
          // Compare with database users
          if (descriptor) {
            compareWithDatabaseUsers(descriptor);
          }
        } else {
          setFaceDetection({
            detected: false,
            confidence: 0,
            qualityScore: 0,
            landmarks: 0,
            age: null,
            gender: null,
            expressions: null,
            faceDescriptor: null
          });
          setMatchResults([]);
        }
      }
    } catch (error) {
      console.error('Error analyzing face:', error);
    }
  }, [faceApiReady, compareWithDatabaseUsers]);

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
          
          // Start real-time analysis
          analysisIntervalRef.current = setInterval(analyzeFace, 100);
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
    setFaceDetection(null);
    setMatchResults([]);
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    if (isStreaming) {
      stopCamera();
      setTimeout(startCamera, 100);
    }
  }, [isStreaming, startCamera, stopCamera]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <UserGroupIcon className="w-8 h-8 text-blue-600" />
          Database Face Detection Test
        </h1>
        <p className="text-gray-600">
          Test face detection and matching against real users in your database
        </p>
      </div>

      {/* Database Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5" />
            Database Status
          </h2>
          <Button
            onClick={loadDatabaseUsers}
            disabled={isLoadingUsers}
            size="sm"
            variant="outline"
          >
            <ArrowPathIcon className="w-4 h-4" />
            {isLoadingUsers ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{databaseStatus.totalUsers}</div>
            <div className="text-sm text-blue-700">Total Users</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{databaseStatus.usersWithFaces}</div>
            <div className="text-sm text-green-700">With Face Data</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className={`text-2xl font-bold ${databaseStatus.connected ? 'text-green-600' : 'text-red-600'}`}>
              {databaseStatus.connected ? '✓' : '✗'}
            </div>
            <div className="text-sm text-gray-700">Connected</div>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
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

      {/* Video and Analysis */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full max-w-2xl mx-auto rounded-lg"
            autoPlay
            muted
            playsInline
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-1/2 transform -translate-x-1/2 rounded-lg pointer-events-none"
          />
        </div>

        {/* Face Detection Results */}
        {faceDetection && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">🤖 face-api.js Analysis</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Face:</span> {faceDetection.detected ? 'Detected' : 'Not detected'}
              </div>
              <div>
                <span className="font-medium">Confidence:</span> {faceDetection.confidence}%
              </div>
              <div>
                <span className="font-medium">Quality:</span> {faceDetection.qualityScore}%
              </div>
              <div>
                <span className="font-medium">Landmarks:</span> {faceDetection.landmarks}/68
              </div>
              {faceDetection.age && (
                <div>
                  <span className="font-medium">Age:</span> ~{faceDetection.age}
                </div>
              )}
              {faceDetection.gender && (
                <div>
                  <span className="font-medium">Gender:</span> {faceDetection.gender}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Database Matches */}
        {matchResults.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-4">Similar Accounts:</h3>
            <div className="space-y-3">
              {matchResults.map((match) => (
                <div key={match.user.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {match.user.profile_photo_url ? (
                        <img
                          src={match.user.profile_photo_url}
                          alt={`${match.user.first_name} ${match.user.last_name}`}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                          {match.user.first_name?.[0]}{match.user.last_name?.[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {match.user.first_name} {match.user.last_name}
                      </h4>
                      <p className="text-gray-600 text-sm">{match.user.email}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                          Face Match
                        </span>
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                          {match.similarity}% Face Similarity
                        </span>
                        <span className="text-gray-500 text-xs">
                          Created: {new Date(match.user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap gap-4 justify-center mt-6">
          <Button
            onClick={isStreaming ? stopCamera : startCamera}
            disabled={!faceApiReady}
            className={isStreaming ? 'bg-red-500 hover:bg-red-600' : ''}
          >
            <CameraIcon className="w-4 h-4" />
            {isStreaming ? 'Stop Camera' : 'Start Camera'}
          </Button>

          <Button onClick={toggleCamera} disabled={!faceApiReady} variant="outline">
            <ArrowPathIcon className="w-4 h-4" />
            {facingMode === 'user' ? 'Rear' : 'Front'}
          </Button>

          <Button
            onClick={() => window.location.href = '/face-api'}
            variant="outline"
          >
            Back to Face Demo
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DatabaseFaceDetectionTest;
