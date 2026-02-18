/**
 * Onboarding Layout
 *
 * Stack navigator for the onboarding flow.
 * Handles navigation between onboarding steps.
 */

import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      {/* Common onboarding steps */}
      <Stack.Screen name="index" />
      <Stack.Screen name="user-type" />
      <Stack.Screen name="user-intro" />
      <Stack.Screen name="account" />
      <Stack.Screen name="phone-verify" />
      <Stack.Screen name="subscription" />
      <Stack.Screen name="congratulations" />
      <Stack.Screen name="social-proof" />

      {/* Role-specific profile flows */}
      <Stack.Screen name="maid" options={{ headerShown: false }} />
      <Stack.Screen name="sponsor" options={{ headerShown: false }} />
      <Stack.Screen name="agency" options={{ headerShown: false }} />

      {/* Final steps */}
      <Stack.Screen name="reviews" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}
