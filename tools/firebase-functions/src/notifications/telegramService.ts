/**
 * Telegram Notification Service
 *
 * Two bots, two audiences:
 *   1. Admin DM bot  — sends to Umer's private chat (telegram.bot_token / telegram.chat_id)
 *   2. Monitor bot   — sends to the shared monitoring group (telegram_monitor.bot_token / telegram_monitor.chat_id)
 *      The OpenClaw agent (Sheger) is in the monitoring group and processes these messages.
 *
 * Non-throwing: logs errors but never crashes the parent function.
 */

import * as functions from 'firebase-functions';

const getTelegramConfig = () => {
  // Prefer process.env (set via .env file) over deprecated functions.config()
  let legacy: Record<string, any> = {};
  try { legacy = functions.config()?.telegram || {}; } catch { /* deprecated */ }
  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN || legacy.bot_token || '',
    chatId: process.env.TELEGRAM_CHAT_ID || legacy.chat_id || '',
  };
};

const getMonitorTelegramConfig = () => {
  let legacy: Record<string, any> = {};
  try { legacy = functions.config()?.telegram_monitor || {}; } catch { /* deprecated */ }
  return {
    botToken: process.env.TELEGRAM_MONITOR_BOT_TOKEN || legacy.bot_token || '',
    chatId: process.env.TELEGRAM_MONITOR_CHAT_ID || legacy.chat_id || '',
  };
};

/**
 * Send a message to the admin Telegram chat.
 * Uses HTML parse mode for rich formatting (bold, italic, links, code).
 *
 * @param text - The message text (supports HTML: <b>, <i>, <a>, <code>, <pre>)
 * @returns true if sent successfully, false otherwise
 */
async function sendViaTelegram(
  botToken: string,
  chatId: string,
  text: string,
  label: string,
): Promise<boolean> {
  if (!botToken || !chatId) {
    console.warn(`[Telegram:${label}] Bot token or chat ID not configured. Skipping.`);
    return false;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[Telegram:${label}] API error ${response.status}: ${errorBody}`);
      return false;
    }

    console.log(`[Telegram:${label}] Message sent successfully`);
    return true;
  } catch (error) {
    console.error(`[Telegram:${label}] Failed to send message:`, error);
    return false;
  }
}

/**
 * Send a message to the admin's private Telegram chat (DM).
 */
export async function sendTelegramMessage(text: string): Promise<boolean> {
  const { botToken, chatId } = getTelegramConfig();
  return sendViaTelegram(botToken, chatId, text, 'DM');
}

/**
 * Send a message to the monitoring group via the Monitor Bot.
 * The OpenClaw agent (Sheger) processes these messages.
 */
export async function sendMonitorTelegramMessage(text: string): Promise<boolean> {
  const { botToken, chatId } = getMonitorTelegramConfig();
  return sendViaTelegram(botToken, chatId, text, 'Monitor');
}
