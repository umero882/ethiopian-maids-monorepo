/**
 * AuthenticationService Port (Interface)
 *
 * Defines the contract for authentication operations.
 * Implementation handles actual auth provider (Supabase, Firebase, etc.)
 */

export interface RegisterCredentials {
  email: string;
  password: string;
  role: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SessionData {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface AuthResult {
  userId: string;
  session: SessionData;
}

export interface UpdatePasswordParams {
  userId?: string;
  newPassword: string;
}

export interface SignOutParams {
  userId?: string;
  token?: string;
}

export interface RevokeAllSessionsParams {
  userId: string;
}

export abstract class AuthenticationService {
  /**
   * Register new user
   * @param credentials - { email, password, role }
   * @returns Promise<AuthResult>
   */
  abstract register(credentials: RegisterCredentials): Promise<AuthResult>;

  /**
   * Sign in user
   * @param credentials - { email, password }
   * @returns Promise<AuthResult>
   */
  abstract signIn(credentials: SignInCredentials): Promise<AuthResult>;

  /**
   * Sign out user
   * @returns Promise<void>
   */
  abstract signOut(params?: SignOutParams): Promise<void>;

  /**
   * Get current session
   * @returns Promise<SessionData | null>
   */
  abstract getSession(): Promise<SessionData | null>;

  /**
   * Refresh session
   * @returns Promise<SessionData>
   */
  abstract refreshSession(): Promise<SessionData>;

  /**
   * Send password reset email
   * @param email - User email
   * @returns Promise<void>
   */
  abstract sendPasswordResetEmail(email: string): Promise<void>;

  /**
   * Update password
   * @param params - Update password parameters
   * @returns Promise<void>
   */
  abstract updatePassword(params: UpdatePasswordParams): Promise<void>;

  /**
   * Verify email with code
   * @param code - Verification code
   * @returns Promise<boolean>
   */
  abstract verifyEmail(code: string): Promise<boolean>;

  /**
   * Revoke all sessions for a user
   * @param params - User ID
   * @returns Promise<void>
   */
  abstract revokeAllSessions(params: RevokeAllSessionsParams): Promise<void>;
}
