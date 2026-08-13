import { useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Link } from 'expo-router'
import PostCard from '@/src/components/PostCard'
import api from '@/src/services/api'
import { apiErrorMessage } from '@/src/utils/errors'
import { colors, initials } from '@/src/theme/tokens'

export default function SearchScreen() {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  async function runSearch() {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setSearched(true)
    try {
      const { data } = await api.get('/api/search', { params: { q: query.trim() } })
      setUsers(data.users || [])
      setPosts(data.posts || [])
    } catch (err) {
      setError(apiErrorMessage(err, 'Ocurrió un error al buscar'))
    } finally {
      setLoading(false)
    }
  }

  function updatePost(updated) {
    setPosts((prev) => prev.map((post) => (post.id === updated.id ? updated : post)))
  }

  function deletePost(postId) {
    setPosts((prev) => prev.filter((post) => post.id !== postId))
  }

  const empty = searched && !loading && users.length === 0 && posts.length === 0

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar usuarios o publicaciones…"
          placeholderTextColor={colors.inkFaint}
          maxLength={100}
          returnKeyType="search"
          onSubmitEditing={runSearch}
        />
        <Pressable
          style={[styles.btn, (!query.trim() || loading) && styles.disabled]}
          onPress={runSearch}
          disabled={loading || !query.trim()}
        >
          {loading ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
            <Text style={styles.btnText}>Buscar</Text>
          )}
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {empty ? <Text style={styles.empty}>No se encontraron resultados.</Text> : null}
            {users.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.heading}>Usuarios</Text>
                {users.map((u) => (
                  <Link key={u.id} href={`/(app)/profile/${u.id}`} asChild>
                    <Pressable style={styles.userRow}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initials(u.username)}</Text>
                      </View>
                      <Text style={styles.username}>@{u.username}</Text>
                    </Pressable>
                  </Link>
                ))}
              </View>
            ) : null}
            {posts.length > 0 ? <Text style={styles.heading}>Publicaciones</Text> : null}
          </>
        }
        renderItem={({ item }) => (
          <PostCard post={item} onUpdated={updatePost} onDeleted={deletePost} />
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchRow: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 8 },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    color: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  btn: {
    backgroundColor: colors.pink,
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  btnText: { color: colors.ink, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  error: { color: colors.error, paddingHorizontal: 16, marginBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  empty: { color: colors.inkMuted, textAlign: 'center', marginTop: 24 },
  section: { marginBottom: 16 },
  heading: { color: colors.ink, fontWeight: '800', fontSize: 16, marginBottom: 10, marginTop: 8 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.yellow, fontWeight: '700', fontSize: 12 },
  username: { color: colors.ink, fontWeight: '700' },
})
