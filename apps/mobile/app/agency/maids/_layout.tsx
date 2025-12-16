/**
 * Agency Maids Layout
 *
 * Handles navigation headers for agency maids management screens.
 */

import { Stack } from 'expo-router';

export default function AgencyMaidsLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Manage Maids' }} />
      <Stack.Screen name="add" options={{ title: 'Add Maid' }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
