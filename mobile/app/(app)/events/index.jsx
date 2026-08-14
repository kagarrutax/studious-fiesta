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
import { useFocusEffect, useRouter } from 'expo-router'
import api from '@/src/services/api'
import { apiErrorMessage } from '@/src/utils/errors'
import { colors } from '@/src/theme/tokens'

export default function EventsScreen() {
  const router = useRouter()
  const [events, setEvents] = useState([])
  const [upcoming, setUpcoming] = useState(true)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async (refresh = false, nextUpcoming = true) => {
    refresh ? setRefreshing(true) : setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/api/events', { params: { limit: 50, upcoming: nextUpcoming } })
      setEvents(data.items || [])
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudieron cargar los eventos'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(useCallback(() => void load(false, upcoming), [load]))

  function changeFilter(value) {
    setUpcoming(value)
    load(false, value)
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Volver</Text></Pressable>
        <Text style={styles.title}>Eventos</Text>
        <Pressable style={styles.primarySmall} onPress={() => router.push('/(app)/events/create')}>
          <Text style={styles.primaryText}>Crear</Text>
        </Pressable>
      </View>
      <View style={styles.filters}>
        <Pressable style={[styles.filter, upcoming && styles.filterActive]} onPress={() => changeFilter(true)}><Text style={[styles.filterText, upcoming && styles.filterTextActive]}>Próximos</Text></Pressable>
        <Pressable style={[styles.filter, !upcoming && styles.filterActive]} onPress={() => changeFilter(false)}><Text style={[styles.filterText, !upcoming && styles.filterTextActive]}>Todos</Text></Pressable>
      </View>
      {error ? <View style={styles.errorBox}><Text style={styles.error}>{error}</Text><Pressable onPress={() => load(false, upcoming)}><Text style={styles.link}>Reintentar</Text></Pressable></View> : null}
      {loading && events.length === 0 ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.cyan} /></View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true, upcoming)} tintColor={colors.cyan} />}
          ListEmptyComponent={<Text style={styles.empty}>No hay eventos que mostrar.</Text>}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/(app)/events/${item.id}`)}>
              <Text style={styles.date}>{formatDate(item.starts_at)}</Text>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.description} numberOfLines={2}>{item.description || 'Sin descripción'}</Text>
              <Text style={styles.location}>{item.location || 'Ubicación por confirmar'}</Text>
              <Text style={styles.meta}>{item.going_count} asistirán · {item.interested_count} interesados</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  )
}

function formatDate(value) {
  if (!value) return 'Fecha por confirmar'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { color: colors.cyan, fontWeight: '700' },
  title: { flex: 1, color: colors.ink, fontSize: 22, fontWeight: '800' },
  primarySmall: { backgroundColor: colors.pink, borderRadius: 8, paddingHorizontal: 13, paddingVertical: 8 },
  primaryText: { color: colors.bg, fontWeight: '800' },
  filters: { flexDirection: 'row', margin: 16, borderRadius: 9, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  filter: { flex: 1, alignItems: 'center', paddingVertical: 9 },
  filterActive: { backgroundColor: colors.surfaceRaised },
  filterText: { color: colors.inkMuted, fontWeight: '700' },
  filterTextActive: { color: colors.cyan },
  list: { paddingHorizontal: 16, paddingBottom: 40, flexGrow: 1 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, marginBottom: 12 },
  date: { color: colors.yellow, fontWeight: '800', fontSize: 12 },
  cardTitle: { color: colors.ink, fontWeight: '800', fontSize: 18, marginTop: 7 },
  description: { color: colors.inkMuted, marginTop: 7, lineHeight: 19 },
  location: { color: colors.cyan, marginTop: 10, fontWeight: '700' },
  meta: { color: colors.inkFaint, marginTop: 8, fontSize: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: colors.inkMuted, textAlign: 'center', marginTop: 48 },
  errorBox: { marginHorizontal: 16, marginBottom: 12, padding: 12, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.error },
  error: { color: colors.error },
  link: { color: colors.cyan, fontWeight: '700', marginTop: 8 },
})
