/**
 * EmailService Port
 *
 * Interface for email sending capabilities.
 * Implementation will be provided by infrastructure layer.
 */

export interface PasswordResetEmailParams {
  email: string;
  token: string;
  userName: string;
  expiresAt: Date;
}

export interface EmailVerificationParams {
  email: string;
  token: string;
  userName: string;
}

export interface WelcomeEmailParams {
  email: string;
  userName: string;
  role: string;
}

export interface SecurityAlertEmailParams {
  email: string;
  alertType: string;
  details: Record<string, unknown>;
}

export abstract class EmailService {
  /**
   * Send password reset email
   * @param params - Email parameters
   * @returns Promise<void>
   */
  abstract sendPasswordResetEmail(params: PasswordResetEmailParams): Promise<void>;

  /**
   * Send email verification email
   * @param params - Email parameters
   * @returns Promise<void>
   */
  abstract sendEmailVerificationEmail(params: EmailVerificationParams): Promise<void>;

  /**
   * Send welcome email
   * @param params - Email parameters
   * @returns Promise<void>
   */
  abstract sendWelcomeEmail(params: WelcomeEmailParams): Promise<void>;

  /**
   * Send security alert email
   * @param params - Email parameters
   * @returns Promise<void>
   */
  abstract sendSecurityAlertEmail(params: SecurityAlertEmailParams): Promise<void>;
}
