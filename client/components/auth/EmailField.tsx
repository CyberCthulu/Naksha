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
    <View style={{ marginBottom: 6 }}>
      <Text style={[uiStyles.text, { marginBottom: 8, fontWeight: '600' }]}>
        Email
      </Text>

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
          paddingVertical: 14,
          paddingHorizontal: 12,
          color: theme.colors.text,
          fontSize: 16,
        }}
      />
    </View>
  )
}