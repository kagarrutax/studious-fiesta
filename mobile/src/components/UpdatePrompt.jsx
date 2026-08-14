import { useEffect, useState } from 'react'
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import Constants, { ExecutionEnvironment } from 'expo-constants'
import * as Linking from 'expo-linking'
import api from '../services/api'
import { colors } from '../theme/tokens'

export default function UpdatePrompt() {
  const [update, setUpdate] = useState(null)
  const [opening, setOpening] = useState(false)

  useEffect(() => {
    if (
      Platform.OS === 'web' ||
      __DEV__ ||
      Constants.executionEnvironment !== ExecutionEnvironment.Standalone
    ) {
      return undefined
    }

    let cancelled = false
    api
      .get('/api/mobile/version', { timeout: 12000 })
      .then(({ data }) => {
        const installed = Number(Constants.expoConfig?.android?.versionCode || 0)
        if (!cancelled && Number(data?.version_code || 0) > installed && data?.apk_url) {
          setUpdate(data)
        }
      })
      .catch(() => {
        // Una comprobación de actualización nunca debe bloquear la app.
      })

    return () => {
      cancelled = true
    }
  }, [])

  async function openUpdate() {
    if (!update?.apk_url) return
    setOpening(true)
    try {
      await Linking.openURL(update.apk_url)
    } finally {
      setOpening(false)
    }
  }

  return (
    <Modal visible={Boolean(update)} transparent animationType="fade" onRequestClose={() => {
      if (!update?.mandatory) setUpdate(null)
    }}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.kicker}>NUEVA VERSIÓN</Text>
          <Text style={styles.title}>Actualiza Studious Party</Text>
          <Text style={styles.body}>
            La versión {update?.version} ya está disponible con mejoras y correcciones.
          </Text>
          <Pressable style={styles.primary} onPress={openUpdate} disabled={opening}>
            {opening ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={styles.primaryText}>Actualizar</Text>
            )}
          </Pressable>
          {!update?.mandatory ? (
            <Pressable style={styles.later} onPress={() => setUpdate(null)}>
              <Text style={styles.laterText}>Más tarde</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 18, 14, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.yellow,
    borderRadius: 16,
    padding: 22,
  },
  kicker: { color: colors.yellow, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: colors.ink, fontSize: 25, fontWeight: '900', marginTop: 8 },
  body: { color: colors.inkMuted, fontSize: 15, lineHeight: 22, marginTop: 10, marginBottom: 20 },
  primary: {
    minHeight: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pink,
  },
  primaryText: { color: colors.bg, fontWeight: '900', fontSize: 15 },
  later: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  laterText: { color: colors.cyan, fontWeight: '700' },
})
