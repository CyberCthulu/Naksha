//components/auth/PasswordField.tsx
import FormField from '../ui/FormField'
import TextField from '../ui/TextField'

type Props = {
  value: string
  onChange: (s: string) => void
}

export default function PasswordField({ value, onChange }: Props) {
  return (
    <FormField label="Password">
      <TextField
        secureTextEntry
        value={value}
        onChangeText={onChange}
        placeholder="••••••••"
      />
    </FormField>
  )
}