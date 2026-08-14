import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Link } from 'expo-router'
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
  },
]

export default function ExploreScreen() {
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
      </View>

      <View style={styles.grid}>
        {DESTINATIONS.map((item) => (
          <Link key={item.href} href={item.href} asChild>
            <Pressable
              style={({ pressed }) => [
                styles.card,
                { borderTopColor: item.accent },
                pressed && styles.cardPressed,
              ]}
            >
              <View style={[styles.iconWrap, { borderColor: item.accent }]}>
                <Text style={[styles.icon, { color: item.accent }]}>{item.icon}</Text>
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </View>
              <Text style={[styles.chevron, { color: item.accent }]}>›</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
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
  title: { color: colors.ink, fontSize: 27, lineHeight: 32, fontWeight: '900' },
  subtitle: { color: colors.inkMuted, lineHeight: 20, marginTop: 10 },
  grid: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 3,
    borderRadius: 14,
    padding: 15,
  },
  cardPressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 24, fontWeight: '900' },
  cardCopy: { flex: 1 },
  cardTitle: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  cardDescription: { color: colors.inkMuted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  chevron: { fontSize: 26, fontWeight: '700' },
})
