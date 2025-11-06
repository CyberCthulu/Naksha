// components/auth/EmailField.tsx
import { Text, TextInput, StyleSheet, View } from 'react-native'
export default function EmailField({ value, onChange }: { value: string; onChange: (s:string)=>void }) {
  return (
    <View>
      <Text>Email</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        value={value}
        onChangeText={onChange}
      />
    </View>
  )
}
const styles = StyleSheet.create({ input:{borderWidth:1,borderColor:'#aaa',padding:10,borderRadius:6} })
