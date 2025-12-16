/**
 * Job Routes Layout
 *
 * Handles navigation headers for job screens.
 */

import { Stack } from 'expo-router';

export default function JobLayout() {
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
      <Stack.Screen name="[id]" options={{ title: 'Job Details' }} />
    </Stack>
  );
}
