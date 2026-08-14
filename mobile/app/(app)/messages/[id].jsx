import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useAuth } from '@/src/context/AuthContext'
import { useChat } from '@/src/context/ChatContext'
import api from '@/src/services/api'
import { colors } from '@/src/theme/tokens'
import { apiErrorMessage } from '@/src/utils/errors'

export default function MessageThreadScreen() {
  const { id } = useLocalSearchParams()
  const conversationId = Number(id)
  const router = useRouter()
  const { user } = useAuth()
  const { conversations, subscribe, sendTyping, markRead, upsertConversation } = useChat()
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [typing, setTyping] = useState(false)
  const [peerReadAt, setPeerReadAt] = useState(null)
  const [error, setError] = useState('')
  const listRef = useRef(null)
  const typingTimer = useRef(null)
  const lastTypingAt = useRef(0)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      api.get(`/api/conversations/${conversationId}`),
      api.get(`/api/conversations/${conversationId}/messages`, { params: { limit: 50 } }),
    ])
      .then(([detail, history]) => {
        if (cancelled) return
        setConversation(detail.data)
        setMessages(history.data.items || [])
        upsertConversation(detail.data)
        markRead(conversationId).catch(() => {})
      })
      .catch((err) => {
        if (!cancelled) setError(apiErrorMessage(err, 'No se pudo abrir el chat'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [conversationId, markRead, upsertConversation])

  useEffect(
    () =>
      subscribe((message) => {
        if (message.type === 'presence' && message.user_id === conversation?.peer?.id) {
          setConversation((previous) =>
            previous ? { ...previous, peer_online: message.status === 'online' } : previous,
          )
          return
        }
        if (message.conversation_id !== conversationId) return
        if (message.type === 'message.new' && message.message) {
          setMessages((previous) =>
            previous.some((item) => item.id === message.message.id)
              ? previous
              : [...previous, message.message],
          )
          if (message.message.sender_id !== user?.id) markRead(conversationId).catch(() => {})
        } else if (message.type === 'typing' && message.user_id !== user?.id) {
          setTyping(true)
          clearTimeout(typingTimer.current)
          typingTimer.current = setTimeout(() => setTyping(false), 2200)
        } else if (message.type === 'message.read' && message.user_id !== user?.id) {
          setPeerReadAt(message.last_read_at)
        }
      }),
    [conversation?.peer?.id, conversationId, markRead, subscribe, user?.id],
  )

  useEffect(() => {
    if (messages.length) setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60)
  }, [messages.length])

  const live = conversations.find((item) => item.id === conversationId)
  const peer = live?.peer || conversation?.peer
  const online = live?.peer_online ?? conversation?.peer_online

  async function sendMessage() {
    const text = body.trim()
    if (!text || sending) return
    setSending(true)
    try {
      const { data } = await api.post(`/api/conversations/${conversationId}/messages`, { body: text })
      setMessages((previous) =>
        previous.some((item) => item.id === data.id) ? previous : [...previous, data],
      )
      setBody('')
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo enviar'))
    } finally {
      setSending(false)
    }
  }

  function changeBody(value) {
    setBody(value)
    if (Date.now() - lastTypingAt.current > 1200) {
      lastTypingAt.current = Date.now()
      sendTyping(conversationId)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.headerBody}>
          <Text style={styles.peer}>@{peer?.username || 'chat'}</Text>
          <Text style={[styles.status, (online || typing) && styles.statusOnline]}>
            {typing ? 'Escribiendo…' : online ? 'En línea' : 'Chat 1:1'}
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.cyan} style={styles.loader} />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.messages}
          ListEmptyComponent={<Text style={styles.empty}>Di hola. El chat se actualiza en vivo.</Text>}
          renderItem={({ item }) => {
            const mine = item.sender_id === user?.id
            return (
              <View style={[styles.row, mine ? styles.rowMine : styles.rowPeer]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubblePeer]}>
                  <Text style={styles.messageText}>{item.body}</Text>
                  <Text style={styles.time}>
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {mine && peerReadAt && new Date(peerReadAt) >= new Date(item.created_at)
                      ? ' · leído'
                      : ''}
                  </Text>
                </View>
              </View>
            )
          }}
          ListFooterComponent={typing ? <Text style={styles.typing}>@{peer?.username} está escribiendo…</Text> : null}
        />
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={body}
          onChangeText={changeBody}
          placeholder="Escribe un mensaje…"
          placeholderTextColor={colors.inkFaint}
          multiline
          maxLength={2000}
        />
        <Pressable
          style={[styles.send, (!body.trim() || sending) && styles.disabled]}
          onPress={sendMessage}
          disabled={!body.trim() || sending}
        >
          {sending ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.sendText}>Enviar</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { width: 42, height: 42, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  backText: { color: colors.cyan, fontSize: 30, lineHeight: 32 },
  headerBody: { flex: 1 },
  peer: { color: colors.ink, fontSize: 19, fontWeight: '900' },
  status: { color: colors.inkFaint, marginTop: 2, fontSize: 12 },
  statusOnline: { color: colors.cyan },
  loader: { flex: 1 },
  messages: { padding: 14, flexGrow: 1, justifyContent: 'flex-end' },
  empty: { color: colors.inkFaint, textAlign: 'center', marginVertical: 30 },
  row: { flexDirection: 'row', marginBottom: 8 },
  rowMine: { justifyContent: 'flex-end' },
  rowPeer: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '82%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1 },
  bubbleMine: { backgroundColor: 'rgba(255,213,74,0.14)', borderColor: colors.yellow },
  bubblePeer: { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
  messageText: { color: colors.ink, fontSize: 15, lineHeight: 21 },
  time: { color: colors.inkFaint, fontSize: 9, marginTop: 4, textAlign: 'right' },
  typing: { color: colors.pink, fontSize: 12, marginTop: 5 },
  error: { color: colors.error, paddingHorizontal: 14, paddingBottom: 5 },
  composer: { flexDirection: 'row', gap: 8, padding: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  input: { flex: 1, minHeight: 44, maxHeight: 110, color: colors.ink, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 10 },
  send: { minWidth: 78, borderRadius: 10, backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  sendText: { color: colors.bg, fontWeight: '900' },
  disabled: { opacity: 0.5 },
})
