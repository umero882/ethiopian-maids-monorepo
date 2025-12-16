/**
 * Agency Routes Layout
 *
 * Handles navigation headers for all agency screens.
 * Uses a consistent white header with dark text.
 */

import { Stack } from 'expo-router';

export default function AgencyLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTintColor: '#1F2937',
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen name="dashboard" options={{ title: 'Agency Dashboard' }} />
      <Stack.Screen name="profile" options={{ title: 'Agency Profile' }} />
      <Stack.Screen name="calendar" options={{ title: 'Calendar & Tasks' }} />
      <Stack.Screen name="subscriptions" options={{ title: 'Subscriptions' }} />
      <Stack.Screen name="maids" options={{ headerShown: false }} />
    </Stack>
  );
}
