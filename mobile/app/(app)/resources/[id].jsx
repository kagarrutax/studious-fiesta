import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import api from '@/src/services/api'
import { apiErrorMessage } from '@/src/utils/errors'
import { mediaUrl } from '@/src/utils/media'
import { colors } from '@/src/theme/tokens'

export default function ResourceDetailScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const [resource, setResource] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get(`/api/resources/${id}`)
      setResource(data)
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo cargar el recurso'))
    } finally {
      setLoading(false)
    }
  }, [id])

  useFocusEffect(useCallback(() => void load(), [load]))

  async function download() {
    if (!resource?.file_url) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api.get(`/api/resources/${id}/download`, { responseType: 'arraybuffer' })
      const url = mediaUrl(resource.file_url)
      const supported = await Linking.canOpenURL(url)
      if (!supported) throw new Error('unsupported-url')
      await Linking.openURL(url)
      setResource((current) => ({ ...current, downloads_count: (current.downloads_count || 0) + 1 }))
      setMessage('Recurso abierto en el visor del dispositivo.')
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo abrir la descarga'))
    } finally {
      setBusy(false)
    }
  }

  async function rate(score) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const { data } = await api.post(`/api/resources/${id}/rate`, { score })
      setResource((current) => ({ ...current, ...data }))
      setMessage(`Tu valoración: ${score}/5`)
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo guardar la valoración'))
    } finally {
      setBusy(false)
    }
  }

  if (loading && !resource) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.cyan} /></View>
  }

  if (error && !resource) {
    return <View style={styles.center}><Text style={styles.error}>{error}</Text><Pressable onPress={load}><Text style={styles.link}>Reintentar</Text></Pressable><Pressable onPress={() => router.back()}><Text style={styles.link}>Volver</Text></Pressable></View>
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Volver</Text></Pressable>
      <View style={styles.card}>
        <Text style={styles.category}>{resource?.category}</Text>
        <Text style={styles.title}>{resource?.title}</Text>
        <Text style={styles.subject}>{resource?.subject?.name || 'Sin materia'}</Text>
        <Text style={styles.description}>{resource?.description || 'Sin descripción'}</Text>
        <Text style={styles.meta}>Subido por @{resource?.uploader?.username || 'usuario'}</Text>
        <Text style={styles.meta}>{formatBytes(resource?.size_bytes)} · {resource?.file_type || 'archivo'}</Text>
        <View style={styles.stats}>
          <Text style={styles.stat}>★ {Number(resource?.avg_rating || 0).toFixed(1)}</Text>
          <Text style={styles.stat}>{resource?.downloads_count || 0} descargas</Text>
        </View>
        <Pressable style={[styles.primary, busy && styles.disabled]} onPress={download} disabled={busy}>
          {busy ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.primaryText}>Descargar / abrir</Text>}
        </Pressable>
      </View>
      <Text style={styles.sectionTitle}>Valorar recurso</Text>
      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((score) => (
          <Pressable key={score} style={[styles.starButton, resource?.my_rating === score && styles.starActive]} onPress={() => rate(score)} disabled={busy}>
            <Text style={styles.star}>{score}★</Text>
          </Pressable>
        ))}
      </View>
      {message ? <Text style={styles.success}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  )
}

function formatBytes(value) {
  if (!value) return 'Tamaño desconocido'
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  back: { color: colors.cyan, fontWeight: '700', marginBottom: 18 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 18 },
  category: { color: colors.yellow, fontWeight: '800', textTransform: 'uppercase', fontSize: 12 },
  title: { color: colors.ink, fontSize: 24, fontWeight: '800', marginTop: 8 },
  subject: { color: colors.cyan, fontWeight: '700', marginTop: 8 },
  description: { color: colors.inkMuted, lineHeight: 21, marginTop: 16 },
  meta: { color: colors.inkFaint, marginTop: 9 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  stat: { color: colors.ink, fontWeight: '700' },
  primary: { backgroundColor: colors.pink, borderRadius: 9, alignItems: 'center', paddingVertical: 12, marginTop: 20 },
  primaryText: { color: colors.bg, fontWeight: '800' },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', marginTop: 24, marginBottom: 12 },
  ratingRow: { flexDirection: 'row', gap: 7 },
  starButton: { flex: 1, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 10 },
  starActive: { backgroundColor: colors.surfaceRaised, borderColor: colors.yellow },
  star: { color: colors.yellow, fontWeight: '800' },
  success: { color: colors.success, marginTop: 15 },
  error: { color: colors.error, marginTop: 15, textAlign: 'center' },
  link: { color: colors.cyan, fontWeight: '700' },
  disabled: { opacity: 0.5 },
})
