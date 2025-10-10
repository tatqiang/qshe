import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';

// MediaPipe Tasks Face Recognition Service (2024+)
// Simplified version using face detection with custom embedding generation

export interface MediaPipeFaceDescriptor {
  landmarks: number[][];     // Face landmark coordinates
  boundingBox: {
    x: number;
    y: number;
    width: number; 
    height: number;
  };
  confidence: number;  // Real confidence score 0-1
  keypoints: { x: number; y: number }[];
}

export interface MediaPipeFaceRecognitionResult {
  detected: boolean;
  faces: MediaPipeFaceDescriptor[];
  quality: {
    overall: number;    // 0-1 score (vs 'good'/'poor' strings)
    lighting: number;   // 0-1 score  
    angle: number;      // 0-1 score
    clarity: number;    // 0-1 score
  };
  processingTime: number;
  confidence: number; // Best face confidence
}

class MediaPipeTasksFaceRecognition {
  private faceDetector: FaceDetector | null = null;
  private wasmFileset: any = null;
  private isInitialized = false;
  private isInitializing = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.isInitializing) {
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    try {
      this.isInitializing = true;
      
      console.log('🔄 Initializing MediaPipe Tasks...');
      
      // Initialize WebAssembly fileset with proper configuration
      this.wasmFileset = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      console.log('✅ WASM fileset loaded');

      // Create face detector with simpler configuration to avoid WASM issues
      this.faceDetector = await FaceDetector.createFromOptions(this.wasmFileset, {
        baseOptions: {
          // Use a more compatible model URL
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite'
        },
        runningMode: 'IMAGE',
        minDetectionConfidence: 0.5,
        minSuppressionThreshold: 0.3
      });

      this.isInitialized = true;
      console.log('✅ MediaPipe Tasks initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize MediaPipe Tasks:', error);
      
      // More specific error handling for WASM issues
      if (error.message?.includes('abort') || error.message?.includes('Module.arguments')) {
        console.warn('⚠️ MediaPipe Tasks WASM initialization failed - this is a known issue in some browser environments');
        throw new Error('MediaPipe Tasks unavailable in this browser environment');
      }
      
      throw new Error(`MediaPipe Tasks initialization failed: ${error}`);
    } finally {
      this.isInitializing = false;
    }
  }

  async detectFaces(
    input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
  ): Promise<MediaPipeFaceRecognitionResult> {
    if (!this.isInitialized || !this.faceDetector) {
      throw new Error('MediaPipe Tasks not initialized. Call initialize() first.');
    }

    const startTime = performance.now();

    try {
      console.log('🔍 Detecting faces with MediaPipe Tasks...');
      
      // Detect faces
      const detectionResult = this.faceDetector.detect(input);
      
      if (!detectionResult.detections || detectionResult.detections.length === 0) {
        return {
          detected: false,
          faces: [],
          quality: { overall: 0, lighting: 0, angle: 0, clarity: 0 },
          processingTime: performance.now() - startTime,
          confidence: 0
        };
      }

      console.log(`✅ Found ${detectionResult.detections.length} faces with MediaPipe Tasks`);

      // Process each detected face
      const faces: MediaPipeFaceDescriptor[] = [];
      let bestConfidence = 0;
      
      for (const detection of detectionResult.detections) {
        if (!detection.boundingBox) continue;
        
        // Extract confidence score
        const confidence = detection.categories?.[0]?.score || 0.8;
        bestConfidence = Math.max(bestConfidence, confidence);

        // Convert keypoints to landmarks format
        const landmarks: number[][] = [];
        const keypoints: { x: number; y: number }[] = [];
        
        if (detection.keypoints) {
          for (const kp of detection.keypoints) {
            landmarks.push([kp.x, kp.y]);
            keypoints.push({ x: kp.x, y: kp.y });
          }
        }

        faces.push({
          landmarks,
          boundingBox: {
            x: detection.boundingBox.originX,
            y: detection.boundingBox.originY,
            width: detection.boundingBox.width,
            height: detection.boundingBox.height
          },
          confidence,
          keypoints
        });
      }

      // Analyze quality
      const quality = this.analyzeQuality(faces, input);
      const processingTime = performance.now() - startTime;

      console.log(`🎯 MediaPipe processing complete: ${processingTime.toFixed(1)}ms, confidence: ${bestConfidence.toFixed(2)}`);

      return {
        detected: faces.length > 0,
        faces,
        quality,
        processingTime,
        confidence: bestConfidence
      };

    } catch (error) {
      console.error('❌ MediaPipe face detection error:', error);
      throw new Error(`Face detection failed: ${error}`);
    }
  }

  private analyzeQuality(
    faces: MediaPipeFaceDescriptor[],
    input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
  ): { overall: number; lighting: number; angle: number; clarity: number } {
    if (faces.length === 0) {
      return { overall: 0, lighting: 0, angle: 0, clarity: 0 };
    }

    const face = faces[0];
    const imageWidth = input.width || (input as HTMLVideoElement).videoWidth || 640;
    const imageHeight = input.height || (input as HTMLVideoElement).videoHeight || 480;

    // Size-based clarity (0-1)
    const faceArea = face.boundingBox.width * face.boundingBox.height;
    const imageArea = imageWidth * imageHeight;
    const faceRatio = faceArea / imageArea;
    const clarityScore = Math.min(1, faceRatio * 20); // Good if face is 5%+ of image

    // Confidence as lighting indicator (0-1)
    const lightingScore = face.confidence;

    // Center position as angle indicator (0-1)
    const faceCenterX = face.boundingBox.x + face.boundingBox.width / 2;
    const faceCenterY = face.boundingBox.y + face.boundingBox.height / 2;
    const imageCenterX = imageWidth / 2;
    const imageCenterY = imageHeight / 2;
    
    const centerDistance = Math.sqrt(
      Math.pow(faceCenterX - imageCenterX, 2) + Math.pow(faceCenterY - imageCenterY, 2)
    );
    const maxDistance = Math.sqrt(Math.pow(imageWidth / 2, 2) + Math.pow(imageHeight / 2, 2));
    const angleScore = Math.max(0, 1 - (centerDistance / maxDistance * 2));

    // Overall quality (weighted average)
    const overallScore = (clarityScore * 0.4 + lightingScore * 0.4 + angleScore * 0.2);

    return {
      overall: overallScore,
      lighting: lightingScore,
      angle: angleScore,
      clarity: clarityScore
    };
  }

  // Generate face descriptor (improved version vs TensorFlow.js)
  generateFaceDescriptor(face: MediaPipeFaceDescriptor): Float32Array {
    // Normalize landmarks and add geometric features (similar to improved TensorFlow version)
    const normalizedLandmarks: number[] = [];
    const { x: boxX, y: boxY, width: boxW, height: boxH } = face.boundingBox;
    
    for (const [x, y] of face.landmarks) {
      // Normalize coordinates relative to face bounding box
      normalizedLandmarks.push((x - boxX) / boxW);
      normalizedLandmarks.push((y - boxY) / boxH);
    }
    
    // Add geometric features
    const geometricFeatures = [
      boxW / boxH, // Face aspect ratio
      face.confidence, // Detection confidence
      face.landmarks.length / 100 // Landmark density
    ];
    
    return new Float32Array([...normalizedLandmarks, ...geometricFeatures]);
  }

  // Compare face descriptors using cosine similarity
  compareFaceDescriptors(descriptor1: Float32Array, descriptor2: Float32Array): number {
    if (descriptor1.length !== descriptor2.length) {
      console.warn('Face descriptors have different lengths');
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < descriptor1.length; i++) {
      dotProduct += descriptor1[i] * descriptor2[i];
      norm1 += descriptor1[i] * descriptor1[i];
      norm2 += descriptor2[i] * descriptor2[i];
    }

    if (norm1 === 0 || norm2 === 0) return 0;

    // Cosine similarity (-1 to 1, convert to 0-1)
    const cosineSimilarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    return Math.max(0, (cosineSimilarity + 1) / 2);
  }

  // Clean up resources
  dispose(): void {
    if (this.faceDetector) {
      this.faceDetector.close();
      this.faceDetector = null;
    }
    this.isInitialized = false;
  }
}

// Singleton instance
export const mediaPipeTasksFaceRecognition = new MediaPipeTasksFaceRecognition();

// Utility functions
export const initializeMediaPipeFaceRecognition = async (): Promise<void> => {
  await mediaPipeTasksFaceRecognition.initialize();
};

export const detectFacesWithMediaPipe = async (
  input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<MediaPipeFaceRecognitionResult> => {
  return await mediaPipeTasksFaceRecognition.detectFaces(input);
};

export const generateMediaPipeFaceDescriptor = (face: MediaPipeFaceDescriptor): Float32Array => {
  return mediaPipeTasksFaceRecognition.generateFaceDescriptor(face);
};

export const compareMediaPipeFaces = (descriptor1: Float32Array, descriptor2: Float32Array): number => {
  return mediaPipeTasksFaceRecognition.compareFaceDescriptors(descriptor1, descriptor2);
};
