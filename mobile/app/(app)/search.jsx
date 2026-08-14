import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Link, useLocalSearchParams } from 'expo-router'
import PostCard from '@/src/components/PostCard'
import ScreenHeader from '@/src/components/ScreenHeader'
import { EmptyState, ErrorState } from '@/src/components/StatusBlocks'
import api from '@/src/services/api'
import { apiErrorMessage } from '@/src/utils/errors'
import { colors, initials } from '@/src/theme/tokens'

const TABS = [
  { id: 'users', label: 'Usuarios' },
  { id: 'posts', label: 'Posts' },
  { id: 'communities', label: 'Comunidades' },
  { id: 'events', label: 'Eventos' },
  { id: 'resources', label: 'Recursos' },
]

const EMPTY_RESULTS = {
  users: [],
  posts: [],
  communities: [],
  events: [],
  resources: [],
}

function formatWhen(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })
}

function ResultLink({ href, title, meta, children }) {
  return (
    <Link href={href} asChild>
      <Pressable style={styles.resultCard}>
        {children}
        <View style={styles.resultCopy}>
          <Text style={styles.resultTitle}>{title}</Text>
          {meta ? <Text style={styles.resultMeta}>{meta}</Text> : null}
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
    </Link>
  )
}

export default function SearchScreen() {
  const params = useLocalSearchParams()
  const initialQuery = String(params.q || '').replace(/^#/, '')
  const [query, setQuery] = useState(initialQuery)
  const [tab, setTab] = useState('posts')
  const [results, setResults] = useState(EMPTY_RESULTS)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  async function runSearch(nextTab = tab, nextQuery = query) {
    const text = String(nextQuery || '').trim().replace(/^#/, '')
    if (!text) return
    setLoading(true)
    setError('')
    setSearched(true)
    try {
      const { data } = await api.get('/api/search', {
        params: { q: text, type: nextTab },
      })
      setResults({ ...EMPTY_RESULTS, ...data })
    } catch (err) {
      setError(apiErrorMessage(err, 'Ocurrió un error al buscar'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initialQuery) return
    setQuery(initialQuery)
    setTab('posts')
    runSearch('posts', initialQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery])

  function selectTab(nextTab) {
    setTab(nextTab)
    setSearched(false)
    setResults(EMPTY_RESULTS)
    if (query.trim()) runSearch(nextTab)
  }

  function updatePost(updated) {
    setResults((prev) => ({
      ...prev,
      posts: prev.posts.map((post) => (post.id === updated.id ? updated : post)),
    }))
  }

  function deletePost(postId) {
    setResults((prev) => ({
      ...prev,
      posts: prev.posts.filter((post) => post.id !== postId),
    }))
  }

  const items = results[tab] || []
  const empty = searched && !loading && items.length === 0

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <ScreenHeader
          kicker="CAMPUS"
          title="Buscar"
          subtitle="Personas, posts, comunidades, eventos y recursos."
        />
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar en el campus…"
            placeholderTextColor={colors.inkFaint}
            maxLength={100}
            returnKeyType="search"
            onSubmitEditing={() => runSearch()}
          />
          <Pressable
            style={[styles.btn, (!query.trim() || loading) && styles.disabled]}
            onPress={() => runSearch()}
            disabled={loading || !query.trim()}
          >
            {loading ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.btnText}>Buscar</Text>}
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
          keyboardShouldPersistTaps="handled"
        >
          {TABS.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.tab, tab === item.id && styles.tabActive]}
              onPress={() => selectTab(item.id)}
            >
              <Text style={[styles.tabText, tab === item.id && styles.tabTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {error ? (
        <View style={styles.errorWrap}>
          <ErrorState message={error} onRetry={() => runSearch()} />
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {empty ? (
          <EmptyState title="Sin resultados" text="Prueba con otra palabra o cambia de pestaña." />
        ) : null}

        {results.users.map((user) => (
          <ResultLink
            key={user.id}
            href={`/(app)/profile/${user.id}`}
            title={`@${user.username}`}
            meta="Ver perfil"
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(user.username)}</Text>
            </View>
          </ResultLink>
        ))}

        {results.posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onUpdated={updatePost}
            onDeleted={deletePost}
          />
        ))}

        {results.communities.map((community) => (
          <ResultLink
            key={community.id}
            href={`/(app)/communities/${community.id}`}
            title={community.name}
            meta={`@${community.slug} · ${community.members_count || 0} miembros`}
          />
        ))}

        {results.events.map((event) => (
          <ResultLink
            key={event.id}
            href={`/(app)/events/${event.id}`}
            title={event.title}
            meta={[formatWhen(event.starts_at), event.location].filter(Boolean).join(' · ')}
          />
        ))}

        {results.resources.map((resource) => (
          <ResultLink
            key={resource.id}
            href={`/(app)/resources/${resource.id}`}
            title={resource.title}
            meta={resource.category}
          />
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  controls: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  searchRow: { flexDirection: 'row', gap: 8 },
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
  tabs: { gap: 8, paddingTop: 12 },
  tab: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  tabActive: { backgroundColor: colors.surfaceRaised, borderColor: colors.yellow },
  tabText: { color: colors.inkMuted, fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: colors.yellow },
  errorWrap: { paddingHorizontal: 16, paddingTop: 12 },
  list: { padding: 16, paddingBottom: 32 },
  empty: { color: colors.inkMuted, textAlign: 'center', marginTop: 24 },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  resultCopy: { flex: 1, gap: 3 },
  resultTitle: { color: colors.ink, fontWeight: '800', fontSize: 15 },
  resultMeta: { color: colors.inkMuted, fontSize: 12 },
  chevron: { color: colors.cyan, fontSize: 24 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.yellow, fontWeight: '800', fontSize: 12 },
})
