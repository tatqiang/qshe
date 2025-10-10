// Enhanced Session Manager for Persistent Authentication
// Handles automatic login persistence, session expiry, and secure storage

import type { AuthUser } from '../../types';

interface SessionData {
  user: AuthUser;
  timestamp: number;
  expiresAt: number;
  lastActivity: number;
}

class SessionManager {
  private static instance: SessionManager;
  private readonly SESSION_KEY = 'qshe_auth_session';
  private readonly MAX_SESSION_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days
  private readonly ACTIVITY_TIMEOUT = 7 * 24 * 60 * 60 * 1000; // 7 days of inactivity
  private activityTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.setupActivityTracking();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Save user session to localStorage with expiry
   */
  public saveSession(user: AuthUser): void {
    try {
      const now = Date.now();
      const sessionData: SessionData = {
        user,
        timestamp: now,
        expiresAt: now + this.MAX_SESSION_AGE,
        lastActivity: now
      };

      localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
      this.updateLastActivity();
      
      console.log('✅ SessionManager: Session saved', {
        userId: user.id,
        email: user.email,
        expiresIn: Math.round(this.MAX_SESSION_AGE / (24 * 60 * 60 * 1000)) + ' days'
      });
    } catch (error) {
      console.error('❌ SessionManager: Failed to save session:', error);
    }
  }

  /**
   * Restore session from localStorage if valid
   */
  public restoreSession(): AuthUser | null {
    try {
      const stored = localStorage.getItem(this.SESSION_KEY);
      if (!stored) {
        console.log('🔍 SessionManager: No stored session found');
        return null;
      }

      const sessionData: SessionData = JSON.parse(stored);
      const now = Date.now();

      // Check if session has expired
      if (now > sessionData.expiresAt) {
        console.log('⏰ SessionManager: Session expired, clearing...');
        this.clearSession();
        return null;
      }

      // Check for inactivity timeout
      if (now - sessionData.lastActivity > this.ACTIVITY_TIMEOUT) {
        console.log('💤 SessionManager: Session inactive too long, clearing...');
        this.clearSession();
        return null;
      }

      // Update last activity
      this.updateLastActivity();

      const daysRemaining = Math.ceil((sessionData.expiresAt - now) / (24 * 60 * 60 * 1000));
      console.log('✅ SessionManager: Session restored', {
        userId: sessionData.user.id,
        email: sessionData.user.email,
        daysRemaining
      });

      return sessionData.user;
    } catch (error) {
      console.error('❌ SessionManager: Failed to restore session:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Update last activity timestamp
   */
  public updateLastActivity(): void {
    try {
      const stored = localStorage.getItem(this.SESSION_KEY);
      if (stored) {
        const sessionData: SessionData = JSON.parse(stored);
        sessionData.lastActivity = Date.now();
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
      }
    } catch (error) {
      console.warn('⚠️ SessionManager: Failed to update activity:', error);
    }
  }

  /**
   * Clear session data
   */
  public clearSession(): void {
    try {
      localStorage.removeItem(this.SESSION_KEY);
      console.log('🗑️ SessionManager: Session cleared');
    } catch (error) {
      console.error('❌ SessionManager: Failed to clear session:', error);
    }
  }

  /**
   * Check if session exists and is valid
   */
  public hasValidSession(): boolean {
    return this.restoreSession() !== null;
  }

  /**
   * Get session info for debugging
   */
  public getSessionInfo(): any {
    try {
      const stored = localStorage.getItem(this.SESSION_KEY);
      if (!stored) return null;

      const sessionData: SessionData = JSON.parse(stored);
      const now = Date.now();

      return {
        hasSession: true,
        userId: sessionData.user.id,
        email: sessionData.user.email,
        role: sessionData.user.role,
        createdAgo: Math.round((now - sessionData.timestamp) / (60 * 60 * 1000) * 10) / 10 + ' hours',
        expiresIn: Math.ceil((sessionData.expiresAt - now) / (24 * 60 * 60 * 1000)) + ' days',
        lastActivityAgo: Math.round((now - sessionData.lastActivity) / (60 * 60 * 1000) * 10) / 10 + ' hours',
        isExpired: now > sessionData.expiresAt,
        isInactive: now - sessionData.lastActivity > this.ACTIVITY_TIMEOUT
      };
    } catch (error) {
      return { hasSession: false, error: error.message };
    }
  }

  /**
   * Setup activity tracking to keep session alive
   */
  private setupActivityTracking(): void {
    if (typeof window === 'undefined') return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const updateActivity = () => {
      this.updateLastActivity();
      
      // Clear existing timer
      if (this.activityTimer) {
        clearTimeout(this.activityTimer);
      }
      
      // Set new timer to update activity every 5 minutes during active use
      this.activityTimer = setTimeout(() => {
        this.updateLastActivity();
      }, 5 * 60 * 1000);
    };

    // Add throttled event listeners
    let lastUpdate = 0;
    const throttledUpdate = () => {
      const now = Date.now();
      if (now - lastUpdate > 30000) { // Throttle to once every 30 seconds
        lastUpdate = now;
        updateActivity();
      }
    };

    events.forEach(event => {
      document.addEventListener(event, throttledUpdate, { passive: true });
    });

    // Update activity on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        updateActivity();
      }
    });
  }

  /**
   * Extend session expiry (for "Remember Me" functionality)
   */
  public extendSession(additionalDays: number = 30): void {
    try {
      const stored = localStorage.getItem(this.SESSION_KEY);
      if (stored) {
        const sessionData: SessionData = JSON.parse(stored);
        sessionData.expiresAt = Date.now() + (additionalDays * 24 * 60 * 60 * 1000);
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
        
        console.log(`✅ SessionManager: Session extended by ${additionalDays} days`);
      }
    } catch (error) {
      console.error('❌ SessionManager: Failed to extend session:', error);
    }
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();

// Export for debugging
(window as any).qsheSessionManager = sessionManager;