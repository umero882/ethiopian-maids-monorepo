/**
 * Payment Layout
 *
 * Layout for payment-related screens (success, cancel, etc.)
 */

import { Stack } from 'expo-router';

export default function PaymentLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="success" />
    </Stack>
  );
}
