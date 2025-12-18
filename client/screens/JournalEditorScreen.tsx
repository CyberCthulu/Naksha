// screens/JournalEditorScreen.tsx
import React, { useLayoutEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { upsertJournal } from '../lib/journals'
import { uiStyles } from '../components/ui/uiStyles'
import { theme } from '../components/ui/theme'

export default function JournalEditorScreen() {
  const nav = useNavigation<any>()
  const route = useRoute<any>()
  const insets = useSafeAreaInsets()

  useLayoutEffect(() => {
    nav.setOptions({ headerShown: false })
  }, [nav])

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

  const headerTitle = initialId ? 'Edit entry' : 'New entry'

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      <View style={{ flex: 1 }}>
        {/* Top bar */}
        <View style={[styles.topRow, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.iconBtn}>
            <Text style={styles.iconText}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.screenTitle}>{headerTitle}</Text>

          <TouchableOpacity
            onPress={onSave}
            disabled={saving}
            style={[styles.savePill, saving && { opacity: 0.7 }]}
          >
            {saving ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.savePillText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: theme.spacing.screen,
            paddingBottom: insets.bottom + 28,
            gap: 12,
          }}
        >
          <Text style={styles.h1}>
            {initialId ? 'Something to add?' : 'Share your thoughts'}
          </Text>

          {/* Title */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Title (optional)"
              placeholderTextColor={theme.colors.muted}
              value={title}
              onChangeText={setTitle}
              returnKeyType="next"
            />
          </View>

          {/* Content */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Entry</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Write your thoughts…"
              placeholderTextColor={theme.colors.muted}
              multiline
              value={content}
              onChangeText={setContent}
              textAlignVertical="top"
            />
          </View>

          {/* Bottom Save (extra) */}
          <TouchableOpacity
            onPress={onSave}
            disabled={saving}
            style={[styles.bigSaveBtn, saving && { opacity: 0.7 }]}
          >
            <Text style={styles.bigSaveText}>{saving ? 'Saving…' : 'Save'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.screen,
    marginBottom: 8,
  },
  iconBtn: {
    width: 40,
    height: 36,
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 30,
    color: theme.colors.text,
  },
  screenTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },

  savePill: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.cardBg,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savePillText: {
    color: theme.colors.text,
    fontWeight: '800',
  },

  h1: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
    textAlign: 'left',
  },

  fieldWrap: {
    gap: 6,
  },
  label: {
    color: theme.colors.sub,
    fontWeight: '700',
  },

  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.cardBg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: theme.colors.text,
    fontSize: 15,
  },
  textarea: {
    minHeight: 220,
    lineHeight: 20,
  },

  bigSaveBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigSaveText: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
})
