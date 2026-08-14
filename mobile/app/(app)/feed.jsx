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
      const { data } = await withApiRetry(() => api.get('/api/posts', { params: { limit: 30 } }), {
        onWake: () => setWaking(true),
      })
      setPosts(data.items || [])
      setWaking(false)
    } catch (err) {
      setWaking(false)
      setError(apiErrorMessage(err, 'No se pudo cargar el feed'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadFeed()
    }, [loadFeed]),
  )

  function updatePost(updated) {
    setPosts((prev) => prev.map((post) => (post.id === updated.id ? updated : post)))
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadFeed(true)}
            tintColor={colors.cyan}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Aún no hay publicaciones. ¡Sé el primero!</Text>
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
