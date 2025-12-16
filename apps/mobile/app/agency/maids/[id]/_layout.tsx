/**
 * Agency Maid Detail Layout
 */

import { Stack } from 'expo-router';

export default function MaidDetailLayout() {
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
      }}
    />
  );
}
