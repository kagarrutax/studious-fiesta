import { Stack } from 'expo-router'
import { colors } from '@/src/theme/tokens'

export default function ProfileStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Mi perfil' }} />
      <Stack.Screen name="[id]" options={{ title: 'Perfil' }} />
    </Stack>
  )
}
