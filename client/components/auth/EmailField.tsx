import { Text, TextInput, View } from 'react-native'
import { uiStyles } from '../ui/uiStyles'
import { theme } from '../ui/theme'

export default function EmailField({
  value,
  onChange,
}: {
  value: string
  onChange: (s: string) => void
}) {
  return (
    <View>
      <Text style={uiStyles.text}>Email</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        value={value}
        onChangeText={onChange}
        placeholder="you@example.com"
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
