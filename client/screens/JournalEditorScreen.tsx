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
} from 'react-native'
import {
  useRoute,
  useNavigation,
  type RouteProp,
} from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { upsertJournal } from '../lib/journals'
import { AppText, MutedText } from '../components/ui/AppText'
import { Card } from '../components/ui/Card'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { theme } from '../components/ui/theme'
import { uiStyles } from '../components/ui/uiStyles'
import type {
  JournalEditorParams,
  RootStackParamList,
} from '../navigation/types'

type GuidanceContext = {
  source: string | null
  promptText: string | null
  practiceSummary: string | null
  practiceSteps: string[]
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

function createGuidanceContext(
  params: JournalEditorParams | undefined,
  isEditMode: boolean
): GuidanceContext | null {
  if (isEditMode) return null

  const context = {
    source: optionalString(params?.promptSource),
    promptText: optionalString(params?.promptText),
    practiceSummary: optionalString(params?.practiceSummary),
    practiceSteps: Array.isArray(params?.practiceSteps)
      ? params.practiceSteps.filter(
          (step): step is string =>
            typeof step === 'string' && step.trim().length > 0
        )
      : [],
  }

  return context.source ||
    context.promptText ||
    context.practiceSummary ||
    context.practiceSteps.length > 0
    ? context
    : null
}

export default function JournalEditorScreen() {
  const nav =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'JournalEditor'>
    >()
  const route = useRoute<RouteProp<RootStackParamList, 'JournalEditor'>>()
  const insets = useSafeAreaInsets()

  useLayoutEffect(() => {
    nav.setOptions({ headerShown: false })
  }, [nav])

  const initialId: number | undefined = route.params?.id
  const isEditMode = initialId != null
  const initialTitle: string = isEditMode
    ? route.params?.title ?? ''
    : route.params?.initialTitle ?? route.params?.title ?? ''
  const initialContent: string = isEditMode
    ? route.params?.content ?? ''
    : route.params?.initialContent ?? route.params?.content ?? ''
  const promptTemplateId: string | null =
    route.params?.promptTemplateId ?? null

  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [guidanceContext] = useState<GuidanceContext | null>(() =>
    createGuidanceContext(route.params, isEditMode)
  )

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
        prompt_template: promptTemplateId,
      })
      nav.goBack()
    } catch (e: any) {
      Alert.alert('Save failed', e?.message ?? 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  const headerTitle = isEditMode ? 'Edit entry' : 'New entry'

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      <View style={{ flex: 1 }}>
        <ScreenHeader
          title={headerTitle}
          onBack={() => nav.goBack()}
          rightAction={{
            label: 'Save',
            onPress: onSave,
            loading: saving,
            accessibilityLabel: 'Save entry',
          }}
          style={[
            styles.header,
            { paddingTop: insets.top + theme.space.md },
          ]}
        />

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: theme.spacing.screen,
            paddingBottom: insets.bottom + 28,
            gap: 12,
          }}
        >
          <Text style={styles.h1}>
            {isEditMode
              ? 'Something to add?'
              : guidanceContext
              ? 'Reflect in your own words'
              : 'Share your thoughts'}
          </Text>

          {guidanceContext ? (
            <Card>
              {guidanceContext.source ? (
                <MutedText style={styles.contextSource}>
                  {guidanceContext.source}
                </MutedText>
              ) : null}
              {guidanceContext.promptText ? (
                <View>
                  <AppText style={uiStyles.cardTitle}>Prompt</AppText>
                  <MutedText style={styles.contextBody}>
                    {guidanceContext.promptText}
                  </MutedText>
                </View>
              ) : null}
              {guidanceContext.practiceSummary ||
              guidanceContext.practiceSteps.length > 0 ? (
                <View style={styles.contextPractice}>
                  <AppText style={uiStyles.cardTitle}>
                    Grounding practice
                  </AppText>
                  {guidanceContext.practiceSummary ? (
                    <MutedText style={styles.contextBody}>
                      {guidanceContext.practiceSummary}
                    </MutedText>
                  ) : null}
                  {guidanceContext.practiceSteps.map((step, index) => (
                    <MutedText
                      key={`${index}:${step}`}
                      style={styles.contextStep}
                    >
                      {index + 1}. {step}
                    </MutedText>
                  ))}
                </View>
              ) : null}
            </Card>
          ) : null}

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
            <Text style={styles.label}>
              {guidanceContext ? 'Your reflection' : 'Entry'}
            </Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder={
                guidanceContext
                  ? 'Write your reflection…'
                  : 'Write your thoughts…'
              }
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
  header: {
    paddingHorizontal: theme.spacing.screen,
  },

  h1: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
    textAlign: 'left',
  },

  contextSource: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  contextBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  contextPractice: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    marginTop: 10,
    paddingTop: 10,
  },
  contextStep: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
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
