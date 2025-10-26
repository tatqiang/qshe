// Offline-First Face Recognition Service
// Handles face recognition with offline capabilities and performance optimization

export interface OfflineFaceRecognitionConfig {
  enableBackgroundCaching: boolean;
  maxCacheAge: number; // milliseconds
  fallbackToBasicDetection: boolean;
  progressiveLoading: boolean;
  mobileOptimized: boolean;
}

export interface FaceModelLoadStatus {
  tinyDetector: boolean;
  landmarks: boolean;
  recognition: boolean;
  expressions: boolean;
  ageGender: boolean;
  allLoaded: boolean;
  progress: number; // 0-100
}

export interface OfflineFaceRecognitionResult {
  success: boolean;
  detected: boolean;
  confidence: number;
  qualityScore: number;
  landmarks: number;
  faceDescriptor?: Float32Array;
  loadingTime: number;
  modelStatus: FaceModelLoadStatus;
  fromCache: boolean;
  error?: string;
}

class OfflineFaceRecognitionService {
  private static instance: OfflineFaceRecognitionService;
  private faceApiReady = false;
  private modelsLoaded: FaceModelLoadStatus = {
    tinyDetector: false,
    landmarks: false,
    recognition: false,
    expressions: false,
    ageGender: false,
    allLoaded: false,
    progress: 0
  };
  private config: OfflineFaceRecognitionConfig = {
    enableBackgroundCaching: true,
    maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    fallbackToBasicDetection: true,
    progressiveLoading: true,
    mobileOptimized: true
  };
  private serviceWorkerRegistered = false;
  private loadingPromise: Promise<void> | null = null;

  static getInstance(): OfflineFaceRecognitionService {
    if (!OfflineFaceRecognitionService.instance) {
      OfflineFaceRecognitionService.instance = new OfflineFaceRecognitionService();
    }
    return OfflineFaceRecognitionService.instance;
  }

  private constructor() {
    this.initializeServiceWorker();
  }

  /**
   * Initialize service worker for model caching
   */
  private async initializeServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/face-models-sw.js', {
        scope: '/'
      });

      console.log('✅ Face Models SW registered:', registration.scope);
      this.serviceWorkerRegistered = true;

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'MODELS_CACHED') {
          console.log('✅ Background model caching completed');
        }
      });

      // Start background caching if needed
      if (this.config.enableBackgroundCaching) {
        this.requestBackgroundCaching();
      }

    } catch (error) {
      console.warn('⚠️ Failed to register Face Models SW:', error);
    }
  }

  /**
   * Request background caching of models
   */
  private requestBackgroundCaching(): void {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_MODELS_BACKGROUND'
      });
    }
  }

  /**
   * Initialize face-api.js with progressive loading
   */
  async initializeFaceAPI(onProgress?: (progress: number) => void): Promise<boolean> {
    if (this.faceApiReady) {
      return true;
    }

    if (this.loadingPromise) {
      await this.loadingPromise;
      return this.faceApiReady;
    }

    this.loadingPromise = this.doInitializeFaceAPI(onProgress);
    await this.loadingPromise;
    this.loadingPromise = null;

    return this.faceApiReady;
  }

  private async doInitializeFaceAPI(onProgress?: (progress: number) => void): Promise<void> {
    const startTime = performance.now();

    try {
      console.log('🔄 Initializing offline face recognition...');

      // 1. Load face-api.js library
      await this.loadFaceAPILibrary();
      this.updateProgress(10, onProgress);

      if (!window.faceapi) {
        throw new Error('face-api.js failed to load');
      }

      // 2. Progressive model loading
      await this.loadModelsProgressively(onProgress);

      const loadTime = performance.now() - startTime;
      console.log(`✅ Face recognition initialized in ${Math.round(loadTime)}ms`);
      console.log('📊 Models loaded:', this.modelsLoaded);

      this.faceApiReady = true;

    } catch (error) {
      console.error('❌ Failed to initialize face recognition:', error);
      throw error;
    }
  }

  /**
   * Load face-api.js library (from cache or network)
   */
  private async loadFaceAPILibrary(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.faceapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
      script.onload = () => {
        console.log('✅ face-api.js library loaded');
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load face-api.js library'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Load models progressively for better UX
   */
  private async loadModelsProgressively(onProgress?: (progress: number) => void): Promise<void> {
    const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
    const faceapi = window.faceapi;

    // Progressive loading order (essential first)
    const modelLoadingSteps = [
      {
        name: 'tinyDetector',
        load: () => faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        progress: 30,
        essential: true
      },
      {
        name: 'landmarks',
        load: () => faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        progress: 60,
        essential: true
      },
      {
        name: 'recognition',
        load: () => faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        progress: 80,
        essential: true
      },
      {
        name: 'expressions',
        load: () => faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        progress: 90,
        essential: false
      },
      {
        name: 'ageGender',
        load: () => faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
        progress: 100,
        essential: false
      }
    ];

    // Load essential models first
    for (const step of modelLoadingSteps) {
      try {
        const startTime = performance.now();
        await step.load();
        const loadTime = performance.now() - startTime;

        (this.modelsLoaded as any)[step.name] = true;
        this.updateProgress(step.progress, onProgress);

        console.log(`✅ ${step.name} loaded in ${Math.round(loadTime)}ms`);

        // Allow basic face detection after essential models
        if (step.essential && this.modelsLoaded.tinyDetector && this.modelsLoaded.landmarks) {
          console.log('🚀 Basic face detection ready');
        }

      } catch (error) {
        console.warn(`⚠️ Failed to load ${step.name}:`, error);

        if (step.essential && !this.config.fallbackToBasicDetection) {
          throw new Error(`Essential model ${step.name} failed to load`);
        }
      }
    }

    this.modelsLoaded.allLoaded = this.modelsLoaded.tinyDetector && 
                                   this.modelsLoaded.landmarks && 
                                   this.modelsLoaded.recognition;
    this.modelsLoaded.progress = 100;
  }

  /**
   * Update loading progress
   */
  private updateProgress(progress: number, onProgress?: (progress: number) => void): void {
    this.modelsLoaded.progress = progress;
    onProgress?.(progress);
  }

  /**
   * Perform face recognition with offline fallback
   */
  async recognizeFace(
    videoElement: HTMLVideoElement,
    options: {
      includeDescriptor?: boolean;
      includeExpressions?: boolean;
      timeout?: number;
    } = {}
  ): Promise<OfflineFaceRecognitionResult> {
    const startTime = performance.now();
    const {
      includeDescriptor = true,
      includeExpressions = false,
      timeout = 5000
    } = options;

    try {
      if (!this.faceApiReady || !window.faceapi) {
        throw new Error('Face API not initialized');
      }

      if (!this.modelsLoaded.tinyDetector) {
        throw new Error('Essential models not loaded');
      }

      // Create detection chain based on available models
      let detection = window.faceapi
        .detectSingleFace(videoElement, new window.faceapi.TinyFaceDetectorOptions());

      // Add landmarks if available
      if (this.modelsLoaded.landmarks) {
        detection = detection.withFaceLandmarks();
      }

      // Add face descriptor if requested and available
      if (includeDescriptor && this.modelsLoaded.recognition) {
        detection = detection.withFaceDescriptor();
      }

      // Add expressions if requested and available
      if (includeExpressions && this.modelsLoaded.expressions) {
        detection = detection.withFaceExpressions();
      }

      // Execute detection with timeout
      const detectionPromise = detection;
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Detection timeout')), timeout);
      });

      const result = await Promise.race([detectionPromise, timeoutPromise]);
      const processingTime = performance.now() - startTime;

      if (result) {
        return {
          success: true,
          detected: true,
          confidence: Math.round(result.detection.score * 100),
          qualityScore: Math.min(100, Math.round(result.detection.score * 100)),
          landmarks: result.landmarks ? result.landmarks.positions.length : 0,
          faceDescriptor: result.descriptor,
          loadingTime: processingTime,
          modelStatus: { ...this.modelsLoaded },
          fromCache: this.serviceWorkerRegistered
        };
      } else {
        return {
          success: true,
          detected: false,
          confidence: 0,
          qualityScore: 0,
          landmarks: 0,
          loadingTime: processingTime,
          modelStatus: { ...this.modelsLoaded },
          fromCache: this.serviceWorkerRegistered
        };
      }

    } catch (error) {
      const processingTime = performance.now() - startTime;
      console.error('❌ Face recognition error:', error);

      return {
        success: false,
        detected: false,
        confidence: 0,
        qualityScore: 0,
        landmarks: 0,
        loadingTime: processingTime,
        modelStatus: { ...this.modelsLoaded },
        fromCache: this.serviceWorkerRegistered,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get cache status from service worker
   */
  async getCacheStatus(): Promise<any> {
    if (!this.serviceWorkerRegistered) {
      return { error: 'Service worker not available' };
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      navigator.serviceWorker.controller?.postMessage(
        { type: 'GET_CACHE_STATUS' },
        [messageChannel.port2]
      );

      // Timeout after 5 seconds
      setTimeout(() => {
        resolve({ error: 'Timeout getting cache status' });
      }, 5000);
    });
  }

  /**
   * Check if face recognition is ready for basic detection
   */
  isBasicDetectionReady(): boolean {
    return this.faceApiReady && 
           this.modelsLoaded.tinyDetector && 
           this.modelsLoaded.landmarks;
  }

  /**
   * Check if full face recognition is ready
   */
  isFullRecognitionReady(): boolean {
    return this.faceApiReady && 
           this.modelsLoaded.tinyDetector && 
           this.modelsLoaded.landmarks && 
           this.modelsLoaded.recognition;
  }

  /**
   * Get current model loading status
   */
  getModelStatus(): FaceModelLoadStatus {
    return { ...this.modelsLoaded };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<OfflineFaceRecognitionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clear all caches (for debugging)
   */
  async clearCaches(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const faceModelCaches = cacheNames.filter(name => 
        name.includes('face-models') || name.includes('qshe-face')
      );

      for (const cacheName of faceModelCaches) {
        await caches.delete(cacheName);
        console.log(`🗑️ Cleared cache: ${cacheName}`);
      }
    }
  }
}

// Export singleton instance
export const offlineFaceRecognition = OfflineFaceRecognitionService.getInstance();

// Export types
export { OfflineFaceRecognitionService };