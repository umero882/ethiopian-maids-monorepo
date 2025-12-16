import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth } from '@/lib/firebaseClient';
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword
} from 'firebase/auth';
import { toast } from '@/components/ui/use-toast';
import { handleAuthError } from '@/services/centralizedErrorHandler';
import { createLogger } from '@/utils/logger';
import { secureLogin, secureLogout, secureRegister } from '@/lib/secureAuth';

const log = createLogger('AuthProvider');

// Auth Context - handles only authentication state and operations
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Authentication state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Clear auth error
  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setAuthError(null);

      const { user, error } = await secureLogin(email, password);

      if (error) {
        setAuthError(error.message);
        throw error;
      }

      log.info('User logged in successfully');
      return { user, error: null };
    } catch (error) {
      const authErr = handleAuthError(error);
      setAuthError(authErr.message);
      log.error('Login failed:', authErr.message);
      return { user: null, error: authErr };
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      setAuthError(null);

      const { error } = await secureLogout();

      if (error) {
        setAuthError(error.message);
        throw error;
      }

      setUser(null);
      log.info('User logged out successfully');
      return { error: null };
    } catch (error) {
      const authErr = handleAuthError(error);
      setAuthError(authErr.message);
      log.error('Logout failed:', authErr.message);
      return { error: authErr };
    } finally {
      setLoading(false);
    }
  }, []);

  // Register function
  const register = useCallback(async (email, password, userData) => {
    try {
      setLoading(true);
      setAuthError(null);

      const { user, error } = await secureRegister(email, password, userData);

      if (error) {
        setAuthError(error.message);
        throw error;
      }

      log.info('User registered successfully');
      return { user, error: null };
    } catch (error) {
      const authErr = handleAuthError(error);
      setAuthError(authErr.message);
      log.error('Registration failed:', authErr.message);
      return { user: null, error: authErr };
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset password function
  const resetPassword = useCallback(async (email) => {
    try {
      setLoading(true);
      setAuthError(null);

      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/reset-password`,
      });

      toast({
        title: "Reset Link Sent",
        description: "Check your email for a password reset link.",
      });

      return { error: null };
    } catch (error) {
      const authErr = handleAuthError(error);
      setAuthError(authErr.message);
      log.error('Password reset failed:', authErr.message);
      return { error: authErr };
    } finally {
      setLoading(false);
    }
  }, []);

  // Update password function
  const updatePassword = useCallback(async (newPassword) => {
    try {
      setLoading(true);
      setAuthError(null);

      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      await firebaseUpdatePassword(currentUser, newPassword);

      toast({
        title: "Password Updated",
        description: "Your password has been updated successfully.",
      });

      return { error: null };
    } catch (error) {
      const authErr = handleAuthError(error);
      setAuthError(authErr.message);
      log.error('Password update failed:', authErr.message);
      return { error: authErr };
    } finally {
      setLoading(false);
    }
  }, []);

  // Auth state listener
  useEffect(() => {
    let mounted = true;

    // Listen for auth changes via Firebase
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!mounted) return;

      if (firebaseUser) {
        // Transform Firebase user to our user format
        const user = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        };
        setUser(user);
        log.debug('Auth state changed: user signed in');
      } else {
        setUser(null);
        log.debug('Auth state changed: user signed out');
      }

      setLoading(false);
    });

    // Cleanup function
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const value = {
    // State
    user,
    loading,
    authError,

    // Authentication functions
    login,
    logout,
    register,
    resetPassword,
    updatePassword,
    clearAuthError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
