import { View, Platform } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { TIMEZONES } from '../../lib/timezones'
import FormField from '../ui/FormField'
import { formStyles } from '../ui/formStyles'
import { useFormAppearance } from '../ui/FormAppearance'
import { theme } from '../ui/theme'

function friendlyZoneLabel(zone: string): string {
  if (zone.startsWith('Etc/')) return zone

  const segments = zone.split('/').map((segment) => segment.replace(/_/g, ' '))
  if (segments.length < 2) return segments[0]

  const city = segments.pop()
  return `${city} · ${segments.join(' / ')}`
}

export default function TimeZonePicker({
  value,
  onChange,
}: {
  value: string
  onChange: (s: string) => void
}) {
  const soft = useFormAppearance() === 'soft'

  return (
    <FormField label="Time Zone">
      <View style={[formStyles.pickerWrap, soft && formStyles.softInput]}>
        <Picker
          accessibilityLabel="Time Zone"
          selectedValue={value}
          onValueChange={onChange}
          style={{
            ...theme.typography.body,
            color: theme.text.primary,
            ...(Platform.OS === 'android'
              ? { backgroundColor: 'transparent' }
              : null),
          }}
          itemStyle={
            Platform.OS === 'ios'
              ? { ...theme.typography.body, color: theme.text.primary }
              : undefined
          }
          dropdownIconColor={
            Platform.OS === 'android' ? theme.text.secondary : undefined
          }
        >
          {TIMEZONES.map((tz) => (
            <Picker.Item
              key={tz}
              label={soft ? friendlyZoneLabel(tz) : tz}
              value={tz}
            />
          ))}
        </Picker>
      </View>
    </FormField>
  )
}
