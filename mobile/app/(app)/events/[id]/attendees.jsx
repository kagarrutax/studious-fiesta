import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import api from '@/src/services/api'
import { apiErrorMessage } from '@/src/utils/errors'
import { colors, initials } from '@/src/theme/tokens'

export default function EventAttendeesScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const [attendees, setAttendees] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async (refresh = false, status = '') => {
    if (!id) return
    refresh ? setRefreshing(true) : setLoading(true)
    setError('')
    try {
      const { data } = await api.get(`/api/events/${id}/attendees`, {
        params: { status: status || undefined },
      })
      setAttendees(data || [])
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudieron cargar los asistentes'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [id])

  useFocusEffect(useCallback(() => void load(false, filter), [load]))

  function selectFilter(value) {
    setFilter(value)
    load(false, value)
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Volver</Text></Pressable>
        <Text style={styles.title}>Participantes</Text>
      </View>
      <View style={styles.filters}>
        {[['', 'Todos'], ['going', 'Asistirán'], ['interested', 'Interesados'], ['declined', 'No asistirán']].map(([value, label]) => (
          <Pressable key={value || 'all'} style={[styles.chip, filter === value && styles.chipActive]} onPress={() => selectFilter(value)}>
            <Text style={[styles.chipText, filter === value && styles.chipTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {error ? <View style={styles.errorBox}><Text style={styles.error}>{error}</Text><Pressable onPress={() => load(false, filter)}><Text style={styles.link}>Reintentar</Text></Pressable></View> : null}
      {loading && attendees.length === 0 ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.cyan} /></View>
      ) : (
        <FlatList
          data={attendees}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true, filter)} tintColor={colors.cyan} />}
          ListEmptyComponent={<Text style={styles.empty}>No hay participantes en esta categoría.</Text>}
          renderItem={({ item }) => (
            <Pressable style={styles.person} onPress={() => router.push(`/(app)/profile/${item.id}`)}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{initials(item.username)}</Text></View>
              <View style={styles.personInfo}>
                <Text style={styles.username}>@{item.username}</Text>
                <Text style={styles.status}>{statusLabel(item.status)}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  )
}

function statusLabel(status) {
  if (status === 'going') return 'Asistirá'
  if (status === 'interested') return 'Interesado/a'
  return 'No asistirá'
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { color: colors.cyan, fontWeight: '700' },
  title: { color: colors.ink, fontSize: 22, fontWeight: '800' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7 },
  chipActive: { backgroundColor: colors.surfaceRaised, borderColor: colors.cyan },
  chipText: { color: colors.inkMuted, fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: colors.cyan },
  list: { paddingHorizontal: 16, paddingBottom: 40, flexGrow: 1 },
  person: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 11, padding: 12, marginBottom: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.yellow, fontWeight: '800' },
  personInfo: { flex: 1, marginLeft: 12 },
  username: { color: colors.ink, fontWeight: '800' },
  status: { color: colors.inkMuted, marginTop: 3, fontSize: 12 },
  chevron: { color: colors.cyan, fontSize: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: colors.inkMuted, textAlign: 'center', marginTop: 48 },
  errorBox: { marginHorizontal: 16, marginBottom: 12, padding: 12, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.error },
  error: { color: colors.error },
  link: { color: colors.cyan, fontWeight: '700', marginTop: 8 },
})
