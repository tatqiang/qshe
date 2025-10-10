import React, { useState, useEffect, useCallback } from 'react';
import { DatabaseFaceTestingService } from '../../../services/databaseFaceTestingService';
import type { StepProps } from '../types/profile-completion.types';

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

export const Step4DuplicateDetection: React.FC<StepProps> = ({ state, onNext, onBack, onError, mode = 'completion' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [duplicateMatches, setDuplicateMatches] = useState<FaceMatchResult[]>([]);
  const [selectedAction, setSelectedAction] = useState<'proceed' | 'cancel' | null>(null);
  const [databaseUsers, setDatabaseUsers] = useState<DatabaseUser[]>([]);
  const [searchComplete, setSearchComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Face similarity calculation - OPTIMIZED FOR FACE-API.JS ONLY
  const calculateSimilarity = useCallback((descriptor1: Float32Array, descriptor2: Float32Array): number => {
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
  }, []);

  // Load users and start comparison when component mounts
  useEffect(() => {
    const initializeDuplicateCheck = async () => {
      // Load database users first
      console.log('🔍 Loading users from database for duplicate detection...');
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await DatabaseFaceTestingService.getAllUsersWithFaceData();
        
        if (result.success) {
          const users = result.data as DatabaseUser[];
          setDatabaseUsers(users);
          
          const usersWithFaces = users.filter(u => u.face_descriptors);
          console.log(`✅ Loaded ${users.length} users, ${usersWithFaces.length} with face data for comparison`);
          
          // If we have face data from Step 3, start comparison
          if (state.faceData?.descriptor) {
            console.log('🎯 Starting duplicate detection with captured face descriptor...');
            
            // Face comparison - keep enhanced UI, fix risk logic, filter low similarities
            const matches: FaceMatchResult[] = [];
            const similarityThreshold = 70; // Don't show matches below 70% (too low to be meaningful)
            const currentDescriptor = state.faceData.descriptor;
            
            console.log(`🔍 Comparing face against ${users.length} users...`);
            console.log(`📊 Current descriptor length: ${currentDescriptor.length}`);
            console.log(`🎯 Display threshold: ${similarityThreshold}% (filtering out low similarities)`);
            console.log(`⏳ Waiting for all face_descriptors to use face-api.js for optimal accuracy`);
            
            users.forEach(user => {
              if (user.face_descriptors) {
                try {
                  // Handle different face descriptor formats from database
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
                  console.log(`🔄 Comparing with ${user.first_name} ${user.last_name} (descriptor length: ${storedDescriptor.length})`);
                  
                  const similarity = calculateSimilarity(currentDescriptor, storedDescriptor);
                  
                  console.log(`👤 ${user.first_name} ${user.last_name}: ${similarity.toFixed(1)}% similarity`);
                  
                  if (similarity >= similarityThreshold) {
                    matches.push({
                      user,
                      similarity,
                      confidence: similarity
                    });
                    
                    console.log(`� Showing match: ${user.first_name} ${user.last_name} (${similarity.toFixed(1)}%)`);
                  } else {
                    console.log(`⬇️ Below display threshold: ${user.first_name} ${user.last_name} (${similarity.toFixed(1)}%)`);
                  }
                } catch (error) {
                  console.error(`❌ Error comparing with user ${user.first_name} ${user.last_name}:`, error);
                }
              }
            });

            // Sort by similarity (highest first)
            matches.sort((a, b) => b.similarity - a.similarity);
            
            setDuplicateMatches(matches);
            console.log(`✅ Duplicate search complete. Found ${matches.length} potential matches`);
          } else {
            console.log('⚠️ No face descriptor available for comparison');
          }
          
          setSearchComplete(true);
        } else {
          setError(`Failed to load users: ${result.error}`);
        }
      } catch (error) {
        console.error('❌ Error in duplicate detection:', error);
        setError('Failed to connect to database');
      } finally {
        setIsLoading(false);
      }
    };

    initializeDuplicateCheck();
  }, []); // Empty dependency array to run only once

  // Handle user decision
  const handleContinue = useCallback(() => {
    onNext({
      matches: duplicateMatches,
      confirmed: true,
      selectedAction: selectedAction || 'proceed'
    });
  }, [duplicateMatches, selectedAction, onNext]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Checking for Duplicates</h2>
        <div className="max-w-md mx-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Comparing your face with existing users...</p>
          <div className="mt-4 bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700">🔍 Analyzing face descriptors</p>
            <p className="text-sm text-blue-700">📊 Calculating similarity scores</p>
            <p className="text-sm text-blue-700">🎯 Identifying potential matches</p>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Duplicate Check Error</h2>
        <div className="max-w-md mx-auto">
          <div className="bg-red-50 p-4 rounded-lg mb-6">
            <p className="text-red-700 font-semibold">⚠️ Error</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
          
          <div className="flex space-x-4 justify-center">
            <button
              onClick={onBack}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main duplicate detection results
  return (
    <div className="text-center py-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {mode === 'edit' ? 'Face Similarity Check' : 'Duplicate Detection Results'}
      </h2>
      
      <div className="max-w-2xl mx-auto">
        {/* Face data summary with captured photo */}
        {state.faceData && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
            <div className="flex items-start space-x-4">
              {/* Current User's Captured Photo */}
              <div className="flex-shrink-0">
                {state.photoData?.preview ? (
                  <div className="relative">
                    <img 
                      src={state.photoData.preview} 
                      alt="Your captured photo"
                      className="w-16 h-16 rounded-full object-cover border-2 border-blue-300 shadow-md"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded-full">
                      YOU
                    </div>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold border-2 border-blue-300 shadow-md">
                    YOU
                  </div>
                )}
              </div>

              {/* Analysis Details */}
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Your Face Analysis:</h3>
                <div className="grid grid-cols-2 gap-x-4 text-sm space-y-1">
                  <p>Quality: {state.faceData.quality}% | Confidence: {state.faceData.confidence}%</p>
                  <p>Database Users Checked: {databaseUsers.length}</p>
                  <p>Face Detected: {state.faceData.detected ? '✅ Yes' : '❌ No'}</p>
                  <p>Descriptor: {state.faceData.descriptor ? '✅ Available' : '❌ Missing'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Duplicate matches results */}
        {searchComplete && (
          <>
            {duplicateMatches.length === 0 ? (
              <div className="bg-green-50 p-6 rounded-lg mb-6">
                <div className="text-green-800 text-center">
                  <div className="text-4xl mb-2">✅</div>
                  <h3 className="text-lg font-semibold mb-2">No Duplicates Found!</h3>
                  <p className="text-green-700 mb-4">
                    Your face does not match any existing users in our database. 
                    You can proceed with profile creation.
                  </p>
                </div>
                
                {/* Detailed analysis results */}
                <div className="bg-white p-4 rounded-lg mt-4 text-left">
                  <h4 className="font-semibold text-gray-900 mb-3">📊 Analysis Results:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Users Checked:</span>
                        <span className="font-medium">{databaseUsers.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Users with Face Data:</span>
                        <span className="font-medium">{databaseUsers.filter(u => u.face_descriptors).length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Your Face Quality:</span>
                        <span className={`font-medium ${
                          (state.faceData?.quality || 0) > 85 ? 'text-green-600' : 
                          (state.faceData?.quality || 0) > 70 ? 'text-yellow-600' : 'text-red-600'
                        }`}>{state.faceData?.quality}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Detection Confidence:</span>
                        <span className={`font-medium ${
                          (state.faceData?.confidence || 0) > 85 ? 'text-green-600' : 
                          (state.faceData?.confidence || 0) > 70 ? 'text-yellow-600' : 'text-red-600'
                        }`}>{state.faceData?.confidence}%</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Highest Similarity:</span>
                        <span className="font-medium">
                          {databaseUsers.filter(u => u.face_descriptors).length > 0 ? 
                            Math.max(...databaseUsers
                              .filter(u => u.face_descriptors && u.face_descriptors.face_descriptor)
                              .map(user => {
                                try {
                                  const storedDescriptor = new Float32Array(user.face_descriptors.face_descriptor);
                                  return calculateSimilarity(state.faceData?.descriptor || new Float32Array(), storedDescriptor);
                                } catch {
                                  return 0;
                                }
                              })
                            ).toFixed(1) + '%' : 'N/A'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Display Threshold:</span>
                        <span className="font-medium">70%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Descriptor Length:</span>
                        <span className="font-medium">{state.faceData?.descriptor?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Algorithm:</span>
                        <span className="font-medium text-xs">Cosine Similarity</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Show top similar users (even below threshold) */}
                {databaseUsers.filter(u => u.face_descriptors).length > 0 && (
                  <div className="bg-white p-4 rounded-lg mt-4 text-left">
                    <h4 className="font-semibold text-gray-900 mb-3">🔍 Closest Matches (Below Threshold):</h4>
                    <div className="space-y-2">
                      {databaseUsers
                        .filter(u => u.face_descriptors && u.face_descriptors.face_descriptor)
                        .map(user => {
                          try {
                            const storedDescriptor = new Float32Array(user.face_descriptors.face_descriptor);
                            const similarity = calculateSimilarity(state.faceData?.descriptor || new Float32Array(), storedDescriptor);
                            return { user, similarity };
                          } catch {
                            return { user, similarity: 0 };
                          }
                        })
                        .sort((a, b) => b.similarity - a.similarity)
                        .slice(0, 3) // Show top 3 closest matches
                        .map((match) => (
                          <div key={match.user.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-700">
                                {match.user.first_name} {match.user.last_name}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">({match.user.user_type})</span>
                            </div>
                            <div className="text-right">
                              <span className={`text-sm font-medium ${
                                match.similarity > 40 ? 'text-yellow-600' : 
                                match.similarity > 20 ? 'text-blue-600' : 'text-gray-500'
                              }`}>
                                {match.similarity.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      * Only showing similarities above 70% (filtering out low matches)
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-yellow-50 p-6 rounded-lg mb-6">
                <div className="text-yellow-800 text-center mb-4">
                  <div className="text-4xl mb-2">⚠️</div>
                  <h3 className="text-lg font-semibold mb-2">Potential Matches Found</h3>
                  <p className="text-yellow-700 mb-4">
                    We found {duplicateMatches.length} user{duplicateMatches.length > 1 ? 's' : ''} with similarity above 70%.
                    Please review the profile photos and confirm your decision.
                  </p>
                </div>

                {/* Show duplicate matches with enhanced profile photos */}
                <div className="space-y-4 text-left">
                  {duplicateMatches.map((match) => (
                    <div key={match.user.id} className="bg-white p-6 rounded-lg border border-yellow-200 shadow-sm">
                      <div className="flex items-start space-x-4">
                        {/* Profile Photo Section */}
                        <div className="flex-shrink-0">
                          {match.user.profile_photo_url ? (
                            <div className="relative">
                              <img 
                                src={match.user.profile_photo_url} 
                                alt={`${match.user.first_name} ${match.user.last_name}`}
                                className="w-20 h-20 rounded-full object-cover border-2 border-gray-300 shadow-md"
                                onError={(e) => {
                                  console.log('❌ Failed to load image:', match.user.profile_photo_url);
                                  const target = e.target as HTMLImageElement;
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div class="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg border-2 border-gray-300 shadow-md">
                                        ${(match.user.first_name?.[0] || '?').toUpperCase()}${(match.user.last_name?.[0] || '').toUpperCase()}
                                      </div>
                                      <div class="absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold text-white ${
                                        match.similarity > 70 ? 'bg-red-500' : 
                                        match.similarity > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                      }">
                                        ${match.similarity.toFixed(0)}%
                                      </div>
                                    `;
                                  }
                                }}
                              />
                              {/* Similarity Badge */}
                              <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold text-white ${
                                match.similarity > 70 ? 'bg-red-500' : 
                                match.similarity > 50 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}>
                                {match.similarity.toFixed(0)}%
                              </div>
                            </div>
                          ) : (
                            <div className="relative">
                              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold text-lg border-2 border-gray-300 shadow-md">
                                {(match.user.first_name?.[0] || '?').toUpperCase()}{(match.user.last_name?.[0] || '').toUpperCase()}
                              </div>
                              {/* Similarity Badge */}
                              <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold text-white ${
                                match.similarity > 70 ? 'bg-red-500' : 
                                match.similarity > 50 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}>
                                {match.similarity.toFixed(0)}%
                              </div>
                            </div>
                          )}
                        </div>

                        {/* User Information */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-900 mb-1">
                                {match.user.first_name} {match.user.last_name}
                              </h4>
                              <p className="text-sm text-gray-600 mb-1">{match.user.email}</p>
                              <div className="flex items-center space-x-3 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  match.user.user_type === 'internal' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {match.user.user_type}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  match.user.status === 'active' ? 'bg-green-100 text-green-800' : 
                                  match.user.status === 'invited' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {match.user.status}
                                </span>
                              </div>
                              
                              {/* Additional User Details */}
                              <div className="mt-3 text-xs text-gray-500">
                                <p>Created: {new Date(match.user.created_at).toLocaleDateString()}</p>
                                <p>ID: {match.user.id.slice(0, 8)}...</p>
                              </div>
                            </div>

                            {/* Similarity Score Display - High similarity colors */}
                            <div className="text-right ml-4">
                              <div className={`text-2xl font-bold mb-1 ${
                                match.similarity > 85 ? 'text-red-600' : 
                                match.similarity > 75 ? 'text-orange-600' : 'text-yellow-600'
                              }`}>
                                {match.similarity.toFixed(1)}%
                              </div>
                              <div className="text-xs text-gray-500">similarity</div>
                              
                              {/* Risk Level Indicator - CORRECTED: High similarity = Low risk */}
                              <div className={`mt-2 px-2 py-1 rounded text-xs font-medium ${
                                match.similarity > 85 ? 'bg-red-100 text-red-700' : 
                                match.similarity > 75 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {match.similarity > 85 ? 'VERY HIGH SIMILARITY' : 
                                 match.similarity > 75 ? 'HIGH SIMILARITY' : 'MODERATE SIMILARITY'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Face Comparison Visualization */}
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Face Comparison Details:</span>
                          <span className="font-medium">Algorithm: Euclidean Distance</span>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              match.similarity > 85 ? 'bg-red-500' : 
                              match.similarity > 75 ? 'bg-orange-500' : 'bg-yellow-500'
                            }`}
                            style={{ width: `${Math.max(5, match.similarity)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* User decision */}
                <div className="mt-6 space-y-4">
                  <h4 className="font-semibold text-gray-900">What would you like to do?</h4>
                  
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="action"
                        value="proceed"
                        checked={selectedAction === 'proceed'}
                        onChange={(e) => setSelectedAction(e.target.value as 'proceed')}
                        className="text-blue-600"
                      />
                      <span className="text-sm">
                        <strong>Proceed anyway</strong> - I am a different person, create new profile
                      </span>
                    </label>
                    
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="action"
                        value="cancel"
                        checked={selectedAction === 'cancel'}
                        onChange={(e) => setSelectedAction(e.target.value as 'cancel')}
                        className="text-blue-600"
                      />
                      <span className="text-sm">
                        <strong>Cancel registration</strong> - This might be my existing account
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Action buttons */}
        <div className="flex space-x-4 justify-center">
          <button
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>
          
          {duplicateMatches.length === 0 ? (
            <button
              onClick={handleContinue}
              disabled={!searchComplete}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Continue - No Duplicates
            </button>
          ) : (
            <button
              onClick={handleContinue}
              disabled={!selectedAction}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selectedAction === 'proceed' ? 'Create New Profile' : 
               selectedAction === 'cancel' ? 'Cancel Registration' : 'Make Selection'}
            </button>
          )}
        </div>

        {/* Debug info for development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 bg-gray-100 p-4 rounded-lg text-left text-xs">
            <h4 className="font-semibold mb-2">Debug Information:</h4>
            <div className="space-y-1">
              <p>Face descriptor length: {state.faceData?.descriptor?.length || 'N/A'}</p>
              <p>Database users total: {databaseUsers.length}</p>
              <p>Users with face data: {databaseUsers.filter(u => u.face_descriptors).length}</p>
              <p>Matches found: {duplicateMatches.length}</p>
              <p>Search completed: {searchComplete ? 'Yes' : 'No'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
