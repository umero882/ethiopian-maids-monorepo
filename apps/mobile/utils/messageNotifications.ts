/**
 * Message Notifications Utility
 *
 * Provides haptic feedback for new messages.
 * Works on both iOS and Android, with graceful fallback on web.
 *
 * Note: Audio support can be added later by installing expo-av
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Play haptic feedback for new message
 */
export async function playMessageHaptic(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    console.warn('[MessageNotifications] Haptic failed:', error);
  }
}

/**
 * Play light haptic for sent message
 */
export async function playSentMessageHaptic(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    console.warn('[MessageNotifications] Haptic failed:', error);
  }
}

/**
 * Play medium haptic for received message
 */
export async function playReceivedMessageHaptic(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    console.warn('[MessageNotifications] Haptic failed:', error);
  }
}

/**
 * Combined notification for new message (haptic only for now)
 */
export async function notifyNewMessage(): Promise<void> {
  await playReceivedMessageHaptic();
}

/**
 * Notification for sent message (light haptic only)
 */
export async function notifySentMessage(): Promise<void> {
  await playSentMessageHaptic();
}

/**
 * Notification for interest received (stronger haptic)
 */
export async function notifyInterestReceived(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    console.warn('[MessageNotifications] Haptic failed:', error);
  }
}

/**
 * Notification for interest accepted
 */
export async function notifyInterestAccepted(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    // Play a success pattern: two quick haptics
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise(resolve => setTimeout(resolve, 100));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (error) {
    console.warn('[MessageNotifications] Haptic failed:', error);
  }
}

/**
 * Cleanup: no-op for now (audio removed)
 */
export async function cleanup(): Promise<void> {
  // No-op - audio support removed
}

/**
 * Preload sounds: no-op for now (audio removed)
 */
export async function preloadSounds(): Promise<void> {
  // No-op - audio support removed
}

export default {
  playMessageHaptic,
  playSentMessageHaptic,
  playReceivedMessageHaptic,
  notifyNewMessage,
  notifySentMessage,
  notifyInterestReceived,
  notifyInterestAccepted,
  cleanup,
  preloadSounds,
};
