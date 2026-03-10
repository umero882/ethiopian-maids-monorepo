/**
 * WhatsApp Webhook Handler - Auto-reply with Welcome + Registration Flow
 *
 * Handles incoming WhatsApp messages via Meta Cloud API webhook.
 * GET  → Webhook verification (hub.verify_token challenge)
 * POST → Incoming message processing → auto-reply with welcome + flow
 *
 * Setup in Meta Business Suite:
 *   Webhook URL: https://us-central1-ethiopian-maids.cloudfunctions.net/whatsappWebhook
 *   Verify Token: (WHATSAPP_WEBHOOK_VERIFY_TOKEN from .env)
 *   Subscribe to: messages
 */

import * as functions from 'firebase-functions';

// ── Config ──

function getConfig() {
  return {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0',
    verifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'ethiopian_maids_webhook_2026',
    flowId: process.env.WHATSAPP_FLOW_ID || '939811995167237',
  };
}

// ── Helpers ──

async function sendTextMessage(to: string, text: string): Promise<void> {
  const { phoneNumberId, accessToken, apiVersion } = getConfig();
  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    console.error('[Webhook] Failed to send text:', JSON.stringify(err));
  }
}

async function sendRegistrationFlow(to: string): Promise<void> {
  const { phoneNumberId, accessToken, apiVersion, flowId } = getConfig();
  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'flow',
        header: { type: 'text', text: 'Ethiopian Maids' },
        body: {
          text: 'Create your full profile with photos, documents, and more. Takes about 5 minutes.',
        },
        footer: { text: 'Powered by Ethiopian Maids' },
        action: {
          name: 'flow',
          parameters: {
            flow_message_version: '3',
            flow_id: flowId,
            flow_cta: 'Start Registration',
            flow_token: `v2:phone:+${to}`,
            flow_action: 'navigate',
            flow_action_payload: {
              screen: 'ROLESELECT',
              data: {
                role_options: [
                  { id: 'maid', title: 'Maid / Domestic Worker' },
                  { id: 'sponsor', title: 'Sponsor / Employer' },
                  { id: 'agency', title: 'Recruitment Agency' },
                ],
              },
            },
          },
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    console.error('[Webhook] Failed to send flow:', JSON.stringify(err));
  }
}

// ── Webhook Handler ──

export const whatsappWebhookHandler = async (
  req: functions.https.Request,
  res: functions.Response
): Promise<void> => {
  const config = getConfig();

  // ── GET: Webhook Verification ──
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === config.verifyToken) {
      console.log('[Webhook] Verification successful');
      res.status(200).send(challenge);
      return;
    }

    console.warn('[Webhook] Verification failed: invalid token');
    res.status(403).send('Forbidden');
    return;
  }

  // ── POST: Incoming Messages ──
  if (req.method === 'POST') {
    // Always respond 200 quickly to Meta (they retry on non-200)
    res.status(200).send('EVENT_RECEIVED');

    try {
      const body = req.body;

      // Extract message entries
      const entries = body?.entry;
      if (!entries || !Array.isArray(entries)) return;

      for (const entry of entries) {
        const changes = entry?.changes;
        if (!changes || !Array.isArray(changes)) continue;

        for (const change of changes) {
          const value = change?.value;
          if (!value) continue;

          const messages = value?.messages;
          if (!messages || !Array.isArray(messages)) continue;

          for (const message of messages) {
            const from = message?.from; // sender phone number (digits only)
            const msgType = message?.type;
            const msgText = (message?.text?.body || '').trim().toLowerCase();

            if (!from) continue;

            // Only respond to text messages that are greetings
            if (msgType !== 'text') continue;

            const greetings = ['hi', 'hello', 'hey', 'helo', 'hola', 'salam', 'selam', 'start', 'register', 'signup', 'sign up'];
            const isGreeting = greetings.some(g => msgText === g || msgText.startsWith(g + ' ') || msgText.startsWith(g + '!'));

            if (!isGreeting) {
              console.log(`[Webhook] Non-greeting text from +${from}: "${msgText.substring(0, 50)}"`);
              continue;
            }

            console.log(`[Webhook] Greeting from +${from}: "${msgText}"`);

            // Send welcome message
            await sendTextMessage(
              from,
              'Welcome to Ethiopian Maids! \u{1F44B}\n\n' +
              'We connect domestic workers, sponsors, and recruitment agencies across the Middle East & Africa.\n\n' +
              'Complete your registration below to get started. It only takes a few minutes!'
            );

            // Small delay to ensure welcome arrives first
            await new Promise(r => setTimeout(r, 1000));

            // Send registration flow
            await sendRegistrationFlow(from);

            console.log(`[Webhook] Welcome + flow sent to +${from}`);
          }
        }
      }
    } catch (error) {
      console.error('[Webhook] Error processing message:', error);
    }

    return;
  }

  // Other methods
  res.status(405).send('Method Not Allowed');
};
