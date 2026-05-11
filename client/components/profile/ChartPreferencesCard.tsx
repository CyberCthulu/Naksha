import { StyleSheet, Switch, Text, View } from 'react-native'

import { uiStyles } from '../ui/uiStyles'
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
    <View style={uiStyles.card}>
      <Text style={uiStyles.cardTitle}>Chart Preferences</Text>
      <Text style={styles.cardHint}>
        Charts currently use Whole Sign houses, Tropical zodiac, and standard fixed aspect orbs.
      </Text>

      <Text style={styles.subheading}>House System</Text>
      <ChoiceRow
        label="Whole Sign"
        note="Current chart engine"
        selected={prefs.house_system === 'whole_sign'}
        onPress={() => onUpdatePrefs({ house_system: 'whole_sign' })}
      />
      <ChoiceRow label="Placidus" note="Coming soon" selected={false} disabled />
      <ChoiceRow label="Equal House" note="Coming soon" selected={false} disabled />

      <Text style={styles.subheading}>Zodiac</Text>
      <ChoiceRow
        label="Tropical"
        note="Current chart engine"
        selected={prefs.zodiac_type === 'tropical'}
        onPress={() => onUpdatePrefs({ zodiac_type: 'tropical' })}
      />
      <ChoiceRow label="Sidereal" note="Coming soon" selected={false} disabled />

      <Text style={styles.subheading}>Aspect Orbs</Text>
      <ChoiceRow
        label="Standard fixed orbs"
        note="Current chart engine"
        selected={prefs.orb_mode === 'medium'}
        onPress={() => onUpdatePrefs({ orb_mode: 'medium' })}
      />
      <ChoiceRow label="Tight orbs" note="Coming soon" selected={false} disabled />
      <ChoiceRow label="Loose orbs" note="Coming soon" selected={false} disabled />

      <View style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={[uiStyles.text, styles.disabledText]}>
            Show house degrees
          </Text>
          <Text style={styles.switchHint}>
            Coming soon.
          </Text>
        </View>
        <Switch
          value={prefs.show_house_degrees}
          disabled
          trackColor={{ false: 'rgba(255,255,255,0.25)', true: 'rgba(0,122,255,0.6)' }}
          thumbColor={prefs.show_house_degrees ? '#007AFF' : '#999'}
        />
      </View>

      {savingPrefs && <Text style={styles.savingText}>Saving preferences…</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  cardHint: { marginTop: 6, fontSize: 12, color: theme.colors.muted },
  subheading: {
    marginTop: 10,
    marginBottom: 6,
    fontWeight: '700',
    color: theme.colors.sub,
  },
  disabledText: {
    color: theme.colors.muted,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 12,
  },
  switchHint: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },
  savingText: {
    marginTop: 8,
    fontSize: 12,
    color: theme.colors.muted,
    fontStyle: 'italic',
  },
})
