/**
 * Auth Layout
 *
 * Simple stack navigator for auth screens.
 * This layout ensures auth routes are properly registered before navigation.
 */

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="select-type" />
    </Stack>
  );
}
