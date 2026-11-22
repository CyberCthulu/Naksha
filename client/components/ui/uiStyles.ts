// components/ui/uiStyles.ts
import { StyleSheet } from 'react-native'
import { theme } from './theme'

export const uiStyles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.space.xl,
  },

  screen: {
    flex: 1,
    padding: theme.space.xl,
    paddingTop: theme.space.xxxxl,
  },

  text: {
    ...theme.typography.body,
    color: theme.text.primary,
  },

  muted: {
    ...theme.typography.bodySmall,
    color: theme.text.secondary,
  },

  errorText: {
    ...theme.typography.bodySmall,
    color: theme.state.danger,
    marginBottom: theme.space.md,
    textAlign: 'center',
  },

  h1: {
    ...theme.typography.title,
    color: theme.text.primary,
  },

  sub: {
    ...theme.typography.body,
    marginTop: 6,
    marginBottom: 16,
    color: theme.text.secondary,
  },

  card: {
    ...theme.elevation.level1,
    backgroundColor: theme.cardSurface.base,
    borderRadius: theme.radius.md,
    padding: theme.space.lg,
    marginBottom: theme.space.md,
  },

  cardTitle: {
    ...theme.typography.heading,
    marginBottom: 6,
    color: theme.text.primary,
  },
})
