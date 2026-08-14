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
import { useFocusEffect, useLocalSearchParams, useRouter, Link } from 'expo-router'
import PostCard from '@/src/components/PostCard'
import { useAuth } from '@/src/context/AuthContext'
import { useChat } from '@/src/context/ChatContext'
import api from '@/src/services/api'
import { apiErrorMessage } from '@/src/utils/errors'
import { mediaUrl } from '@/src/utils/media'
import { colors, initials } from '@/src/theme/tokens'

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams()
  const { user: me } = useAuth()
  const { openWithUser } = useChat()
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [followBusy, setFollowBusy] = useState(false)
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [error, setError] = useState('')

  const isOwn = Boolean(me && String(me.id) === String(id))

  const load = useCallback(async (isRefresh = false) => {
    if (!id) return
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const [userRes, postsRes, followersRes, followingRes] = await Promise.all([
        api.get(`/api/users/${id}`),
        api.get('/api/posts', { params: { author_id: id, limit: 50 } }),
        api.get(`/api/users/${id}/followers`),
        api.get(`/api/users/${id}/following`),
      ])
      setProfile(userRes.data)
      setPosts(postsRes.data.items || [])
      setFollowers(followersRes.data || [])
      setFollowing(followingRes.data || [])
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

  function deletePost(postId) {
    setPosts((prev) => prev.filter((post) => post.id !== postId))
  }

  async function toggleFollow() {
    if (!id || isOwn) return
    setFollowBusy(true)
    setError('')
    try {
      const { data } = profile?.is_following
        ? await api.delete(`/api/users/${id}/follow`)
        : await api.post(`/api/users/${id}/follow`)
      setProfile((prev) => ({
        ...prev,
        is_following: data.following,
        followers_count: data.followers_count,
      }))
      const { data: list } = await api.get(`/api/users/${id}/followers`)
      setFollowers(list || [])
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo actualizar el follow'))
    } finally {
      setFollowBusy(false)
    }
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
  const cover = mediaUrl(profile?.cover_url)

  async function openChat() {
    try {
      const conversation = await openWithUser(Number(id))
      router.push(`/(app)/messages/${conversation.id}`)
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo abrir el chat'))
    }
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
          <View style={styles.cover}>
            {cover ? <Image source={{ uri: cover }} style={styles.coverImage} /> : null}
          </View>
          <View style={styles.avatarWrap}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarText}>{initials(profile?.username)}</Text>
            )}
          </View>
          <Text style={styles.username}>@{profile?.username}</Text>
          {[profile?.career, profile?.university, profile?.semester ? `Semestre ${profile.semester}` : null]
            .filter(Boolean)
            .length ? (
            <Text style={styles.academic}>
              {[profile?.career, profile?.university, profile?.semester ? `Semestre ${profile.semester}` : null]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          ) : null}
          {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
          <Text style={styles.xp}>Nivel {profile?.level ?? 1} · {profile?.xp ?? 0} XP</Text>
          {profile?.badges?.length ? (
            <View style={styles.badges}>
              {profile.badges.map((badge) => (
                <View key={badge.code} style={styles.badge}>
                  <Text style={styles.badgeText}>{badge.name}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <View style={styles.counts}>
            <Text style={styles.countText}>{profile?.followers_count ?? 0} seguidores</Text>
            <Text style={styles.countText}>{profile?.following_count ?? 0} siguiendo</Text>
          </View>
          {followers.length > 0 ? (
            <View style={styles.followers}>
              <Text style={styles.followersTitle}>Seguidores</Text>
              {followers.map((person) => (
                <Link key={person.id} href={`/(app)/profile/${person.id}`} asChild>
                  <Pressable style={styles.followerChip}>
                    <Text style={styles.followerText}>@{person.username}</Text>
                  </Pressable>
                </Link>
              ))}
            </View>
          ) : (
            <Text style={styles.followersEmpty}>Nadie sigue este perfil todavía.</Text>
          )}
          {!isOwn ? (
            <View style={styles.profileActions}>
              <Pressable
                style={[styles.followBtn, profile?.is_following && styles.unfollowBtn, followBusy && styles.disabled]}
                onPress={toggleFollow}
                disabled={followBusy}
              >
                <Text style={[styles.followText, profile?.is_following && styles.unfollowText]}>
                  {profile?.is_following ? 'Dejar de seguir' : 'Seguir'}
                </Text>
              </Pressable>
              <Pressable style={styles.messageBtn} onPress={openChat}>
                <Text style={styles.messageText}>Mensaje</Text>
              </Pressable>
            </View>
          ) : null}
          {following.length ? (
            <Text style={styles.followingSummary}>
              Sigue a {following.slice(0, 3).map((person) => `@${person.username}`).join(', ')}
              {following.length > 3 ? ` y ${following.length - 3} más` : ''}
            </Text>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={styles.section}>Publicaciones</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>Este usuario aún no ha publicado.</Text>}
      renderItem={({ item }) => (
        <PostCard post={item} onUpdated={updatePost} onDeleted={deletePost} />
      )}
    />
  )
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 16 },
  cover: { width: '100%', height: 110, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, overflow: 'hidden', marginBottom: -30 },
  coverImage: { width: '100%', height: '100%' },
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
  academic: { color: colors.cyan, marginTop: 6, textAlign: 'center', fontSize: 12 },
  bio: { color: colors.ink, marginTop: 10, textAlign: 'center', lineHeight: 20 },
  xp: { color: colors.yellow, marginTop: 8, fontWeight: '800' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 8 },
  badge: { backgroundColor: colors.surfaceRaised, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  badgeText: { color: colors.cyan, fontSize: 10, fontWeight: '800' },
  counts: { flexDirection: 'row', gap: 16, marginTop: 10 },
  countText: { color: colors.inkMuted, fontSize: 13, fontWeight: '600' },
  followers: { width: '100%', marginTop: 16 },
  followersTitle: { color: colors.ink, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  followerChip: {
    alignSelf: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
  },
  followerText: { color: colors.ink, fontWeight: '600' },
  followersEmpty: { color: colors.inkMuted, marginTop: 12, fontSize: 13 },
  profileActions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  followBtn: {
    backgroundColor: colors.pink,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  unfollowBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  followText: { color: colors.ink, fontWeight: '700' },
  unfollowText: { color: colors.pink },
  messageBtn: { borderWidth: 1, borderColor: colors.cyan, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 8 },
  messageText: { color: colors.cyan, fontWeight: '800' },
  followingSummary: { color: colors.inkFaint, marginTop: 12, textAlign: 'center', fontSize: 11 },
  disabled: { opacity: 0.5 },
  section: {
    alignSelf: 'flex-start',
    color: colors.ink,
    fontWeight: '700',
    fontSize: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  empty: { color: colors.inkMuted, textAlign: 'center', marginTop: 12 },
  error: { color: colors.error, textAlign: 'center', marginTop: 8 },
})
