/**
 * Root Layout
 *
 * Sets up Apollo Provider, Auth Provider, and navigation structure
 * using Expo Router for file-based routing.
 * Also initializes push notifications for the app.
 */

import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '@ethio/api-client';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { SubscriptionProvider } from '../context/SubscriptionContext';
import { OnboardingProvider } from '../context/OnboardingContext';
import { SoundProvider } from '../context/SoundContext';
import { registerServiceWorker, setupInstallPrompt } from '../utils/pwa';
import { usePushNotifications } from '../hooks';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Initialize push notifications when user is authenticated
  const { isEnabled: pushEnabled, state: pushState } = usePushNotifications(
    isAuthenticated ? user?.uid ?? null : null
  );

  useEffect(() => {
    if (pushEnabled) {
      console.log('[PushNotifications] Push notifications enabled');
    }
    if (pushState.error) {
      console.warn('[PushNotifications] Error:', pushState.error);
    }
  }, [pushEnabled, pushState]);

  useEffect(() => {
    // Hide splash screen once auth is loaded
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inOnboardingGroup = segments[0] === 'onboarding';

    // Delay navigation to ensure routes are fully loaded
    const timeout = setTimeout(() => {
      if (!isAuthenticated && !inAuthGroup && !inOnboardingGroup) {
        // Redirect to login if not authenticated
        router.replace('/auth/login');
      } else if (isAuthenticated && inAuthGroup) {
        // Redirect to home if authenticated and on auth screen
        router.replace('/(tabs)');
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1E40AF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="job"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="auth"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="messages"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="agency"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="sponsor"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="profile"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="maid"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="chat"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="browse"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="interests"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="payment"
          options={{ headerShown: false }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  // Register service worker for PWA on web
  useEffect(() => {
    if (Platform.OS === 'web') {
      registerServiceWorker();
      setupInstallPrompt(() => {
        console.log('[PWA] App can be installed');
      });
    }
  }, []);

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <SafeAreaProvider>
        <ApolloProvider client={apolloClient}>
          <AuthProvider>
            <SubscriptionProvider>
              <ToastProvider>
                <SoundProvider>
                  <OnboardingProvider>
                    <RootLayoutNav />
                  </OnboardingProvider>
                </SoundProvider>
              </ToastProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </ApolloProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
});
