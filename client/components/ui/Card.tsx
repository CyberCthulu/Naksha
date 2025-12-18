// components/ui/Card.tsx
import React from 'react'
import { View, StyleSheet } from 'react-native'

export function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 12,
    padding: 14,
    backgroundColor: 'rgba(0,0,0,0.35)',
    marginBottom: 12,
  },
})
