/**
 * Profile Stack Layout
 *
 * Stack navigator for profile-related screens.
 */

import { Stack } from 'expo-router';

export default function ProfileLayout() {
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
