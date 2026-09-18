import { useState } from 'react'
import { Platform, Pressable } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { AppText } from '../ui/AppText'
import FormField from '../ui/FormField'
import { formStyles } from '../ui/formStyles'
import { theme } from '../ui/theme'
import {
  civilDateFromPicker,
  civilDateToPicker,
  type CivilDate,
} from '../../lib/time'

export default function DateField({
  label,
  value,
  onChange,
}: {
  label: string
  value: CivilDate | null
  onChange: (d: CivilDate) => void
}) {
  const [open, setOpen] = useState(false)
  const displayValue = value
    ? `${String(value.year).padStart(4, '0')}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`
    : 'Select Date'

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
          value={value ? civilDateToPicker(value) : new Date()}
          mode="date"
          themeVariant="dark"
          accentColor={theme.accent.base}
          display={Platform.OS === 'ios' ? 'compact' : 'calendar'}
          onChange={(_, d) => {
            setOpen(false)
            if (d) onChange(civilDateFromPicker(d))
          }}
        />
      )}
    </FormField>
  )
}
