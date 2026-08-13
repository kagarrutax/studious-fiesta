import { useState } from 'react'
import { Link, useRouter } from 'expo-router'
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
import { withApiRetry } from '@/src/utils/withRetry'
import { colors } from '@/src/theme/tokens'

export default function RegisterScreen() {
  const { login } = useAuth()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit() {
    setError('')
    setStatus('')
    setBusy(true)
    try {
      const { data } = await withApiRetry(
        async () => {
          await api.post('/api/auth/register', {
            username: username.trim(),
            email: email.trim(),
            password,
          })
          return api.post('/api/auth/login', {
            email: email.trim(),
            password,
          })
        },
        {
          onWake: () => setStatus('Despertando el servidor… puede tardar ~30–60 s'),
        },
      )
      setStatus('')
      await login(data.access_token)
      router.replace('/(app)/feed')
    } catch (err) {
      setStatus('')
      setError(apiErrorMessage(err, 'No se pudo registrar'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Crear cuenta</Text>
      <Text style={styles.subtitle}>Únete al tablón del campus</Text>

      <TextInput
        style={styles.input}
        autoCapitalize="none"
        placeholder="Usuario"
        placeholderTextColor={colors.inkFaint}
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        placeholderTextColor={colors.inkFaint}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="Contraseña (mín. 8)"
        placeholderTextColor={colors.inkFaint}
        value={password}
        onChangeText={setPassword}
      />

      {status ? <Text style={styles.status}>{status}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.btn, busy && styles.disabled]}
        onPress={onSubmit}
        disabled={busy || !username.trim() || !email.trim() || password.length < 8}
      >
        {busy ? (
          <ActivityIndicator color={colors.bg} />
        ) : (
          <Text style={styles.btnText}>Registrarme</Text>
        )}
      </Pressable>

      <Link href="/(auth)/login" style={styles.link}>
        ¿Ya tienes cuenta? Inicia sesión
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
  status: { color: colors.cyan, marginBottom: 12, fontSize: 13, lineHeight: 18 },
  error: { color: colors.error, marginBottom: 12 },
  btn: {
    backgroundColor: colors.cyan,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: { color: colors.bg, fontWeight: '700', fontSize: 16 },
  disabled: { opacity: 0.6 },
  link: { color: colors.pink, marginTop: 20, textAlign: 'center', fontWeight: '600' },
})
