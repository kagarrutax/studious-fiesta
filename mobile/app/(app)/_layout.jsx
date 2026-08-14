import { Stack } from 'expo-router'
import { colors } from '@/src/theme/tokens'

export default function AppStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="search" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="communities" />
      <Stack.Screen name="resources" />
      <Stack.Screen name="events" />
    </Stack>
  )
}
