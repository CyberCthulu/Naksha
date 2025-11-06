// screens/JournalEditorScreen.tsx
import { useState } from 'react'
import { View, Text, StyleSheet, TextInput, Button, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { upsertJournal } from '../lib/journals'

export default function JournalEditorScreen() {
  const nav = useNavigation<any>()
  const route = useRoute<any>()
  const insets = useSafeAreaInsets()

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
    <KeyboardAvoidingView
      style={[styles.flex, { paddingBottom: insets.bottom + 16 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]}>
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
      </ScrollView>

      <View style={[styles.footer, { marginBottom: insets.bottom + 8 }]}>
        <Button title={saving ? 'Saving…' : 'Save'} onPress={onSave} disabled={saving} />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, padding: 16, paddingTop: 40, gap: 10 },
  h1: { fontSize: 20, fontWeight: '600', marginBottom: 4 },
  titleInput: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    padding: 10,
  },
  input: {
    flex: 1,
    minHeight: 200,
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    padding: 12, textAlignVertical: 'top',
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
    padding: 12,
    backgroundColor: '#fafafa',
  },
})
