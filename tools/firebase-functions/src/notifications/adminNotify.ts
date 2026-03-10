/**
 * Admin Notification Callable Function
 *
 * Generic callable Cloud Function that the frontend can invoke
 * to send Telegram notifications for client-side events
 * (bookings, interviews, site errors, profile updates, etc.).
 */

import * as functions from 'firebase-functions';
import { sendTelegramMessage, sendMonitorTelegramMessage } from './telegramService';
import {
  formatBookingCreated,
  formatInterviewScheduled,
  formatSiteError,
  formatProfileUpdate,
  formatCustomMessage,
} from './adminMessages';

/** Supported notification types */
type NotificationType =
  | 'booking'
  | 'interview'
  | 'site_error'
  | 'profile_update'
  | 'custom';

interface AdminNotifyData {
  type: NotificationType;
  payload: Record<string, any>;
}

/**
 * Callable function: Send admin notification via Telegram.
 *
 * Requires authenticated caller. Formats the message based on
 * the event type and sends it to the admin Telegram chat.
 *
 * Usage from client:
 *   const adminNotify = httpsCallable(functions, 'adminNotify');
 *   await adminNotify({ type: 'booking', payload: { ... } });
 */
export async function adminNotifyHandler(
  data: AdminNotifyData,
  context: functions.https.CallableContext
): Promise<{ success: boolean }> {
  // Must be authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to send notifications'
    );
  }

  if (!data?.type) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Notification type is required'
    );
  }

  const callerId = context.auth.uid;
  const payload = data.payload || {};

  console.log(`[AdminNotify] type=${data.type} from user=${callerId}`);

  let message: string;

  switch (data.type) {
    case 'booking':
      message = formatBookingCreated({
        sponsorId: payload.sponsorId || callerId,
        sponsorName: payload.sponsorName,
        maidId: payload.maidId,
        maidName: payload.maidName,
        bookingId: payload.bookingId,
      });
      break;

    case 'interview':
      message = formatInterviewScheduled({
        sponsorId: payload.sponsorId || callerId,
        sponsorName: payload.sponsorName,
        maidId: payload.maidId,
        maidName: payload.maidName,
        scheduledDate: payload.scheduledDate,
        interviewId: payload.interviewId,
      });
      break;

    case 'site_error':
      message = formatSiteError({
        type: payload.type || payload.errorType,
        message: payload.message,
        url: payload.url,
        userId: payload.userId || callerId,
        stack: payload.stack,
      });
      break;

    case 'profile_update':
      message = formatProfileUpdate({
        userId: payload.userId || callerId,
        userType: payload.userType,
        action: payload.action,
      });
      break;

    case 'custom':
      message = formatCustomMessage({
        title: payload.title,
        message: payload.message,
        details: payload.details,
      });
      break;

    default:
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Unknown notification type: ${data.type}`
      );
  }

  await sendTelegramMessage(message);
  await sendMonitorTelegramMessage(message);

  return { success: true };
}
