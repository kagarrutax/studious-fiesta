import { useState } from 'react'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import api from '@/src/services/api'
import { apiErrorMessage } from '@/src/utils/errors'
import { colors } from '@/src/theme/tokens'

export default function ComposeScreen() {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [image, setImage] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function pickImage() {
    setError('')
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      setError('Necesitamos permiso para acceder a la galería')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    })
    if (result.canceled || !result.assets?.[0]) return

    const asset = result.assets[0]
    const manipulated = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: 1280 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
    )
    setImage({
      uri: manipulated.uri,
      name: `upload-${Date.now()}.jpg`,
      type: 'image/jpeg',
    })
  }

  async function publish() {
    if (!content.trim()) return
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      let data
      if (image) {
        const formData = new FormData()
        formData.append('content', content.trim())
        formData.append('image', {
          uri: image.uri,
          name: image.name,
          type: image.type,
        })
        ;({ data } = await api.post('/api/posts/upload', formData))
      } else {
        ;({ data } = await api.post('/api/posts', {
          content: content.trim(),
          image_url: null,
        }))
      }
      setContent('')
      setImage(null)
      setSuccess('Publicado en el tablón')
      router.push('/(app)/feed')
      return data
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo publicar'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Nueva publicación</Text>
        <TextInput
          style={styles.textarea}
          multiline
          maxLength={2000}
          placeholder="¿Qué se cuece en el campus?"
          placeholderTextColor={colors.inkFaint}
          value={content}
          onChangeText={setContent}
        />
        <Text style={styles.counter}>{content.length}/2000</Text>

        {image ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: image.uri }} style={styles.preview} />
            <Pressable onPress={() => setImage(null)} style={styles.remove}>
              <Text style={styles.removeText}>Quitar imagen</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.row}>
          <Pressable style={styles.ghost} onPress={pickImage} disabled={busy}>
            <Text style={styles.ghostText}>+ Imagen</Text>
          </Pressable>
          <Pressable
            style={[styles.primary, (busy || !content.trim()) && styles.disabled]}
            onPress={publish}
            disabled={busy || !content.trim()}
          >
            {busy ? (
              <ActivityIndicator color={colors.ink} />
            ) : (
              <Text style={styles.primaryText}>Publicar</Text>
            )}
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 16, paddingBottom: 40 },
  title: { color: colors.ink, fontSize: 22, fontWeight: '800', marginBottom: 12 },
  textarea: {
    minHeight: 140,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.ink,
    padding: 14,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  counter: { color: colors.inkFaint, textAlign: 'right', marginTop: 6, marginBottom: 12 },
  previewWrap: { marginBottom: 12 },
  preview: { width: '100%', height: 200, borderRadius: 10, backgroundColor: colors.surfaceRaised },
  remove: { marginTop: 8 },
  removeText: { color: colors.error, fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  ghost: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  ghostText: { color: colors.cyan, fontWeight: '700' },
  primary: {
    flex: 1,
    backgroundColor: colors.pink,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryText: { color: colors.ink, fontWeight: '700', fontSize: 16 },
  disabled: { opacity: 0.5 },
  error: { color: colors.error, marginTop: 14 },
  success: { color: colors.success, marginTop: 14 },
})
