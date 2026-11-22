import { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import {
  classifyZonedCivilTime,
  formatUtcOffset,
  type CivilDate,
  type CivilTime,
} from '../../lib/time'
import { normalizeZone } from '../../lib/timezones'
import { AppText } from '../ui/AppText'
import { theme } from '../ui/theme'

type Props = {
  birthDate: CivilDate | null
  birthTime: CivilTime | null
  timeZone: string
  selectedOffsetMinutes: number | null
  onSelectOffsetMinutes: (value: number) => void
}

export default function BirthTimeResolutionField({
  birthDate,
  birthTime,
  timeZone,
  selectedOffsetMinutes,
  onSelectOffsetMinutes,
}: Props) {
  const classification = useMemo(() => {
    const zone = normalizeZone(timeZone)
    if (!birthDate || !birthTime || !zone) return null

    return classifyZonedCivilTime(birthDate, birthTime, zone)
  }, [birthDate, birthTime, timeZone])

  if (!classification || classification.status === 'unambiguous') return null

  if (classification.status === 'nonexistent') {
    return (
      <AppText
        variant="bodySmall"
        accessibilityLiveRegion="polite"
        style={styles.error}
      >
        This local time did not exist in {timeZone} on that date. Choose a valid
        time.
      </AppText>
    )
  }

  return (
    <View accessibilityRole="radiogroup" style={styles.group}>
      <AppText
        variant="bodySmall"
        accessibilityLiveRegion="polite"
        style={styles.explanation}
      >
        This local time occurred twice. Choose which occurrence you mean.
      </AppText>

      {classification.options.map((option, index) => {
        const selected = selectedOffsetMinutes === option.offsetMinutes
        const occurrence = index === 0 ? 'Earlier occurrence' : 'Later occurrence'
        const label = `${occurrence} — ${formatUtcOffset(option.offsetMinutes)}`

        return (
          <Pressable
            key={option.utcIso}
            accessibilityRole="radio"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            onPress={() => onSelectOffsetMinutes(option.offsetMinutes)}
            style={({ pressed }) => [
              styles.option,
              selected && styles.optionSelected,
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.radio, selected && styles.radioSelected]}>
              {selected ? <View style={styles.radioCore} /> : null}
            </View>
            <AppText variant="body">{label}</AppText>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  error: {
    color: theme.state.danger,
    marginBottom: theme.space.lg,
    marginTop: -theme.space.sm,
  },
  group: {
    marginBottom: theme.space.lg,
    marginTop: -theme.space.sm,
  },
  explanation: {
    color: theme.text.secondary,
    marginBottom: theme.space.xs,
  },
  option: {
    alignItems: 'center',
    borderColor: theme.border.base,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.space.sm,
    minHeight: theme.touchTarget.min,
    paddingHorizontal: theme.space.md,
    marginTop: theme.space.xs,
  },
  optionSelected: {
    borderColor: theme.accent.base,
  },
  pressed: {
    opacity: 0.75,
  },
  radio: {
    alignItems: 'center',
    borderColor: theme.border.base,
    borderRadius: 9,
    borderWidth: 1.5,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  radioSelected: {
    borderColor: theme.accent.base,
  },
  radioCore: {
    backgroundColor: theme.accent.base,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
})
