import { useState } from 'react'
import { Platform, Pressable } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { AppText } from '../ui/AppText'
import FormField from '../ui/FormField'
import { formStyles } from '../ui/formStyles'
import { theme } from '../ui/theme'

export default function TimeField({
  label,
  value,
  onChange,
}: {
  label: string
  value: Date | null
  onChange: (d: Date) => void
}) {
  const [open, setOpen] = useState(false)
  const displayValue = value ? value.toLocaleTimeString() : 'Select Time'

  return (
    <FormField label={label}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: displayValue }}
        onPress={() => setOpen(true)}
        style={formStyles.input}
      >
        <AppText
          variant="body"
          style={{ color: value ? theme.text.primary : theme.text.tertiary }}
        >
          {displayValue}
        </AppText>
      </Pressable>

      {open && (
        <DateTimePicker
          value={value || new Date()}
          mode="time"
          themeVariant="dark"
          accentColor={theme.accent.base}
          display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
          onChange={(_, d) => {
            setOpen(false)
            if (d) onChange(d)
          }}
        />
      )}
    </FormField>
  )
}
