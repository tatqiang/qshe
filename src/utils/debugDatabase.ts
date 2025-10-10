import { supabase } from '../lib/api/supabase';

/**
 * Debug function to check users in the database
 * This can be called from browser console to troubleshoot login issues
 */
export async function debugUsers() {
  try {
    console.log('=== DEBUG: Checking all users in database ===');
    
    // Use (supabase as any) to bypass potential RLS issues during debugging
    const { data: allUsers, error } = await (supabase as any)
      .from('users')
      .select('id, email, status, role, first_name, last_name, created_at');
    
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    
    console.log('Total users found:', allUsers?.length || 0);
    console.table(allUsers || []);
    
    return allUsers;
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

/**
 * Debug function to check pre-registrations
 */
export async function debugPreRegistrations() {
  try {
    console.log('=== DEBUG: Checking all pre-registrations ===');
    
    // Use (supabase as any) to bypass potential RLS issues during debugging
    const { data: preRegs, error } = await (supabase as any)
      .from('pre_registrations')
      .select('id, email, status, created_at, registered_at, registered_user_id');
    
    if (error) {
      console.error('Error fetching pre-registrations:', error);
      return;
    }
    
    console.log('Total pre-registrations found:', preRegs?.length || 0);
    console.table(preRegs || []);
    
    return preRegs;
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Make functions available globally for console debugging
if (typeof window !== 'undefined') {
  (window as any).debugUsers = debugUsers;
  (window as any).debugPreRegistrations = debugPreRegistrations;
}
