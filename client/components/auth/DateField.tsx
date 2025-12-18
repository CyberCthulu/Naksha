import { useState } from 'react'
import { View, Text, Platform, Pressable } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { uiStyles } from '../ui/uiStyles'
import { theme } from '../ui/theme'

export default function DateField({
  label,
  value,
  onChange,
}: {
  label: string
  value: Date | null
  onChange: (d: Date) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <View>
      <Text style={uiStyles.text}>{label}</Text>

      <Pressable
        onPress={() => setOpen(true)}
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.card,
          padding: 10,
          marginTop: 8,
        }}
      >
        <Text style={value ? uiStyles.text : uiStyles.muted}>
          {value ? value.toDateString() : 'Select Date'}
        </Text>
      </Pressable>

      {open && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'compact' : 'calendar'}
          onChange={(_, d) => {
            setOpen(false)
            if (d) onChange(d)
          }}
        />
      )}
    </View>
  )
}
