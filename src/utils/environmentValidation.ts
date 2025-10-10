/**
 * Environment Variables Validation for Production
 * Helps prevent blank pages due to missing environment variables
 */

interface EnvValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fallbackMode: boolean;
}

export const validateEnvironment = (): EnvValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];
  let isValid = true;
  let fallbackMode = false;

  // Check critical environment variables
  if (!import.meta.env.VITE_SUPABASE_URL) {
    errors.push('Missing VITE_SUPABASE_URL');
    isValid = false;
    fallbackMode = true;
  }

  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    errors.push('Missing VITE_SUPABASE_ANON_KEY');
    isValid = false;
    fallbackMode = true;
  }

  // Validate URL format if present
  if (import.meta.env.VITE_SUPABASE_URL) {
    try {
      new URL(import.meta.env.VITE_SUPABASE_URL);
    } catch {
      errors.push('Invalid VITE_SUPABASE_URL format');
      isValid = false;
      fallbackMode = true;
    }
  }

  // Check optional environment variables
  if (!import.meta.env.VITE_R2_ACCOUNT_ID) {
    warnings.push('Missing VITE_R2_ACCOUNT_ID - file uploads may not work');
  }

  return {
    isValid,
    errors,
    warnings,
    fallbackMode
  };
};

// Create a safer environment object with fallbacks
export const safeEnv = {
  get SUPABASE_URL() {
    return import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
  },
  get SUPABASE_ANON_KEY() {
    return import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';
  },
  get R2_ACCOUNT_ID() {
    return import.meta.env.VITE_R2_ACCOUNT_ID || '';
  },
  get MODE() {
    return import.meta.env.MODE || 'development';
  },
  get DEV() {
    return import.meta.env.DEV;
  },
  get PROD() {
    return import.meta.env.PROD;
  }
};

// Log environment status on initialization
const envValidation = validateEnvironment();
console.log('🔧 Environment Validation:', envValidation);

if (envValidation.fallbackMode) {
  console.warn('⚠️ Running in fallback mode due to missing environment variables');
  console.warn('📋 Required environment variables:');
  console.warn('  - VITE_SUPABASE_URL: Your Supabase project URL');
  console.warn('  - VITE_SUPABASE_ANON_KEY: Your Supabase anon key');
}

export default envValidation;