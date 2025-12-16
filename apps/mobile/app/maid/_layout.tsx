/**
 * Maid Routes Layout
 *
 * Handles navigation headers for all maid screens.
 */

import { Stack } from 'expo-router';

export default function MaidLayout() {
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
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Maid Profile',
        }}
      />
      <Stack.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          title: 'My Profile',
        }}
      />
      <Stack.Screen
        name="availability"
        options={{
          title: 'Availability',
        }}
      />
      <Stack.Screen
        name="bookings"
        options={{
          title: 'Bookings',
        }}
      />
      <Stack.Screen
        name="documents"
        options={{
          title: 'Documents',
        }}
      />
      <Stack.Screen
        name="subscriptions"
        options={{
          title: 'Subscriptions',
        }}
      />
    </Stack>
  );
}
