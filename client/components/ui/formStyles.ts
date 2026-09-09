import { StyleSheet } from 'react-native'
import { theme } from './theme'

export const formStyles = StyleSheet.create({
  section: {
    marginBottom: theme.space.lg,
  },
  label: {
    ...theme.typography.subheading,
    color: theme.text.primary,
    marginBottom: theme.space.sm,
  },
  input: {
    minHeight: theme.touchTarget.min,
    borderWidth: 1,
    borderColor: theme.border.base,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.space.md,
    paddingHorizontal: theme.space.md,
    backgroundColor: theme.background.sunken,
  },
  pickerWrap: {
    minHeight: theme.touchTarget.min,
    borderWidth: 1,
    borderColor: theme.border.base,
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
    backgroundColor: theme.background.sunken,
  },
})
