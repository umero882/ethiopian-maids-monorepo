/**
 * WhatsApp Flow Endpoint - HTTPS Cloud Function
 *
 * Receives encrypted POST from Meta WhatsApp Flows infrastructure,
 * decrypts, routes to handler (v1 or v2), encrypts response, and returns it.
 *
 * v1 flow_token format: "phone:+971..."
 * v2 flow_token format: "v2:phone:+971..."
 *
 * Meta docs: https://developers.facebook.com/docs/whatsapp/flows/guides/implementingyourflowendpoint
 */

import * as functions from 'firebase-functions';
import { decryptFlowRequest, encryptFlowResponse } from './flowEncryption';
import { handleFlowAction, handleFlowActionV2 } from './flowDataHandler';

// Flow encryption config from environment
function getFlowConfig() {
  return {
    privateKey: (process.env.WHATSAPP_FLOW_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    passphrase: process.env.WHATSAPP_FLOW_PRIVATE_KEY_PASSPHRASE || '',
    flowToken: process.env.WHATSAPP_FLOW_TOKEN || '',
  };
}

/**
 * Detect flow version from flow_token.
 * v2 tokens start with "v2:", everything else is v1.
 */
function detectFlowVersion(body: Record<string, unknown>): 'v1' | 'v2' {
  const flowToken = (body.flow_token as string) || '';
  if (flowToken.startsWith('v2:')) return 'v2';

  // Also check nested data for flow_token
  const data = body.data as Record<string, unknown> | undefined;
  if (data) {
    const dataFlowToken = (data.flow_token as string) || '';
    if (dataFlowToken.startsWith('v2:')) return 'v2';
  }

  return 'v1';
}

/**
 * HTTPS request handler for WhatsApp Flow endpoint.
 * Exported for use with functions.https.onRequest() in index.ts.
 */
export const whatsappFlowEndpointHandler = async (
  req: functions.https.Request,
  res: functions.Response
): Promise<void> => {
  // Only accept POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const config = getFlowConfig();

  if (!config.privateKey) {
    console.error('[FlowEndpoint] WHATSAPP_FLOW_PRIVATE_KEY not configured');
    res.status(500).json({ error: 'Flow endpoint not configured' });
    return;
  }

  try {
    // Step 1: Decrypt the incoming request
    const { decryptedBody, aesKeyBuffer, initialVectorBuffer } = decryptFlowRequest(
      req.body,
      config.privateKey,
      config.passphrase
    );

    const body = decryptedBody as Record<string, unknown>;
    console.log('[FlowEndpoint] Decrypted action:', body.action);

    // Inject phone context into data
    if (body.data && typeof body.data === 'object') {
      const flowData = body.data as Record<string, unknown>;
      if (body.flow_token && typeof body.flow_token === 'string') {
        flowData._phone_number = flowData._phone_number || '';
      }
    }

    // Step 2: Detect version and route to appropriate handler
    const version = detectFlowVersion(body);
    console.log(`[FlowEndpoint] Detected flow version: ${version}`);

    let response: Record<string, unknown>;
    if (version === 'v2') {
      response = await handleFlowActionV2(body);
    } else {
      response = await handleFlowAction(body);
    }

    // Step 3: Encrypt and send response
    const encryptedResponse = encryptFlowResponse(response, aesKeyBuffer, initialVectorBuffer);

    res.status(200).send(encryptedResponse);
  } catch (error) {
    console.error('[FlowEndpoint] Error processing flow request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
