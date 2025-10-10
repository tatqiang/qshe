import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types';

// Extend Window interface for our custom error property
declare global {
  interface Window {
    __SUPABASE_CONFIG_ERROR__?: string;
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Better error handling for missing environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = 'Supabase configuration missing';
  console.error('❌ ' + errorMessage + ':', {
    url: supabaseUrl ? '✅ Present' : '❌ Missing',
    key: supabaseAnonKey ? '✅ Present' : '❌ Missing',
    environment: import.meta.env.MODE,
    allEnvVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
  });
  
  // For iOS Safari, avoid throwing errors that can cause blank pages
  // Instead, create a mock client that will handle errors gracefully
  if (typeof window !== 'undefined') {
    window.__SUPABASE_CONFIG_ERROR__ = errorMessage;
  }
  
  // Don't throw immediately - let the app load and show error in UI
  console.warn('⚠️ Creating mock Supabase client due to missing config');
}

// Validate URL format only if URL exists
if (supabaseUrl) {
  try {
    new URL(supabaseUrl);
  } catch (error) {
    console.error('❌ Invalid Supabase URL format:', supabaseUrl);
    if (typeof window !== 'undefined') {
      window.__SUPABASE_CONFIG_ERROR__ = `Invalid Supabase URL format: ${supabaseUrl}`;
    }
  }
}

// Create client with fallback values to prevent crashes
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
