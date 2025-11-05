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
 }