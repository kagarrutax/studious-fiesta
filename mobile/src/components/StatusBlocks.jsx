import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/tokens'

export function LoadingState({ label = 'Cargando…' }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.cyan} />
      <Text style={styles.hint}>{label}</Text>
    </View>
  )
}

export function EmptyState({ title, text }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {text ? <Text style={styles.text}>{text}</Text> : null}
    </View>
  )
}

export function ErrorState({ message, onRetry }) {
  if (!message) return null
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry ? (
        <Pressable style={styles.retry} onPress={onRetry}>
          <Text style={styles.retryText}>Reintentar</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  hint: { color: colors.inkMuted, textAlign: 'center' },
  card: {
    padding: 28,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  title: { color: colors.ink, fontSize: 18, fontWeight: '900', textAlign: 'center' },
  text: { color: colors.inkMuted, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  errorBox: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderColor: colors.error,
    borderWidth: 1,
  },
  errorText: { color: colors.error, marginBottom: 8 },
  retry: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryText: { color: colors.cyan, fontWeight: '700' },
})
