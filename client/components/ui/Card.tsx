// components/ui/Card.tsx
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { theme } from './theme'

export function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    padding: theme.spacing.card,
    backgroundColor: theme.colors.cardBg,
    marginBottom: 12,
  },
})
