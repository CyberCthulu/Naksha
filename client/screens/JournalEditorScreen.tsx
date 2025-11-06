// screens/JournalEditorScreen.tsx
import { useState } from 'react'
import { View, Text, StyleSheet, TextInput, Button, Alert } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { upsertJournal } from '../lib/journals'

export default function JournalEditorScreen() {
  const nav = useNavigation<any>()
  const route = useRoute<any>()
  const initialId: number | undefined = route.params?.id
  const initialTitle: string = route.params?.title ?? ''
  const initialContent: string = route.params?.content ?? ''

  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)

  const onSave = async () => {
    const trimmedContent = content.trim()
    const trimmedTitle = title.trim()

    if (!trimmedContent) {
      Alert.alert('Empty', 'Write something first.')
      return
    }

    try {
      setSaving(true)
      await upsertJournal({
        id: initialId,
        title: trimmedTitle || null,
        content: trimmedContent,
      })
      nav.goBack()
    } catch (e: any) {
      Alert.alert('Save failed', e?.message ?? 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>{initialId ? 'Edit Entry' : 'New Entry'}</Text>

      <TextInput
        style={styles.titleInput}
        placeholder="Title (optional)"
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        style={styles.input}
        placeholder="Write your thoughts…"
        multiline
        value={content}
        onChangeText={setContent}
      />

      <Button title={saving ? 'Saving…' : 'Save'} onPress={onSave} disabled={saving} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 40, gap: 10 },
  h1: { fontSize: 20, fontWeight: '600' },
  titleInput: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    padding: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    padding: 12, textAlignVertical: 'top'
  },
})
