import { useState } from 'react';
import { supabase } from '../lib/api/supabase';

interface RegistrationData {
  email: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: string;
}

export function useUserRegistration() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  const checkUserExists = async (email: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('users')
        .select('id, email')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      return data ? true : false;
    } catch (error) {
      console.error('Error checking user exists:', error);
      throw error;
    }
  };

  const registerUser = async (userData: RegistrationData, azureAccountId?: string) => {
    setIsRegistering(true);
    setRegistrationError(null);

    try {
      // Check if user already exists
      const userExists = await checkUserExists(userData.email);
      
      if (userExists) {
        throw new Error('User already registered with this email');
      }

      // Create new user record with proper schema
      const newUser = {
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        job_title: userData.jobTitle,
        department: userData.department,
        azure_user_id: azureAccountId,
        // Set registration defaults as requested
        user_type: 'internal',  // Default already set in DB
        status: 'active',       // Override default 'invited'
        role: 'member',         // Default already set in DB  
        position_id: null,      // Blank as requested
        registration_completed_at: new Date().toISOString(),
        profile_completed_at: new Date().toISOString()
      };

      const { data, error } = await (supabase as any)
        .from('users')
        .insert([newUser])
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('✅ User registered successfully:', data);
      return data;
    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      setRegistrationError(error.message || 'Registration failed');
      throw error;
    } finally {
      setIsRegistering(false);
    }
  };

  const updateUserLogin = async (userId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('users')
        .update({
          last_login: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.warn('Failed to update login info:', error);
      }
    } catch (error) {
      console.warn('Failed to update login info:', error);
    }
  };

  return {
    isRegistering,
    registrationError,
    checkUserExists,
    registerUser,
    updateUserLogin
  };
}