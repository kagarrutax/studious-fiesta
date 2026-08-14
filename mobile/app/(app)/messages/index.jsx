import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useChat } from '@/src/context/ChatContext'
import { colors, initials } from '@/src/theme/tokens'
import { mediaUrl } from '@/src/utils/media'

function Avatar({ user, size = 46 }) {
  const source = mediaUrl(user?.avatar_url)
  if (source) return <Image source={{ uri: source }} style={[styles.avatarImage, { width: size, height: size }]} />
  return (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.avatarText}>{initials(user?.username)}</Text>
    </View>
  )
}

export default function MessagesScreen() {
  const router = useRouter()
  const { conversations, onlineUsers, loading, loadInbox, openWithUser } = useChat()
  const [openingId, setOpeningId] = useState(null)

  useEffect(() => {
    loadInbox().catch(() => {})
  }, [loadInbox])

  async function openUser(userId) {
    setOpeningId(userId)
    try {
      const conversation = await openWithUser(userId)
      router.push(`/(app)/messages/${conversation.id}`)
    } finally {
      setOpeningId(null)
    }
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        refreshing={loading}
        onRefresh={() => loadInbox().catch(() => {})}
        ListHeaderComponent={
          <>
            <Text style={styles.kicker}>CHAT EN VIVO</Text>
            <Text style={styles.title}>Mensajes</Text>
            <Text style={styles.subtitle}>Conversaciones privadas que se actualizan al instante.</Text>
            {onlineUsers.length ? (
              <View style={styles.onlineCard}>
                <Text style={styles.sectionTitle}>En línea</Text>
                <FlatList
                  horizontal
                  data={onlineUsers}
                  keyExtractor={(item) => String(item.id)}
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <Pressable style={styles.onlineUser} onPress={() => openUser(item.id)}>
                      <View>
                        <Avatar user={item} size={42} />
                        <View style={styles.onlineDot} />
                      </View>
                      <Text style={styles.onlineName} numberOfLines={1}>{item.username}</Text>
                      {openingId === item.id ? <ActivityIndicator size="small" color={colors.cyan} /> : null}
                    </Pressable>
                  )}
                />
              </View>
            ) : null}
            <View style={styles.headingRow}>
              <Text style={styles.sectionTitle}>Inbox</Text>
              <Text style={styles.count}>{conversations.length}</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.cyan} style={styles.loader} />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Sin conversaciones</Text>
              <Text style={styles.emptyText}>Busca un usuario o toca una persona activa para comenzar.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.conversation, item.unread_count > 0 && styles.conversationUnread]}
            onPress={() => router.push(`/(app)/messages/${item.id}`)}
          >
            <View>
              <Avatar user={item.peer} />
              {item.peer_online ? <View style={styles.onlineDot} /> : null}
            </View>
            <View style={styles.conversationBody}>
              <Text style={styles.peer}>@{item.peer?.username}</Text>
              <Text style={[styles.preview, item.unread_count > 0 && styles.previewUnread]} numberOfLines={1}>
                {item.last_message?.body || 'Sin mensajes todavía'}
              </Text>
            </View>
            {item.unread_count > 0 ? (
              <View style={styles.badge}><Text style={styles.badgeText}>{item.unread_count}</Text></View>
            ) : null}
          </Pressable>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 36 },
  kicker: { color: colors.yellow, fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  title: { color: colors.ink, fontSize: 32, fontWeight: '900', marginTop: 5 },
  subtitle: { color: colors.inkMuted, lineHeight: 21, marginTop: 5, marginBottom: 18 },
  onlineCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
  },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '900', marginBottom: 10 },
  onlineUser: { width: 70, alignItems: 'center', marginRight: 8, gap: 3 },
  onlineName: { color: colors.inkMuted, fontSize: 11, maxWidth: 66 },
  avatarImage: { borderRadius: 99, borderWidth: 1, borderColor: colors.yellow },
  avatarFallback: { backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.yellow, fontWeight: '900', fontSize: 12 },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.cyan,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  count: { color: colors.cyan, fontWeight: '800' },
  conversation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 14,
    padding: 13,
    marginBottom: 10,
  },
  conversationUnread: { borderColor: colors.yellow },
  conversationBody: { flex: 1, minWidth: 0 },
  peer: { color: colors.ink, fontWeight: '900', fontSize: 16 },
  preview: { color: colors.inkMuted, marginTop: 3 },
  previewUnread: { color: colors.ink, fontWeight: '700' },
  badge: { minWidth: 24, height: 24, borderRadius: 12, backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: colors.bg, fontSize: 11, fontWeight: '900' },
  empty: { padding: 28, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, borderRadius: 14 },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  emptyText: { color: colors.inkMuted, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  loader: { marginTop: 28 },
})
