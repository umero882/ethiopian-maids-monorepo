/**
 * Email Notification Cloud Function (Gmail SMTP via Nodemailer)
 *
 * Callable function that sends email notifications via Gmail SMTP.
 * Only callable by site_admin role users.
 *
 * Environment variables (set in .env):
 *   GMAIL_EMAIL=your-email@gmail.com
 *   GMAIL_APP_PASSWORD=your-app-password
 *   EMAIL_FROM_NAME=Ethiopian Maids Platform
 */

import * as functions from 'firebase-functions';
import * as nodemailer from 'nodemailer';

const getEmailConfig = () => {
  // Prefer process.env (set via .env file) over deprecated functions.config()
  let legacyConfig: Record<string, any> = {};
  try { legacyConfig = functions.config()?.gmail || {}; } catch { /* deprecated */ }

  return {
    email: process.env.GMAIL_EMAIL || legacyConfig.email || '',
    appPassword: process.env.GMAIL_APP_PASSWORD || legacyConfig.app_password || '',
    fromName: process.env.EMAIL_FROM_NAME || legacyConfig.from_name || 'Ethiopian Maids Platform',
  };
};

// Create reusable transporter (lazy init)
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  const config = getEmailConfig();
  if (!config.email || !config.appPassword) {
    throw new functions.https.HttpsError('failed-precondition', 'Email service not configured');
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.email,
      pass: config.appPassword,
    },
  });

  return transporter;
}

interface SendEmailData {
  to: string;
  subject: string;
  message: string;
  recipientName?: string;
}

export const sendNotificationEmailHandler = async (
  data: SendEmailData,
  context: functions.https.CallableContext
) => {
  // Verify caller is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  // Verify caller is site_admin
  const claims = context.auth.token;
  const role = claims['https://hasura.io/jwt/claims']?.['x-hasura-default-role'];
  if (role !== 'site_admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  const { to, subject, message, recipientName } = data;

  if (!to || !subject || !message) {
    throw new functions.https.HttpsError('invalid-argument', 'to, subject, and message are required');
  }

  const config = getEmailConfig();
  if (!config.email || !config.appPassword) {
    console.error('[SendEmail] Gmail credentials not configured');
    throw new functions.https.HttpsError('failed-precondition', 'Email service not configured');
  }

  try {
    const transport = getTransporter();

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${config.fromName}" <${config.email}>`,
      to: recipientName ? `"${recipientName}" <${to}>` : to,
      subject,
      text: message,
      html: formatEmailHtml(subject, message, recipientName),
    };

    const info = await transport.sendMail(mailOptions);
    console.log(`[SendEmail] Email sent to ${to}, messageId: ${info.messageId}`);

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    if (error instanceof functions.https.HttpsError) throw error;
    console.error('[SendEmail] Failed to send email:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send email');
  }
};

function formatEmailHtml(subject: string, message: string, recipientName?: string): string {
  const escapedMessage = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;margin-top:20px;margin-bottom:20px;">
    <tr>
      <td style="background:#6e2be4;padding:24px 32px;">
        <h1 style="color:#ffffff;margin:0;font-size:20px;">Ethiopian Maids Platform</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        <h2 style="color:#1a1a2e;margin:0 0 16px 0;font-size:18px;">${subject}</h2>
        <div style="color:#4a4a68;font-size:15px;line-height:1.6;">
          ${escapedMessage}
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">
          This email was sent from Ethiopian Maids Platform. Please do not reply to this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
