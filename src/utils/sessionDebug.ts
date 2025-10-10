// Session Debug Utilities
// Helper functions to debug and manage persistent sessions

import { sessionManager } from '../lib/auth/sessionManager';

/**
 * Debug session status - call from browser console
 */
export const debugSession = () => {
  const info = sessionManager.getSessionInfo();
  
  console.log('=== QSHE Session Debug ===');
  console.log('Session Info:', info);
  
  if (info?.hasSession) {
    console.log('✅ Valid session found');
    console.log(`👤 User: ${info.email} (${info.role})`);
    console.log(`⏰ Created: ${info.createdAgo} ago`);
    console.log(`⏳ Expires: ${info.expiresIn}`);
    console.log(`🔄 Last activity: ${info.lastActivityAgo} ago`);
    
    if (info.isExpired) {
      console.log('❌ Session is EXPIRED');
    } else if (info.isInactive) {
      console.log('💤 Session is INACTIVE (too long without activity)');
    } else {
      console.log('✅ Session is ACTIVE');
    }
  } else {
    console.log('❌ No valid session found');
  }
  
  return info;
};

/**
 * Extend current session by additional days
 */
export const extendSession = (days: number = 30) => {
  sessionManager.extendSession(days);
  console.log(`🔄 Session extended by ${days} days`);
  return debugSession();
};

/**
 * Clear current session
 */
export const clearSession = () => {
  sessionManager.clearSession();
  console.log('🗑️ Session cleared');
  window.location.reload();
};

/**
 * Check if user should stay logged in
 */
export const shouldStayLoggedIn = (): boolean => {
  return sessionManager.hasValidSession();
};

// Attach to window for easy console access
if (typeof window !== 'undefined') {
  (window as any).qsheSession = {
    debug: debugSession,
    extend: extendSession,
    clear: clearSession,
    shouldStayLoggedIn
  };
  
  console.log('🔧 Session debug tools loaded. Use qsheSession.debug() in console.');
}

export { sessionManager };