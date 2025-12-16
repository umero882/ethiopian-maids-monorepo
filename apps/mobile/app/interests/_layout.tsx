/**
 * Interests Routes Layout
 *
 * Handles navigation headers for interests screens.
 */

import { Stack } from 'expo-router';

export default function InterestsLayout() {
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
    />
  );
}
