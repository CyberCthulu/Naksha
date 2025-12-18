import { View, Text, Platform } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { TIMEZONES } from '../../lib/timezones'
import { uiStyles } from '../ui/uiStyles'
import { theme } from '../ui/theme'

export default function TimeZonePicker({
  value,
  onChange,
}: {
  value: string
  onChange: (s: string) => void
}) {
  return (
    <View>
      <Text style={uiStyles.text}>Time Zone</Text>

      <View
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.card,
          overflow: 'hidden',
          marginTop: 8,
        }}
      >
        <Picker
          selectedValue={value}
          onValueChange={onChange}
          style={{
            color: theme.colors.text,
            ...(Platform.OS === 'android' ? { backgroundColor: 'transparent' } : null),
          }}
          itemStyle={Platform.OS === 'ios' ? { color: theme.colors.text } : undefined}
          dropdownIconColor={Platform.OS === 'android' ? theme.colors.text : undefined}
        >
          {TIMEZONES.map((tz) => (
            <Picker.Item key={tz} label={tz} value={tz} />
          ))}
        </Picker>
      </View>
    </View>
  )
}
