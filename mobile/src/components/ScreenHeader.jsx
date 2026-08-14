import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { colors } from '../theme/tokens'

export function BackButton({ onPress, label = 'Regresar' }) {
  const router = useRouter()
  return (
    <Pressable style={styles.back} onPress={onPress || (() => router.back())}>
      <Text style={styles.backText}>← {label}</Text>
    </Pressable>
  )
}

export default function ScreenHeader({ kicker, title, subtitle, right, showBack = true }) {
  return (
    <View style={styles.wrap}>
      {showBack ? <BackButton /> : null}
      <View style={styles.titleRow}>
        <View style={styles.titleCopy}>
          {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
          <Text style={styles.title}>{title}</Text>
        </View>
        {right}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  back: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  backText: {
    color: colors.cyan,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  titleCopy: { flex: 1 },
  kicker: { color: colors.yellow, fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  title: { color: colors.ink, fontSize: 32, fontWeight: '900', marginTop: 5 },
  subtitle: { color: colors.inkMuted, marginTop: 6, lineHeight: 20 },
})
