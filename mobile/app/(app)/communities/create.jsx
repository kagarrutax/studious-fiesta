import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import api from '@/src/services/api'
import { apiErrorMessage } from '@/src/utils/errors'
import { colors } from '@/src/theme/tokens'

export default function CreateCommunityScreen() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [rules, setRules] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function create() {
    if (name.trim().length < 2) return
    setBusy(true)
    setError('')
    try {
      const { data } = await api.post('/api/communities', {
        name: name.trim(),
        description: description.trim() || null,
        rules: rules.trim() || null,
      })
      router.replace(`/(app)/communities/${data.id}`)
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo crear la comunidad'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Volver</Text></Pressable>
        <Text style={styles.title}>Crear comunidad</Text>
        <Text style={styles.label}>Nombre *</Text>
        <TextInput value={name} onChangeText={setName} maxLength={100} style={styles.input} placeholder="Ej. Cálculo I" placeholderTextColor={colors.inkFaint} />
        <Text style={styles.label}>Descripción</Text>
        <TextInput value={description} onChangeText={setDescription} multiline maxLength={1000} style={[styles.input, styles.textarea]} placeholder="Objetivo del grupo" placeholderTextColor={colors.inkFaint} />
        <Text style={styles.label}>Reglas</Text>
        <TextInput value={rules} onChangeText={setRules} multiline maxLength={2000} style={[styles.input, styles.textarea]} placeholder="Normas de convivencia" placeholderTextColor={colors.inkFaint} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={[styles.primary, (busy || name.trim().length < 2) && styles.disabled]} onPress={create} disabled={busy || name.trim().length < 2}>
          {busy ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.primaryText}>Crear comunidad</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  back: { color: colors.cyan, fontWeight: '700', marginBottom: 18 },
  title: { color: colors.ink, fontSize: 24, fontWeight: '800', marginBottom: 20 },
  label: { color: colors.inkMuted, fontWeight: '700', marginBottom: 7, marginTop: 12 },
  input: { color: colors.ink, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12 },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  primary: { backgroundColor: colors.pink, borderRadius: 10, alignItems: 'center', paddingVertical: 13, marginTop: 24 },
  primaryText: { color: colors.bg, fontWeight: '800', fontSize: 16 },
  disabled: { opacity: 0.5 },
  error: { color: colors.error, marginTop: 14 },
})
