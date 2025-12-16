/**
 * Auth Context - Firebase Auth Version
 *
 * Provides authentication state and methods throughout the app.
 * Uses Firebase Auth with secure token storage.
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  AuthError,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../utils/firebaseConfig';
import { authStorage } from '../utils/secureStorage';
import { setAuthToken, apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';

// GraphQL mutation for creating/upserting profile in Hasura database
const CREATE_PROFILE_MUTATION = gql`
  mutation CreateProfile($data: profiles_insert_input!) {
    insert_profiles_one(object: $data, on_conflict: {
      constraint: profiles_pkey,
      update_columns: [full_name, phone, country, user_type, updated_at]
    }) {
      id
      full_name
      email
      phone
      user_type
      country
      registration_complete
      is_active
      created_at
      updated_at
    }
  }
`;

// GraphQL query to get user's profile type and ID
const GET_USER_PROFILE_TYPE = gql`
  query GetUserProfileType($email: String!) {
    profiles(where: { email: { _eq: $email } }, limit: 1) {
      id
      user_type
      full_name
      email
    }
  }
`;

type UserType = 'sponsor' | 'maid' | 'agency' | null;

interface ExtendedUser extends User {
  user_type?: UserType;
  profile_id?: string; // Database profile ID (may differ from Firebase UID for legacy users)
}

interface AuthState {
  user: ExtendedUser | null;
  userType: UserType;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
}

interface UserData {
  full_name?: string;
  user_type?: UserType;
  [key: string]: any;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, userData?: UserData) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResult>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    userType: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[Auth] Firebase auth state changed:', user ? 'logged in' : 'logged out');

      if (user) {
        // Get and store the ID token
        try {
          const idToken = await user.getIdToken();
          await authStorage.saveTokens(idToken);

          // Update Apollo Client auth token
          setAuthToken(idToken);

          // Get stored user data to retrieve user_type and profile_id
          const storedUserData = await authStorage.getUserData() as UserData | null;
          let userType = storedUserData?.user_type as UserType || null;
          let profileId = storedUserData?.profile_id as string || null;

          // If profile_id or userType is missing, fetch from database
          if (!profileId || !userType) {
            try {
              console.log('[Auth] Missing profile data, fetching from database...');
              const { data } = await apolloClient.query({
                query: GET_USER_PROFILE_TYPE,
                variables: { email: user.email },
                fetchPolicy: 'network-only',
              });
              if (data?.profiles?.[0]) {
                profileId = data.profiles[0].id;
                userType = data.profiles[0].user_type as UserType || null;
                console.log('[Auth] Fetched from DB - Profile ID:', profileId, 'Type:', userType);
              }
            } catch (dbError) {
              console.warn('[Auth] Could not fetch profile from database:', dbError);
            }
          }

          // Fallback to Firebase UID if still no profile_id
          if (!profileId) {
            profileId = user.uid;
          }

          // Store user data (preserve existing user_type and profile_id if present)
          await authStorage.saveUserData({
            uid: user.uid,
            profile_id: profileId,
            email: user.email,
            displayName: user.displayName,
            emailVerified: user.emailVerified,
            user_type: userType,
          });

          // Create extended user with user_type and profile_id
          const extendedUser: ExtendedUser = Object.assign(user, {
            user_type: userType,
            profile_id: profileId,
          });

          console.log('[Auth] User type:', userType, 'Profile ID:', profileId);

          setState({
            user: extendedUser,
            userType,
            isLoading: false,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error('[Auth] Error getting ID token:', error);
          setState({
            user: null,
            userType: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      } else {
        // User is signed out
        await authStorage.clearAll();
        setAuthToken('');

        setState({
          user: null,
          userType: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Token refresh - Firebase handles this automatically, but we can force refresh
  useEffect(() => {
    if (!state.user) return;

    // Refresh token every 55 minutes (Firebase tokens expire in 1 hour)
    const refreshInterval = setInterval(async () => {
      try {
        const idToken = await state.user?.getIdToken(true); // Force refresh
        if (idToken) {
          await authStorage.saveTokens(idToken);
          setAuthToken(idToken);
          console.log('[Auth] Token refreshed');
        }
      } catch (error) {
        console.error('[Auth] Token refresh error:', error);
      }
    }, 55 * 60 * 1000); // 55 minutes

    return () => clearInterval(refreshInterval);
  }, [state.user]);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      // Trim and validate email
      const trimmedEmail = email?.trim().toLowerCase();
      const trimmedPassword = password?.trim();

      if (!trimmedEmail || !trimmedPassword) {
        return { success: false, error: 'Email and password are required' };
      }

      console.log('[Auth] Attempting sign in for:', trimmedEmail);
      setState(prev => ({ ...prev, isLoading: true }));

      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
      const user = userCredential.user;

      // Get ID token for Hasura
      const idToken = await user.getIdToken();
      await authStorage.saveTokens(idToken);
      setAuthToken(idToken);

      // Fetch user_type and profile_id from database
      let userType: UserType = null;
      let profileId: string | null = null;
      let profileExists = false;
      try {
        const { data } = await apolloClient.query({
          query: GET_USER_PROFILE_TYPE,
          variables: { email: trimmedEmail },
          fetchPolicy: 'network-only',
        });
        if (data?.profiles?.[0]) {
          profileExists = true;
          profileId = data.profiles[0].id;
          userType = data.profiles[0].user_type as UserType || null;
          console.log('[Auth] Fetched profile from database - ID:', profileId, 'Type:', userType);
        } else {
          console.log('[Auth] No profile found in database for user');
        }
      } catch (profileError) {
        console.warn('[Auth] Could not fetch user type from database:', profileError);
      }

      // If no profile exists, try to get user_type from local storage (set during registration)
      // and create the missing profile
      if (!profileExists) {
        try {
          const storedData = await authStorage.getUserData() as UserData | null;
          const storedUserType = storedData?.user_type as UserType;

          if (storedUserType) {
            userType = storedUserType;
            console.log('[Auth] Using stored user type:', storedUserType);

            // Try to create missing profile in database
            try {
              console.log('[Auth] Creating missing profile in database...');
              const profileInput = {
                id: user.uid,
                email: trimmedEmail,
                full_name: user.displayName || trimmedEmail.split('@')[0],
                user_type: storedUserType,
                phone: storedData?.phone || '',
                country: storedData?.country || '',
                registration_complete: false,
                is_active: true,
              };

              await apolloClient.mutate({
                mutation: CREATE_PROFILE_MUTATION,
                variables: { data: profileInput },
              });
              console.log('[Auth] Missing profile created successfully');
            } catch (createError) {
              console.warn('[Auth] Could not create missing profile:', createError);
            }
          }
        } catch (storageError) {
          console.warn('[Auth] Could not read stored user data:', storageError);
        }
      }

      // Store user data with user_type and profile_id locally
      // Use database profile_id if available, otherwise fall back to Firebase UID
      const effectiveProfileId = profileId || user.uid;
      await authStorage.saveUserData({
        uid: user.uid,
        profile_id: effectiveProfileId,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        user_type: userType,
      });

      // Create extended user with user_type and profile_id
      const extendedUser: ExtendedUser = Object.assign(user, {
        user_type: userType,
        profile_id: effectiveProfileId,
      });

      // Update state with userType immediately
      setState({
        user: extendedUser,
        userType,
        isLoading: false,
        isAuthenticated: true,
      });

      console.log('[Auth] Sign in successful:', user.email, 'Type:', userType, 'ProfileID:', effectiveProfileId);
      return { success: true, user };
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      const authError = error as AuthError;
      console.error('[Auth] Sign in error:', authError.code);
      return { success: false, error: getAuthErrorMessage(authError) };
    }
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    userData?: UserData
  ): Promise<AuthResult> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Trim and validate
      const trimmedEmail = email?.trim().toLowerCase();
      const trimmedName = userData?.full_name?.trim() || '';

      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      const user = userCredential.user;

      // Update Firebase display name
      if (trimmedName) {
        await updateProfile(user, { displayName: trimmedName });
      }

      // Get ID token for Hasura
      const idToken = await user.getIdToken();
      await authStorage.saveTokens(idToken);
      setAuthToken(idToken);

      // Extract user_type from userData
      const userType = userData?.user_type as UserType || 'sponsor';

      // Create profile in Hasura database (matching web behavior)
      try {
        console.log('[Auth] Creating profile in Hasura database...');
        const profileInput = {
          id: user.uid,
          email: trimmedEmail,
          full_name: trimmedName || trimmedEmail.split('@')[0],
          user_type: userType,
          phone: userData?.phone || '',
          country: userData?.country || '',
          registration_complete: false,
          is_active: true,
        };

        const { data, errors } = await apolloClient.mutate({
          mutation: CREATE_PROFILE_MUTATION,
          variables: { data: profileInput },
        });

        if (errors && errors.length > 0) {
          console.warn('[Auth] Profile creation had errors:', errors[0]?.message);
        } else {
          console.log('[Auth] Profile created in database:', data?.insert_profiles_one?.id);
        }
      } catch (profileError) {
        // Don't fail registration if profile creation fails
        // The web handles this gracefully too - profile can be created later
        console.warn('[Auth] Profile creation failed (non-fatal):', profileError);
      }

      // Store user data including user_type locally
      const userDataToStore = {
        uid: user.uid,
        email: user.email,
        displayName: trimmedName || user.email?.split('@')[0],
        emailVerified: user.emailVerified,
        user_type: userType,
        ...userData,
      };
      await authStorage.saveUserData(userDataToStore);

      // Create extended user with user_type
      const extendedUser: ExtendedUser = Object.assign(user, { user_type: userType });

      console.log('[Auth] Sign up successful:', user.email, 'Type:', userType);

      // Update state with user type immediately
      setState({
        user: extendedUser,
        userType,
        isLoading: false,
        isAuthenticated: true,
      });

      return { success: true, user };
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      const authError = error as AuthError;
      console.error('[Auth] Sign up error:', authError.code);
      return { success: false, error: getAuthErrorMessage(authError) };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      await firebaseSignOut(auth);
      await authStorage.clearAll();
      setAuthToken('');

      console.log('[Auth] Sign out successful');
      setState({
        user: null,
        userType: null,
        isLoading: false,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('[Auth] Sign out error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('[Auth] Password reset email sent to:', email);
      return { success: true };
    } catch (error) {
      const authError = error as AuthError;
      console.error('[Auth] Password reset error:', authError.code);
      return { success: false, error: getAuthErrorMessage(authError) };
    }
  }, []);

  const refreshToken = useCallback(async () => {
    if (!state.user) return;

    try {
      const idToken = await state.user.getIdToken(true); // Force refresh
      await authStorage.saveTokens(idToken);
      setAuthToken(idToken);
      console.log('[Auth] Token refreshed manually');
    } catch (error) {
      console.error('[Auth] Manual token refresh error:', error);
    }
  }, [state.user]);

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

function getAuthErrorMessage(error: AuthError): string {
  const code = error.code;

  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/user-disabled':
      return 'This account has been disabled';
    case 'auth/user-not-found':
      return 'No account found with this email';
    case 'auth/wrong-password':
      return 'Invalid password';
    case 'auth/invalid-credential':
      return 'Invalid email or password';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return error.message || 'An unexpected error occurred';
  }
}

// Export auth instance for direct use if needed
export { auth };
