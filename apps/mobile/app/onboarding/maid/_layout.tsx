/**
 * Maid Profile Onboarding Layout
 *
 * Stack navigator for maid-specific profile steps.
 */

import { Stack } from 'expo-router';

export default function MaidOnboardingLayout() {
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
      <Stack.Screen name="address" />
      <Stack.Screen name="profession" />
      <Stack.Screen name="skills" />
      <Stack.Screen name="experience" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="about" />
      <Stack.Screen name="media" />
      <Stack.Screen name="consents" />
    </Stack>
  );
}
