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
} from 'react-native'
import { useRouter } from 'expo-router'
import api from '@/src/services/api'
import { apiErrorMessage } from '@/src/utils/errors'
import { colors } from '@/src/theme/tokens'

export default function CreateEventScreen() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [communityId, setCommunityId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function create() {
    if (!title.trim() || !startsAt.trim()) return
    const start = new Date(startsAt.trim())
    const end = endsAt.trim() ? new Date(endsAt.trim()) : null
    if (Number.isNaN(start.getTime()) || (end && Number.isNaN(end.getTime()))) {
      setError('Usa fechas ISO válidas, por ejemplo 2026-09-20T15:00:00Z')
      return
    }
    if (end && end < start) {
      setError('La fecha de fin debe ser posterior al inicio')
      return
    }
    setBusy(true)
    setError('')
    try {
      const { data } = await api.post('/api/events', {
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        starts_at: startsAt.trim(),
        ends_at: endsAt.trim() || null,
        community_id: communityId.trim() ? Number(communityId) : null,
      })
      router.replace(`/(app)/events/${data.id}`)
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo crear el evento'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Volver</Text></Pressable>
        <Text style={styles.title}>Crear evento</Text>
        <Text style={styles.label}>Título *</Text>
        <TextInput value={title} onChangeText={setTitle} maxLength={200} style={styles.input} placeholder="Ej. Hackathon campus" placeholderTextColor={colors.inkFaint} />
        <Text style={styles.label}>Descripción</Text>
        <TextInput value={description} onChangeText={setDescription} multiline style={[styles.input, styles.textarea]} placeholder="Detalles del evento" placeholderTextColor={colors.inkFaint} />
        <Text style={styles.label}>Ubicación</Text>
        <TextInput value={location} onChangeText={setLocation} style={styles.input} placeholder="Aula, edificio o enlace" placeholderTextColor={colors.inkFaint} />
        <Text style={styles.label}>Inicio ISO *</Text>
        <TextInput value={startsAt} onChangeText={setStartsAt} autoCapitalize="none" style={styles.input} placeholder="2026-09-20T15:00:00Z" placeholderTextColor={colors.inkFaint} />
        <Text style={styles.label}>Fin ISO (opcional)</Text>
        <TextInput value={endsAt} onChangeText={setEndsAt} autoCapitalize="none" style={styles.input} placeholder="2026-09-20T18:00:00Z" placeholderTextColor={colors.inkFaint} />
        <Text style={styles.label}>ID de comunidad (opcional)</Text>
        <TextInput value={communityId} onChangeText={setCommunityId} keyboardType="number-pad" style={styles.input} placeholder="Ej. 12" placeholderTextColor={colors.inkFaint} />
        <Text style={styles.help}>Las fechas se envían tal como se escriben en formato ISO 8601.</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={[styles.primary, (busy || !title.trim() || !startsAt.trim()) && styles.disabled]} onPress={create} disabled={busy || !title.trim() || !startsAt.trim()}>
          {busy ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.primaryText}>Crear evento</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  back: { color: colors.cyan, fontWeight: '700', marginBottom: 18 },
  title: { color: colors.ink, fontSize: 24, fontWeight: '800', marginBottom: 14 },
  label: { color: colors.inkMuted, fontWeight: '700', marginBottom: 7, marginTop: 12 },
  input: { color: colors.ink, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12 },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  help: { color: colors.inkFaint, fontSize: 12, marginTop: 10 },
  primary: { backgroundColor: colors.pink, borderRadius: 10, alignItems: 'center', paddingVertical: 13, marginTop: 24 },
  primaryText: { color: colors.bg, fontWeight: '800', fontSize: 16 },
  disabled: { opacity: 0.5 },
  error: { color: colors.error, marginTop: 14 },
})
