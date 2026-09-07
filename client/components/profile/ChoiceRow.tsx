import { Pressable, StyleSheet, View } from 'react-native'

import { AppText, MutedText } from '../ui/AppText'
import { theme } from '../ui/theme'

type Props = {
  label: string
  note?: string
  selected: boolean
  onPress?: () => void
  disabled?: boolean
}

/**
 * One option in a preference group.
 *
 * Announced as a radio rather than a button, with its selected and disabled
 * state carried in `accessibilityState`. Previously it was an unlabelled
 * TouchableOpacity whose only selection cue was the colour of a 14pt dot --
 * invisible to a screen reader, and roughly a 26dp target against the 48dp
 * minimum. The row is the control now, and it is full height whatever the
 * label wraps to.
 *
 * "Coming soon" options stay disabled and unselectable. They are shown because
 * they say where the chart engine is going, not because they can be chosen.
 */
export default function ChoiceRow({
  label,
  note,
  selected,
  onPress,
  disabled = false,
}: Props) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={note ? `${label}, ${note}` : label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled || !onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {/* Selection is a filled gold disc inside a ring -- shape as well as
          colour, so it survives both a monochrome view and a colour-blind one. */}
      <View style={[styles.dot, selected && styles.dotSelected]}>
        {selected ? <View style={styles.dotCore} /> : null}
      </View>

      <View style={styles.text}>
        <AppText
          variant="body"
          style={[styles.label, disabled && styles.disabledText]}
        >
          {label}
        </AppText>
        {note ? (
          <MutedText variant="caption" style={styles.note}>
            {note}
          </MutedText>
        ) : null}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    columnGap: theme.space.md,
    flexDirection: 'row',
    minHeight: theme.touchTarget.min,
    paddingVertical: theme.space.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.6,
  },
  dot: {
    alignItems: 'center',
    borderColor: theme.border.base,
    borderRadius: 9,
    borderWidth: 1.5,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  dotSelected: {
    borderColor: theme.accent.base,
  },
  dotCore: {
    backgroundColor: theme.accent.base,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  text: {
    flex: 1,
  },
  label: {
    color: theme.text.primary,
  },
  disabledText: {
    color: theme.text.tertiary,
  },
  note: {
    color: theme.text.tertiary,
    marginTop: theme.space.hair,
  },
})
