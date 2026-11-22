import { StyleSheet, View } from 'react-native'

import { AppText, MutedText } from '../ui/AppText'
import { theme } from '../ui/theme'

type Props = {
  label: string
  value: string
}

/**
 * A labelled fact.
 *
 * Stacked rather than columned. The label used to sit in a fixed 110pt column
 * with the value right-aligned against it, which design-system 13.2 rules out:
 * at a large font scale the label clips and the value is squeezed into a
 * ragged sliver. Stacking has no width to run out of, and no `numberOfLines`
 * cap -- a birth location is not something to truncate.
 */
export default function InfoRow({ label, value }: Props) {
  return (
    <View style={styles.row}>
      <MutedText variant="caption" style={styles.label}>
        {label}
      </MutedText>
      <AppText variant="body" style={styles.value}>
        {value}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    marginTop: theme.space.md,
  },
  label: {
    color: theme.text.tertiary,
  },
  value: {
    color: theme.text.primary,
    marginTop: theme.space.hair,
  },
})
