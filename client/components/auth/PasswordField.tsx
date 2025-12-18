import { Text, TextInput, View } from 'react-native'
import { uiStyles } from '../ui/uiStyles'
import { theme } from '../ui/theme'

export default function PasswordField({
  value,
  onChange,
}: {
  value: string
  onChange: (s: string) => void
}) {
  return (
    <View>
      <Text style={uiStyles.text}>Password</Text>
      <TextInput
        secureTextEntry
        value={value}
        onChangeText={onChange}
        placeholder="••••••••"
        placeholderTextColor={theme.colors.muted}
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.card,
          padding: 10,
          marginTop: 8,
          color: theme.colors.text,
        }}
      />
    </View>
  )
}
