// screens/JournalEditorScreen.tsx
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
import FormField from '../components/ui/FormField'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import TextField from '../components/ui/TextField'
import { theme } from '../components/ui/theme'
import type {
  JournalEditorParams,
  RootStackParamList,
} from '../navigation/types'

/** Shown as a hint, never as an error: nothing has gone wrong yet. */
const EMPTY_RESPONSE_HINT = 'Write something before saving.'

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

  /*
   * Only the response counts. A title alone is not something to save -- it
   * names an entry that does not exist yet.
   */
  const canSave = content.trim().length > 0

  /*
   * Dirty is measured against what this editor session opened with, so
   * reopening an entry and changing nothing exits without a prompt. The fixed
   * guidance context is not part of it: the reader cannot edit it, so it can
   * never be unsaved work.
   */
  const isDirty = title !== initialTitle || content !== initialContent

  // Set when leaving is legitimate -- a completed save, or a confirmed
  // discard -- so the guard stands aside instead of asking twice.
  const bypassGuard = useRef(false)
  // A second back press while the Alert is open must not stack another one.
  const confirming = useRef(false)

  const onSave = async () => {
    const trimmedContent = content.trim()
    const trimmedTitle = title.trim()

    if (!trimmedContent) return

    try {
      setSaving(true)
      await upsertJournal({
        id: initialId,
        title: trimmedTitle || null,
        content: trimmedContent,
        prompt_template: promptTemplateId,
      })
      bypassGuard.current = true
      nav.goBack()
    } catch (e: any) {
      // The editor stays, and stays dirty: the writing is not lost because a
      // save failed.
      Alert.alert('Save failed', e?.message ?? 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  /*
   * One guard for every way out.
   *
   * `beforeRemove` covers the header back, the Android hardware back and any
   * programmatic removal, so there is a single implementation rather than a
   * BackHandler racing a navigation listener.
   */
  useEffect(() => {
    const unsubscribe = nav.addListener('beforeRemove', (event) => {
      if (bypassGuard.current || !isDirty) return

      event.preventDefault()
      if (confirming.current) return
      confirming.current = true

      Alert.alert(
        'Discard changes?',
        'Your unsaved journal changes will be lost.',
        [
          {
            text: 'Keep editing',
            style: 'cancel',
            onPress: () => {
              confirming.current = false
            },
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              confirming.current = false
              bypassGuard.current = true
              nav.dispatch(event.data.action)
            },
          },
        ]
      )
    })

    return unsubscribe
  }, [nav, isDirty])

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
            disabled: !canSave,
            accessibilityLabel: 'Save entry',
            accessibilityHint: canSave ? undefined : EMPTY_RESPONSE_HINT,
          }}
          style={[
            styles.header,
            { paddingTop: insets.top + theme.space.xs },
          ]}
        />

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + theme.space.xxl },
          ]}
        >
          <AppText variant="title" style={styles.heading}>
            {isEditMode
              ? 'Something to add?'
              : guidanceContext
              ? 'Reflect in your own words'
              : 'Share your thoughts'}
          </AppText>

          {/*
            Quoted material, not a field.

            The context used to sit in a Card directly above two bordered
            inputs, which gave the prompt the same grammar as the things the
            reader is meant to type into. A gold rule down the side says the
            same thing a block quote does: this is here to be answered, not
            filled in. It holds no focusable control, and reads to assistive
            technology as one passage.
          */}
          {guidanceContext ? (
            <View
              accessible
              testID="journal-guidance-context"
              style={styles.epigraph}
            >
              {guidanceContext.source ? (
                <MutedText variant="eyebrow" style={styles.epigraphSource}>
                  {guidanceContext.source}
                </MutedText>
              ) : null}

              {guidanceContext.promptText ? (
                <AppText variant="bodyLarge" style={styles.epigraphPrompt}>
                  {guidanceContext.promptText}
                </AppText>
              ) : null}

              {guidanceContext.practiceSummary ||
              guidanceContext.practiceSteps.length > 0 ? (
                <View style={styles.epigraphPractice}>
                  <AppText variant="subheading" style={styles.epigraphLabel}>
                    Grounding practice
                  </AppText>
                  {guidanceContext.practiceSummary ? (
                    <MutedText variant="bodySmall" style={styles.epigraphBody}>
                      {guidanceContext.practiceSummary}
                    </MutedText>
                  ) : null}
                  {guidanceContext.practiceSteps.map((step, index) => (
                    <MutedText
                      variant="bodySmall"
                      key={`${index}:${step}`}
                      style={styles.epigraphStep}
                    >
                      {index + 1}. {step}
                    </MutedText>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          <FormField label="Title">
            <TextField
              placeholder="Title (optional)"
              value={title}
              onChangeText={setTitle}
              returnKeyType="next"
            />
          </FormField>

          <FormField
            label={guidanceContext ? 'Your reflection' : 'Entry'}
            hint={canSave ? undefined : EMPTY_RESPONSE_HINT}
          >
            <TextField
              placeholder={
                guidanceContext
                  ? 'Write your reflection…'
                  : 'Write your thoughts…'
              }
              multiline
              value={content}
              onChangeText={setContent}
              textAlignVertical="top"
              style={styles.response}
            />
          </FormField>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: theme.space.xl,
  },
  content: {
    paddingHorizontal: theme.space.xl,
    paddingTop: theme.space.sm,
  },
  heading: {
    color: theme.text.primary,
    marginBottom: theme.space.lg,
  },
  /* A block quote, not a card: a rule down the side, no fill, no border. */
  epigraph: {
    borderLeftColor: theme.accent.base,
    borderLeftWidth: 2,
    marginBottom: theme.space.xl,
    paddingLeft: theme.space.lg,
  },
  epigraphSource: {
    color: theme.accent.base,
  },
  epigraphPrompt: {
    color: theme.text.primary,
    marginTop: theme.space.sm,
  },
  epigraphPractice: {
    marginTop: theme.space.lg,
  },
  epigraphLabel: {
    color: theme.text.primary,
    marginBottom: theme.space.xs,
  },
  epigraphBody: {
    color: theme.text.secondary,
  },
  epigraphStep: {
    color: theme.text.secondary,
    marginTop: theme.space.xs,
  },
  response: {
    minHeight: 220,
    backgroundColor: theme.cardSurface.base,
  },
})
