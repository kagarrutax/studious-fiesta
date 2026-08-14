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
import { useFocusEffect } from 'expo-router'
import PostCard from '@/src/components/PostCard'
import api from '@/src/services/api'
import { apiErrorMessage } from '@/src/utils/errors'
import { withApiRetry } from '@/src/utils/withRetry'
import { colors } from '@/src/theme/tokens'

export default function FeedScreen() {
  const [tab, setTab] = useState('global')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [waking, setWaking] = useState(false)
  const [error, setError] = useState('')

  const loadFeed = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')
    setWaking(false)
    try {
      const endpoint = tab === 'following' ? '/api/feed' : '/api/posts'
      const { data } = await withApiRetry(() => api.get(endpoint, { params: { limit: 50 } }), {
        onWake: () => setWaking(true),
      })
      const items = data.items || []
      setPosts(tab === 'saved' ? items.filter((post) => post.saved_by_me) : items)
      setWaking(false)
    } catch (err) {
      setWaking(false)
      setError(apiErrorMessage(err, 'No se pudo cargar el feed'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [tab])

  useFocusEffect(
    useCallback(() => {
      loadFeed()
    }, [loadFeed]),
  )

  function updatePost(updated) {
    setPosts((prev) => {
      const next = prev.map((post) => (post.id === updated.id ? updated : post))
      return tab === 'saved' ? next.filter((post) => post.saved_by_me) : next
    })
  }

  function handlePostDeleted(postId) {
    setPosts((prev) => prev.filter((post) => post.id !== postId))
  }

  if (loading && posts.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.cyan} />
        <Text style={styles.hint}>
          {waking ? 'Despertando el servidor…' : 'Cargando tablón…'}
        </Text>
        {waking ? (
          <Text style={styles.subhint}>Render free puede tardar ~30–60 s la primera vez.</Text>
        ) : null}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => loadFeed()} style={styles.retry}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.tabs}>
            <Pressable
              style={[styles.tab, tab === 'global' && styles.tabActive]}
              onPress={() => setTab('global')}
            >
              <Text style={[styles.tabText, tab === 'global' && styles.tabTextActive]}>Global</Text>
            </Pressable>
            <Pressable
              style={[styles.tab, tab === 'following' && styles.tabActive]}
              onPress={() => setTab('following')}
            >
              <Text style={[styles.tabText, tab === 'following' && styles.tabTextActive]}>
                Siguiendo
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, tab === 'saved' && styles.tabActive]}
              onPress={() => setTab('saved')}
            >
              <Text style={[styles.tabText, tab === 'saved' && styles.tabTextActive]}>
                Guardados
              </Text>
            </Pressable>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadFeed(true)}
            tintColor={colors.cyan}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            {tab === 'saved'
              ? 'Aún no has guardado publicaciones.'
              : tab === 'following'
                ? 'Sigue a alguien para ver su tablón aquí.'
                : 'Aún no hay publicaciones. ¡Sé el primero!'}
          </Text>
        }
        renderItem={({ item }) => (
          <PostCard post={item} onUpdated={updatePost} onDeleted={handlePostDeleted} />
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  hint: { color: colors.inkMuted, textAlign: 'center' },
  subhint: { color: colors.inkFaint, fontSize: 12, textAlign: 'center' },
  list: { padding: 16, paddingBottom: 32 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tab: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  tabActive: { borderColor: colors.yellow, backgroundColor: colors.surfaceRaised },
  tabText: { color: colors.inkMuted, fontWeight: '800' },
  tabTextActive: { color: colors.yellow },
  empty: { color: colors.inkMuted, textAlign: 'center', marginTop: 40 },
  errorBox: {
    margin: 16,
    marginBottom: 0,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderColor: colors.error,
    borderWidth: 1,
  },
  errorText: { color: colors.error, marginBottom: 8 },
  retry: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryText: { color: colors.cyan, fontWeight: '700' },
})
