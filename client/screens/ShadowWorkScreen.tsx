import { ScrollView, StyleSheet, View } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { AppText, MutedText, TitleText } from '../components/ui/AppText'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { theme } from '../components/ui/theme'
import { uiStyles } from '../components/ui/uiStyles'
import {
  REFLECTION_PROMPTS,
  SUGGESTED_PRACTICES,
  getReflectionPrompt,
  getSuggestedPractice,
} from '../lib/lexicon/guidance'

type ShadowWorkRouteParams = {
  promptId?: string
  practiceId?: string
}

export default function ShadowWorkScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const insets = useSafeAreaInsets()
  const params = (route.params ?? {}) as ShadowWorkRouteParams

  const prompt =
    getReflectionPrompt(params.promptId ?? '') ?? REFLECTION_PROMPTS[0]
  const practice =
    getSuggestedPractice(params.practiceId ?? '') ??
    SUGGESTED_PRACTICES[0]

  const openJournal = () => {
    navigation.navigate('JournalEditor', {
      id: undefined,
      initialTitle: 'Shadow Reflection',
      initialContent: [
        'Prompt:',
        prompt.prompt,
        '',
        'Practice:',
        practice.summary,
        ...practice.steps.map((step, index) => `${index + 1}. ${step}`),
        '',
        'Reflection:',
        '',
      ].join('\n'),
      promptTemplateId: prompt.id,
      promptSource: 'Shadow Work',
    })
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 24 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <TitleText style={uiStyles.h1}>Shadow Work</TitleText>
      <MutedText style={styles.intro}>
        A focused space for gentle self-inquiry and grounded reflection.
      </MutedText>

      <Card>
        <AppText style={uiStyles.cardTitle}>A gentle reminder</AppText>
        <MutedText style={styles.body}>
          Use this as a reflection prompt, not a diagnosis. Pause if it
          feels overwhelming, and return when you feel grounded.
        </MutedText>
      </Card>

      <Card>
        <AppText style={uiStyles.cardTitle}>Reflection prompt</AppText>
        <AppText style={styles.itemTitle}>{prompt.title}</AppText>
        <MutedText style={styles.body}>{prompt.prompt}</MutedText>
        {prompt.followUp ? (
          <MutedText style={styles.followUp}>{prompt.followUp}</MutedText>
        ) : null}
      </Card>

      <Card>
        <AppText style={uiStyles.cardTitle}>Grounding practice</AppText>
        <AppText style={styles.itemTitle}>{practice.title}</AppText>
        <MutedText style={styles.body}>{practice.summary}</MutedText>
        <View style={styles.steps}>
          {practice.steps.map((step, index) => (
            <MutedText key={`${practice.id}:${index}`} style={styles.body}>
              {index + 1}. {step}
            </MutedText>
          ))}
        </View>
      </Card>

      <Button title="Journal this" onPress={openJournal} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.screen,
    paddingTop: theme.spacing.top,
  },
  intro: {
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 16,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  followUp: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  steps: {
    gap: 6,
    marginTop: 8,
  },
})
