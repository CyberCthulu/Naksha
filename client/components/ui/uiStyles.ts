import { StyleSheet } from 'react-native'
import { theme } from './theme'

export const uiStyles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.screen,
  },

  screen: {
    flex: 1,
    padding: theme.spacing.screen,
    paddingTop: theme.spacing.top,
  },

  text: {
    color: theme.colors.text,
  },

  muted: {
    color: theme.colors.muted,
  },

  errorText: {
    color: theme.colors.danger,
    marginBottom: 12,
    textAlign: 'center',
  },

  h1: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.colors.text,
  },

  sub: {
    marginTop: 6,
    marginBottom: 16,
    color: theme.colors.sub,
  },

  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    padding: theme.spacing.card,
    backgroundColor: theme.colors.cardBg,
    marginBottom: 12,
  },

  cardTitle: {
    fontWeight: '700',
    marginBottom: 6,
    color: theme.colors.text,
  },
})
