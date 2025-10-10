// Type declarations for modules that might not have proper types

// Override Supabase types to be more permissive
declare global {
  namespace Supabase {
    interface Database {
      public: {
        Tables: {
          [key: string]: {
            Row: any;
            Insert: any;
            Update: any;
          };
        };
        Functions: {
          [key: string]: {
            Args: any;
            Returns: any;
          };
        };
      };
    }
  }
}

declare module 'face-api.js' {
  export const nets: any;
  export const detectAllFaces: any;
  export const detectSingleFace: any;
  export const TinyFaceDetectorOptions: any;
  export const FaceLandmarks68Net: any;
  export const FaceRecognitionNet: any;
  export const loadTinyFaceDetectorModel: any;
  export const loadFaceLandmarkModel: any;
  export const loadFaceRecognitionModel: any;
  export const resizeResults: any;
  export const draw: any;
  export default any;
}

// Global type augmentations for better compatibility
declare global {
  interface Window {
    // Add any global properties if needed
  }
}

export {};
