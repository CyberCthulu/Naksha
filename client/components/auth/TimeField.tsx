// components/auth/TimeField.tsx
import { useState } from 'react'
import { View, Text, Button, Platform } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'

export default function TimeField({ label, value, onChange }:{
  label: string; value: Date | null; onChange: (d:Date)=>void
}) {
  const [open, setOpen] = useState(false)
  return (
    <View>
      <Text>{label}</Text>
      <Button title={value ? value.toLocaleTimeString() : 'Select Time'} onPress={() => setOpen(true)} />
      {open && (
        <DateTimePicker
          value={value || new Date()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
          onChange={(_, d) => { setOpen(false); if (d) onChange(d) }}
        />
      )}
    </View>
  )
}
