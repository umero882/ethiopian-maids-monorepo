/**
 * Messages Routes Layout
 *
 * Handles navigation headers for messages screens.
 */

import { Stack } from 'expo-router';

export default function MessagesLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Messages' }} />
      <Stack.Screen name="[id]" options={{ title: 'Conversation' }} />
    </Stack>
  );
}
