/**
 * Chat Routes Layout
 */

import { Stack } from 'expo-router';

export default function ChatLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide default header - chat screen has custom header
      }}
    />
  );
}
