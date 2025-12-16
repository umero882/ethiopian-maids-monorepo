/**
 * PWA Utilities
 *
 * Service worker registration and PWA install prompt handling
 */

import { Platform } from 'react-native';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

/**
 * Check if running as a PWA (installed)
 */
export function isPWA(): boolean {
  if (Platform.OS !== 'web') return false;

  if (typeof window === 'undefined') return false;

  // Check display-mode media query
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  // Check iOS specific property
  const isIOSStandalone = (window.navigator as any).standalone === true;

  // Check Android TWA
  const isTWA = document.referrer.includes('android-app://');

  return isStandalone || isIOSStandalone || isTWA;
}

/**
 * Check if the app can be installed
 */
export function canInstall(): boolean {
  return deferredPrompt !== null;
}

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (Platform.OS !== 'web') return null;

  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[PWA] Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[PWA] Service worker registered:', registration.scope);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            console.log('[PWA] New version available');
            // Optionally notify user about update
            notifyUpdate();
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('[PWA] Service worker registration failed:', error);
    return null;
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (Platform.OS !== 'web') return false;

  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const result = await registration.unregister();
    console.log('[PWA] Service worker unregistered:', result);
    return result;
  } catch (error) {
    console.error('[PWA] Service worker unregistration failed:', error);
    return false;
  }
}

/**
 * Set up install prompt listener
 */
export function setupInstallPrompt(onCanInstall?: () => void): void {
  if (Platform.OS !== 'web') return;

  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();

    // Store the event for later use
    deferredPrompt = e as BeforeInstallPromptEvent;

    console.log('[PWA] Install prompt available');
    onCanInstall?.();
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed');
    deferredPrompt = null;
  });
}

/**
 * Show install prompt to user
 */
export async function showInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) {
    console.log('[PWA] Install prompt not available');
    return false;
  }

  // Show the install prompt
  deferredPrompt.prompt();

  // Wait for user choice
  const { outcome } = await deferredPrompt.userChoice;

  console.log('[PWA] Install prompt outcome:', outcome);

  // Clear the deferred prompt
  deferredPrompt = null;

  return outcome === 'accepted';
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | null> {
  if (Platform.OS !== 'web') return null;

  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.log('[PWA] Notifications not supported');
    return null;
  }

  const permission = await Notification.requestPermission();
  console.log('[PWA] Notification permission:', permission);
  return permission;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(
  vapidPublicKey: string
): Promise<PushSubscription | null> {
  if (Platform.OS !== 'web') return null;

  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    console.log('[PWA] Push subscription:', subscription);
    return subscription;
  } catch (error) {
    console.error('[PWA] Push subscription failed:', error);
    return null;
  }
}

/**
 * Show a notification when update is available
 */
function notifyUpdate(): void {
  // You can implement a toast or banner here
  console.log('[PWA] Update available - refresh to get the latest version');
}

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Check online status
 */
export function isOnline(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return true;
  }
  return navigator.onLine;
}

/**
 * Listen for online/offline events
 */
export function onConnectionChange(callback: (online: boolean) => void): () => void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return () => {};
  }

  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Cache API data for offline use
 */
export async function cacheData(key: string, data: any): Promise<void> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;

  try {
    localStorage.setItem(`cache_${key}`, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.error('[PWA] Cache data failed:', error);
  }
}

/**
 * Get cached data
 */
export function getCachedData<T>(key: string, maxAge?: number): T | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(`cache_${key}`);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);

    // Check if data is stale
    if (maxAge && Date.now() - timestamp > maxAge) {
      localStorage.removeItem(`cache_${key}`);
      return null;
    }

    return data as T;
  } catch (error) {
    console.error('[PWA] Get cached data failed:', error);
    return null;
  }
}
