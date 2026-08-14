import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useFocusEffect, useRouter, Link } from 'expo-router'
import PostCard from '@/src/components/PostCard'
import { useAuth } from '@/src/context/AuthContext'
import api from '@/src/services/api'
import { apiErrorMessage } from '@/src/utils/errors'
import { mediaUrl } from '@/src/utils/media'
import { colors, initials } from '@/src/theme/tokens'

export default function MyProfileScreen() {
  const { user, logout, setUser } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [gamification, setGamification] = useState(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ bio: '', career: '', university: '', semester: '' })

  const load = useCallback(async (isRefresh = false) => {
    if (!user?.id) return
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const [meRes, postsRes, followersRes, followingRes, gameRes] = await Promise.all([
        api.get(`/api/users/${user.id}`),
        api.get('/api/posts', { params: { author_id: user.id, limit: 50 } }),
        api.get(`/api/users/${user.id}/followers`),
        api.get(`/api/users/${user.id}/following`),
        api.get('/api/gamification/me'),
      ])
      setProfile(meRes.data)
      setPosts(postsRes.data.items || [])
      setFollowers(followersRes.data || [])
      setFollowing(followingRes.data || [])
      setGamification(gameRes.data)
      setForm({
        bio: meRes.data.bio || '',
        career: meRes.data.career || '',
        university: meRes.data.university || '',
        semester: meRes.data.semester ? String(meRes.data.semester) : '',
      })
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

  async function saveProfile() {
    setSaving(true)
    try {
      const payload = {
        bio: form.bio.trim() || null,
        career: form.career.trim() || null,
        university: form.university.trim() || null,
        semester: form.semester ? Number(form.semester) : null,
      }
      const { data } = await api.patch('/api/auth/me', payload)
      setUser(data)
      setProfile((previous) => ({ ...previous, ...data }))
      setEditing(false)
    } catch (err) {
      Alert.alert('No se pudo guardar', apiErrorMessage(err, 'Revisa los datos'))
    } finally {
      setSaving(false)
    }
  }

  async function changeImage(kind) {
    let result
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.82,
        aspect: kind === 'cover' ? [16, 6] : [1, 1],
      })
    } catch (err) {
      Alert.alert('No se pudo abrir la galería', apiErrorMessage(err, 'Intenta de nuevo'))
      return
    }
    if (result.canceled) return
    const asset = result.assets[0]
    const formData = new FormData()
    formData.append('image', {
      uri: asset.uri,
      name: asset.fileName || `${kind}.jpg`,
      type: asset.mimeType || 'image/jpeg',
    })
    try {
      const { data } = await api.post(`/api/auth/me/${kind}`, formData)
      setUser(data)
      setProfile((previous) => ({ ...previous, ...data }))
    } catch (err) {
      Alert.alert('No se pudo subir', apiErrorMessage(err, 'Intenta otra imagen'))
    }
  }

  function updatePost(updated) {
    setPosts((prev) => prev.map((post) => (post.id === updated.id ? updated : post)))
  }

  function deletePost(postId) {
    setPosts((prev) => prev.filter((post) => post.id !== postId))
  }

  const avatar = mediaUrl(user?.avatar_url)
  const cover = mediaUrl(profile?.cover_url)

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
          <Pressable style={styles.cover} onPress={() => changeImage('cover')}>
            {cover ? <Image source={{ uri: cover }} style={styles.coverImage} /> : null}
            <Text style={styles.coverLabel}>{cover ? 'Cambiar portada' : 'Añadir portada'}</Text>
          </Pressable>
          <View style={styles.avatarWrap}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarText}>{initials(user.username)}</Text>
            )}
          </View>
          <Pressable style={styles.photoAction} onPress={() => changeImage('avatar')}>
            <Text style={styles.photoActionText}>Cambiar foto</Text>
          </Pressable>
          <Text style={styles.username}>@{user.username}</Text>
          <Text style={styles.email}>{user.email}</Text>
          {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
          <View style={styles.counts}>
            <Text style={styles.countText}>{profile?.followers_count ?? 0} seguidores</Text>
            <Text style={styles.countText}>{profile?.following_count ?? 0} siguiendo</Text>
          </View>
          <View style={styles.xpCard}>
            <Text style={styles.xpTitle}>Nivel {gamification?.level ?? profile?.level ?? 1}</Text>
            <Text style={styles.xpText}>
              {gamification?.xp ?? profile?.xp ?? 0} XP · siguiente nivel {gamification?.next_level_xp ?? 0} XP
            </Text>
            {gamification?.badges?.length ? (
              <View style={styles.badges}>
                {gamification.badges.map((badge) => (
                  <View key={badge.code} style={styles.badge}>
                    <Text style={styles.badgeText}>{badge.name}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
          <Pressable style={styles.editProfile} onPress={() => setEditing((value) => !value)}>
            <Text style={styles.editProfileText}>{editing ? 'Cancelar edición' : 'Editar perfil'}</Text>
          </Pressable>
          {editing ? (
            <View style={styles.editForm}>
              <TextInput
                style={styles.field}
                value={form.bio}
                onChangeText={(bio) => setForm((previous) => ({ ...previous, bio }))}
                placeholder="Biografía"
                placeholderTextColor={colors.inkFaint}
                multiline
              />
              <TextInput
                style={styles.field}
                value={form.career}
                onChangeText={(career) => setForm((previous) => ({ ...previous, career }))}
                placeholder="Carrera"
                placeholderTextColor={colors.inkFaint}
              />
              <TextInput
                style={styles.field}
                value={form.university}
                onChangeText={(university) => setForm((previous) => ({ ...previous, university }))}
                placeholder="Universidad"
                placeholderTextColor={colors.inkFaint}
              />
              <TextInput
                style={styles.field}
                value={form.semester}
                onChangeText={(semester) => setForm((previous) => ({ ...previous, semester }))}
                placeholder="Semestre"
                placeholderTextColor={colors.inkFaint}
                keyboardType="number-pad"
              />
              <Pressable style={[styles.saveProfile, saving && styles.disabled]} onPress={saveProfile} disabled={saving}>
                <Text style={styles.saveProfileText}>{saving ? 'Guardando…' : 'Guardar cambios'}</Text>
              </Pressable>
            </View>
          ) : null}
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
            <Text style={styles.followersEmpty}>Nadie te sigue todavía.</Text>
          )}
          {following.length > 0 ? (
            <View style={styles.followers}>
              <Text style={styles.followersTitle}>Siguiendo</Text>
              <View style={styles.followingWrap}>
                {following.map((person) => (
                  <Link key={person.id} href={`/(app)/profile/${person.id}`} asChild>
                    <Pressable style={styles.followerChip}>
                      <Text style={styles.followerText}>@{person.username}</Text>
                    </Pressable>
                  </Link>
                ))}
              </View>
            </View>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={styles.logout} onPress={onLogout}>
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </Pressable>
          <Text style={styles.section}>Mis publicaciones</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>Aún no has publicado nada.</Text>}
      renderItem={({ item }) => (
        <PostCard post={item} onUpdated={updatePost} onDeleted={deletePost} />
      )}
    />
  )
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 16 },
  cover: {
    width: '100%',
    height: 112,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -30,
  },
  coverImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  coverLabel: { color: colors.yellow, backgroundColor: 'rgba(15,45,35,0.82)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, fontSize: 11, fontWeight: '800' },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.bg,
  },
  avatarImg: { width: 72, height: 72 },
  avatarText: { color: colors.yellow, fontWeight: '800', fontSize: 22 },
  photoAction: { marginBottom: 8 },
  photoActionText: { color: colors.cyan, fontSize: 11, fontWeight: '800' },
  username: { color: colors.ink, fontSize: 22, fontWeight: '800' },
  email: { color: colors.inkMuted, marginTop: 4 },
  bio: { color: colors.ink, marginTop: 10, textAlign: 'center', lineHeight: 20 },
  counts: { flexDirection: 'row', gap: 16, marginTop: 10 },
  countText: { color: colors.inkMuted, fontSize: 13, fontWeight: '600' },
  xpCard: { width: '100%', backgroundColor: colors.surface, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.yellow, borderRadius: 12, padding: 12, marginTop: 14 },
  xpTitle: { color: colors.yellow, fontWeight: '900', fontSize: 16 },
  xpText: { color: colors.inkMuted, fontSize: 12, marginTop: 3 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 9 },
  badge: { backgroundColor: colors.surfaceRaised, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  badgeText: { color: colors.cyan, fontSize: 10, fontWeight: '800' },
  editProfile: { marginTop: 12, borderWidth: 1, borderColor: colors.cyan, borderRadius: 9, paddingHorizontal: 14, paddingVertical: 9 },
  editProfileText: { color: colors.cyan, fontWeight: '800', fontSize: 12 },
  editForm: { width: '100%', marginTop: 10, gap: 8 },
  field: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 9, color: colors.ink, paddingHorizontal: 12, paddingVertical: 10 },
  saveProfile: { backgroundColor: colors.pink, borderRadius: 9, alignItems: 'center', padding: 11 },
  saveProfileText: { color: colors.bg, fontWeight: '900' },
  disabled: { opacity: 0.5 },
  followers: { width: '100%', marginTop: 16 },
  followingWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
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
