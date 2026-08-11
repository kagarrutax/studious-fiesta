import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Link } from 'expo-router'
import api from '../services/api'
import { apiErrorMessage } from '../utils/errors'
import { mediaUrl } from '../utils/media'
import { colors, initials } from '../theme/tokens'

function formatDate(value) {
  try {
    return new Date(value).toLocaleString('es', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return ''
  }
}

export default function PostCard({ post, onUpdated }) {
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState(null)
  const [showComments, setShowComments] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [imageBroken, setImageBroken] = useState(false)

  const imageSrc = mediaUrl(post.image_url)
  const showImage = Boolean(imageSrc) && !imageBroken

  useEffect(() => {
    setImageBroken(false)
  }, [post.id, post.image_url])

  async function toggleLike() {
    setBusy(true)
    setError('')
    try {
      const { data } = await api.post(`/api/posts/${post.id}/like`)
      onUpdated?.({
        ...post,
        likes_count: data.likes_count,
        liked_by_me: data.liked,
      })
    } catch (err) {
      setError(apiErrorMessage(err, 'Error al dar like'))
    } finally {
      setBusy(false)
    }
  }

  async function loadComments() {
    setShowComments(true)
    try {
      const { data } = await api.get(`/api/posts/${post.id}/comments`)
      setComments(data)
    } catch (err) {
      setError(apiErrorMessage(err, 'Error al cargar comentarios'))
    }
  }

  async function submitComment() {
    if (!comment.trim()) return
    setBusy(true)
    setError('')
    try {
      const { data } = await api.post(`/api/posts/${post.id}/comments`, {
        content: comment.trim(),
      })
      setComments((prev) => [...(prev || []), data])
      setComment('')
      onUpdated?.({
        ...post,
        comments_count: (post.comments_count || 0) + 1,
      })
    } catch (err) {
      setError(apiErrorMessage(err, 'Error al comentar'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(post.author?.username)}</Text>
        </View>
        <View style={styles.headerText}>
          <Link href={`/(app)/profile/${post.author?.id}`} asChild>
            <Pressable>
              <Text style={styles.username}>@{post.author?.username}</Text>
            </Pressable>
          </Link>
          <Text style={styles.meta}>{formatDate(post.created_at)}</Text>
        </View>
      </View>

      <Text style={styles.content}>{post.content}</Text>

      {showImage && (
        <Image
          source={{ uri: imageSrc }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setImageBroken(true)}
        />
      )}

      <View style={styles.actions}>
        <Pressable onPress={toggleLike} disabled={busy} style={styles.actionBtn}>
          <Text style={[styles.actionLabel, post.liked_by_me && styles.liked]}>
            {post.liked_by_me ? '♥' : '♡'} {post.likes_count ?? 0} Me gusta
          </Text>
        </Pressable>
        <Pressable onPress={loadComments} style={styles.actionBtn}>
          <Text style={styles.actionLabel}>
            {post.comments_count ?? 0} Comentarios
          </Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {showComments && (
        <View style={styles.comments}>
          {comments === null ? (
            <ActivityIndicator color={colors.cyan} />
          ) : (
            comments.map((item) => (
              <Text key={item.id} style={styles.commentLine}>
                <Text style={styles.commentAuthor}>@{item.author?.username} </Text>
                {item.content}
              </Text>
            ))
          )}
          <View style={styles.commentForm}>
            <TextInput
              style={styles.input}
              value={comment}
              onChangeText={setComment}
              placeholder="Escribe un comentario…"
              placeholderTextColor={colors.inkFaint}
              maxLength={1000}
            />
            <Pressable
              style={[styles.sendBtn, (!comment.trim() || busy) && styles.disabled]}
              onPress={submitComment}
              disabled={busy || !comment.trim()}
            >
              <Text style={styles.sendText}>Enviar</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.yellow, fontWeight: '700', fontSize: 13 },
  headerText: { flex: 1 },
  username: { color: colors.ink, fontWeight: '700', fontSize: 15 },
  meta: { color: colors.inkMuted, fontSize: 12, marginTop: 2 },
  content: { color: colors.ink, fontSize: 15, lineHeight: 22, marginBottom: 10 },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: colors.surfaceRaised,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingTop: 8 },
  actionBtn: { paddingVertical: 4 },
  actionLabel: { color: colors.inkMuted, fontSize: 13, fontWeight: '600' },
  liked: { color: colors.pink },
  error: { color: colors.error, marginTop: 8, fontSize: 13 },
  comments: { marginTop: 12, gap: 8 },
  commentLine: { color: colors.inkMuted, fontSize: 13, lineHeight: 18 },
  commentAuthor: { color: colors.ink, fontWeight: '700' },
  commentForm: { flexDirection: 'row', gap: 8, marginTop: 4 },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  sendBtn: {
    backgroundColor: colors.pink,
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  sendText: { color: colors.ink, fontWeight: '700', fontSize: 13 },
  disabled: { opacity: 0.5 },
})
