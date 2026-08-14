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

const CATEGORIES = ['', 'notes', 'slides', 'exam', 'other']

export default function ResourcesScreen() {
  const router = useRouter()
  const [resources, setResources] = useState([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async (refresh = false, q = '', cat = '') => {
    refresh ? setRefreshing(true) : setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/api/resources', {
        params: { limit: 50, q: q.trim() || undefined, category: cat || undefined },
      })
      setResources(data.items || [])
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudieron cargar los recursos'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(useCallback(() => void load(false, query, category), [load]))

  function selectCategory(next) {
    setCategory(next)
    load(false, query, next)
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Volver</Text></Pressable>
        <Text style={styles.title}>Recursos</Text>
        <Pressable style={styles.primarySmall} onPress={() => router.push('/(app)/resources/create')}>
          <Text style={styles.primaryText}>Subir</Text>
        </Pressable>
      </View>
      <View style={styles.searchRow}>
        <TextInput value={query} onChangeText={setQuery} onSubmitEditing={() => load(false, query, category)} placeholder="Buscar apuntes, exámenes…" placeholderTextColor={colors.inkFaint} style={styles.input} returnKeyType="search" />
        <Pressable style={styles.searchButton} onPress={() => load(false, query, category)}><Text style={styles.searchText}>Buscar</Text></Pressable>
      </View>
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item || 'all'}
        contentContainerStyle={styles.categories}
        showsHorizontalScrollIndicator={false}
        style={styles.categoryList}
        renderItem={({ item }) => (
          <Pressable style={[styles.chip, category === item && styles.chipActive]} onPress={() => selectCategory(item)}>
            <Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item || 'Todo'}</Text>
          </Pressable>
        )}
      />
      {error ? <View style={styles.errorBox}><Text style={styles.error}>{error}</Text><Pressable onPress={() => load(false, query, category)}><Text style={styles.link}>Reintentar</Text></Pressable></View> : null}
      {loading && resources.length === 0 ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.cyan} /></View>
      ) : (
        <FlatList
          data={resources}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true, query, category)} tintColor={colors.cyan} />}
          ListEmptyComponent={<Text style={styles.empty}>No hay recursos con estos filtros.</Text>}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/(app)/resources/${item.id}`)}>
              <View style={styles.cardTop}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.badge}>{item.category}</Text></View>
              <Text style={styles.description} numberOfLines={2}>{item.description || 'Sin descripción'}</Text>
              <Text style={styles.subject}>{item.subject?.name || 'Sin materia'}</Text>
              <Text style={styles.meta}>★ {Number(item.avg_rating || 0).toFixed(1)} · {item.downloads_count || 0} descargas</Text>
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
  searchRow: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 8 },
  input: { flex: 1, color: colors.ink, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10 },
  searchButton: { justifyContent: 'center', paddingHorizontal: 12, borderRadius: 9, borderWidth: 1, borderColor: colors.cyan },
  searchText: { color: colors.cyan, fontWeight: '700' },
  categoryList: { flexGrow: 0, maxHeight: 49 },
  categories: { paddingHorizontal: 16, paddingVertical: 5, gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  chipActive: { backgroundColor: colors.surfaceRaised, borderColor: colors.cyan },
  chipText: { color: colors.inkMuted, textTransform: 'capitalize' },
  chipTextActive: { color: colors.cyan, fontWeight: '700' },
  list: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, color: colors.ink, fontWeight: '800', fontSize: 17 },
  badge: { color: colors.yellow, fontSize: 12, textTransform: 'uppercase' },
  description: { color: colors.inkMuted, marginTop: 7, lineHeight: 19 },
  subject: { color: colors.cyan, marginTop: 9, fontWeight: '700' },
  meta: { color: colors.inkFaint, marginTop: 7, fontSize: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: colors.inkMuted, textAlign: 'center', marginTop: 48 },
  errorBox: { marginHorizontal: 16, padding: 12, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.error },
  error: { color: colors.error },
  link: { color: colors.cyan, fontWeight: '700', marginTop: 8 },
})
