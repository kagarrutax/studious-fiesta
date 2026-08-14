import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useChat } from '@/src/context/ChatContext'
import { useNotifications } from '@/src/context/NotificationsContext'
import { colors } from '@/src/theme/tokens'

const DESTINATIONS = [
  {
    href: '/(app)/search',
    icon: '⌕',
    title: 'Buscar',
    description: 'Encuentra personas, posts y contenido del campus.',
    accent: colors.yellow,
  },
  {
    href: '/(app)/dashboard',
    icon: '▦',
    title: 'Mi panel',
    description: 'Revisa tu actividad, próximos eventos y progreso XP.',
    accent: colors.cyan,
  },
  {
    href: '/(app)/communities',
    icon: '◎',
    title: 'Comunidades',
    description: 'Conecta con grupos que comparten tus intereses.',
    accent: colors.pink,
  },
  {
    href: '/(app)/resources',
    icon: '▤',
    title: 'Recursos',
    description: 'Explora materiales compartidos por la comunidad.',
    accent: colors.success,
  },
  {
    href: '/(app)/events',
    icon: '◇',
    title: 'Eventos',
    description: 'Descubre actividades y organiza tu agenda.',
    accent: colors.yellow,
  },
  {
    href: '/(app)/notifications',
    icon: '◌',
    title: 'Notificaciones',
    description: 'Consulta las novedades de tu cuenta.',
    accent: colors.cyan,
    badgeKey: 'notifications',
  },
]

export default function ExploreScreen() {
  const router = useRouter()
  const { unread: notificationsUnread } = useNotifications()
  const { unreadTotal } = useChat()

  function badgeFor(item) {
    if (item.badgeKey === 'notifications' && notificationsUnread > 0) return notificationsUnread
    return 0
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>DESCUBRIR</Text>
        <Text style={styles.title}>Todo el campus, en un lugar</Text>
        <Text style={styles.subtitle}>
          Explora espacios, recursos y actividades para sacar más provecho de tu comunidad.
        </Text>
        <View style={styles.heroMeta}>
          <View style={styles.pill}>
            <Text style={styles.pillLabel}>Avisos</Text>
            <Text style={styles.pillValue}>{notificationsUnread}</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillLabel}>Mensajes</Text>
            <Text style={styles.pillValue}>{unreadTotal}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>ATAJOS</Text>

      <View style={styles.grid}>
        {DESTINATIONS.map((item) => {
          const badge = badgeFor(item)
          return (
            <Pressable
              key={item.href}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              onPress={() => router.push(item.href)}
              style={({ pressed }) => [
                styles.card,
                { borderLeftColor: item.accent },
                pressed && styles.cardPressed,
              ]}
            >
              <View style={[styles.iconWrap, { borderColor: item.accent }]}>
                <Text style={[styles.icon, { color: item.accent }]}>{item.icon}</Text>
              </View>
              <View style={styles.cardCopy}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {badge > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
              <Text style={[styles.chevron, { color: item.accent }]}>›</Text>
            </Pressable>
          )
        })}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40, maxWidth: 640, width: '100%', alignSelf: 'center' },
  hero: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 18,
  },
  eyebrow: {
    color: colors.yellow,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  title: { color: colors.ink, fontSize: 26, lineHeight: 32, fontWeight: '900' },
  subtitle: { color: colors.inkMuted, fontSize: 14, lineHeight: 20, marginTop: 10 },
  heroMeta: { flexDirection: 'row', gap: 10, marginTop: 16 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  pillLabel: { color: colors.inkMuted, fontSize: 12, fontWeight: '700' },
  pillValue: { color: colors.yellow, fontSize: 13, fontWeight: '900' },
  sectionLabel: {
    color: colors.inkFaint,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  grid: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 15,
  },
  cardPressed: { opacity: 0.75, backgroundColor: colors.surfaceRaised },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 22, fontWeight: '900' },
  cardCopy: { flex: 1, minWidth: 0 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { color: colors.ink, fontSize: 16, fontWeight: '900', flexShrink: 1 },
  cardDescription: { color: colors.inkMuted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  badge: {
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.bg, fontSize: 11, fontWeight: '900' },
  chevron: { fontSize: 24, fontWeight: '900', lineHeight: 26 },
})
