// components/auth/DateField.tsx
import { useState } from 'react'
import { View, Text, Button, Platform } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'

export default function DateField({ label, value, onChange }:{
  label: string; value: Date | null; onChange: (d:Date)=>void
}) {
  const [open, setOpen] = useState(false)
  return (
    <View>
      <Text>{label}</Text>
      <Button title={value ? value.toDateString() : 'Select Date'} onPress={() => setOpen(true)} />
      {open && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'compact' : 'calendar'}
          onChange={(_, d) => { setOpen(false); if (d) onChange(d) }}
        />
      )}
    </View>
  )
}
