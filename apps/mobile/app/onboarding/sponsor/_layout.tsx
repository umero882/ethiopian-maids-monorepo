/**
 * Sponsor Profile Onboarding Layout
 *
 * Stack navigator for sponsor-specific profile steps.
 */

import { Stack } from 'expo-router';

export default function SponsorOnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen name="personal" />
      <Stack.Screen name="biometric-doc" />
      <Stack.Screen name="location" />
      <Stack.Screen name="family" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="budget" />
      <Stack.Screen name="accommodation" />
      <Stack.Screen name="consents" />
    </Stack>
  );
}
