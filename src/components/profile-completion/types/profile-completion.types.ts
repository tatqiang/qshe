// TypeScript interfaces for new profile completion wizard

export interface TokenData {
  id: string;
  email: string;
  username: string;
  userType: 'internal' | 'external'; // Removed 'worker' - now only organizational types
  role: string;
  firstName: string;
  lastName: string;
  firstNameThai?: string; // Added Thai first name
  lastNameThai?: string; // Added Thai last name
  nationality?: string; // Added nationality
  positionId?: string;
  positionTitle: string;
  companyId?: string;
  companyName?: string; // Added company name for display
  status: 'pending' | 'invited';
  timestamp: number;
  
  // NEW: Current database status (added during validation)
  currentStatus?: 'invited' | 'active' | 'inactive';
  profileCompleted?: boolean;
  hasFaceData?: boolean;
}

// NEW: User data for edit mode (loaded from database)
export interface EditUserData {
  id: string;
  email: string;
  username: string;
  userType: 'internal' | 'external'; // Removed 'worker' - now only organizational types
  role: string;
  firstName: string;
  lastName: string;
  firstNameThai?: string; // Added Thai first name
  lastNameThai?: string; // Added Thai last name
  nationality?: string; // Added nationality
  positionId?: string;
  positionTitle: string;
  companyId?: string;
  companyName?: string; // Added company name for display
  status: 'active' | 'invited' | 'inactive';
  profile_photo_url?: string;
  face_descriptors?: any;  // Only face descriptors - no photo URLs needed
  profile_completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileCompletionState {
  // Mode and token validation
  mode: 'completion' | 'edit'; // NEW: Support both modes
  token: string | null;
  tokenValid: boolean;
  tokenValidating: boolean;
  
  // User data from token OR direct user data for edit mode
  userData: TokenData | EditUserData | null;
  
  // Wizard state
  currentStep: number; // 1 = password, 2 = photo, 3 = face, 4 = duplicates, 5 = complete
  
  // Form data
  passwordData: {
    firstName: string;
    lastName: string;
    firstNameThai?: string;
    lastNameThai?: string;
    nationality?: string;
    positionId?: string;
    companyId?: string;
    password: string;
    confirmPassword: string;
  } | null;
  
  // Photo data
  photoData: {
    file: File | null;
    preview: string | null;
    processed: boolean;
  } | null;
  
  // Face recognition data
  faceData: {
    descriptor: Float32Array | null;
    confidence: number;
    quality: number;
    landmarks: any[];
    detected: boolean;
    photoUrl?: string; // Captured face photo
    faceRecognitionSkipped?: boolean; // Flag to indicate user skipped face recognition
  } | null;
  
  // Duplicate detection
  duplicateCheck: {
    matches: DuplicateUser[];
    confirmed: boolean;
    selectedAction: 'proceed' | 'cancel' | null;
  } | null;
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
  
  // For localStorage persistence
  lastSaved?: number; // Timestamp of last save
}

export interface DuplicateUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePhotoUrl: string | null;
  similarity: number; // 0-100 percentage
  role?: string;
  department?: string;
}

export interface FaceRecognitionResult {
  detected: boolean;
  confidence: number;
  quality: number;
  landmarks: any[];
  descriptor: Float32Array | null;
  photoUrl?: string; // Captured face photo
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
  score: number; // 0-100
}

export interface StepProps {
  state: ProfileCompletionState;
  onNext: (data?: any) => void;
  onBack?: () => void;
  onError: (error: string) => void;
  mode?: 'completion' | 'edit'; // Optional mode prop for steps
  hideTitle?: boolean; // Optional prop to hide step title (for modal usage)
}

export interface WizardStep {
  id: number;
  title: string;
  description: string;
  component: React.ComponentType<StepProps>;
  isComplete: boolean;
  isActive: boolean;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ProfileCompletionRequest {
  userId: string;
  password: string;
  profilePhoto?: File;
  faceDescriptor?: Float32Array;
  duplicateConfirmed?: boolean;
}

export interface ProfileCompletionResponse {
  success: boolean;
  userId: string;
  message: string;
}
