import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import PostCard from '@/src/components/PostCard'
import { useAuth } from '@/src/context/AuthContext'
import api from '@/src/services/api'
import { apiErrorMessage } from '@/src/utils/errors'
import { mediaUrl } from '@/src/utils/media'
import { colors, initials } from '@/src/theme/tokens'

export default function MyProfileScreen() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async (isRefresh = false) => {
    if (!user?.id) return
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/api/posts')
      setPosts(data.filter((p) => String(p.author_id) === String(user.id)))
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo cargar el perfil'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user?.id])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load]),
  )

  async function onLogout() {
    await logout()
    router.replace('/(auth)')
  }

  function updatePost(updated) {
    setPosts((prev) => prev.map((post) => (post.id === updated.id ? updated : post)))
  }

  const avatar = mediaUrl(user?.avatar_url)

  if (!user || (loading && posts.length === 0)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.cyan} />
      </View>
    )
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={posts}
      keyExtractor={(item) => String(item.id)}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.cyan} />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarText}>{initials(user.username)}</Text>
            )}
          </View>
          <Text style={styles.username}>@{user.username}</Text>
          <Text style={styles.email}>{user.email}</Text>
          {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={styles.logout} onPress={onLogout}>
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </Pressable>
          <Text style={styles.section}>Mis publicaciones</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>Aún no has publicado nada.</Text>}
      renderItem={({ item }) => <PostCard post={item} onUpdated={updatePost} />}
    />
  )
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 16 },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  avatarImg: { width: 72, height: 72 },
  avatarText: { color: colors.yellow, fontWeight: '800', fontSize: 22 },
  username: { color: colors.ink, fontSize: 22, fontWeight: '800' },
  email: { color: colors.inkMuted, marginTop: 4 },
  bio: { color: colors.ink, marginTop: 10, textAlign: 'center', lineHeight: 20 },
  error: { color: colors.error, marginTop: 8 },
  logout: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  logoutText: { color: colors.pink, fontWeight: '700' },
  section: {
    alignSelf: 'flex-start',
    color: colors.ink,
    fontWeight: '700',
    fontSize: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  empty: { color: colors.inkMuted, textAlign: 'center', marginTop: 12 },
})
