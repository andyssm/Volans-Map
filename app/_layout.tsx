import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="auth"
        options={{ headerShown: false, animation: 'fade' }}
      />
      <Stack.Screen
        name="app"
        options={{ headerShown: false, animation: 'fade' }} // 👈 smooth zoom-like effect
      />
    </Stack>
  );
}
