import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import api from '@/src/services/api'
import { apiErrorMessage } from '@/src/utils/errors'
import { colors } from '@/src/theme/tokens'

export default function CommunitiesScreen() {
  const router = useRouter()
  const [communities, setCommunities] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async (refresh = false, q = '') => {
    refresh ? setRefreshing(true) : setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/api/communities', {
        params: { limit: 50, q: q.trim() || undefined },
      })
      setCommunities(data.items || [])
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudieron cargar las comunidades'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(useCallback(() => void load(false, query), [load]))

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Volver</Text></Pressable>
        <Text style={styles.title}>Comunidades</Text>
        <Pressable style={styles.primarySmall} onPress={() => router.push('/(app)/communities/create')}>
          <Text style={styles.primaryText}>Crear</Text>
        </Pressable>
      </View>
      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => load(false, query)}
          placeholder="Buscar comunidad"
          placeholderTextColor={colors.inkFaint}
          style={styles.input}
          returnKeyType="search"
        />
        <Pressable style={styles.searchButton} onPress={() => load(false, query)}>
          <Text style={styles.searchText}>Buscar</Text>
        </Pressable>
      </View>
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={() => load(false, query)}><Text style={styles.link}>Reintentar</Text></Pressable>
        </View>
      ) : null}
      {loading && communities.length === 0 ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.cyan} /></View>
      ) : (
        <FlatList
          data={communities}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true, query)} tintColor={colors.cyan} />
          }
          ListEmptyComponent={<Text style={styles.empty}>No hay comunidades que mostrar.</Text>}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/(app)/communities/${item.id}`)}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                {item.is_member ? <Text style={styles.badge}>Miembro</Text> : null}
              </View>
              <Text style={styles.description}>{item.description || 'Sin descripción'}</Text>
              <Text style={styles.meta}>{item.members_count} miembros · {item.posts_count} publicaciones</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { color: colors.cyan, fontWeight: '700' },
  title: { flex: 1, color: colors.ink, fontSize: 22, fontWeight: '800' },
  primarySmall: { backgroundColor: colors.pink, borderRadius: 8, paddingHorizontal: 13, paddingVertical: 8 },
  primaryText: { color: colors.bg, fontWeight: '800' },
  searchRow: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 0 },
  input: { flex: 1, color: colors.ink, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10 },
  searchButton: { justifyContent: 'center', paddingHorizontal: 12, borderRadius: 9, borderWidth: 1, borderColor: colors.cyan },
  searchText: { color: colors.cyan, fontWeight: '700' },
  list: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, color: colors.ink, fontWeight: '800', fontSize: 17 },
  badge: { color: colors.success, fontSize: 12, fontWeight: '700' },
  description: { color: colors.inkMuted, marginTop: 7, lineHeight: 19 },
  meta: { color: colors.inkFaint, marginTop: 10, fontSize: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: colors.inkMuted, textAlign: 'center', marginTop: 48 },
  errorBox: { margin: 16, marginBottom: 0, padding: 12, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.error },
  error: { color: colors.error },
  link: { color: colors.cyan, fontWeight: '700', marginTop: 8 },
})
