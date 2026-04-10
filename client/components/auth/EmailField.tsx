//components/auth/EmailField.tsx
import FormField from '../ui/FormField'
import TextField from '../ui/TextField'

type Props = {
  value: string
  onChange: (s: string) => void
}

export default function EmailField({ value, onChange }: Props) {
  return (
    <FormField label="Email">
      <TextField
        autoCapitalize="none"
        keyboardType="email-address"
        value={value}
        onChangeText={onChange}
        placeholder="you@example.com"
      />
    </FormField>
  )
}