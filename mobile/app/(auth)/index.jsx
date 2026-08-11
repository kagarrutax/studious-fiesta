import { Link } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '@/src/theme/tokens'

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Studious Party</Text>
      <Text style={styles.tagline}>La red social del campus, ahora en el móvil.</Text>
      <Link href="/(auth)/login" asChild>
        <Pressable style={styles.primary}>
          <Text style={styles.primaryText}>Iniciar sesión</Text>
        </Pressable>
      </Link>
      <Link href="/(auth)/register" asChild>
        <Pressable style={styles.secondary}>
          <Text style={styles.secondaryText}>Crear cuenta</Text>
        </Pressable>
      </Link>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  brand: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.pink,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 16,
    color: colors.inkMuted,
    marginBottom: 36,
    lineHeight: 24,
  },
  primary: {
    backgroundColor: colors.pink,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryText: { color: colors.ink, fontWeight: '700', fontSize: 16 },
  secondary: {
    borderWidth: 1,
    borderColor: colors.cyan,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryText: { color: colors.cyan, fontWeight: '700', fontSize: 16 },
})
