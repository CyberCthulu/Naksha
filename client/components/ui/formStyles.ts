import { StyleSheet } from 'react-native'
import { theme } from './theme'

export const formStyles = StyleSheet.create({
  section: {
    marginBottom: 16,
  },
  label: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    paddingVertical: 14,
    paddingHorizontal: 12,
    color: theme.colors.text,
    fontSize: 16,
    backgroundColor: 'transparent',
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
})