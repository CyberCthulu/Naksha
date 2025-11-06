// components/auth/PasswordField.tsx
import { Text, TextInput, StyleSheet, View } from 'react-native'
export default function PasswordField({ value, onChange }: { value: string; onChange: (s:string)=>void }) {
  return (
    <View>
      <Text>Password</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={value}
        onChangeText={onChange}
      />
    </View>
  )
}
const styles = StyleSheet.create({ input:{borderWidth:1,borderColor:'#aaa',padding:10,borderRadius:6} })
