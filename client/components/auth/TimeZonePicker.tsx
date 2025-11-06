// components/auth/TimeZonePicker.tsx
import { View, Text, StyleSheet } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { TIMEZONES } from '../../lib/timezones'

export default function TimeZonePicker({ value, onChange }:{
  value: string; onChange: (s:string)=>void
}) {
  return (
    <View>
      <Text>Time Zone</Text>
      <View style={styles.wrap}>
        <Picker selectedValue={value} onValueChange={onChange}>
          {TIMEZONES.map(tz => <Picker.Item key={tz} label={tz} value={tz} />)}
        </Picker>
      </View>
    </View>
  )
}
const styles = StyleSheet.create({
  wrap:{ borderWidth:1,borderColor:'#aaa',borderRadius:6,overflow:'hidden' }
})
