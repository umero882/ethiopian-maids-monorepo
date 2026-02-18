/**
 * Agency Profile Onboarding Layout
 *
 * Stack navigator for agency-specific profile steps.
 */

import { Stack } from 'expo-router';

export default function AgencyOnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen name="basic" />
      <Stack.Screen name="biometric-doc" />
      <Stack.Screen name="coverage" />
      <Stack.Screen name="contact" />
      <Stack.Screen name="representative" />
      <Stack.Screen name="services" />
      <Stack.Screen name="about" />
      <Stack.Screen name="consents" />
    </Stack>
  );
}
