import React, { useState, useEffect } from 'react';
import { Modal } from '../../common/Modal';
import { Step3FaceRecognition } from '../../profile-completion/steps/Step3FaceRecognition';
import { Card } from '../../common/Card';
import { ProfileImage } from '../../common/ProfileImage';
import { Button } from '../../common/Button';
import { useAppSelector } from '../../../hooks/redux';
import { DatabaseFaceTestingService } from '../../../services/databaseFaceTestingService';
import type { User } from '../../../types';
import type { RootState } from '../../../store';
import type { ProfileCompletionState } from '../../profile-completion/types/profile-completion.types';

interface FaceScanModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  confidence: 'high' | 'medium' | 'low';
}

export const FaceScanModal: React.FC<FaceScanModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState<'scanning' | 'results'>('scanning');
  const [matchResults, setMatchResults] = useState<FaceMatchResult[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [capturedFaceData, setCapturedFaceData] = useState<any>(null);

  const { users } = useAppSelector((state: RootState) => state.users);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('scanning');
      setMatchResults([]);
      setIsComparing(false);
      setCapturedFaceData(null);
    }
  }, [isOpen]);

  const getConfidenceLevel = (similarity: number): 'high' | 'medium' | 'low' => {
    if (similarity >= 70) return 'high';
    if (similarity >= 50) return 'medium';
    return 'low';
  };

  // Face similarity calculation - COPIED FROM Step4DuplicateDetection.tsx
  const calculateSimilarity = (descriptor1: Float32Array, descriptor2: Float32Array): number => {
    if (!descriptor1 || !descriptor2) {
      console.log('❌ Missing descriptors:', { desc1: !!descriptor1, desc2: !!descriptor2 });
      return 0;
    }
    
    if (descriptor1.length !== descriptor2.length) {
      console.log('❌ Descriptor length mismatch:', { len1: descriptor1.length, len2: descriptor2.length });
      return 0;
    }

    try {
      // Standard Euclidean distance for face-api.js descriptors
      let sumSquaredDiff = 0;
      for (let i = 0; i < descriptor1.length; i++) {
        const diff = descriptor1[i] - descriptor2[i];
        sumSquaredDiff += diff * diff;
      }
      
      const euclideanDistance = Math.sqrt(sumSquaredDiff);
      
      // OPTIMIZED for pure face-api.js descriptors
      // Now that all data will be face-api.js, we can use standard thresholds
      const maxDistance = 1.2; // Standard face-api.js threshold
      const similarity = Math.max(0, (1 - (euclideanDistance / maxDistance)) * 100);
      
      console.log(`🔍 Distance: ${euclideanDistance.toFixed(3)}, Similarity: ${similarity.toFixed(1)}%`);
      
      return Math.max(0, Math.min(100, similarity));
    } catch (error) {
      console.error('❌ Error calculating similarity:', error);
      return 0;
    }
  };

  // Handle face capture from Step3FaceRecognition component
  const handleFaceNext = async (faceData: any) => {
    console.log('🔍 Face scan data received:', faceData);
    
    if (!faceData.detected || !faceData.descriptor) {
      console.error('No face detected or descriptor missing');
      return;
    }

    setCapturedFaceData(faceData);
    setIsComparing(true);
    setCurrentStep('results');

    try {
      // Load users from database using DatabaseFaceTestingService (same as Step4DuplicateDetection)
      console.log('🔍 Loading users from database for face scan comparison...');
      const result = await DatabaseFaceTestingService.getAllUsersWithFaceData();
      
      if (!result.success) {
        console.error('Failed to load users from database:', result.error);
        setMatchResults([]);
        return;
      }

      const databaseUsers = result.data as DatabaseUser[];
      const matches: FaceMatchResult[] = [];
      const similarityThreshold = 30; // Show matches above 30% for face scan (lower threshold than duplicate detection)
      const currentDescriptor = faceData.descriptor;
      
      console.log(`🔍 Comparing face against ${databaseUsers.length} users...`);
      console.log(`📊 Current descriptor length: ${currentDescriptor.length}`);
      console.log(`🎯 Display threshold: ${similarityThreshold}% (face scan mode)`);
      
      databaseUsers.forEach(user => {
        if (user.face_descriptors) {
          try {
            // Handle different face descriptor formats from database (EXACT COPY from Step4DuplicateDetection)
            let descriptorArray: number[] | undefined;
            
            console.log(`🔍 Processing ${user.first_name} ${user.last_name}, face_descriptors:`, user.face_descriptors);
            
            if (Array.isArray(user.face_descriptors)) {
              if (user.face_descriptors.length > 0 && Array.isArray(user.face_descriptors[0])) {
                // Array of arrays format: [[1.2, 3.4, ...]] - use the first inner array
                descriptorArray = user.face_descriptors[0];
                console.log(`  Format: Array of arrays, using first inner array (length: ${user.face_descriptors[0].length})`);
              } else {
                // Direct array format: [1.2, 3.4, ...]
                descriptorArray = user.face_descriptors;
                console.log(`  Format: Direct array (length: ${user.face_descriptors.length})`);
              }
            } else if (typeof user.face_descriptors === 'object' && user.face_descriptors.face_descriptor) {
              // Nested object format: { face_descriptor: [1.2, 3.4, ...] }
              descriptorArray = user.face_descriptors.face_descriptor;
              console.log(`  Format: Nested object with face_descriptor (length: ${user.face_descriptors.face_descriptor.length})`);
            }
            
            if (!descriptorArray || !Array.isArray(descriptorArray) || descriptorArray.length !== 128) {
              console.log(`⚠️ ${user.first_name} ${user.last_name}: Invalid face descriptor format or length`, {
                isArray: Array.isArray(descriptorArray),
                length: descriptorArray?.length,
                expected: 128,
                data: user.face_descriptors
              });
              return;
            }
            
            const storedDescriptor = new Float32Array(descriptorArray);
            console.log(`� Comparing with ${user.first_name} ${user.last_name} (descriptor length: ${storedDescriptor.length})`);
            
            const similarity = calculateSimilarity(currentDescriptor, storedDescriptor);
            
            console.log(`👤 ${user.first_name} ${user.last_name}: ${similarity.toFixed(1)}% similarity`);
            
            if (similarity >= similarityThreshold) {
              matches.push({
                user,
                similarity: Math.round(similarity),
                confidence: getConfidenceLevel(similarity)
              });
              
              console.log(`✅ Showing match: ${user.first_name} ${user.last_name} (${similarity.toFixed(1)}%)`);
            } else {
              console.log(`⬇️ Below display threshold: ${user.first_name} ${user.last_name} (${similarity.toFixed(1)}%)`);
            }
          } catch (error) {
            console.warn(`Error comparing with user ${user.id}:`, error);
          }
        }
      });

      // Sort by similarity (highest first) and limit to top 5
      matches.sort((a, b) => b.similarity - a.similarity);
      setMatchResults(matches.slice(0, 5));
      
      console.log(`✅ Face scan comparison complete. Found ${matches.length} matches above ${similarityThreshold}%`);
      
    } catch (error) {
      console.error('Error during face comparison:', error);
    } finally {
      setIsComparing(false);
    }
  };

  const handleNewScan = () => {
    setCurrentStep('scanning');
    setMatchResults([]);
    setCapturedFaceData(null);
  };

  const getConfidenceColor = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
    }
  };

  const getConfidenceText = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high': return 'High Match';
      case 'medium': return 'Possible Match';
      case 'low': return 'Low Match';
    }
  };

  // Mock state for Step3FaceRecognition component
  const mockState = {
    mode: 'completion' as const,
    token: null,
    tokenValid: false,
    tokenValidating: false,
    userData: null,
    currentStep: 3,
    passwordData: null,
    photoData: null,
    faceData: null,
    duplicateCheck: null,
    isLoading: false,
    error: null
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Face Recognition Scan"
      size="xl"
    >
      <div className="space-y-6">
        {currentStep === 'scanning' && (
          <div>
            {/* Use Step3FaceRecognition component directly */}
            <Step3FaceRecognition
              state={mockState}
              onNext={handleFaceNext}
              onBack={onClose}
              onError={(error) => console.error('Face recognition error:', error)}
              mode="completion"
              hideTitle={true}
            />
          </div>
        )}

        {currentStep === 'results' && (
          <div className="space-y-6">
            {/* Scanned Face Preview */}
            {capturedFaceData?.photoUrl && (
              <Card padding="md">
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 mb-3">Scanned Face</h3>
                  <img 
                    src={capturedFaceData.photoUrl} 
                    alt="Scanned face" 
                    className="w-32 h-32 rounded-lg mx-auto object-cover border-2 border-gray-200"
                  />
                  <div className="mt-2 text-sm text-gray-600">
                    Quality: {capturedFaceData.quality}% | Confidence: {capturedFaceData.confidence}%
                  </div>
                </div>
              </Card>
            )}

            {/* Loading State */}
            {isComparing && (
              <Card padding="md">
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
                  <div className="text-center py-8">
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
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-4">
                          <ProfileImage
                            src={match.user.profile_photo_url}
                            alt={`${match.user.first_name} ${match.user.last_name}`}
                            size="md"
                            fallbackInitials={`${match.user.first_name?.[0] || ''}${match.user.last_name?.[0] || ''}`}
                          />
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {match.user.first_name} {match.user.last_name}
                            </h4>
                            <p className="text-sm text-gray-600">{match.user.email}</p>
                            <p className="text-xs text-gray-500">{match.user.user_type} - {match.user.status}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            {match.similarity}%
                          </div>
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${getConfidenceColor(match.confidence)}`}>
                            {getConfidenceText(match.confidence)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleNewScan}>
                Scan Another Face
              </Button>
              <Button onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};