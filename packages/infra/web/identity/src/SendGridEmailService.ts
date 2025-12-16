/**
 * SendGridEmailService
 *
 * Concrete implementation of EmailService port using SendGrid.
 * Can be replaced with any email provider (AWS SES, Mailgun, etc.)
 */

import {
  EmailService,
  PasswordResetEmailParams,
  EmailVerificationParams,
  WelcomeEmailParams,
  SecurityAlertEmailParams,
} from '@ethio/app-identity';

export interface SendGridEmailServiceConfig {
  apiKey?: string;
  fromEmail?: string;
  fromName?: string;
  baseUrl?: string;
}

type EnvRecord = Record<string, string | undefined>;

const readEnv = (key: string): string | undefined => {
  const globalScope =
    typeof globalThis !== 'undefined'
      ? (globalThis as { process?: { env?: EnvRecord }; __ENV__?: EnvRecord })
      : undefined;

  const candidates = [
    globalScope?.process?.env?.[key],
    globalScope?.__ENV__?.[key],
  ];

  for (const value of candidates) {
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }

  return undefined;
};

export class SendGridEmailService extends EmailService {
  private readonly config: Required<SendGridEmailServiceConfig>;

  constructor(config: SendGridEmailServiceConfig = {}) {
    super();
    this.config = {
      apiKey: config.apiKey || readEnv('SENDGRID_API_KEY') || '',
      fromEmail:
        config.fromEmail || readEnv('SENDGRID_FROM_EMAIL') || 'noreply@ethiomaids.com',
      fromName: config.fromName || 'Ethiopian Maids',
      baseUrl: config.baseUrl || readEnv('APP_BASE_URL') || 'https://ethiomaids.com',
    };
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail({
    email,
    token,
    userName,
    expiresAt,
  }: PasswordResetEmailParams): Promise<void> {
    const resetLink = `${this.config.baseUrl}/reset-password?token=${token}`;
    const expiryMinutes = Math.round((expiresAt.getTime() - Date.now()) / (60 * 1000));

    const html = this._generatePasswordResetHtml({
      userName,
      resetLink,
      expiryMinutes,
    });

    return this._sendEmail({
      to: email,
      subject: 'Reset Your Password - Ethiopian Maids',
      html,
    });
  }

  /**
   * Send email verification email
   */
  async sendEmailVerificationEmail({
    email,
    token,
    userName,
  }: EmailVerificationParams): Promise<void> {
    const verifyLink = `${this.config.baseUrl}/verify-email?token=${token}`;

    const html = this._generateEmailVerificationHtml({
      userName,
      verifyLink,
    });

    return this._sendEmail({
      to: email,
      subject: 'Verify Your Email - Ethiopian Maids',
      html,
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail({ email, userName, role }: WelcomeEmailParams): Promise<void> {
    const dashboardLink = `${this.config.baseUrl}/dashboard/${role}`;

    const html = this._generateWelcomeHtml({
      userName,
      role,
      dashboardLink,
    });

    return this._sendEmail({
      to: email,
      subject: 'Welcome to Ethiopian Maids!',
      html,
    });
  }

  /**
   * Send security alert email
   */
  async sendSecurityAlertEmail({
    email,
    alertType,
    details,
  }: SecurityAlertEmailParams): Promise<void> {
    const alertTitles: Record<string, string> = {
      password_changed: 'Password Changed',
      email_changed: 'Email Address Changed',
      suspicious_login: 'Suspicious Login Detected',
      account_suspended: 'Account Suspended',
      password_reset_requested: 'Password Reset Requested',
    };

    const title = alertTitles[alertType] || 'Security Alert';

    const html = this._generateSecurityAlertHtml({
      title,
      details,
    });

    return this._sendEmail({
      to: email,
      subject: `Security Alert: ${title} - Ethiopian Maids`,
      html,
    });
  }

  /**
   * Generate password reset HTML
   */
  private _generatePasswordResetHtml({
    userName,
    resetLink,
    expiryMinutes,
  }: {
    userName: string;
    resetLink: string;
    expiryMinutes: number;
  }): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hello ${userName},</p>
        <p>You requested to reset your password. Click the button below to reset it:</p>
        <p style="margin: 30px 0;">
          <a href="${resetLink}"
             style="background-color: #4F46E5; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #6B7280; word-break: break-all;">${resetLink}</p>
        <p><strong>This link will expire in ${expiryMinutes} minutes.</strong></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
        <p style="color: #6B7280; font-size: 12px;">
          Ethiopian Maids Platform<br>
          This is an automated message, please do not reply.
        </p>
      </div>
    `;
  }

  /**
   * Generate email verification HTML
   */
  private _generateEmailVerificationHtml({
    userName,
    verifyLink,
  }: {
    userName: string;
    verifyLink: string;
  }): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify Your Email Address</h2>
        <p>Hello ${userName},</p>
        <p>Thank you for registering with Ethiopian Maids. Please verify your email address by clicking the button below:</p>
        <p style="margin: 30px 0;">
          <a href="${verifyLink}"
             style="background-color: #10B981; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email
          </a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #6B7280; word-break: break-all;">${verifyLink}</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
        <p style="color: #6B7280; font-size: 12px;">
          Ethiopian Maids Platform<br>
          This is an automated message, please do not reply.
        </p>
      </div>
    `;
  }

  /**
   * Generate welcome HTML
   */
  private _generateWelcomeHtml({
    userName,
    role,
    dashboardLink,
  }: {
    userName: string;
    role: string;
    dashboardLink: string;
  }): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Ethiopian Maids!</h2>
        <p>Hello ${userName},</p>
        <p>Your account has been successfully created. We're excited to have you on board!</p>
        <p>You're registered as a <strong>${role}</strong>.</p>
        <p style="margin: 30px 0;">
          <a href="${dashboardLink}"
             style="background-color: #4F46E5; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Go to Dashboard
          </a>
        </p>
        <h3>Next Steps:</h3>
        <ul>
          <li>Complete your profile</li>
          <li>Verify your phone number</li>
          <li>Explore available opportunities</li>
        </ul>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
        <p style="color: #6B7280; font-size: 12px;">
          Ethiopian Maids Platform<br>
          This is an automated message, please do not reply.
        </p>
      </div>
    `;
  }

  /**
   * Generate security alert HTML
   */
  private _generateSecurityAlertHtml({
    title,
    details,
  }: {
    title: string;
    details: Record<string, unknown>;
  }): string {
    const detailsHtml = `
      ${details.message || 'Security-related action was performed on your account.'}
      ${details.ip ? `<br><br><strong>IP Address:</strong> ${details.ip}` : ''}
      ${details.location ? `<br><strong>Location:</strong> ${details.location}` : ''}
      ${
        details.timestamp
          ? `<br><strong>Time:</strong> ${new Date(details.timestamp as string).toLocaleString()}`
          : ''
      }
    `;

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 16px; margin-bottom: 20px;">
          <h2 style="color: #B91C1C; margin: 0 0 10px 0;">${title}</h2>
        </div>
        <p>Hello,</p>
        <p>We detected important activity on your Ethiopian Maids account:</p>
        <div style="background-color: #F9FAFB; padding: 16px; border-radius: 6px; margin: 20px 0;">
          ${detailsHtml}
        </div>
        <p><strong>If this was you, no action is needed.</strong></p>
        <p>If you didn't perform this action, please secure your account immediately:</p>
        <ul>
          <li>Change your password</li>
          <li>Review your account activity</li>
          <li>Contact our support team</li>
        </ul>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
        <p style="color: #6B7280; font-size: 12px;">
          Ethiopian Maids Platform<br>
          This is an automated message, please do not reply.
        </p>
      </div>
    `;
  }

  /**
   * Internal method to send email via SendGrid API
   */
  private async _sendEmail({
    to,
    subject,
    html,
  }: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    if (!this.config.apiKey) {
      console.warn('SendGrid API key not configured. Email not sent:', { to, subject });
      // In development without API key, just log
      console.log('📧 [DEV MODE] Email would be sent:', {
        to,
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        subject,
        htmlLength: html.length,
      });
      return;
    }

    try {
      // Use SendGrid SDK
      const sgMail = await import('@sendgrid/mail');
      sgMail.default.setApiKey(this.config.apiKey);

      const result = await sgMail.default.send({
        to,
        from: { email: this.config.fromEmail, name: this.config.fromName },
        subject,
        html,
      });

      console.log('✅ Email sent successfully:', {
        to,
        subject,
        messageId: result[0].headers['x-message-id'],
      });
    } catch (error) {
      console.error('❌ SendGrid error:', {
        to,
        subject,
        error: error instanceof Error ? error.message : 'Unknown error',
        response: (error as any).response?.body,
      });
      throw new Error(
        `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
