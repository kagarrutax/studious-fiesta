import { useCallback, useState } from 'react'
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Link, useFocusEffect } from 'expo-router'
import ScreenHeader from '@/src/components/ScreenHeader'
import { ErrorState, LoadingState } from '@/src/components/StatusBlocks'
import api from '@/src/services/api'
import { useAuth } from '@/src/context/AuthContext'
import { apiErrorMessage } from '@/src/utils/errors'
import { colors, initials } from '@/src/theme/tokens'

const PERSONAL_STATS = [
  { key: 'posts', label: 'Mis posts' },
  { key: 'likes_received', label: 'Me gusta' },
  { key: 'comments_received', label: 'Comentarios' },
  { key: 'followers', label: 'Seguidores' },
  { key: 'following', label: 'Siguiendo' },
  { key: 'communities', label: 'Comunidades' },
  { key: 'resources', label: 'Recursos' },
  { key: 'unread_notifications', label: 'Avisos' },
]

function formatWhen(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })
}

function Section({ title, action, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action}
      </View>
      {children}
    </View>
  )
}

function SectionLink({ href, children }) {
  return (
    <Link href={href} asChild>
      <Pressable>
        <Text style={styles.sectionLink}>{children}</Text>
      </Pressable>
    </Link>
  )
}

function ListLink({ href, title, meta }) {
  return (
    <Link href={href} asChild>
      <Pressable style={styles.listRow}>
        <View style={styles.listCopy}>
          <Text style={styles.listTitle}>{title}</Text>
          {meta ? <Text style={styles.listMeta}>{meta}</Text> : null}
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
    </Link>
  )
}

function Empty({ children }) {
  return <Text style={styles.empty}>{children}</Text>
}

export default function DashboardScreen() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const [statsResponse, leaderboardResponse] = await Promise.all([
        api.get('/api/stats'),
        api.get('/api/gamification/leaderboard', { params: { limit: 10 } }),
      ])
      setStats(statsResponse.data)
      setLeaderboard(Array.isArray(leaderboardResponse.data) ? leaderboardResponse.data : [])
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo cargar el panel'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadDashboard()
    }, [loadDashboard]),
  )

  const personalXp = leaderboard.find((entry) => entry.id === user?.id)

  if (loading && !stats) {
    return <LoadingState label="Cargando tu panel…" />
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadDashboard(true)}
          tintColor={colors.cyan}
        />
      }
    >
      <ScreenHeader
        kicker="TU CAMPUS"
        title="Panel"
        subtitle="Tu actividad y próximos pasos en el campus"
      />

      {error ? <ErrorState message={error} onRetry={() => loadDashboard()} /> : null}

      {stats ? (
        <>
          {personalXp ? (
            <View style={styles.xpCard}>
              <View>
                <Text style={styles.eyebrow}>TU PROGRESO</Text>
                <Text style={styles.xpValue}>{personalXp.xp} XP</Text>
              </View>
              <View style={styles.levelPill}>
                <Text style={styles.levelText}>Nivel {personalXp.level}</Text>
              </View>
            </View>
          ) : null}

          <Section title="Tu cuenta">
            <View style={styles.statGrid}>
              {PERSONAL_STATS.map((item) => (
                <View key={item.key} style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.me?.[item.key] ?? 0}</Text>
                  <Text style={styles.statLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </Section>

          <Section
            title="Próximos eventos"
            action={<SectionLink href="/(app)/events">Ver agenda</SectionLink>}
          >
            {(stats.upcoming_events || []).length ? (
              stats.upcoming_events.map((event) => (
                <ListLink
                  key={event.id}
                  href={`/(app)/events/${event.id}`}
                  title={event.title}
                  meta={[
                    formatWhen(event.starts_at),
                    event.location,
                    `${event.going_count || 0} van`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                />
              ))
            ) : (
              <Empty>No hay eventos próximos.</Empty>
            )}
          </Section>

          <Section
            title="Mis comunidades"
            action={<SectionLink href="/(app)/communities">Explorar</SectionLink>}
          >
            {(stats.my_communities || []).length ? (
              stats.my_communities.map((community) => (
                <ListLink
                  key={community.id}
                  href={`/(app)/communities/${community.id}`}
                  title={community.name}
                  meta={`@${community.slug}`}
                />
              ))
            ) : (
              <Empty>Aún no te unes a ninguna comunidad.</Empty>
            )}
          </Section>

          <Section
            title="Mis recursos"
            action={<SectionLink href="/(app)/resources">Biblioteca</SectionLink>}
          >
            {(stats.my_resources || []).length ? (
              stats.my_resources.map((resource) => (
                <ListLink
                  key={resource.id}
                  href={`/(app)/resources/${resource.id}`}
                  title={resource.title}
                />
              ))
            ) : (
              <Empty>Aún no has subido recursos.</Empty>
            )}
          </Section>

          <Section title="Ranking XP">
            {leaderboard.length ? (
              leaderboard.map((entry, index) => (
                <Link key={entry.id} href={`/(app)/profile/${entry.id}`} asChild>
                  <Pressable
                    style={[styles.rankRow, entry.id === user?.id && styles.rankRowCurrent]}
                  >
                    <Text style={styles.rankNumber}>#{index + 1}</Text>
                    <View style={styles.rankAvatar}>
                      <Text style={styles.rankAvatarText}>{initials(entry.username)}</Text>
                    </View>
                    <Text style={styles.rankName} numberOfLines={1}>
                      @{entry.username}
                    </Text>
                    <Text style={styles.rankXp}>
                      Nv. {entry.level} · {entry.xp} XP
                    </Text>
                  </Pressable>
                </Link>
              ))
            ) : (
              <Empty>Aún no hay posiciones en el ranking.</Empty>
            )}
          </Section>
        </>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.bg,
  },
  loadingText: { color: colors.inkMuted },
  title: { color: colors.ink, fontSize: 30, fontWeight: '900' },
  subtitle: { color: colors.inkMuted, marginTop: 4, marginBottom: 20 },
  errorBox: {
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  errorText: { color: colors.error },
  retry: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  retryText: { color: colors.cyan, fontWeight: '800' },
  xpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.yellow,
    borderRadius: 14,
    padding: 18,
    marginBottom: 22,
  },
  eyebrow: { color: colors.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  xpValue: { color: colors.yellow, fontSize: 28, fontWeight: '900', marginTop: 4 },
  levelPill: {
    backgroundColor: colors.bg,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  levelText: { color: colors.cyan, fontWeight: '800' },
  section: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  sectionLink: { color: colors.cyan, fontSize: 12, fontWeight: '800' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.bg,
    borderRadius: 10,
    padding: 12,
  },
  statValue: { color: colors.yellow, fontSize: 23, fontWeight: '900' },
  statLabel: { color: colors.inkMuted, fontSize: 12, marginTop: 3 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 11,
  },
  listCopy: { flex: 1, paddingRight: 8 },
  listTitle: { color: colors.ink, fontWeight: '700' },
  listMeta: { color: colors.inkMuted, fontSize: 12, marginTop: 4 },
  chevron: { color: colors.cyan, fontSize: 22 },
  empty: { color: colors.inkMuted, paddingVertical: 6 },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 9,
    paddingHorizontal: 4,
  },
  rankRowCurrent: { backgroundColor: colors.surfaceRaised, borderRadius: 8 },
  rankNumber: { color: colors.inkFaint, fontSize: 11, width: 24 },
  rankAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  rankAvatarText: { color: colors.yellow, fontSize: 10, fontWeight: '800' },
  rankName: { color: colors.ink, fontWeight: '700', flex: 1 },
  rankXp: { color: colors.cyan, fontSize: 11, fontWeight: '700' },
})
