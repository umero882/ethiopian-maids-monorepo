/**
 * Session Manager - Handles session persistence and automatic refresh
 * Prevents premature logouts and ensures continuous authentication
 *
 * UPDATED: Now uses Firebase Auth instead of Supabase Auth
 */

import { auth, getIdToken, refreshIdToken, FIREBASE_TOKEN_KEY } from './firebaseClient';
import { onIdTokenChanged } from 'firebase/auth';
import { createLogger } from '@/utils/logger';

const log = createLogger('SessionManager');

class SessionManager {
  constructor() {
    this.refreshInterval = null;
    this.lastActivityTime = Date.now();
    this.isRefreshing = false;
    this.sessionCheckInterval = 10 * 60 * 1000; // Check every 10 minutes (less aggressive)
    this.inactivityTimeout = 24 * 60 * 60 * 1000; // 24 hours of inactivity
    this.lastVisibilityCheck = 0;
    this.visibilityCheckDebounce = 3000; // 3 seconds debounce for visibility changes
    this.tokenUnsubscribe = null;
  }

  /**
   * Initialize session monitoring
   */
  initialize() {
    log.debug('Initializing session manager...');

    // Track user activity
    this.trackActivity();

    // Start periodic session refresh
    this.startSessionRefresh();

    // Listen for Firebase token changes
    this.setupFirebaseTokenListener();

    // Listen for visibility changes (tab becomes active) with debouncing
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Debounce visibility checks to prevent rapid-fire session checks
        const now = Date.now();
        if (now - this.lastVisibilityCheck > this.visibilityCheckDebounce) {
          this.lastVisibilityCheck = now;
          // Delay the check slightly to allow the page to stabilize
          setTimeout(() => this.checkAndRefreshSession(), 500);
        }
      }
    });

    // Listen for online/offline events
    window.addEventListener('online', () => {
      log.debug('Connection restored, checking session...');
      this.checkAndRefreshSession();
    });

    log.debug('Session manager initialized');
  }

  /**
   * Set up Firebase token change listener
   * Automatically updates localStorage when token changes
   */
  setupFirebaseTokenListener() {
    if (!auth) {
      log.warn('Firebase Auth not available, token listener not set up');
      return;
    }

    // Clean up existing listener
    if (this.tokenUnsubscribe) {
      this.tokenUnsubscribe();
    }

    this.tokenUnsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          localStorage.setItem(FIREBASE_TOKEN_KEY, token);
          log.debug('Firebase token updated in localStorage');
        } catch (error) {
          log.error('Failed to get Firebase token on change:', error);
        }
      } else {
        // User signed out, clear token
        localStorage.removeItem(FIREBASE_TOKEN_KEY);
        log.debug('Firebase token cleared from localStorage');
      }
    });

    log.debug('Firebase token listener set up');
  }

  /**
   * Track user activity to update last activity timestamp
   */
  trackActivity() {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const updateActivity = () => {
      this.lastActivityTime = Date.now();
    };

    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });
  }

  /**
   * Start periodic session refresh
   */
  startSessionRefresh() {
    // Clear existing interval if any
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    // Check session every 10 minutes
    this.refreshInterval = setInterval(() => {
      this.checkAndRefreshSession();
    }, this.sessionCheckInterval);

    log.debug('Session refresh interval started');
  }

  /**
   * Check if session needs refresh and refresh if necessary
   */
  async checkAndRefreshSession() {
    // Prevent multiple simultaneous refreshes
    if (this.isRefreshing) {
      log.debug('Session refresh already in progress, skipping...');
      return;
    }

    try {
      this.isRefreshing = true;

      // Check if Firebase user is authenticated
      if (!auth?.currentUser) {
        log.debug('No active Firebase session found');
        return;
      }

      // Check if user has been inactive for too long
      const inactiveTime = Date.now() - this.lastActivityTime;
      if (inactiveTime > this.inactivityTimeout) {
        log.info('User inactive for too long, session will expire naturally');
        return;
      }

      // Get token metadata to check expiry
      const tokenResult = await auth.currentUser.getIdTokenResult();
      const expiresAt = new Date(tokenResult.expirationTime).getTime();
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;
      const fifteenMinutes = 15 * 60 * 1000;

      log.debug('Session status:', {
        expiresAt: tokenResult.expirationTime,
        timeUntilExpiry: `${Math.floor(timeUntilExpiry / 1000 / 60)} minutes`,
        needsRefresh: timeUntilExpiry < fifteenMinutes
      });

      // Refresh if token expires in less than 15 minutes
      if (timeUntilExpiry < fifteenMinutes) {
        log.info('Session expiring soon, refreshing token...');
        await this.refreshSession();
      } else {
        log.debug('Session is valid, no refresh needed');
      }

    } catch (error) {
      log.error('Error checking session:', error);
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Manually refresh the session
   */
  async refreshSession() {
    try {
      log.debug('Refreshing session...');

      const token = await refreshIdToken();

      if (!token) {
        log.warn('No token returned from refresh');
        return { success: false, error: new Error('No token data') };
      }

      // Get new expiry time
      const tokenResult = await auth.currentUser?.getIdTokenResult();

      log.info('Session refreshed successfully');
      if (tokenResult) {
        log.debug('New session expires at:', tokenResult.expirationTime);
      }

      return { success: true, token };

    } catch (error) {
      log.error('Exception during session refresh:', error);
      return { success: false, error };
    }
  }

  /**
   * Manually trigger session check (useful after navigation)
   */
  async ensureSession() {
    await this.checkAndRefreshSession();
  }

  /**
   * Get time until session expires
   */
  async getTimeUntilExpiry() {
    try {
      if (!auth?.currentUser) {
        return null;
      }

      const tokenResult = await auth.currentUser.getIdTokenResult();
      const expiresAt = new Date(tokenResult.expirationTime).getTime();
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;

      return {
        milliseconds: timeUntilExpiry,
        minutes: Math.floor(timeUntilExpiry / 1000 / 60),
        hours: Math.floor(timeUntilExpiry / 1000 / 60 / 60),
        expiresAt: new Date(expiresAt)
      };

    } catch (error) {
      log.error('Error getting session expiry:', error);
      return null;
    }
  }

  /**
   * Clean up session manager
   */
  cleanup() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    if (this.tokenUnsubscribe) {
      this.tokenUnsubscribe();
      this.tokenUnsubscribe = null;
    }
    log.debug('Session manager cleaned up');
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

// Auto-initialize on load
if (typeof window !== 'undefined') {
  // Initialize after a short delay to ensure Firebase is ready
  setTimeout(() => {
    sessionManager.initialize();
  }, 1000);
}

export default sessionManager;
export { SessionManager };
