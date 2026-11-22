import { StyleSheet, Switch, View } from 'react-native'

import { AppText, MutedText } from '../ui/AppText'
import { Card } from '../ui/Card'
import { theme } from '../ui/theme'
import ChoiceRow from './ChoiceRow'

type HouseSystem = 'whole_sign' | 'placidus' | 'equal'
type ZodiacType = 'tropical' | 'sidereal'
type OrbMode = 'tight' | 'medium' | 'loose'

type ChartPreferences = {
  house_system: HouseSystem
  zodiac_type: ZodiacType
  orb_mode: OrbMode
  show_house_degrees: boolean
}

type Props = {
  prefs: ChartPreferences
  savingPrefs: boolean
  onUpdatePrefs: (next: Partial<ChartPreferences>) => void
}

export default function ChartPreferencesCard({
  prefs,
  savingPrefs,
  onUpdatePrefs,
}: Props) {
  return (
    <Card>
      <AppText variant="heading" style={styles.title}>
        Chart Preferences
      </AppText>
      <MutedText variant="caption" style={styles.hint}>
        Charts currently use Whole Sign houses, Tropical zodiac, and standard
        fixed aspect orbs.
      </MutedText>

      {/*
        Each group is a radiogroup so the options are announced as a set --
        "1 of 3" rather than three unrelated buttons. The "Coming soon" rows
        stay disabled: they describe where the chart engine is going, and
        nothing here activates them.
      */}
      <View accessibilityRole="radiogroup" style={styles.group}>
        <AppText variant="subheading" style={styles.groupTitle}>
          House System
        </AppText>
        <ChoiceRow
          label="Whole Sign"
          note="Current chart engine"
          selected={prefs.house_system === 'whole_sign'}
          onPress={() => onUpdatePrefs({ house_system: 'whole_sign' })}
        />
        <ChoiceRow label="Placidus" note="Coming soon" selected={false} disabled />
        <ChoiceRow label="Equal House" note="Coming soon" selected={false} disabled />
      </View>

      <View accessibilityRole="radiogroup" style={styles.group}>
        <AppText variant="subheading" style={styles.groupTitle}>
          Zodiac
        </AppText>
        <ChoiceRow
          label="Tropical"
          note="Current chart engine"
          selected={prefs.zodiac_type === 'tropical'}
          onPress={() => onUpdatePrefs({ zodiac_type: 'tropical' })}
        />
        <ChoiceRow label="Sidereal" note="Coming soon" selected={false} disabled />
      </View>

      <View accessibilityRole="radiogroup" style={styles.group}>
        <AppText variant="subheading" style={styles.groupTitle}>
          Aspect Orbs
        </AppText>
        <ChoiceRow
          label="Standard fixed orbs"
          note="Current chart engine"
          selected={prefs.orb_mode === 'medium'}
          onPress={() => onUpdatePrefs({ orb_mode: 'medium' })}
        />
        <ChoiceRow label="Tight orbs" note="Coming soon" selected={false} disabled />
        <ChoiceRow label="Loose orbs" note="Coming soon" selected={false} disabled />
      </View>

      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <AppText variant="body" style={styles.switchLabel}>
            Show house degrees
          </AppText>
          <MutedText variant="caption" style={styles.switchHint}>
            Coming soon.
          </MutedText>
        </View>
        <Switch
          value={prefs.show_house_degrees}
          disabled
          accessibilityLabel="Show house degrees"
          accessibilityState={{
            disabled: true,
            checked: prefs.show_house_degrees,
          }}
          trackColor={{ false: theme.border.base, true: theme.accent.muted }}
          thumbColor={
            prefs.show_house_degrees ? theme.accent.base : theme.text.disabled
          }
        />
      </View>

      {savingPrefs ? (
        <MutedText
          variant="caption"
          accessibilityLiveRegion="polite"
          style={styles.saving}
        >
          Saving preferences…
        </MutedText>
      ) : null}
    </Card>
  )
}

const styles = StyleSheet.create({
  title: {
    color: theme.text.primary,
  },
  hint: {
    color: theme.text.tertiary,
    marginTop: theme.space.xs,
  },
  group: {
    marginTop: theme.space.lg,
  },
  groupTitle: {
    color: theme.text.primary,
    marginBottom: theme.space.xs,
  },
  switchRow: {
    alignItems: 'center',
    columnGap: theme.space.md,
    flexDirection: 'row',
    marginTop: theme.space.lg,
    minHeight: theme.touchTarget.min,
  },
  switchText: {
    flex: 1,
  },
  switchLabel: {
    color: theme.text.tertiary,
  },
  switchHint: {
    color: theme.text.tertiary,
    marginTop: theme.space.hair,
  },
  saving: {
    color: theme.text.tertiary,
    marginTop: theme.space.md,
  },
})
