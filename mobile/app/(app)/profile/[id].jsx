import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useFocusEffect, useLocalSearchParams } from 'expo-router'
import PostCard from '@/src/components/PostCard'
import api from '@/src/services/api'
import { apiErrorMessage } from '@/src/utils/errors'
import { mediaUrl } from '@/src/utils/media'
import { colors, initials } from '@/src/theme/tokens'

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async (isRefresh = false) => {
    if (!id) return
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const [userRes, postsRes] = await Promise.all([
        api.get(`/api/users/${id}`),
        api.get('/api/posts'),
      ])
      setProfile(userRes.data)
      setPosts(postsRes.data.filter((p) => String(p.author_id) === String(id)))
    } catch (err) {
      setError(apiErrorMessage(err, 'Perfil no disponible'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [id])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load]),
  )

  function updatePost(updated) {
    setPosts((prev) => prev.map((post) => (post.id === updated.id ? updated : post)))
  }

  if (loading && !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.cyan} />
      </View>
    )
  }

  if (error && !profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    )
  }

  const avatar = mediaUrl(profile?.avatar_url)

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
              <Text style={styles.avatarText}>{initials(profile?.username)}</Text>
            )}
          </View>
          <Text style={styles.username}>@{profile?.username}</Text>
          {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
          <Text style={styles.section}>Publicaciones</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>Este usuario aún no ha publicado.</Text>}
      renderItem={({ item }) => <PostCard post={item} onUpdated={updatePost} />}
    />
  )
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
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
  bio: { color: colors.ink, marginTop: 10, textAlign: 'center', lineHeight: 20 },
  section: {
    alignSelf: 'flex-start',
    color: colors.ink,
    fontWeight: '700',
    fontSize: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  empty: { color: colors.inkMuted, textAlign: 'center', marginTop: 12 },
  error: { color: colors.error, textAlign: 'center' },
})
