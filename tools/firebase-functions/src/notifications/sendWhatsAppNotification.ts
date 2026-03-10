/**
 * Meta WhatsApp Business API Cloud Function
 *
 * Callable function that sends WhatsApp messages via Meta Cloud API.
 * Only callable by site_admin role users.
 *
 * Config:
 *   firebase functions:config:set whatsapp.phone_number_id="..." whatsapp.access_token="..."
 */

import * as functions from 'firebase-functions';

const getWhatsAppConfig = () => {
  // Prefer process.env (set via .env file) over deprecated functions.config()
  let legacyConfig: Record<string, any> = {};
  try { legacyConfig = functions.config()?.whatsapp || {}; } catch { /* deprecated */ }

  return {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || legacyConfig.phone_number_id || '',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || legacyConfig.access_token || '',
    apiVersion: process.env.WHATSAPP_API_VERSION || legacyConfig.api_version || 'v18.0',
  };
};

interface SendWhatsAppData {
  phone: string;
  message: string;
}

export const sendWhatsAppNotificationHandler = async (
  data: SendWhatsAppData,
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

  const { phone, message } = data;

  if (!phone || !message) {
    throw new functions.https.HttpsError('invalid-argument', 'phone and message are required');
  }

  // Clean phone number - remove non-digit chars except leading +
  let cleanPhone = phone.replace(/[^\d+]/g, '');
  // Remove leading + for WhatsApp API (they want digits only)
  if (cleanPhone.startsWith('+')) {
    cleanPhone = cleanPhone.substring(1);
  }

  if (cleanPhone.length < 8) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid phone number');
  }

  const config = getWhatsAppConfig();
  if (!config.phoneNumberId || !config.accessToken) {
    console.error('[WhatsApp] WhatsApp API not configured');
    throw new functions.https.HttpsError('failed-precondition', 'WhatsApp service not configured');
  }

  try {
    const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: 'text',
        text: { body: message },
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('[WhatsApp] API error:', response.status, JSON.stringify(responseData));
      throw new functions.https.HttpsError('internal', `WhatsApp send failed: ${responseData?.error?.message || response.status}`);
    }

    const waMessageId = responseData?.messages?.[0]?.id || '';
    console.log(`[WhatsApp] Message sent to ${cleanPhone}, waMessageId: ${waMessageId}`);

    return { success: true, waMessageId };
  } catch (error: any) {
    if (error instanceof functions.https.HttpsError) throw error;
    console.error('[WhatsApp] Failed to send message:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send WhatsApp message');
  }
};
