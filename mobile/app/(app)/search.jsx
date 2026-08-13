import { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
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
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSearch() {
    const cleanQuery = query.trim()

    if (!cleanQuery || loading) return

    setLoading(true)
    setError('')

    try {
      const { data } = await api.get('/api/search', {
        params: {
          q: cleanQuery,
        },
      })

      setResults(data)
    } catch (err) {
      setError(apiErrorMessage(err, 'Ocurrió un error al buscar'))
      setResults(null)
    } finally {
      setLoading(false)
    }
  }

  function handlePostUpdated(updatedPost) {
    setResults((prev) => {
      if (!prev) return prev

      return {
        ...prev,
        posts: prev.posts.map((post) =>
          post.id === updatedPost.id ? updatedPost : post,
        ),
      }
    })
  }

  const users = results?.users || []
  const posts = results?.posts || []
  const hasResults = users.length > 0 || posts.length > 0

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Buscar</Text>

      <Text style={styles.subtitle}>
        Encuentra usuarios y publicaciones en Studious Party.
      </Text>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar usuarios o publicaciones..."
          placeholderTextColor={colors.inkFaint}
          maxLength={100}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          autoCapitalize="none"
        />

        <Pressable
          style={[
            styles.searchButton,
            (!query.trim() || loading) && styles.disabled,
          ]}
          onPress={handleSearch}
          disabled={!query.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.ink} size="small" />
          ) : (
            <Text style={styles.searchButtonText}>Buscar</Text>
          )}
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {results && !loading && !hasResults ? (
        <Text style={styles.empty}>No se encontraron resultados.</Text>
      ) : null}

      {users.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usuarios</Text>

          {users.map((user) => (
            <Link
              key={user.id}
              href={`/(app)/profile/${user.id}`}
              asChild
            >
              <Pressable style={styles.userCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {initials(user.username)}
                  </Text>
                </View>

                <View style={styles.userInfo}>
                  <Text style={styles.username}>@{user.username}</Text>

                  {user.bio ? (
                    <Text
                      style={styles.bio}
                      numberOfLines={2}
                    >
                      {user.bio}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            </Link>
          ))}
        </View>
      ) : null}

      {posts.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Publicaciones</Text>

          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onUpdated={handlePostUpdated}
            />
          ))}
        </View>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  container: {
    padding: 16,
    paddingBottom: 40,
  },

  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
  },

  subtitle: {
    color: colors.inkMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },

  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },

  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    color: colors.ink,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
  },

  searchButton: {
    backgroundColor: colors.pink,
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 78,
  },

  searchButtonText: {
    color: colors.ink,
    fontWeight: '700',
    fontSize: 14,
  },

  disabled: {
    opacity: 0.5,
  },

  error: {
    color: colors.error,
    marginBottom: 14,
    textAlign: 'center',
  },

  empty: {
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: 30,
    fontSize: 15,
  },

  section: {
    marginTop: 18,
  },

  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },

  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  avatarText: {
    color: colors.yellow,
    fontSize: 14,
    fontWeight: '800',
  },

  userInfo: {
    flex: 1,
  },

  username: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },

  bio: {
    color: colors.inkMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
})