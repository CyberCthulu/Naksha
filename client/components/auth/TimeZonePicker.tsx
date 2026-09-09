import { View, Platform } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { TIMEZONES } from '../../lib/timezones'
import FormField from '../ui/FormField'
import { formStyles } from '../ui/formStyles'
import { theme } from '../ui/theme'

export default function TimeZonePicker({
  value,
  onChange,
}: {
  value: string
  onChange: (s: string) => void
}) {
  return (
    <FormField label="Time Zone">
      <View style={formStyles.pickerWrap}>
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
            <Picker.Item key={tz} label={tz} value={tz} />
          ))}
        </Picker>
      </View>
    </FormField>
  )
}
