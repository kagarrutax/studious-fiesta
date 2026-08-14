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
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import PostCard from '@/src/components/PostCard'
import api from '@/src/services/api'
import { apiErrorMessage } from '@/src/utils/errors'
import { colors } from '@/src/theme/tokens'

export default function CommunityDetailScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const [community, setCommunity] = useState(null)
  const [posts, setPosts] = useState([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async (refresh = false) => {
    if (!id) return
    refresh ? setRefreshing(true) : setLoading(true)
    setError('')
    try {
      const [communityRes, postsRes] = await Promise.all([
        api.get(`/api/communities/${id}`),
        api.get(`/api/communities/${id}/posts`, { params: { limit: 50 } }),
      ])
      setCommunity(communityRes.data)
      setPosts(postsRes.data.items || [])
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo cargar la comunidad'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [id])

  useFocusEffect(useCallback(() => void load(), [load]))

  async function toggleMembership() {
    setActionBusy(true)
    setError('')
    try {
      const { data } = community.is_member
        ? await api.delete(`/api/communities/${id}/join`)
        : await api.post(`/api/communities/${id}/join`)
      setCommunity(data)
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo actualizar la membresía'))
    } finally {
      setActionBusy(false)
    }
  }

  async function publish() {
    if (!draft.trim()) return
    setActionBusy(true)
    setError('')
    try {
      const { data } = await api.post(`/api/communities/${id}/posts`, { content: draft.trim() })
      setPosts((current) => [data, ...current])
      setDraft('')
      setCommunity((current) => ({ ...current, posts_count: (current.posts_count || 0) + 1 }))
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo publicar'))
    } finally {
      setActionBusy(false)
    }
  }

  if (loading && !community) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.cyan} /></View>
  }

  if (error && !community) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Pressable onPress={() => load()}><Text style={styles.link}>Reintentar</Text></Pressable>
        <Pressable onPress={() => router.back()}><Text style={styles.link}>Volver</Text></Pressable>
      </View>
    )
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={posts}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.cyan} />}
      ListHeaderComponent={
        <View>
          <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Volver</Text></Pressable>
          <Text style={styles.title}>{community?.name}</Text>
          <Text style={styles.meta}>{community?.members_count} miembros · {community?.posts_count} publicaciones</Text>
          <Text style={styles.description}>{community?.description || 'Sin descripción'}</Text>
          {community?.rules ? <View style={styles.rules}><Text style={styles.rulesTitle}>Reglas</Text><Text style={styles.description}>{community.rules}</Text></View> : null}
          <Pressable style={[styles.membership, actionBusy && styles.disabled]} onPress={toggleMembership} disabled={actionBusy}>
            <Text style={styles.membershipText}>{community?.is_member ? 'Salir de la comunidad' : 'Unirme'}</Text>
          </Pressable>
          {community?.is_member ? (
            <View style={styles.composer}>
              <Text style={styles.sectionTitle}>Publicar en la comunidad</Text>
              <TextInput value={draft} onChangeText={setDraft} multiline maxLength={2000} style={styles.textarea} placeholder="Comparte algo con el grupo" placeholderTextColor={colors.inkFaint} />
              <Pressable style={[styles.primary, (!draft.trim() || actionBusy) && styles.disabled]} onPress={publish} disabled={!draft.trim() || actionBusy}>
                <Text style={styles.primaryText}>Publicar</Text>
              </Pressable>
            </View>
          ) : <Text style={styles.note}>Únete para poder publicar.</Text>}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={styles.sectionTitle}>Publicaciones</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>Todavía no hay publicaciones.</Text>}
      renderItem={({ item }) => (
        <PostCard
          post={item}
          onUpdated={(updated) => setPosts((current) => current.map((post) => post.id === updated.id ? updated : post))}
          onDeleted={(postId) => setPosts((current) => current.filter((post) => post.id !== postId))}
        />
      )}
    />
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  back: { color: colors.cyan, fontWeight: '700', marginBottom: 16 },
  title: { color: colors.ink, fontSize: 25, fontWeight: '800' },
  meta: { color: colors.inkFaint, marginTop: 7 },
  description: { color: colors.inkMuted, lineHeight: 20, marginTop: 10 },
  rules: { backgroundColor: colors.surface, borderRadius: 10, padding: 12, marginTop: 14 },
  rulesTitle: { color: colors.ink, fontWeight: '800' },
  membership: { borderWidth: 1, borderColor: colors.cyan, borderRadius: 9, alignItems: 'center', paddingVertical: 10, marginTop: 16 },
  membershipText: { color: colors.cyan, fontWeight: '800' },
  composer: { marginTop: 22 },
  textarea: { minHeight: 100, color: colors.ink, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, textAlignVertical: 'top' },
  primary: { alignSelf: 'flex-end', backgroundColor: colors.pink, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 10, marginTop: 10 },
  primaryText: { color: colors.bg, fontWeight: '800' },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '800', marginTop: 22, marginBottom: 10 },
  note: { color: colors.inkMuted, marginTop: 14 },
  empty: { color: colors.inkMuted, textAlign: 'center', marginTop: 24 },
  error: { color: colors.error, marginTop: 12, textAlign: 'center' },
  link: { color: colors.cyan, fontWeight: '700' },
  disabled: { opacity: 0.5 },
})
