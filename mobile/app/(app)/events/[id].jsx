import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import api from '@/src/services/api'
import { apiErrorMessage } from '@/src/utils/errors'
import { colors } from '@/src/theme/tokens'

const RSVP_OPTIONS = [
  { value: 'going', label: 'Asistiré' },
  { value: 'interested', label: 'Me interesa' },
  { value: 'declined', label: 'No asistiré' },
]

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get(`/api/events/${id}`)
      setEvent(data)
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo cargar el evento'))
    } finally {
      setLoading(false)
    }
  }, [id])

  useFocusEffect(useCallback(() => void load(), [load]))

  async function rsvp(status) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const { data } = await api.post(`/api/events/${id}/rsvp`, { status })
      setEvent(data)
      setMessage('Tu respuesta se guardó.')
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo guardar tu respuesta'))
    } finally {
      setBusy(false)
    }
  }

  if (loading && !event) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.cyan} /></View>
  }

  if (error && !event) {
    return <View style={styles.center}><Text style={styles.error}>{error}</Text><Pressable onPress={load}><Text style={styles.link}>Reintentar</Text></Pressable><Pressable onPress={() => router.back()}><Text style={styles.link}>Volver</Text></Pressable></View>
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Volver</Text></Pressable>
      <View style={styles.card}>
        <Text style={styles.date}>{formatDate(event?.starts_at)}</Text>
        <Text style={styles.title}>{event?.title}</Text>
        {event?.ends_at ? <Text style={styles.meta}>Finaliza: {formatDate(event.ends_at)}</Text> : null}
        <Text style={styles.location}>{event?.location || 'Ubicación por confirmar'}</Text>
        <Text style={styles.description}>{event?.description || 'Sin descripción'}</Text>
        <Text style={styles.meta}>Creado por @{event?.creator?.username || 'usuario'}</Text>
        {event?.community_id ? <Text style={styles.meta}>Comunidad #{event.community_id}</Text> : null}
        <View style={styles.stats}>
          <Text style={styles.stat}>{event?.going_count || 0} asistirán</Text>
          <Text style={styles.stat}>{event?.interested_count || 0} interesados</Text>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Tu RSVP</Text>
      <View style={styles.options}>
        {RSVP_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={[styles.option, event?.my_status === option.value && styles.optionActive, busy && styles.disabled]}
            onPress={() => rsvp(option.value)}
            disabled={busy}
          >
            <Text style={[styles.optionText, event?.my_status === option.value && styles.optionTextActive]}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={styles.attendees} onPress={() => router.push(`/(app)/events/${id}/attendees`)}>
        <Text style={styles.attendeesText}>Ver asistentes e interesados ›</Text>
      </Pressable>
      {message ? <Text style={styles.success}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  )
}

function formatDate(value) {
  if (!value) return 'Fecha por confirmar'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  back: { color: colors.cyan, fontWeight: '700', marginBottom: 18 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 18 },
  date: { color: colors.yellow, fontWeight: '800' },
  title: { color: colors.ink, fontSize: 25, fontWeight: '800', marginTop: 8 },
  location: { color: colors.cyan, fontWeight: '700', marginTop: 14 },
  description: { color: colors.inkMuted, lineHeight: 21, marginTop: 16 },
  meta: { color: colors.inkFaint, marginTop: 9 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  stat: { color: colors.ink, fontWeight: '700' },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', marginTop: 24, marginBottom: 12 },
  options: { gap: 9 },
  option: { borderWidth: 1, borderColor: colors.border, borderRadius: 9, paddingVertical: 11, alignItems: 'center' },
  optionActive: { backgroundColor: colors.surfaceRaised, borderColor: colors.cyan },
  optionText: { color: colors.inkMuted, fontWeight: '700' },
  optionTextActive: { color: colors.cyan },
  attendees: { marginTop: 22, alignItems: 'center' },
  attendeesText: { color: colors.cyan, fontWeight: '800' },
  success: { color: colors.success, textAlign: 'center', marginTop: 14 },
  error: { color: colors.error, textAlign: 'center', marginTop: 14 },
  link: { color: colors.cyan, fontWeight: '700' },
  disabled: { opacity: 0.5 },
})
