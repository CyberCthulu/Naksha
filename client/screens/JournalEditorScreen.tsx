// screens/JournalEditorScreen.tsx
import { useState } from 'react'
import { View, Text, StyleSheet, TextInput, Button, Alert } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { upsertJournal } from '../lib/journals'

export default function JournalEditorScreen() {
    const nav = useNavigation<any>()
    const route = useRoute<any>()
    const initialId: number | undefined = route.params?.id
    const initialContent: string = route.params?.content ?? ''

    const [saving, setSaving] = useState(false)
    const [content, setContent] = useState(initialContent)

    const onSave = async () => {
        if (!content.trim()) {
            Alert.alert('Empty', 'Write something first.')
            return
        }
        try {
            setSaving(true)
            await upsertJournal({ id: initialId, content })
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
  input: {
    flex: 1,
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    padding: 12, textAlignVertical: 'top'
  },
})