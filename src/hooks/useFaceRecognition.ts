
//src/hooks/useFaceRecognition.ts

import { useState, useCallback } from 'react';
import { supabase } from '../lib/api/supabase';

export interface FaceRecognitionData {
  imageDataUrl: string;
  faceDescriptor: Float32Array;
  detectionResult: {
    detected: boolean;
    confidence: number;
    qualityScore: number;
    landmarks: number;
    faces: any[];
  };
  quality: {
    overall: 'good' | 'fair' | 'poor';
  };
}

export interface UseFaceRecognitionReturn {
  faceData: FaceRecognitionData | null;
  storeFaceData: (imageDataUrl: string, detectionResult?: any) => void;
  clearFaceData: () => void;
  compareFaces: (descriptor1: Float32Array, descriptor2: Float32Array) => number;
  isValidFaceData: boolean;
  saveFaceToDatabase: (userId: string) => Promise<{ success: boolean; error?: string }>; // Removed photoUrl parameter
  loadFaceFromDatabase: (userId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  getUserFaceSummary: () => Promise<any>;
  authenticateWithFace: (inputDescriptor: Float32Array) => Promise<{ success: boolean; error?: string }>;
}

export const useFaceRecognition = (): UseFaceRecognitionReturn => {
  const [faceData, setFaceData] = useState<FaceRecognitionData | null>(null);

  const storeFaceData = useCallback((imageDataUrl: string, detectionResult?: any) => {
    console.log('📥 Storing face data with face-api.js result:', {
      hasImage: !!imageDataUrl,
      hasDetection: !!detectionResult,
      detected: detectionResult?.detected,
      confidence: detectionResult?.confidence,
      landmarks: detectionResult?.landmarks,
      hasDescriptor: !!detectionResult?.faceDescriptor
    });

    if (!detectionResult || !detectionResult.detected) {
      console.warn('⚠️ No face detection result provided');
      return;
    }

    const qualityOverall = detectionResult.qualityScore >= 85 ? 'good' : 
                          detectionResult.qualityScore >= 70 ? 'fair' : 'poor';

    const faceRecognitionData: FaceRecognitionData = {
      imageDataUrl,
      faceDescriptor: detectionResult.faceDescriptor,
      detectionResult: {
        detected: detectionResult.detected,
        confidence: detectionResult.confidence,
        qualityScore: detectionResult.qualityScore,
        landmarks: detectionResult.landmarks,
        faces: detectionResult.faces || []
      },
      quality: {
        overall: qualityOverall
      }
    };

    setFaceData(faceRecognitionData);
    console.log('✅ Face data stored successfully');
  }, []);

  const clearFaceData = useCallback(() => {
    setFaceData(null);
    console.log('🗑️ Face data cleared');
  }, []);

  const compareFaces = useCallback((descriptor1: Float32Array, descriptor2: Float32Array): number => {
    if (!descriptor1 || !descriptor2) {
      return 0;
    }

    if (descriptor1.length !== descriptor2.length) {
      console.warn('Face descriptors have different lengths');
      return 0;
    }

    // Calculate Euclidean distance between face descriptors
    let sum = 0;
    for (let i = 0; i < descriptor1.length; i++) {
      const diff = descriptor1[i] - descriptor2[i];
      sum += diff * diff;
    }
    const distance = Math.sqrt(sum);
    
    // face-api.js descriptors typically have distances between 0.4-1.2
    // Distance < 0.6 = very similar (80-100%)
    // Distance 0.6-0.8 = somewhat similar (40-80%)  
    // Distance > 0.8 = different (0-40%)
    
    const similarity = Math.max(0, Math.min(100, (1 - Math.min(distance, 1.2)) * 100));
    
    console.log('🔍 Face comparison:', {
      distance: distance.toFixed(3),
      similarity: similarity.toFixed(1) + '%',
      threshold: 'Similar if > 60%'
    });
    
    return Math.round(similarity * 100) / 100; // Round to 2 decimal places
  }, []);

  const saveFaceToDatabase = useCallback(async (userId: string) => {
    if (!faceData?.faceDescriptor) {
      return { success: false, error: 'No face data to save' };
    }

    try {
      console.log('💾 Saving face descriptors to database for user (no photo):', userId);
      
      // Convert Float32Array to regular array for JSON storage
      const descriptorArray = Array.from(faceData.faceDescriptor);
      
      const { error } = await (supabase
        .from('users') as any)
        .update({
          face_descriptors: {
            descriptor: descriptorArray,
            confidence: faceData.detectionResult.confidence,
            quality: faceData.quality.overall,
            landmarks: faceData.detectionResult.landmarks,
            created_at: new Date().toISOString()
          }
          // No face_photo_url field - we don't store face photos anymore
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Database save error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Face descriptors saved to database (no photo stored)');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Face save error:', error);
      return { success: false, error: error.message };
    }
  }, [faceData]);

  const loadFaceFromDatabase = useCallback(async (userId: string) => {
    try {
      const { data, error } = await (supabase
        .from('users') as any)
        .select('face_descriptors, face_photo_url')
        .eq('id', userId)
        .single();

      if (error || !data?.face_descriptors) {
        return { success: false, error: error?.message || 'No face data found' };
      }

      return { success: true, data: data.face_descriptors };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const getUserFaceSummary = useCallback(async () => {
    if (!faceData) return null;
    
    return {
      hasValidData: !!faceData.faceDescriptor,
      confidence: faceData.detectionResult.confidence,
      quality: faceData.quality.overall,
      landmarks: faceData.detectionResult.landmarks
    };
  }, [faceData]);

  const authenticateWithFace = useCallback(async (inputDescriptor: Float32Array) => {
    if (!faceData?.faceDescriptor) {
      return { success: false, error: 'No stored face data for comparison' };
    }

    const similarity = compareFaces(faceData.faceDescriptor, inputDescriptor);
    const threshold = 70; // 70% similarity threshold
    
    if (similarity >= threshold) {
      return { success: true };
    } else {
      return { success: false, error: `Face match failed (${similarity}% similarity, need ${threshold}%)` };
    }
  }, [faceData, compareFaces]);

  const isValidFaceData = !!(faceData?.faceDescriptor && faceData.detectionResult.detected);

  return {
    faceData,
    storeFaceData,
    clearFaceData,
    compareFaces,
    isValidFaceData,
    saveFaceToDatabase,
    loadFaceFromDatabase,
    getUserFaceSummary,
    authenticateWithFace,
  };
};