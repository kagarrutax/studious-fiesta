import { useState } from 'react'
import { Link, Redirect, useRouter } from 'expo-router'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native'
import { useAuth } from '@/src/context/AuthContext'
import api from '@/src/services/api'
import { apiErrorMessage } from '@/src/utils/errors'
import { colors } from '@/src/theme/tokens'

export default function LoginScreen() {
  const { login, isAuthenticated } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (isAuthenticated) {
    return <Redirect href="/(app)/feed" />
  }

  async function onSubmit() {
    setError('')
    setBusy(true)
    try {
      const { data } = await api.post('/api/auth/login', {
        email: email.trim(),
        password,
      })
      await login(data.access_token)
      router.replace('/(app)/feed')
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo iniciar sesión'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Bienvenido</Text>
      <Text style={styles.subtitle}>Entra con tu cuenta Studious Party</Text>

      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        placeholder="Email"
        placeholderTextColor={colors.inkFaint}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="Contraseña"
        placeholderTextColor={colors.inkFaint}
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.btn, busy && styles.disabled]}
        onPress={onSubmit}
        disabled={busy || !email.trim() || !password}
      >
        {busy ? (
          <ActivityIndicator color={colors.ink} />
        ) : (
          <Text style={styles.btnText}>Entrar</Text>
        )}
      </Pressable>

      <Link href="/(auth)/register" style={styles.link}>
        ¿No tienes cuenta? Regístrate
      </Link>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: colors.bg, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink, marginBottom: 6 },
  subtitle: { color: colors.inkMuted, marginBottom: 24 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    color: colors.ink,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  error: { color: colors.error, marginBottom: 12 },
  btn: {
    backgroundColor: colors.pink,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: { color: colors.ink, fontWeight: '700', fontSize: 16 },
  disabled: { opacity: 0.6 },
  link: { color: colors.cyan, marginTop: 20, textAlign: 'center', fontWeight: '600' },
})
