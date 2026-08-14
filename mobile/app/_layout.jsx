import { Stack, useRouter, useSegments } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider, useAuth } from '@/src/context/AuthContext'
import { ChatProvider } from '@/src/context/ChatContext'
import { NotificationsProvider } from '@/src/context/NotificationsContext'
import UpdatePrompt from '@/src/components/UpdatePrompt'
import { colors } from '@/src/theme/tokens'

export { ErrorBoundary } from 'expo-router'

function AuthGate({ children }) {
  const { booting, loading, isAuthenticated } = useAuth()
  const segments = useSegments()
  const router = useRouter()
  const inAuthGroup = segments[0] === '(auth)'

  useEffect(() => {
    if (booting) return
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)')
      return
    }
    if (isAuthenticated && inAuthGroup) {
      router.replace('/(app)/feed')
    }
  }, [booting, isAuthenticated, inAuthGroup, router])

  if (booting || (isAuthenticated && loading && !inAuthGroup && !segments.length)) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.cyan} />
      </View>
    )
  }

  return children
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <UpdatePrompt />
      <ChatProvider>
        <NotificationsProvider>
          <AuthGate>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(app)" />
            </Stack>
          </AuthGate>
        </NotificationsProvider>
      </ChatProvider>
    </AuthProvider>
  )
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
