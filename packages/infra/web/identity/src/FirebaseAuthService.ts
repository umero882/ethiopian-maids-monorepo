/**
 * FirebaseAuthService - Implements AuthenticationService port
 *
 * Adapter for Firebase Auth, replacing Supabase Auth.
 */

import {
  AuthenticationService,
  RegisterCredentials,
  SignInCredentials,
  SessionData,
  AuthResult,
  UpdatePasswordParams,
  SignOutParams,
  RevokeAllSessionsParams,
} from '@ethio/app-identity';
import type { Auth, User as FirebaseUser } from 'firebase/auth';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword,
  applyActionCode,
} from 'firebase/auth';

export class FirebaseAuthService extends AuthenticationService {
  constructor(private readonly auth: Auth) {
    super();
  }

  /**
   * Register new user
   */
  async register({ email, password, role }: RegisterCredentials): Promise<AuthResult> {
    const userCredential = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );

    const user = userCredential.user;
    if (!user) {
      throw new Error('Registration failed: No user returned');
    }

    // Get ID token for Hasura authentication
    const idToken = await user.getIdToken();

    // Store token expiry (Firebase tokens expire after 1 hour)
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;

    // Note: role is stored in the user's profile in Hasura, not in Firebase custom claims
    // Custom claims would require a Cloud Function to set securely

    return {
      userId: user.uid,
      session: {
        accessToken: idToken,
        refreshToken: user.refreshToken,
        expiresAt,
      },
    };
  }

  /**
   * Sign in user
   */
  async signIn({ email, password }: SignInCredentials): Promise<AuthResult> {
    const userCredential = await signInWithEmailAndPassword(
      this.auth,
      email,
      password
    );

    const user = userCredential.user;
    if (!user) {
      throw new Error('Sign in failed: No user returned');
    }

    // Get ID token for Hasura authentication
    const idToken = await user.getIdToken();

    // Store token expiry (Firebase tokens expire after 1 hour)
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;

    return {
      userId: user.uid,
      session: {
        accessToken: idToken,
        refreshToken: user.refreshToken,
        expiresAt,
      },
    };
  }

  /**
   * Sign out user
   */
  async signOut(_params?: SignOutParams): Promise<void> {
    await firebaseSignOut(this.auth);
  }

  /**
   * Get current session
   */
  async getSession(): Promise<SessionData | null> {
    const user = this.auth.currentUser;

    if (!user) {
      return null;
    }

    try {
      const idToken = await user.getIdToken();
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;

      return {
        accessToken: idToken,
        refreshToken: user.refreshToken,
        expiresAt,
      };
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  /**
   * Refresh session
   */
  async refreshSession(): Promise<SessionData> {
    const user = this.auth.currentUser;

    if (!user) {
      throw new Error('No authenticated user to refresh session');
    }

    // Force refresh the token
    const idToken = await user.getIdToken(true);
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;

    return {
      accessToken: idToken,
      refreshToken: user.refreshToken,
      expiresAt,
    };
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    const actionCodeSettings = {
      url: `${globalThis.window?.location.origin || ''}/reset-password`,
      handleCodeInApp: true,
    };

    await firebaseSendPasswordResetEmail(this.auth, email, actionCodeSettings);
  }

  /**
   * Update password
   */
  async updatePassword({ newPassword }: UpdatePasswordParams): Promise<void> {
    const user = this.auth.currentUser;

    if (!user) {
      throw new Error('No authenticated user to update password');
    }

    await firebaseUpdatePassword(user, newPassword);
  }

  /**
   * Verify email with code
   * Firebase handles email verification via action codes from email links
   */
  async verifyEmail(code: string): Promise<boolean> {
    try {
      await applyActionCode(this.auth, code);
      return true;
    } catch (error) {
      console.error('Email verification failed:', error);
      throw new Error(`Email verification failed: ${(error as Error).message}`);
    }
  }

  /**
   * Revoke all sessions for a user
   * Firebase doesn't have a direct API for this, so we sign out the current session
   * For full session revocation across all devices, use Firebase Admin SDK on the server
   */
  async revokeAllSessions(_params: RevokeAllSessionsParams): Promise<void> {
    await firebaseSignOut(this.auth);
  }

  /**
   * Get the current Firebase user (for advanced use cases)
   */
  getCurrentUser(): FirebaseUser | null {
    return this.auth.currentUser;
  }
}
