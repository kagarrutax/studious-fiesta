import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import ScreenHeader from '@/src/components/ScreenHeader'
import { EmptyState } from '@/src/components/StatusBlocks'
import { useNotifications } from '@/src/context/NotificationsContext'
import { colors } from '@/src/theme/tokens'

function noticeText(item) {
  const username = item.actor?.username || item.payload?.actor_username || 'Alguien'
  if (item.type === 'like') return `@${username} indicó que le gusta tu publicación`
  if (item.type === 'comment') return `@${username} comentó tu publicación`
  if (item.type === 'follow') return `@${username} empezó a seguirte`
  if (item.type === 'message') return `@${username} te envió un mensaje`
  return `Nueva actividad de @${username}`
}

export default function NotificationsScreen() {
  const router = useRouter()
  const { items, unread, loading, nextCursor, loadList, markAllRead, markOneRead } =
    useNotifications()

  function openNotice(item) {
    if (!item.read_at) markOneRead(item.id).catch(() => {})
    if (item.type === 'follow' && item.actor_id) {
      router.push(`/(app)/profile/${item.actor_id}`)
    } else if (item.type === 'message' && item.entity_id) {
      router.push(`/(app)/messages/${item.entity_id}`)
    } else {
      router.push('/(app)/feed')
    }
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        refreshing={loading}
        onRefresh={() => loadList({ reset: true }).catch(() => {})}
        ListHeaderComponent={
          <>
            <ScreenHeader
              kicker="BUZÓN EN VIVO"
              title="Avisos"
              subtitle="Likes, comentarios, follows y mensajes en tiempo real."
              right={
                unread > 0 ? (
                  <View style={styles.badge}><Text style={styles.badgeText}>{unread}</Text></View>
                ) : null
              }
            />
            <Pressable
              style={[styles.readAll, unread === 0 && styles.disabled]}
              disabled={unread === 0}
              onPress={() => markAllRead().catch(() => {})}
            >
              <Text style={styles.readAllText}>Marcar todo leído</Text>
            </Pressable>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.cyan} style={styles.loader} />
          ) : (
            <EmptyState
              title="Sin avisos todavía"
              text="La actividad nueva aparecerá aquí al instante."
            />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.notice, !item.read_at && styles.noticeUnread]}
            onPress={() => openNotice(item)}
          >
            <View style={[styles.dot, item.read_at && styles.dotRead]} />
            <View style={styles.noticeBody}>
              <Text style={[styles.noticeText, !item.read_at && styles.noticeTextUnread]}>
                {noticeText(item)}
              </Text>
              <Text style={styles.time}>{new Date(item.created_at).toLocaleString()}</Text>
            </View>
          </Pressable>
        )}
        ListFooterComponent={
          nextCursor ? (
            <Pressable style={styles.more} onPress={() => loadList({ reset: false }).catch(() => {})}>
              <Text style={styles.moreText}>Cargar más</Text>
            </Pressable>
          ) : null
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 36 },
  back: { alignSelf: 'flex-start', borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 18 },
  backText: { color: colors.cyan, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { color: colors.yellow, fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  title: { color: colors.ink, fontSize: 32, fontWeight: '900', marginTop: 5 },
  subtitle: { color: colors.inkMuted, marginTop: 6, marginBottom: 14, lineHeight: 20 },
  badge: { minWidth: 30, height: 30, borderRadius: 15, backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: colors.bg, fontWeight: '900' },
  readAll: { alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.cyan, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 18 },
  readAllText: { color: colors.cyan, fontWeight: '800', fontSize: 12 },
  disabled: { opacity: 0.4 },
  notice: { flexDirection: 'row', gap: 10, backgroundColor: colors.surface, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, borderRadius: 13, padding: 13, marginBottom: 9 },
  noticeUnread: { borderColor: colors.yellow, backgroundColor: colors.surfaceRaised },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.pink, marginTop: 5 },
  dotRead: { backgroundColor: colors.inkFaint },
  noticeBody: { flex: 1 },
  noticeText: { color: colors.inkMuted, lineHeight: 20 },
  noticeTextUnread: { color: colors.ink, fontWeight: '700' },
  time: { color: colors.inkFaint, fontSize: 10, marginTop: 5 },
  empty: { padding: 30, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, borderRadius: 14, alignItems: 'center' },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  emptyText: { color: colors.inkMuted, marginTop: 6, textAlign: 'center' },
  loader: { marginTop: 30 },
  more: { alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, marginTop: 6 },
  moreText: { color: colors.cyan, fontWeight: '800' },
})
