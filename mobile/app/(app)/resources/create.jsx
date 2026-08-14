import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import * as DocumentPicker from 'expo-document-picker'
import api from '@/src/services/api'
import { colors } from '@/src/theme/tokens'
import { apiErrorMessage } from '@/src/utils/errors'

const CATEGORIES = [
  ['notes', 'Apuntes'],
  ['slides', 'Diapositivas'],
  ['exam', 'Examen'],
  ['other', 'Otro'],
]

export default function ResourceUploadScreen() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('notes')
  const [subjects, setSubjects] = useState([])
  const [subjectId, setSubjectId] = useState(null)
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/subjects').then(({ data }) => setSubjects(data || [])).catch(() => {})
  }, [])

  async function pickFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/zip', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/*'],
      copyToCacheDirectory: true,
    })
    if (!result.canceled) setFile(result.assets[0])
  }

  async function submit() {
    if (!title.trim() || !file) return
    setBusy(true)
    setError('')
    const form = new FormData()
    form.append('title', title.trim())
    form.append('description', description.trim())
    form.append('category', category)
    if (subjectId) form.append('subject_id', String(subjectId))
    form.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || 'application/octet-stream',
    })
    try {
      const { data } = await api.post('/api/resources', form)
      router.replace(`/(app)/resources/${data.id}`)
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo subir el archivo'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Volver</Text></Pressable>
      <View style={styles.card}>
        <Text style={styles.icon}>↥</Text>
        <Text style={styles.title}>Subir recurso</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Título" placeholderTextColor={colors.inkFaint} maxLength={200} />
        <TextInput style={[styles.input, styles.textarea]} value={description} onChangeText={setDescription} placeholder="Descripción" placeholderTextColor={colors.inkFaint} multiline maxLength={4000} />
        <Text style={styles.label}>Categoría</Text>
        <View style={styles.options}>
          {CATEGORIES.map(([value, label]) => (
            <Pressable key={value} style={[styles.option, category === value && styles.optionActive]} onPress={() => setCategory(value)}>
              <Text style={[styles.optionText, category === value && styles.optionTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        {subjects.length ? (
          <>
            <Text style={styles.label}>Materia (opcional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Pressable style={[styles.option, !subjectId && styles.optionActive]} onPress={() => setSubjectId(null)}>
                <Text style={[styles.optionText, !subjectId && styles.optionTextActive]}>Sin materia</Text>
              </Pressable>
              {subjects.map((subject) => (
                <Pressable key={subject.id} style={[styles.option, subjectId === subject.id && styles.optionActive, styles.subject]} onPress={() => setSubjectId(subject.id)}>
                  <Text style={[styles.optionText, subjectId === subject.id && styles.optionTextActive]}>{subject.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        ) : null}
        <Pressable style={styles.file} onPress={pickFile}>
          <Text style={styles.fileTitle}>{file ? file.name : 'Elegir archivo'}</Text>
          <Text style={styles.fileMeta}>{file?.size ? `${Math.ceil(file.size / 1024)} KB` : 'PDF, DOCX, PPTX, ZIP o imagen'}</Text>
        </Pressable>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={[styles.primary, (!file || !title.trim() || busy) && styles.disabled]} onPress={submit} disabled={!file || !title.trim() || busy}>
          {busy ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.primaryText}>Subir recurso</Text>}
        </Pressable>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 36 },
  back: { color: colors.cyan, fontWeight: '700', marginBottom: 24 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 22, alignItems: 'center' },
  icon: { color: colors.yellow, fontSize: 38, fontWeight: '800' },
  title: { color: colors.ink, fontSize: 23, fontWeight: '800', marginTop: 8 },
  input: { width: '100%', backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: 9, color: colors.ink, paddingHorizontal: 12, paddingVertical: 11, marginTop: 12 },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  label: { width: '100%', color: colors.inkMuted, fontSize: 11, fontWeight: '800', marginTop: 14, marginBottom: 7, textTransform: 'uppercase' },
  options: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  option: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 7, marginRight: 6 },
  optionActive: { borderColor: colors.yellow, backgroundColor: colors.surfaceRaised },
  optionText: { color: colors.inkMuted, fontSize: 11, fontWeight: '700' },
  optionTextActive: { color: colors.yellow },
  subject: { maxWidth: 180 },
  file: { width: '100%', borderWidth: 1, borderStyle: 'dashed', borderColor: colors.cyan, borderRadius: 10, padding: 14, marginTop: 16 },
  fileTitle: { color: colors.cyan, fontWeight: '800' },
  fileMeta: { color: colors.inkFaint, fontSize: 11, marginTop: 4 },
  error: { color: colors.error, marginTop: 10, textAlign: 'center' },
  primary: { minWidth: 160, minHeight: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.pink, borderRadius: 9, paddingHorizontal: 20, paddingVertical: 11, marginTop: 18 },
  primaryText: { color: colors.bg, fontWeight: '800' },
  disabled: { opacity: 0.5 },
})
